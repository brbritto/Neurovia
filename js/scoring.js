function clamp100(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function parseTimeToMinutes(value) {
  if (!value || !value.includes(":")) return 0;

  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function calculateSleepHours(sleepTime, wakeTime) {
  if (!sleepTime || !wakeTime) return 0;

  let sleep = parseTimeToMinutes(sleepTime);
  let wake = parseTimeToMinutes(wakeTime);

  if (wake <= sleep) {
    wake += 24 * 60;
  }

  return Number(((wake - sleep) / 60).toFixed(1));
}

function recommendedSleepRange(age) {
  const n = Number(age);

  if (n >= 6 && n <= 12) return { min: 9, max: 12 };
  if (n >= 13 && n <= 17) return { min: 8, max: 10 };
  if (n >= 18 && n <= 64) return { min: 7, max: 9 };
  if (n >= 65) return { min: 7, max: 8 };

  return { min: 8, max: 10 };
}

function calculateSleepScore(age, sleepHours) {
  const range = recommendedSleepRange(age);

  if (!sleepHours) return 0;

  if (sleepHours >= range.min && sleepHours <= range.max) {
    return 100;
  }

  if (sleepHours < range.min) {
    const deficit = range.min - sleepHours;
    return clamp100(100 - deficit * 22);
  }

  const excess = sleepHours - range.max;
  return clamp100(100 - excess * 12);
}

function calculateDailySleepDebt(age, sleepHours) {
  const range = recommendedSleepRange(age);

  if (!sleepHours) return 0;

  return Number(
    Math.max(0, range.min - sleepHours).toFixed(1)
  );
}

function calculateScores(profile, log) {
  const age = Number(profile?.age || 18);

  const sleepHours = calculateSleepHours(
    log.sleepTime,
    log.wakeTime
  );

  const stress = Number(log.stressLevel || 5);
  const energy = Number(log.energyLevel || 5);
  const workload = Number(log.workloadLevel || 5);
  const focus = Number(log.focusLevel || 5);

  const sleep = calculateSleepScore(age, sleepHours);

  // High score = better stress regulation.
  const stressControl = clamp100(110 - stress * 10);

  // High energy produces a higher recovery signal.
  const energyScore = clamp100(energy * 10);

  // High focus = better cognitive functioning today.
  const focusScore = clamp100(focus * 10);

  // Cognitive Load is intentionally different:
  // high number = MORE load / strain.
  const cognitiveLoad = clamp100(
    workload * 6 +
    stress * 4 +
    (10 - focus) * 3
  );

  const recovery = clamp100(
    sleep * 0.50 +
    energyScore * 0.30 +
    stressControl * 0.20
  );

  const brainReadiness = clamp100(
    sleep * 0.30 +
    recovery * 0.30 +
    focusScore * 0.25 +
    (100 - cognitiveLoad) * 0.15
  );

  const sleepDebt = calculateDailySleepDebt(
    age,
    sleepHours
  );

  return {
    sleep,
    stress: stressControl,
    stressControl,
    cognitive: 100 - cognitiveLoad,
    cognitiveLoad,
    recovery,
    brainReadiness,
    overall: brainReadiness,

    sleepHours,
    sleepDebt,

    energy,
    workload,
    focus
  };
}

function getLatestLog(user) {
  if (!user?.dailyLogs) return null;

  const dates = Object.keys(user.dailyLogs).sort();

  if (!dates.length) return null;

  return user.dailyLogs[dates[dates.length - 1]];
}

function getPreviousLog(user) {
  if (!user?.dailyLogs) return null;

  const dates = Object.keys(user.dailyLogs).sort();

  if (dates.length < 2) return null;

  return user.dailyLogs[dates[dates.length - 2]];
}

function getAverageOfLogs(logs) {
  const validLogs = (logs || []).filter(
    log => log && log.scores
  );

  if (!validLogs.length) return null;

  const totals = {
    sleep: 0,
    recovery: 0,
    cognitiveLoad: 0,
    brainReadiness: 0,
    focus: 0
  };

  validLogs.forEach(log => {
    totals.sleep += Number(log.scores.sleep || 0);
    totals.recovery += Number(log.scores.recovery || 0);
    totals.cognitiveLoad += Number(
      log.scores.cognitiveLoad || 0
    );
    totals.brainReadiness += Number(
      log.scores.brainReadiness ||
      log.scores.overall ||
      0
    );
    totals.focus += Number(log.scores.focus || 0);
  });

  const count = validLogs.length;

  return {
    sleep: Math.round(totals.sleep / count),
    recovery: Math.round(totals.recovery / count),
    cognitiveLoad: Math.round(
      totals.cognitiveLoad / count
    ),
    brainReadiness: Math.round(
      totals.brainReadiness / count
    ),
    overall: Math.round(
      totals.brainReadiness / count
    ),
    focus: Math.round(totals.focus / count)
  };
}

function calculateWeeklySleepDebt(profile, logs) {
  let debt = 0;

  (logs || []).forEach(log => {
    if (!log) return;

    const hours = calculateSleepHours(
      log.sleepTime,
      log.wakeTime
    );

    debt += calculateDailySleepDebt(
      profile?.age || 18,
      hours
    );
  });

  return Number(debt.toFixed(1));
}