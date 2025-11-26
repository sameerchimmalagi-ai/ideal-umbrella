import copy
import pytest
from fastapi.testclient import TestClient

from src import app as app_module

client = TestClient(app_module.app)


@pytest.fixture(autouse=True)
def restore_activities():
    """Fixture to snapshot and restore the in-memory activities dict to keep tests isolated."""
    original = copy.deepcopy(app_module.activities)
    yield
    app_module.activities.clear()
    app_module.activities.update(original)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    activities = resp.json()
    assert isinstance(activities, dict)
    assert "Chess Club" in activities


def test_signup_duplicate_and_unregister_flow():
    activity_name = "Robotics Club"
    email = "testsuite_user@example.com"

    # Ensure user no longer exists at start
    resp = client.get("/activities")
    activities = resp.json()
    if email in activities[activity_name]["participants"]:
        resp = client.delete(f"/activities/{activity_name}/signup?email={email}")
        assert resp.status_code == 200

    # Sign up user
    resp = client.post(f"/activities/{activity_name}/signup?email={email}")
    assert resp.status_code == 200
    assert "Signed up" in resp.json().get("message", "")

    # Duplicate signup should return 400
    resp = client.post(f"/activities/{activity_name}/signup?email={email}")
    assert resp.status_code == 400

    # Unregister should succeed
    resp = client.delete(f"/activities/{activity_name}/signup?email={email}")
    assert resp.status_code == 200

    # Unregister again returns 404
    resp = client.delete(f"/activities/{activity_name}/signup?email={email}")
    assert resp.status_code == 404


def test_unregister_non_existent_is_404():
    activity_name = "Chess Club"
    resp = client.delete(f"/activities/{activity_name}/signup?email=noone@example.com")
    assert resp.status_code == 404
