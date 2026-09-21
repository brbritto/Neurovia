function clamp100(value) {
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(value)
    )
  );
}


function parseTimeToMinutes(value) {

  if (
    !value ||
    !value.includes(":")
  ) {
    return 0;
  }

  const [
    hours,
    minutes
  ] =
    value
      .split(":")
      .map(Number);

  return (
    hours * 60 +
    minutes
  );
}


function calculateSleepHours(
  sleepTime,
  wakeTime
) {

  if (
    !sleepTime ||
    !wakeTime
  ) {
    return 0;
  }


  let sleep =
    parseTimeToMinutes(
      sleepTime
    );


  let wake =
    parseTimeToMinutes(
      wakeTime
    );


  if (wake <= sleep) {
    wake += 24 * 60;
  }


  return Number(
    (
      (wake - sleep) /
      60
    ).toFixed(1)
  );
}


function recommendedSleepRange(age) {

  const n =
    Number(age);


  if (
    n >= 6 &&
    n <= 12
  ) {
    return {
      min: 9,
      max: 12
    };
  }


  if (
    n >= 13 &&
    n <= 17
  ) {
    return {
      min: 8,
      max: 10
    };
  }


  if (
    n >= 18 &&
    n <= 64
  ) {
    return {
      min: 7,
      max: 9
    };
  }


  if (n >= 65) {
    return {
      min: 7,
      max: 8
    };
  }


  return {
    min: 8,
    max: 10
  };
}


function calculateSleepScore(
  age,
  sleepHours
) {

  const range =
    recommendedSleepRange(
      age
    );


  if (!sleepHours) {
    return 0;
  }


  if (
    sleepHours >= range.min &&
    sleepHours <= range.max
  ) {
    return 100;
  }


  if (
    sleepHours <
    range.min
  ) {

    const deficit =
      range.min -
      sleepHours;


    return clamp100(
      100 -
      deficit * 22
    );
  }


  const excess =
    sleepHours -
    range.max;


  return clamp100(
    100 -
    excess * 12
  );
}


function calculateDailySleepDebt(
  age,
  sleepHours
) {

  const range =
    recommendedSleepRange(
      age
    );


  if (!sleepHours) {
    return 0;
  }


  return Number(
    Math.max(
      0,
      range.min -
      sleepHours
    ).toFixed(1)
  );
}


/*
  DAILY CHECK-IN SCORING

  These are Neurovia wellness estimates.
  They are not diagnostic measurements.
*/

function calculateScores(
  profile,
  log
) {

  const age =
    Number(
      profile?.age ||
      18
    );


  const sleepHours =
    calculateSleepHours(
      log.sleepTime,
      log.wakeTime
    );


  const stress =
    Number(
      log.stressLevel ||
      5
    );


  const energy =
    Number(
      log.energyLevel ||
      5
    );


  const workload =
    Number(
      log.workloadLevel ||
      5
    );


  const focus =
    Number(
      log.focusLevel ||
      5
    );


  const sleepQuality =
    Number(
      log.sleepQuality ||
      5
    );


  const sleepDurationScore =
    calculateSleepScore(
      age,
      sleepHours
    );


  const sleepQualityScore =
    clamp100(
      sleepQuality *
      10
    );


  const sleep =
    clamp100(
      sleepDurationScore *
      0.65 +

      sleepQualityScore *
      0.35
    );


  const stressControl =
    clamp100(
      110 -
      stress * 10
    );


  const energyScore =
    clamp100(
      energy * 10
    );


  const focusScore =
    clamp100(
      focus * 10
    );


  /*
    Cognitive Load:
    higher number =
    greater mental demand.
  */

  const cognitiveLoad =
    clamp100(

      workload * 6 +

      stress * 4 +

      (10 - focus) * 3

    );


  /*
    Recovery gives the
    strongest weight to sleep.
  */

  const recovery =
    clamp100(

      sleep * 0.50 +

      energyScore * 0.30 +

      stressControl * 0.20

    );


  /*
    Brain Readiness combines
    sleep, recovery, focus and
    inverse cognitive load.
  */

  const brainReadiness =
    clamp100(

      sleep * 0.30 +

      recovery * 0.30 +

      focusScore * 0.25 +

      (100 - cognitiveLoad) *
      0.15

    );


  const sleepDebt =
    calculateDailySleepDebt(
      age,
      sleepHours
    );


  return {

    sleep,

    stress:
      stressControl,

    stressControl,

    cognitive:
      100 -
      cognitiveLoad,

    cognitiveLoad,

    recovery,

    brainReadiness,

    overall:
      brainReadiness,

    sleepHours,

    sleepQuality,

    sleepDebt,

    energy,

    workload,

    focus

  };
}


function getLatestLog(user) {

  if (
    !user?.dailyLogs
  ) {
    return null;
  }


  const dates =
    Object
      .keys(
        user.dailyLogs
      )
      .sort();


  if (!dates.length) {
    return null;
  }


  return user.dailyLogs[
    dates[
      dates.length - 1
    ]
  ];
}


function getPreviousLog(user) {

  if (
    !user?.dailyLogs
  ) {
    return null;
  }


  const dates =
    Object
      .keys(
        user.dailyLogs
      )
      .sort();


  if (
    dates.length < 2
  ) {
    return null;
  }


  return user.dailyLogs[
    dates[
      dates.length - 2
    ]
  ];
}


function getAverageOfLogs(logs) {

  const validLogs =
    (logs || [])
      .filter(
        log =>
          log &&
          log.scores
      );


  if (!validLogs.length) {
    return null;
  }


  const totals = {

    sleep: 0,

    recovery: 0,

    cognitiveLoad: 0,

    brainReadiness: 0,

    focus: 0

  };


  validLogs.forEach(
    log => {

      totals.sleep +=
        Number(
          log.scores.sleep ||
          0
        );


      totals.recovery +=
        Number(
          log.scores.recovery ||
          0
        );


      totals.cognitiveLoad +=
        Number(
          log.scores.cognitiveLoad ||
          0
        );


      totals.brainReadiness +=
        Number(
          log.scores.brainReadiness ??
          log.scores.overall ??
          0
        );


      totals.focus +=
        Number(
          log.scores.focus ||
          0
        );

    }
  );


  const count =
    validLogs.length;


  return {

    sleep:
      Math.round(
        totals.sleep /
        count
      ),

    recovery:
      Math.round(
        totals.recovery /
        count
      ),

    cognitiveLoad:
      Math.round(
        totals.cognitiveLoad /
        count
      ),

    brainReadiness:
      Math.round(
        totals.brainReadiness /
        count
      ),

    overall:
      Math.round(
        totals.brainReadiness /
        count
      ),

    focus:
      Math.round(
        totals.focus /
        count
      )

  };
}


function calculateWeeklySleepDebt(
  profile,
  logs
) {

  let debt = 0;


  (logs || [])
    .forEach(
      log => {

        if (!log) {
          return;
        }


        const hours =
          calculateSleepHours(
            log.sleepTime,
            log.wakeTime
          );


        debt +=
          calculateDailySleepDebt(
            profile?.age ||
            18,
            hours
          );

      }
    );


  return Number(
    debt.toFixed(1)
  );
}


/* =========================
   BASELINE SCORING
   ========================= */


function optionScore(
  value,
  map,
  fallback = 50
) {

  return (
    map[value] ??
    fallback
  );
}


function calculateBaselineScores(
  profile,
  answers
) {

  const age =
    Number(
      profile.age ||
      18
    );


  const sleepHours =
    calculateSleepHours(
      answers.sleepTime,
      answers.wakeTime
    );


  const durationScore =
    calculateSleepScore(
      age,
      sleepHours
    );


  const restedScore =
    optionScore(
      answers.rested,
      {
        "Never": 20,
        "Rarely": 40,
        "Sometimes": 60,
        "Often": 80,
        "Always": 100
      }
    );


  const fallingAsleepScore =
    optionScore(
      answers.fallAsleepDifficulty,
      {
        "Never": 100,
        "Rarely": 85,
        "Sometimes": 65,
        "Often": 40,
        "Always": 20
      }
    );


  const screenSleepScore =
    optionScore(
      answers.screenUseBeforeSleep,
      {
        "Less than 1 hour": 100,
        "1 to 2 hours": 80,
        "2 to 3 hours": 55,
        "More than 3 hours": 30
      }
    );


  const sleep =
    clamp100(

      durationScore *
      0.40 +

      restedScore *
      0.25 +

      fallingAsleepScore *
      0.20 +

      screenSleepScore *
      0.15

    );


  const stressNumber =
    Number(
      answers.stressLevel ||
      5
    );


  const directStressScore =
    clamp100(
      110 -
      stressNumber *
      10
    );


  const fatigueScore =
    optionScore(
      answers.daytimeFatigue,
      {
        "Never": 100,
        "Rarely": 85,
        "Sometimes": 65,
        "Often": 40,
        "Always": 20
      }
    );


  const environmentScore =
    optionScore(
      answers.studyEnvironment,
      {
        "Very quiet and comfortable": 100,
        "Mostly quiet with good lighting": 85,
        "Moderately distracting": 65,
        "Noisy or poorly lit": 40,
        "Very distracting": 20
      }
    );


  const stress =
    clamp100(

      directStressScore *
      0.55 +

      fatigueScore *
      0.25 +

      environmentScore *
      0.20

    );


  const studyHoursScore =
    optionScore(
      answers.studyHours,
      {
        "Less than 1 hour": 80,
        "1 to 2 hours": 90,
        "3 to 4 hours": 100,
        "5 to 6 hours": 75,
        "More than 6 hours": 50
      }
    );


  const breaksScore =
    optionScore(
      answers.studyBreaks,
      {
        "Almost never": 30,
        "Every 2+ hours": 50,
        "Every 60 to 90 minutes": 80,
        "Every 30 to 60 minutes": 100,
        "Very frequently": 75
      }
    );


  const cognitive =
    clamp100(

      studyHoursScore *
      0.35 +

      breaksScore *
      0.30 +

      fatigueScore *
      0.20 +

      environmentScore *
      0.15

    );


  const exerciseScore =
    optionScore(
      answers.exerciseFrequency,
      {
        "Never": 30,
        "1 time per week": 50,
        "2 to 3 times per week": 80,
        "4 to 5 times per week": 100,
        "Daily": 90
      }
    );


  const breakfastScore =
    optionScore(
      answers.breakfastHabits,
      {
        "I never eat breakfast": 40,
        "I rarely eat breakfast": 55,
        "I eat breakfast sometimes": 70,
        "I usually eat breakfast": 90,
        "I always eat breakfast": 100
      }
    );


  const waterScore =
    optionScore(
      answers.waterIntake,
      {
        "Less than 1 liter": 40,
        "1 to 2 liters": 70,
        "2 to 3 liters": 100,
        "More than 3 liters": 85
      }
    );


  const physical =
    clamp100(

      exerciseScore *
      0.45 +

      breakfastScore *
      0.25 +

      waterScore *
      0.30

    );


  /*
    Baseline weights from
    the Neurovia specification:
    Sleep 35%
    Stress 30%
    Cognitive Load 25%
    Physical Wellness 10%
  */

  const overall =
    clamp100(

      sleep *
      0.35 +

      stress *
      0.30 +

      cognitive *
      0.25 +

      physical *
      0.10

    );


  return {

    sleep,

    stress,

    cognitive,

    physical,

    overall,

    createdAt:
      new Date()
        .toISOString()

  };
}