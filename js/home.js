document.addEventListener("DOMContentLoaded", function () {
  const currentUserEmail = getCurrentUser();

  if (!currentUserEmail) {
    window.location.href = "index.html";
    return;
  }

  const user = findUserByEmail(currentUserEmail);

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  if (!user.onboardingCompleted) {
    window.location.href = "onboarding.html";
    return;
  }

  const welcomeText = document.getElementById("welcomeText");
  const statusText = document.getElementById("statusText");
  const answersList = document.getElementById("answersList");
  const logoutBtn = document.getElementById("logoutBtn");

  welcomeText.textContent = `Welcome, ${user.name}`;
  statusText.textContent = "Initial assessment completed successfully.";

  answersList.innerHTML = "";

  const labels = {
    weight: "Approximate weight",
    height: "Approximate height",
    sleepTime: "Usual sleep time",
    wakeTime: "Usual wake-up time",
    rested: "Feeling rested upon waking",
    stressLevel: "Stress level this week",
    studyEnvironment: "Study environment",
    screenUseBeforeSleep: "Screen use before sleep",
    exerciseFrequency: "Frequency of exercise",
    breakfastHabits: "Breakfast habits",
    waterIntake: "Estimated daily water intake",
    studyHours: "Average daily study time",
    studyBreaks: "Study break frequency",
    fallAsleepDifficulty: "Difficulty falling asleep",
    daytimeFatigue: "Daytime mental fatigue"
  };

  Object.keys(user.answers).forEach(key => {
    const item = document.createElement("div");
    item.className = "answers-item";
    item.innerHTML = `<strong>${labels[key] || key}:</strong> ${user.answers[key]}`;
    answersList.appendChild(item);
  });

  logoutBtn.addEventListener("click", function () {
    logoutUser();
    window.location.href = "index.html";
  });
});