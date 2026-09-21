function classifyReadiness(score) {
  if (score >= 80) return "Ready";
  if (score >= 65) return "Balanced";
  if (score >= 45) return "Under strain";

  return "Recovery needed";
}

function getRecentLogs(user, limit = 7) {
  if (!user?.dailyLogs) return [];

  return Object.keys(user.dailyLogs)
    .sort()
    .slice(-limit)
    .map(date => user.dailyLogs[date]);
}

function buildMainInsight(
  user,
  latestLog,
  scores,
  recentLogs
) {
  const concern =
    user.mainConcern ||
    "My routine feels unstable";

  const sleepDebt =
    calculateWeeklySleepDebt(
      user.profile,
      recentLogs
    );

  const stress =
    Number(latestLog.stressLevel || 0);

  const energy =
    Number(latestLog.energyLevel || 0);

  const workload =
    Number(latestLog.workloadLevel || 0);

  const focus =
    Number(latestLog.focusLevel || 0);

  if (concern === "I feel exhausted") {

    if (sleepDebt >= 2) {
      return {
        title:
          "Sleep recovery may be contributing to your exhaustion",

        explanation:
          `Your recent sleep pattern shows approximately ${sleepDebt} hours of accumulated sleep debt. That pattern may be contributing to lower energy and recovery today.`,

        action:
          "Tonight, prioritize enough time in bed to move closer to your recommended sleep range."
      };
    }

    if (energy <= 4 && stress >= 7) {
      return {
        title:
          "High stress may be reducing your recovery",

        explanation:
          "Your energy is low while your reported stress is high. Your pattern suggests that recovery demand is currently elevated.",

        action:
          "Reduce one non-essential demanding task today and protect a low-stimulation recovery period before sleep."
      };
    }

    return {
      title:
        "Your energy is currently below your usual capacity",

      explanation:
        "No single factor clearly explains the pattern yet. Neurovia will become more useful as you build several days of data.",

      action:
        "Keep today's workload moderate and complete tomorrow's check-in so the trend can be compared."
    };
  }

  if (concern === "I can’t focus") {

    if (
      scores.cognitiveLoad >= 70
    ) {
      return {
        title:
          "High cognitive load may be limiting your focus",

        explanation:
          `Your cognitive load is ${scores.cognitiveLoad}/100. High workload combined with stress and reduced focus is creating a high-demand pattern today.`,

        action:
          "Do your next demanding task in one focused block, then take a real break before starting another."
      };
    }

    if (scores.sleep < 65) {
      return {
        title:
          "Sleep recovery may be affecting your concentration",

        explanation:
          `You slept approximately ${scores.sleepHours} hours and your sleep recovery score is ${scores.sleep}/100.`,

        action:
          "Prioritize your sleep window tonight instead of extending work later into the evening."
      };
    }

    return {
      title:
        "Your focus difficulty is not explained by one dominant factor yet",

      explanation:
        "Your current sleep and cognitive-load signals do not show one strong driver. More daily data will help distinguish a temporary low-focus day from a recurring pattern.",

      action:
        "Protect one distraction-free work block today and check whether focus changes afterward."
    };
  }

  if (concern === "I wake up tired") {

    if (scores.sleepDebt > 0) {
      return {
        title:
          "Your sleep duration may not be supporting full recovery",

        explanation:
          `You slept approximately ${scores.sleepHours} hours. Today's estimated sleep deficit is ${scores.sleepDebt} hour(s).`,

        action:
          "Give yourself a longer sleep opportunity tonight rather than trying to compensate with more work or screen time."
      };
    }

    return {
      title:
        "Sleep duration alone may not explain your morning fatigue",

      explanation:
        "Your recorded sleep duration is within the expected range, so Neurovia needs several days of data to determine whether timing, stress or accumulated workload is part of the pattern.",

      action:
        "Keep your sleep and wake times consistent tonight and continue the daily check-in."
    };
  }

  if (
    concern ===
    "I feel mentally overloaded"
  ) {

    if (
      workload >= 7 ||
      scores.cognitiveLoad >= 70
    ) {
      return {
        title:
          "Your current demand is exceeding your recovery signal",

        explanation:
          `Your cognitive load is ${scores.cognitiveLoad}/100 while recovery is ${scores.recovery}/100. This pattern suggests that mental demand is currently high relative to recovery.`,

        action:
          "Choose one priority task for your next work period instead of switching between multiple demanding tasks."
      };
    }

    return {
      title:
        "Your overload may be building across the week",

      explanation:
        "Today's workload alone is not extremely high. Repeated daily check-ins will help Neurovia identify whether the problem is cumulative rather than isolated.",

      action:
        "Avoid adding unnecessary tasks today and complete the next daily check-in."
    };
  }

  if (scores.cognitiveLoad >= 70) {
    return {
      title:
        "Cognitive demand is your strongest signal today",

      explanation:
        `Your cognitive load is ${scores.cognitiveLoad}/100, which is currently your most important strain signal.`,

      action:
        "Reduce task switching and complete your highest-priority task before adding new demands."
    };
  }

  if (scores.recovery < 55) {
    return {
      title:
        "Recovery is your main limiting factor today",

      explanation:
        `Your recovery score is ${scores.recovery}/100. Sleep, energy and stress are combining into a lower-recovery pattern.`,

      action:
        "Keep today's workload below your maximum capacity and prioritize recovery tonight."
    };
  }

  return {
    title:
      "Your current pattern looks relatively balanced",

    explanation:
      "No major strain signal is dominating today's check-in.",

    action:
      "Maintain your current routine and continue checking in so Neurovia can detect changes early."
  };
}

function buildWeeklyInsight(
  currentScores,
  previousScores
) {
  if (!previousScores) {
    return {
      title: "Building your baseline",
      text:
        "Keep checking in. Neurovia needs more than one day to identify a meaningful trend."
    };
  }

  const difference =
    currentScores.brainReadiness -
    previousScores.brainReadiness;

  if (difference >= 8) {
    return {
      title: "Readiness is improving",
      text:
        `Your Brain Readiness increased by ${difference} points compared with your previous check-in.`
    };
  }

  if (difference <= -8) {
    return {
      title: "Readiness has declined",
      text:
        `Your Brain Readiness decreased by ${Math.abs(difference)} points compared with your previous check-in.`
    };
  }

  return {
    title: "Your readiness is relatively stable",
    text:
      "Your latest check-ins do not show a major change in overall readiness."
  };
}