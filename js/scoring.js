function parseTimeToMinutes(value) {
  if (!value || !value.includes(":")) return 0;
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function calculateSleepHours(sleepTime, wakeTime) {
  if (!sleepTime || !wakeTime) return 0;
  let sleep = parseTimeToMinutes(sleepTime);
  let wake = parseTimeToMinutes(wakeTime);
  if (wake <= sleep) wake += 24 * 60;
  return (wake - sleep) / 60;
}

function recommendedSleepRange(age) {
  const n = Number(age);
  if (n >= 6 && n <= 12) return { min: 9, max: 12 };
  if (n >= 13 && n <= 17) return { min: 8, max: 10 };
  if (n >= 18 && n <= 60) return { min: 7, max: 9 };
  if (n >= 61 && n <= 64) return { min: 7, max: 9 };
  return { min: 7, max: 8.5 };
}

function scoreSleepDuration(age, hours) {
  const { min, max } = recommendedSleepRange(age);
  if (hours >= min && hours <= max) return 40;
  if (hours >= min - 1 && hours < min) return 28;
  if (hours > max && hours <= max + 1) return 28;
  if (hours >= min - 2 && hours < min - 1) return 16;
  return 6;
}

function scoreRested(value) {
  return {
    "Always": 25,
    "Often": 20,
    "Sometimes": 12,
    "Rarely": 6,
    "Never": 0
  }[value] ?? 0;
}

function scoreFallingAsleep(value) {
  return {
    "Never": 20,
    "Rarely": 16,
    "Sometimes": 10,
    "Often": 5,
    "Always": 0
  }[value] ?? 0;
}

function scoreScreenBeforeSleep(value) {
  return {
    "Less than 1 hour": 15,
    "1 to 2 hours": 10,
    "2 to 3 hours": 5,
    "More than 3 hours": 0
  }[value] ?? 0;
}

function scoreStressLevel(value) {
  const n = Number(value);
  if (n <= 2) return 35;
  if (n <= 4) return 28;
  if (n <= 6) return 18;
  if (n <= 8) return 8;
  return 0;
}

function scoreEnvironment(value) {
  return {
    "Very quiet and comfortable": 30,
    "Mostly quiet with good lighting": 24,
    "Moderately distracting": 16,
    "Noisy or poorly lit": 8,
    "Very distracting": 0
  }[value] ?? 0;
}

function scoreFatigue(value) {
  return {
    "Never": 35,
    "Rarely": 28,
    "Sometimes": 18,
    "Often": 8,
    "Always": 0
  }[value] ?? 0;
}

function scoreStudyHours(value) {
  return {
    "Less than 1 hour": 20,
    "1 to 2 hours": 30,
    "3 to 4 hours": 35,
    "5 to 6 hours": 25,
    "More than 6 hours": 15
  }[value] ?? 0;
}

function scoreStudyBreaks(value) {
  return {
    "Every 30 to 60 minutes": 30,
    "Every 60 to 90 minutes": 25,
    "Very frequently": 18,
    "Every 2+ hours": 10,
    "Almost never": 0
  }[value] ?? 0;
}

function scoreExercise(value) {
  return {
    "Daily": 35,
    "4 to 5 times per week": 30,
    "2 to 3 times per week": 22,
    "1 time per week": 12,
    "Never": 0
  }[value] ?? 0;
}

function scoreBreakfast(value) {
  return {
    "I always eat breakfast": 20,
    "I usually eat breakfast": 16,
    "I eat breakfast sometimes": 10,
    "I rarely eat breakfast": 4,
    "I never eat breakfast": 0
  }[value] ?? 0;
}

function estimateWaterTargetLiters(profile, log) {
  const age = Number(profile.age || 18);
  const weight = Number(profile.weight || 60);
  const sex = profile.sex || "Prefer not to say";
  const exercise = log.exerciseFrequency || "Never";

  let base = age < 14 ? weight * 0.03 : weight * 0.035;

  if (sex === "Male" && age >= 18) base += 0.2;
  if (exercise === "2 to 3 times per week") base += 0.2;
  if (exercise === "4 to 5 times per week") base += 0.4;
  if (exercise === "Daily") base += 0.6;

  return Math.max(1.2, Math.min(4.5, Number(base.toFixed(1))));
}

function parseWaterIntakeToLiters(value) {
  return {
    "Less than 1 liter": 0.8,
    "1 to 2 liters": 1.5,
    "2 to 3 liters": 2.5,
    "More than 3 liters": 3.4
  }[value] ?? 0;
}

function scoreWater(profile, log) {
  const target = estimateWaterTargetLiters(profile, log);
  const actual = parseWaterIntakeToLiters(log.waterIntake);
  const ratio = actual / target;

  if (ratio >= 0.9 && ratio <= 1.2) return 25;
  if (ratio >= 0.75) return 18;
  if (ratio >= 0.6) return 10;
  return 4;
}

function clamp100(n) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function calculateScores(profile, log) {
  const sleepHours = calculateSleepHours(log.sleepTime, log.wakeTime);
  const waterTarget = estimateWaterTargetLiters(profile, log);
  const actualWater = parseWaterIntakeToLiters(log.waterIntake);

  const sleep = clamp100(
    scoreSleepDuration(profile.age, sleepHours) +
    scoreRested(log.rested) +
    scoreFallingAsleep(log.fallAsleepDifficulty) +
    scoreScreenBeforeSleep(log.screenUseBeforeSleep)
  );

  const stress = clamp100(
    scoreStressLevel(log.stressLevel) +
    scoreFatigue(log.daytimeFatigue) +
    scoreEnvironment(log.studyEnvironment)
  );

  const cognitive = clamp100(
    scoreStudyHours(log.studyHours) +
    scoreStudyBreaks(log.studyBreaks) +
    scoreScreenBeforeSleep(log.screenUseBeforeSleep) +
    Math.round(scoreFatigue(log.daytimeFatigue) * 0.4)
  );

  const physical = clamp100(
    scoreExercise(log.exerciseFrequency) +
    scoreBreakfast(log.breakfastHabits) +
    scoreWater(profile, log) +
    20
  );

  const overall = clamp100(
    sleep * 0.35 +
    stress * 0.25 +
    cognitive * 0.25 +
    physical * 0.15
  );

  return {
  sleep,
  stress,
  stressControl: stress,
  cognitive,
  physical,
  overall,
  sleepHours: Number(sleepHours.toFixed(1)),
  waterTarget,
  actualWater
};
}

const GLOBAL_REFERENCE_BASELINE = {
  sleep: 72,
  stress: 61,
  cognitive: 66,
  physical: 64,
  overall: 66
};

function getLatestLog(user) {
  if (!user.dailyLogs) return null;
  const dates = Object.keys(user.dailyLogs).sort();
  if (!dates.length) return null;
  return user.dailyLogs[dates[dates.length - 1]];
}

function getPreviousLog(user) {
  if (!user.dailyLogs) return null;
  const dates = Object.keys(user.dailyLogs).sort();
  if (dates.length < 2) return null;
  return user.dailyLogs[dates[dates.length - 2]];
}

function getGlobalAppAverage(users) {
  const totals = { sleep: 0, stress: 0, cognitive: 0, physical: 0, overall: 0 };
  let count = 0;

  users.forEach(user => {
    const latest = getLatestLog(user);
    if (latest && latest.scores) {
      totals.sleep += latest.scores.sleep;
      totals.stress += latest.scores.stress;
      totals.cognitive += latest.scores.cognitive;
      totals.physical += latest.scores.physical;
      totals.overall += latest.scores.overall;
      count++;
    }
  });

  if (count < 5) return null;

  return {
    sleep: Math.round(totals.sleep / count),
    stress: Math.round(totals.stress / count),
    cognitive: Math.round(totals.cognitive / count),
    physical: Math.round(totals.physical / count),
    overall: Math.round(totals.overall / count)
  };
}

function getAverageOfLogs(logs) {
  if (!logs.length) return null;

  const total = { sleep: 0, stress: 0, cognitive: 0, physical: 0, overall: 0 };

  logs.forEach(log => {
    total.sleep += log.scores.sleep;
    total.stress += log.scores.stress;
    total.cognitive += log.scores.cognitive;
    total.physical += log.scores.physical;
    total.overall += log.scores.overall;
  });

  return {
    sleep: Math.round(total.sleep / logs.length),
    stress: Math.round(total.stress / logs.length),
    cognitive: Math.round(total.cognitive / logs.length),
    physical: Math.round(total.physical / logs.length),
    overall: Math.round(total.overall / logs.length)
  };
}