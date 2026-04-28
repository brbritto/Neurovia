function classifyScore(score) {
  if (score >= 80) return "Doing good";
  if (score >= 60) return "Stable";
  return "Needs improvement";
}

function calculateSleepDebt(age, logs) {
  const { min } = recommendedSleepRange(age);
  let debt = 0;

  logs.forEach(log => {
    const hours = calculateSleepHours(log.sleepTime, log.wakeTime);
    if (hours < min) debt += (min - hours);
  });

  return Number(debt.toFixed(1));
}

function calculateSleepVariability(logs) {
  const values = logs
    .map(log => log.sleepTime)
    .filter(Boolean)
    .map(parseTimeToMinutes);

  if (values.length < 2) return 0;
  return Math.round((Math.max(...values) - Math.min(...values)) / 60);
}

function buildMainInsight(user, latestLog, scores, recentLogs) {
  const concern = user.mainConcern || "My routine feels unstable";
  const sleepDebt = calculateSleepDebt(user.profile.age, recentLogs);

  if (concern === "I feel exhausted") {
    if (sleepDebt >= 3 || scores.sleep < 70) {
      return {
        title: "Your fatigue may be linked to sleep recovery",
        text: `Your recent pattern suggests reduced sleep recovery. Estimated sleep debt: ${sleepDebt} hour(s). Your first action should be to recover part of that debt before trying to optimize the rest of your routine.`
      };
    }
    if (scores.physical < 70) {
      return {
        title: "Your fatigue may be linked to physical recovery inputs",
        text: `Your hydration, breakfast or exercise pattern may be limiting your energy stability. Start with hydration and a more consistent recovery routine first.`
      };
    }
  }

  if (concern === "I can’t focus") {
    if (scores.cognitive < 70) {
      return {
        title: "Your focus may be limited by cognitive overload",
        text: `Your recent study rhythm, fatigue pattern and break structure suggest overload. Shorter focused blocks and better break spacing should come before trying to simply study longer.`
      };
    }
    if (scores.sleep < 70) {
      return {
        title: "Your focus may be limited by poor sleep recovery",
        text: `Your recent sleep pattern may be contributing to reduced concentration and mental endurance. Sleep stabilization should be your first correction.`
      };
    }
  }

  if (concern === "I wake up tired") {
    return {
      title: "Your morning tiredness may be linked to sleep quality",
      text: `Your current sleep duration, recovery perception and difficulty falling asleep suggest that your sleep may not be restorative enough yet.`
    };
  }

  if (concern === "I feel mentally overloaded") {
    return {
      title: "Your current pattern suggests mental overload",
      text: `Your stress, fatigue and study pattern suggest that the issue is not only volume, but the way effort and recovery are distributed through the week.`
    };
  }

  return {
    title: "Your routine may need stabilization",
    text: `Your current data suggests that routine consistency matters more than one isolated metric right now. Regular sleep, hydration and study structure should come first.`
  };
}

function buildImprovementCards(profile, latestLog, scores, recentLogs) {
  const cards = [];

  const sleepDebt = calculateSleepDebt(profile.age, recentLogs);
  const variability = calculateSleepVariability(recentLogs);
  const targetRange = recommendedSleepRange(profile.age);
  const waterGap = Number((scores.waterTarget - scores.actualWater).toFixed(1));

  if (scores.sleep < 80) {
    let sleepAction = "";

    if (sleepDebt >= 7) {
      sleepAction = `You accumulated about ${sleepDebt} hours of sleep debt. For the next 4 nights, add 60 to 90 minutes of sleep. Keep the same wake-up time every day. After the recovery phase, keep a stable sleep window for 7 days.`;
    } else if (sleepDebt >= 3) {
      sleepAction = `You have a moderate sleep debt of about ${sleepDebt} hours. Add 45 to 60 minutes of sleep for the next 3 nights, then keep bedtime and wake-up time stable for one week.`;
    } else if (variability >= 2) {
      sleepAction = `Your sleep schedule is inconsistent. Your bedtime varies by about ${variability} hours. Keep bedtime and wake-up time within a 60-minute range for the next 7 days.`;
    } else {
      sleepAction = `Your last recorded sleep was ${scores.sleepHours} hours. Your target for your age is ${targetRange.min} to ${targetRange.max} hours. Move bedtime earlier by 15 to 30 minutes every 2 nights until you enter that range.`;
    }

    cards.push({
      area: "Sleep",
      issue: `Your sleep score is ${scores.sleep}.`,
      why: `Your recent sleep pattern is below the optimal range for your age. Estimated weekly sleep debt: ${sleepDebt} hours.`,
      action: sleepAction
    });
  }

  if (scores.stress < 80) {
    const stress = Number(latestLog.stressLevel || 0);
    let stressAction = "";

    if (stress >= 8) {
      stressAction = "For the next 3 days, reduce long study blocks, split demanding tasks into shorter sessions, and reserve one 20-minute decompression block every day.";
    } else if (stress >= 6) {
      stressAction = "Move your hardest task to your first strong-energy block of the day and avoid heavy late-night study this week.";
    } else {
      stressAction = "Protect the first hours after waking for focused work and keep evening stimulation lower.";
    }

    cards.push({
      area: "Stress Control",
      issue: `Your stress control score is ${scores.stress}.`,
      why: `Your reported stress level and fatigue pattern suggest recovery pressure.`,
      action: stressAction
    });
  }

  if (scores.cognitive < 80) {
    let cognitiveAction = "";

    if (latestLog.studyHours === "More than 6 hours" && (latestLog.studyBreaks === "Almost never" || latestLog.studyBreaks === "Every 2+ hours")) {
      cognitiveAction = "Start using 50 minutes of study followed by 10 minutes of break for every long block. Maintain this structure for the next 7 days.";
    } else if (latestLog.daytimeFatigue === "Often" || latestLog.daytimeFatigue === "Always") {
      cognitiveAction = "Reduce passive screen use at night, and place your most demanding study task in the first half of the day.";
    } else {
      cognitiveAction = "Keep break intervals under 90 minutes and avoid long uninterrupted work sessions.";
    }

    cards.push({
      area: "Cognitive Load",
      issue: `Your cognitive load score is ${scores.cognitive}.`,
      why: `Your study hours, fatigue pattern and break structure suggest unnecessary strain.`,
      action: cognitiveAction
    });
  }

  if (scores.physical < 80) {
    let physicalAction = "";

    if (waterGap > 1) {
      physicalAction = `Your estimated hydration target is ${scores.waterTarget} L/day and your last log suggests about ${scores.actualWater} L/day. Raise intake gradually by 300 to 500 mL earlier in the day, then reassess after 5 to 7 days.`;
    } else if (latestLog.exerciseFrequency === "Never") {
      physicalAction = "Start with 2 sessions per week of 20 to 30 minutes and build consistency before increasing volume.";
    } else if (latestLog.breakfastHabits === "I never eat breakfast" || latestLog.breakfastHabits === "I rarely eat breakfast") {
      physicalAction = "Start with a small morning meal or snack for 5 consecutive days, then reassess energy stability.";
    } else {
      physicalAction = "Improve hydration distribution through the day and keep exercise consistent across the week.";
    }

    cards.push({
      area: "Physical Wellness",
      issue: `Your physical wellness score is ${scores.physical}.`,
      why: `Hydration, exercise and breakfast patterns are part of your current recovery baseline.`,
      action: physicalAction
    });
  }

  if (!cards.length) {
    cards.push({
      area: "Overall",
      issue: "No major weak area was detected.",
      why: "Your current pattern looks relatively balanced.",
      action: "Keep updating your daily data so the app can detect subtle changes over time."
    });
  }

  return cards;
}

function buildHomeSummary(todayScores, previousScores, weeklyAverage) {
  let trendLabel = "Insufficient history";
  let trendValue = 0;
  let previousStatus = "No previous day";

  if (previousScores) {
    trendValue = todayScores.overall - previousScores.overall;
    trendLabel = trendValue > 3 ? "Improving" : trendValue < -3 ? "Declining" : "Stable";
    previousStatus = classifyScore(previousScores.overall);
  }

  return {
    todayStatus: classifyScore(todayScores.overall),
    previousStatus,
    weeklyStatus: weeklyAverage ? classifyScore(weeklyAverage.overall) : "No weekly baseline",
    trendLabel,
    trendValue
  };
}