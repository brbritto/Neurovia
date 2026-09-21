const RECOVERY_LIBRARY = {

  sleepDebt: [
    "Protect a longer sleep opportunity tonight and keep tomorrow's wake-up time consistent.",

    "Avoid extending demanding work late into the evening tonight. Your recent sleep deficit is the priority.",

    "Reduce optional late-night screen use and protect enough time for sleep tonight."
  ],

  lowReadiness: [
    "Keep today's workload below your maximum capacity and avoid unnecessary task switching.",

    "Move one non-essential demanding task to another day if possible.",

    "Use shorter focused work blocks today and leave recovery time between demanding tasks."
  ],

  cognitiveLoad: [
    "Choose one priority task and finish one focused block before switching tasks.",

    "Break the next demanding task into a smaller first step instead of trying to complete everything at once.",

    "Protect one interruption-free work block, then take a real break before continuing."
  ],

  stress: [
    "Reduce one avoidable demand today and keep the final part of your evening lower stimulation.",

    "Move your hardest remaining task away from the end of the day if possible.",

    "Take a short walk or movement break before returning to demanding work."
  ]
};


function stableSuggestion(
  category,
  seed = 0
) {
  const list =
    RECOVERY_LIBRARY[
      category
    ] || [];

  if (!list.length) {
    return null;
  }

  return list[
    Math.abs(seed) %
    list.length
  ];
}


function consecutiveLowReadiness(
  user,
  threshold = 55
) {
  const dates =
    Object.keys(
      user.dailyLogs || {}
    )
      .sort()
      .reverse();

  let count = 0;

  for (
    const date of dates
  ) {

    const scores =
      user.dailyLogs[
        date
      ]?.scores;

    const readiness =
      Number(
        scores?.brainReadiness ??
        scores?.overall ??
        100
      );

    if (
      readiness <
      threshold
    ) {
      count++;
    } else {
      break;
    }
  }

  return count;
}


function buildRecoveryTool(
  user
) {
  const dates =
    Object.keys(
      user.dailyLogs || {}
    ).sort();

  if (!dates.length) {
    return null;
  }

  const latestDate =
    dates[
      dates.length - 1
    ];

  const latest =
    user.dailyLogs[
      latestDate
    ];

  const scores =
    latest.scores || {};

  const recentLogs =
    dates
      .slice(-7)
      .map(
        date =>
          user.dailyLogs[
            date
          ]
      );

  const sleepDebt =
    calculateWeeklySleepDebt(
      user.profile,
      recentLogs
    );

  const lowDays =
    consecutiveLowReadiness(
      user
    );

  const seed =
    dates.length;

  if (sleepDebt >= 5) {
    return {
      type: "Sleep recovery",

      reason:
        `Your estimated sleep debt across recent logs is ${sleepDebt} hours.`,

      action:
        stableSuggestion(
          "sleepDebt",
          seed
        )
    };
  }

  if (lowDays >= 3) {
    return {
      type: "Readiness recovery",

      reason:
        `Your Brain Readiness has been below 55 for ${lowDays} consecutive logged days.`,

      action:
        stableSuggestion(
          "lowReadiness",
          seed
        )
    };
  }

  if (
    Number(
      scores.cognitiveLoad
    ) >= 70
  ) {
    return {
      type:
        "Cognitive load",

      reason:
        `Your current Cognitive Load is ${scores.cognitiveLoad}/100.`,

      action:
        stableSuggestion(
          "cognitiveLoad",
          seed
        )
    };
  }

  if (
    Number(
      latest.stressLevel
    ) >= 8
  ) {
    return {
      type:
        "Stress load",

      reason:
        `You reported stress at ${latest.stressLevel}/10 today.`,

      action:
        stableSuggestion(
          "stress",
          seed
        )
    };
  }

  return {
    type:
      "Maintain",

    reason:
      "No major recovery trigger is active right now.",

    action:
      "Maintain your current routine and keep checking in so Neurovia can detect changes early."
  };
}