document.addEventListener("DOMContentLoaded", function () {
  const user = getCurrentUserObject();
  if (!user || !user.onboardingCompleted) {
    window.location.href = "index.html";
    return;
  }

  function mapWater(value) {
    if (value < 1) return "Less than 1 liter";
    if (value <= 2) return "1 to 2 liters";
    if (value <= 3) return "2 to 3 liters";
    return "More than 3 liters";
  }

  function mapExercise(value) {
    return value === "Yes" ? "1 time per week" : "Never";
  }

  function mapBreakfast(value) {
    return value === "Yes" ? "I always eat breakfast" : "I never eat breakfast";
  }

  function mapYesNoDifficulty(value) {
    return value === "Yes" ? "Often" : "Never";
  }

  function mapYesNoFatigue(value) {
    return value === "Yes" ? "Often" : "Never";
  }

  function mapRested(value) {
    return {
      "0": "Never",
      "1": "Rarely",
      "2": "Sometimes",
      "3": "Often",
      "4": "Always"
    }[String(value)] || "Sometimes";
  }

  function mapEnvironment(value) {
    return {
      "0": "Very distracting",
      "1": "Noisy or poorly lit",
      "2": "Moderately distracting",
      "3": "Mostly quiet with good lighting",
      "4": "Very quiet and comfortable"
    }[String(value)] || "Moderately distracting";
  }

  function mapScreen(value) {
    if (value < 1) return "Less than 1 hour";
    if (value <= 2) return "1 to 2 hours";
    if (value <= 3) return "2 to 3 hours";
    return "More than 3 hours";
  }

  function mapStudyHours(value) {
    if (value < 1) return "Less than 1 hour";
    if (value <= 2) return "1 to 2 hours";
    if (value <= 4) return "3 to 4 hours";
    if (value <= 6) return "5 to 6 hours";
    return "More than 6 hours";
  }

  function mapBreaks(value) {
    return {
      "0": "Almost never",
      "1": "Every 2+ hours",
      "2": "Every 60 to 90 minutes",
      "3": "Every 30 to 60 minutes",
      "4": "Very frequently"
    }[String(value)] || "Every 60 to 90 minutes";
  }

  document.getElementById("dailyUpdateForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const updated = getCurrentUserObject();

    const waterValue = Number(document.getElementById("waterLiters").value);
    const studyHoursValue = Number(document.getElementById("studyHoursToday").value);
    const screenValue = Number(document.getElementById("screenHoursToday").value);

    const log = {
      sleepTime: document.getElementById("sleepTime").value.trim(),
      wakeTime: document.getElementById("wakeTime").value.trim(),
      waterIntake: mapWater(waterValue),
      exerciseFrequency: mapExercise(document.getElementById("exerciseToday").value),
      studyHours: mapStudyHours(studyHoursValue),
      breakfastHabits: mapBreakfast(document.getElementById("breakfastToday").value),
      fallAsleepDifficulty: mapYesNoDifficulty(document.getElementById("difficultyToday").value),
      daytimeFatigue: mapYesNoFatigue(document.getElementById("fatigueToday").value),
      stressLevel: document.getElementById("stressToday").value.trim(),
      rested: mapRested(document.getElementById("restedToday").value),
      studyEnvironment: mapEnvironment(document.getElementById("environmentToday").value),
      screenUseBeforeSleep: mapScreen(screenValue),
      studyBreaks: mapBreaks(document.getElementById("breaksToday").value)
    };

    const scores = calculateScores(updated.profile, log);

    const today = todayKey();
    updated.dailyLogs[today] = { ...log, scores };
    updateUser(updated);

    window.location.href = "dashboard.html";
  });
});