document.addEventListener("DOMContentLoaded", function () {
  const user = getCurrentUserObject();
  if (!user || !user.onboardingCompleted) {
    window.location.href = "index.html";
    return;
  }

  document.getElementById("weeklyCheckinForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const updated = getCurrentUserObject();
    updated.weeklyCheckins = updated.weeklyCheckins || [];

    updated.weeklyCheckins.push({
      date: todayKey(),
      energyWeek: document.getElementById("energyWeek").value,
      focusWeek: document.getElementById("focusWeek").value,
      stressWeek: document.getElementById("stressWeek").value,
      mainIssueWeek: document.getElementById("mainIssueWeek").value.trim()
    });

    updateUser(updated);
    window.location.href = "dashboard.html";
  });
});