function ensureBrainCalendar(user) {
  if (!user.brainCalendar) {
    user.brainCalendar = [];
  }

  return user.brainCalendar;
}


function addBrainEvent(user, eventData) {
  ensureBrainCalendar(user);

  const event = {
    id:
      Date.now().toString() +
      Math.random().toString(16).slice(2),

    title: eventData.title,
    date: eventData.date,
    type: eventData.type || "Other",

    intensity:
      Number(eventData.intensity || 2),

    createdAt:
      new Date().toISOString()
  };

  user.brainCalendar.push(event);

  return event;
}


function deleteBrainEvent(user, eventId) {
  ensureBrainCalendar(user);

  user.brainCalendar =
    user.brainCalendar.filter(
      event => event.id !== eventId
    );
}


function dateDistanceInDays(dateA, dateB) {
  const a =
    new Date(dateA + "T12:00:00");

  const b =
    new Date(dateB + "T12:00:00");

  return Math.abs(
    Math.round(
      (a - b) /
      (1000 * 60 * 60 * 24)
    )
  );
}


function getRecentReadiness(user, days = 5) {
  const logs =
    user.dailyLogs || {};

  const dates =
    Object.keys(logs)
      .sort()
      .slice(-days);

  const values =
    dates
      .map(date => {
        const scores =
          logs[date]?.scores;

        return Number(
          scores?.brainReadiness ??
          scores?.overall ??
          0
        );
      })
      .filter(value => value > 0);

  if (!values.length) {
    return 70;
  }

  return Math.round(
    values.reduce(
      (sum, value) =>
        sum + value,
      0
    ) / values.length
  );
}


function getEventsAroundDate(
  user,
  targetDate,
  radiusDays = 1
) {
  ensureBrainCalendar(user);

  return user.brainCalendar.filter(
    event =>
      dateDistanceInDays(
        event.date,
        targetDate
      ) <= radiusDays
  );
}


function calculateCalendarRisk(
  user,
  targetDate
) {
  const nearby =
    getEventsAroundDate(
      user,
      targetDate,
      1
    );

  const exact =
    nearby.filter(
      event =>
        event.date === targetDate
    );

  const readiness =
    getRecentReadiness(
      user,
      5
    );

  const density =
    nearby.length;

  const intensity =
    nearby.reduce(
      (sum, event) =>
        sum +
        Number(
          event.intensity || 1
        ),
      0
    );

  let riskPoints = 0;

  /*
    Workload density
  */

  if (density >= 2) {
    riskPoints += 1;
  }

  if (density >= 3) {
    riskPoints += 1;
  }

  if (exact.length >= 2) {
    riskPoints += 1;
  }

  if (intensity >= 6) {
    riskPoints += 1;
  }

  /*
    Current brain trend
  */

  if (readiness < 65) {
    riskPoints += 1;
  }

  if (readiness < 50) {
    riskPoints += 2;
  }

  let tier = "Low";

  if (riskPoints >= 5) {
    tier = "High";
  } else if (riskPoints >= 2) {
    tier = "Moderate";
  }

  return {
    tier,
    riskPoints,
    density,
    exactCount: exact.length,
    readiness,
    intensity,
    events: nearby
  };
}


function getCalendarSuggestion(
  risk
) {
  if (risk.tier === "High") {

    return (
      `You have ${risk.density} demanding events ` +
      `clustered within roughly 72 hours, while your ` +
      `recent Brain Readiness average is ${risk.readiness}. ` +
      `Consider starting or moving at least one task earlier.`
    );
  }

  if (risk.tier === "Moderate") {

    return (
      "Your upcoming workload is starting to cluster. " +
      "Starting one demanding task earlier may reduce " +
      "pressure later."
    );
  }

  return (
    "Your upcoming workload currently looks manageable."
  );
}


function getUpcomingBrainDays(
  user,
  numberOfDays = 14
) {
  const days = [];

  const today =
    new Date();

  today.setHours(
    12,
    0,
    0,
    0
  );

  for (
    let i = 0;
    i < numberOfDays;
    i++
  ) {

    const date =
      new Date(today);

    date.setDate(
      today.getDate() + i
    );

    const key =
      date
        .toISOString()
        .slice(0, 10);

    const events =
      (user.brainCalendar || [])
        .filter(
          event =>
            event.date === key
        );

    const risk =
      calculateCalendarRisk(
        user,
        key
      );

    days.push({
      date: key,
      events,
      risk
    });
  }

  return days;
}