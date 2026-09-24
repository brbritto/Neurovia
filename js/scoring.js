function clamp100(value) {

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(value)
    )
  );

}


/* =========================
   TIME HELPERS
   ========================= */


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


function circularMinuteDifference(
  firstTime,
  secondTime
) {

  if (
    !firstTime ||
    !secondTime
  ) {
    return null;
  }


  const first =
    parseTimeToMinutes(
      firstTime
    );


  const second =
    parseTimeToMinutes(
      secondTime
    );


  let difference =
    Math.abs(
      first -
      second
    );


  /*
    Handles midnight correctly.

    Example:
    23:30 and 00:30
    should be 60 minutes apart,
    not 23 hours apart.
  */

  difference =
    Math.min(
      difference,
      1440 - difference
    );


  return difference;

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


  if (
    wake <= sleep
  ) {

    wake +=
      24 * 60;

  }


  return Number(
    (
      (
        wake -
        sleep
      ) /
      60
    ).toFixed(1)
  );

}


/* =========================
   SLEEP REFERENCE
   ========================= */


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


  if (
    n >= 65
  ) {

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


/* =========================
   GENERIC HELPERS
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


function averageNumbers(
  values
) {

  const valid =
    (values || [])
      .map(Number)
      .filter(
        Number.isFinite
      );


  if (
    !valid.length
  ) {
    return null;
  }


  return (
    valid.reduce(
      (
        total,
        value
      ) =>
        total +
        value,
      0
    ) /
    valid.length
  );

}


/* =========================
   NEW DAILY VARIABLES
   ========================= */


function screenMinutesFromAnswer(
  value
) {

  const map = {

    "None":
      0,

    "Less than 15 min":
      10,

    "15 to 30 min":
      22.5,

    "30 to 45 min":
      37.5,

    "More than 45 min":
      55

  };


  return (
    map[value] ??
    null
  );

}


function breakSupportScore(
  value
) {

  return optionScore(
    value,
    {

      "None":
        20,

      "Few":
        45,

      "Some":
        75,

      "Enough":
        100

    },
    50
  );

}


function getRestedScore(
  value
) {

  const number =
    Number(value);


  if (
    !Number.isFinite(number)
  ) {
    return 50;
  }


  return clamp100(
    number *
    10
  );

}


/* =========================
   BASELINE HELPERS
   ========================= */


function getBaselineAnswers(
  profile
) {

  return (
    profile?.baselineAnswers ||
    {}
  );

}


/* =========================
   DAILY CHECK-IN SCORING
   ========================= */


/*
  Neurovia scores are wellness
  estimates.

  They are not diagnostic
  measurements.
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


  const baseline =
    getBaselineAnswers(
      profile
    );


  /*
    DAILY INPUTS
  */


  const sleepHours =
    calculateSleepHours(
      log.sleepTime,
      log.wakeTime
    );


  const sleepQuality =
    Number(
      log.sleepQuality ||
      5
    );


  const rested =
    Number(
      log.restedLevel ||
      5
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


  const distraction =
    Number(
      log.distractionLevel ||
      3
    );


  const focus =
    Number(
      log.focusLevel ||
      5
    );


  /*
    SLEEP
  */


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


  const wakeRestedScore =
    getRestedScore(
      rested
    );


  /*
    Duration:
    50%

    Subjective sleep quality:
    30%

    How restored the person
    felt after waking:
    20%
  */


  const sleep =
    clamp100(

      sleepDurationScore *
      0.50 +

      sleepQualityScore *
      0.30 +

      wakeRestedScore *
      0.20

    );


  /*
    STRESS
  */


  const stressControl =
    clamp100(
      110 -
      stress *
      10
    );


  /*
    ENERGY
  */


  const energyScore =
    clamp100(
      energy *
      10
    );


  /*
    FOCUS
  */


  const focusScore =
    clamp100(
      focus *
      10
    );


  /*
    DISTRACTION

    1 = very focused environment
    5 = extremely distracting
  */


  const distractionControl =
    clamp100(
      110 -
      distraction *
      20
    );


  /*
    BREAKS
  */


  const breaksSupport =
    breakSupportScore(
      log.breaksLevel
    );


  /*
    COGNITIVE LOAD

    Higher score =
    greater cognitive load.

    Mental demand remains the
    largest component.

    Stress, low focus,
    distraction and lack of
    breaks also contribute.
  */


  const cognitiveLoad =
    clamp100(

      workload *
      5.0 +

      stress *
      2.5 +

      (
        10 -
        focus
      ) *
      1.5 +

      (
        100 -
        distractionControl
      ) *
      0.10 +

      (
        100 -
        breaksSupport
      ) *
      0.10

    );


  /*
    RECOVERY

    Sleep remains the largest
    contributor.

    Energy, stress regulation
    and breaks also matter.
  */


  const recovery =
    clamp100(

      sleep *
      0.45 +

      energyScore *
      0.25 +

      stressControl *
      0.20 +

      breaksSupport *
      0.10

    );


  /*
    BRAIN READINESS
  */


  const brainReadiness =
    clamp100(

      sleep *
      0.30 +

      recovery *
      0.30 +

      focusScore *
      0.25 +

      (
        100 -
        cognitiveLoad
      ) *
      0.15

    );


  /*
    SLEEP DEBT
  */


  const sleepDebt =
    calculateDailySleepDebt(
      age,
      sleepHours
    );


  /*
    BASELINE COMPARISON

    These variables make the
    Baseline useful after the
    onboarding.

    We compare today's sleep
    schedule with the person's
    usual sleep schedule.
  */


  const usualSleepTime =
    baseline.sleepTime ||
    null;


  const usualWakeTime =
    baseline.wakeTime ||
    null;


  const sleepTimeShiftMinutes =
    circularMinuteDifference(
      log.sleepTime,
      usualSleepTime
    );


  const wakeTimeShiftMinutes =
    circularMinuteDifference(
      log.wakeTime,
      usualWakeTime
    );


  /*
    SCREEN TIME

    IMPORTANT:

    Screen time is recorded as
    a context variable.

    Neurovia does NOT directly
    subtract points just because
    the user used a screen.

    Instead, repeated observations
    can later be compared with
    sleep quality.
  */


  const screenBeforeSleepMinutes =
    screenMinutesFromAnswer(
      log.screenBeforeSleep
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

    focus,

    rested,

    distraction,

    distractionControl,

    breaksSupport,

    screenBeforeSleepMinutes,

    sleepTimeShiftMinutes,

    wakeTimeShiftMinutes,

    usualSleepTime,

    usualWakeTime

  };

}


/* =========================
   LOG HELPERS
   ========================= */


function getLatestLog(
  user
) {

  const dates =
    Object
      .keys(
        user?.dailyLogs ||
        {}
      )
      .sort();


  if (
    !dates.length
  ) {
    return null;
  }


  return user.dailyLogs[
    dates[
      dates.length -
      1
    ]
  ];

}


function getPreviousLog(
  user
) {

  const dates =
    Object
      .keys(
        user?.dailyLogs ||
        {}
      )
      .sort();


  if (
    dates.length <
    2
  ) {
    return null;
  }


  return user.dailyLogs[
    dates[
      dates.length -
      2
    ]
  ];

}


/* =========================
   AVERAGES
   ========================= */


function getAverageOfLogs(
  logs
) {

  const validLogs =
    (logs || [])
      .filter(
        log =>
          log &&
          log.scores
      );


  if (
    !validLogs.length
  ) {
    return null;
  }


  const totals = {

    sleep:
      0,

    recovery:
      0,

    cognitiveLoad:
      0,

    brainReadiness:
      0,

    focus:
      0

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
          log.focusLevel ||
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


/* =========================
   WEEKLY SLEEP DEBT
   ========================= */


function calculateWeeklySleepDebt(
  profile,
  logs
) {

  let debt =
    0;


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


/*
  The old Physical Wellness
  score has been removed.

  No weight, height, sex,
  exercise, breakfast or
  water variables are used.
*/


function calculateBaselineScores(
  profile,
  answers
) {

  const age =
    Number(
      profile.age ||
      18
    );


  /*
    USUAL SLEEP DURATION
  */


  const usualSleepHours =
    calculateSleepHours(
      answers.sleepTime,
      answers.wakeTime
    );


  const durationScore =
    calculateSleepScore(
      age,
      usualSleepHours
    );


  /*
    DIFFICULTY FALLING ASLEEP
  */


  const fallingAsleepScore =
    optionScore(
      answers.fallAsleepDifficulty,
      {

        "Never":
          100,

        "Rarely":
          85,

        "Sometimes":
          65,

        "Often":
          40,

        "Always":
          20

      }
    );


  /*
    BASELINE SLEEP
  */


  const sleep =
    clamp100(

      durationScore *
      0.70 +

      fallingAsleepScore *
      0.30

    );


  /*
    USUAL COGNITIVE DEMAND

    This does NOT mean that
    demanding work is inherently
    unhealthy.

    It gives Neurovia context
    about the user's normal
    cognitive schedule.
  */


  const demandLoad =
    optionScore(
      answers.mentalDemandHours,
      {

        "Less than 1 hour":
          20,

        "1 to 2 hours":
          35,

        "3 to 4 hours":
          55,

        "5 to 6 hours":
          75,

        "More than 6 hours":
          95

      },
      50
    );


  /*
    ROUTINE BALANCE

    This replaces the old
    Overall Baseline that mixed
    unrelated Physical Wellness
    variables.
  */


  const routineBalance =
    clamp100(

      sleep *
      0.70 +

      (
        100 -
        demandLoad
      ) *
      0.30

    );


  return {

    sleep,

    usualSleepHours,

    fallingAsleepScore,

    demandLoad,

    routineBalance,

    overall:
      routineBalance,

    createdAt:
      new Date()
        .toISOString()

  };

}


/* =========================
   PERSONAL PATTERNS
   ========================= */


/*
  This section is important.

  These functions let Neurovia
  USE the new Daily questions
  longitudinally instead of
  simply collecting them.
*/


function getRecentDailyLogs(
  user,
  limit = 30
) {

  return Object
    .keys(
      user?.dailyLogs ||
      {}
    )
    .sort()
    .slice(
      -limit
    )
    .map(
      date => ({

        date,

        log:
          user.dailyLogs[
            date
          ]

      })
    );

}


/*
  PERSONAL PATTERN ENGINE

  Minimum:
  3 observations in each
  comparison group.

  This avoids making claims
  based on one isolated day.
*/


function buildPersonalDailyPatterns(
  user,
  limit = 30
) {

  const items =
    getRecentDailyLogs(
      user,
      limit
    );


  const result = {

    sampleSize:
      items.length,

    screenSleep:
      null,

    distractionFocus:
      null,

    breaksLoad:
      null,

    sleepEnergy:
      null

  };


  /* =====================
     SCREEN ↔ SLEEP
     ===================== */


  const lowScreen =
    items.filter(
      item => {

        const minutes =
          Number(
            item.log
              ?.scores
              ?.screenBeforeSleepMinutes
          );


        return (
          Number.isFinite(minutes) &&
          minutes <= 15
        );

      }
    );


  const highScreen =
    items.filter(
      item => {

        const minutes =
          Number(
            item.log
              ?.scores
              ?.screenBeforeSleepMinutes
          );


        return (
          Number.isFinite(minutes) &&
          minutes >= 30
        );

      }
    );


  if (
    lowScreen.length >= 3 &&
    highScreen.length >= 3
  ) {

    const low =
      averageNumbers(
        lowScreen.map(
          item =>
            item.log.sleepQuality
        )
      );


    const high =
      averageNumbers(
        highScreen.map(
          item =>
            item.log.sleepQuality
        )
      );


    result.screenSleep = {

      lowScreenCount:
        lowScreen.length,

      highScreenCount:
        highScreen.length,

      lowScreenSleepQuality:
        Number(
          low.toFixed(1)
        ),

      highScreenSleepQuality:
        Number(
          high.toFixed(1)
        ),

      difference:
        Number(
          (
            low -
            high
          ).toFixed(1)
        )

    };

  }


  /* =====================
     DISTRACTION ↔ FOCUS
     ===================== */


  const lowDistraction =
    items.filter(
      item =>

        Number(
          item.log
            ?.distractionLevel
        ) <= 2

    );


  const highDistraction =
    items.filter(
      item =>

        Number(
          item.log
            ?.distractionLevel
        ) >= 4

    );


  if (
    lowDistraction.length >= 3 &&
    highDistraction.length >= 3
  ) {

    const low =
      averageNumbers(
        lowDistraction.map(
          item =>
            item.log.focusLevel
        )
      );


    const high =
      averageNumbers(
        highDistraction.map(
          item =>
            item.log.focusLevel
        )
      );


    result.distractionFocus = {

      lowDistractionCount:
        lowDistraction.length,

      highDistractionCount:
        highDistraction.length,

      lowDistractionFocus:
        Number(
          low.toFixed(1)
        ),

      highDistractionFocus:
        Number(
          high.toFixed(1)
        ),

      difference:
        Number(
          (
            low -
            high
          ).toFixed(1)
        )

    };

  }


  /* =====================
     BREAKS ↔ LOAD
     ===================== */


  const weakBreaks =
    items.filter(
      item =>

        [
          "None",
          "Few"
        ].includes(
          item.log
            ?.breaksLevel
        )

    );


  const goodBreaks =
    items.filter(
      item =>

        [
          "Some",
          "Enough"
        ].includes(
          item.log
            ?.breaksLevel
        )

    );


  if (
    weakBreaks.length >= 3 &&
    goodBreaks.length >= 3
  ) {

    const weak =
      averageNumbers(
        weakBreaks.map(
          item =>
            item.log
              ?.scores
              ?.cognitiveLoad
        )
      );


    const good =
      averageNumbers(
        goodBreaks.map(
          item =>
            item.log
              ?.scores
              ?.cognitiveLoad
        )
      );


    result.breaksLoad = {

      weakBreaksCount:
        weakBreaks.length,

      goodBreaksCount:
        goodBreaks.length,

      weakBreaksLoad:
        Math.round(
          weak
        ),

      goodBreaksLoad:
        Math.round(
          good
        ),

      difference:
        Math.round(
          weak -
          good
        )

    };

  }


  /* =====================
     SLEEP ↔ ENERGY
     ===================== */


  const range =
    recommendedSleepRange(
      user?.profile?.age ||
      18
    );


  const enoughSleep =
    items.filter(
      item =>

        Number(
          item.log
            ?.scores
            ?.sleepHours
        ) >=
        range.min

    );


  const shortSleep =
    items.filter(
      item =>

        Number(
          item.log
            ?.scores
            ?.sleepHours
        ) <
        range.min

    );


  if (
    enoughSleep.length >= 3 &&
    shortSleep.length >= 3
  ) {

    const enough =
      averageNumbers(
        enoughSleep.map(
          item =>
            item.log.energyLevel
        )
      );


    const short =
      averageNumbers(
        shortSleep.map(
          item =>
            item.log.energyLevel
        )
      );


    result.sleepEnergy = {

      enoughSleepCount:
        enoughSleep.length,

      shortSleepCount:
        shortSleep.length,

      enoughSleepEnergy:
        Number(
          enough.toFixed(1)
        ),

      shortSleepEnergy:
        Number(
          short.toFixed(1)
        ),

      difference:
        Number(
          (
            enough -
            short
          ).toFixed(1)
        )

    };

  }


  return result;

}


/* =========================
   BASELINE CONTEXT
   ========================= */


function getBaselineContext(
  user
) {

  const answers =
    user?.baseline?.answers ||
    user?.onboardingAnswers ||
    {};


  return {

    usualSleepTime:
      answers.sleepTime ||
      null,

    usualWakeTime:
      answers.wakeTime ||
      null,

    fallAsleepDifficulty:
      answers.fallAsleepDifficulty ||
      null,

    mentalDemandHours:
      answers.mentalDemandHours ||
      null

  };

}