document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Simple utility to escape text for safety
  function escapeHTML(str) {
    return str
      ? str.replace(/[&<>"']/g, (s) =>
          ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[s])
        )
      : "";
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    activitiesList.innerHTML = '<p>Loading activities...</p>';
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${escapeHTML(name)}</h4>
          <p>${escapeHTML(details.description)}</p>
          <p><strong>Schedule:</strong> ${escapeHTML(details.schedule)}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left (${details.participants.length}/${details.max_participants})</p>
        `;

        // Participants heading
        const participantsHeading = document.createElement("p");
        participantsHeading.innerHTML = "<strong>Participants:</strong>";
        activityCard.appendChild(participantsHeading);

        // Participants list
        const participantsUl = document.createElement("ul");
        participantsUl.className = "participants-list";

        if (details.participants && details.participants.length > 0) {
          details.participants.forEach((email) => {
            const li = document.createElement("li");
            li.className = "participant-pill";
            li.textContent = email;
            participantsUl.appendChild(li);
          });
        } else {
          const emptyLi = document.createElement("li");
          emptyLi.className = "participant-pill empty";
          emptyLi.textContent = "No participants yet";
          participantsUl.appendChild(emptyLi);
        }

        activityCard.appendChild(participantsUl);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown showing current count
        const option = document.createElement("option");
        option.value = name;
        option.textContent = `${name} (${details.participants.length}/${details.max_participants})`;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Display messages
  function showMessage(text, type = "info") {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");
    setTimeout(() => messageDiv.classList.add("hidden"), 5000);
  }

  // Handle signups (refresh activities after success)
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value.trim();
    const activity = document.getElementById("activity").value;

    if (!activity) {
      showMessage("Please select an activity", "error");
      return;
    }

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        { method: "POST" }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities(); // update participants immediately
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initial load
  fetchActivities();
});
