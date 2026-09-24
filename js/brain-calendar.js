function ensureBrainCalendar(user) {
  if (!user.brainCalendar) {
    user.brainCalendar = [];
  }

  return user.brainCalendar;
}


function timeToMinutes(time) {
  if (!time || !time.includes(":")) {
    return null;
  }

  const [hours, minutes] =
    time.split(":").map(Number);

  return hours * 60 + minutes;
}


function getEventDurationHours(event) {
  const start =
    timeToMinutes(event.startTime);

  const end =
    timeToMinutes(event.endTime);

  if (
    start === null ||
    end === null ||
    end <= start
  ) {
    return 1;
  }

  return Number(
    ((end - start) / 60).toFixed(2)
  );
}


function getIntensityLabel(intensity) {
  const labels = {
    1: "Super Light",
    2: "Light",
    3: "Moderate",
    4: "High",
    5: "Super High"
  };

  return labels[
    Number(intensity)
  ] || "Moderate";
}


/*
  Event type matters separately
  from the user's mental-demand choice.

  Physical activity receives the
  smallest cognitive-load multiplier.

  These are Neurovia planning
  heuristics, not clinical values.
*/
function getEventTypeMultiplier(type) {
  const normalized =
    String(type || "")
      .trim()
      .toLowerCase();

  const multipliers = {
    "physical activity": 0.45,
    "activity": 0.45,

    "assignment / task": 0.70,
    "assignment": 0.70,
    "task": 0.70,

    "studies": 0.90,
    "study": 0.90,

    "exam": 1.15,

    "presentation": 1.00,

    "other": 0.80
  };

  return (
    multipliers[normalized] ??
    0.80
  );
}


function addBrainEvent(
  user,
  eventData
) {
  ensureBrainCalendar(user);

  const event = {
    id:
      Date.now().toString() +
      Math.random()
        .toString(16)
        .slice(2),

    title:
      eventData.title,

    date:
      eventData.date,

    startTime:
      eventData.startTime || "",

    endTime:
      eventData.endTime || "",

    type:
      eventData.type || "Other",

    intensity:
      Number(
        eventData.intensity || 3
      ),

    createdAt:
      new Date().toISOString()
  };

  user.brainCalendar.push(event);

  return event;
}


function deleteBrainEvent(
  user,
  eventId
) {
  ensureBrainCalendar(user);

  user.brainCalendar =
    user.brainCalendar.filter(
      event =>
        event.id !== eventId
    );
}


function dateDistanceInDays(
  dateA,
  dateB
) {
  const a =
    dateFromKey(dateA);

  const b =
    dateFromKey(dateB);

  if (!a || !b) {
    return 0;
  }

  return Math.abs(
    Math.round(
      (
        a.getTime() -
        b.getTime()
      ) /
      86400000
    )
  );
}


function getRecentReadiness(
  user,
  days = 5
) {
  const logs =
    user.dailyLogs || {};

  const dates =
    Object
      .keys(logs)
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
      .filter(
        value =>
          Number.isFinite(value) &&
          value > 0
      );

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


function getDurationMultiplier(
  duration
) {
  if (duration <= 0.5) {
    return 0.55;
  }

  if (duration <= 1) {
    return 0.75;
  }

  if (duration <= 2) {
    return 1.00;
  }

  if (duration <= 3) {
    return 1.20;
  }

  if (duration <= 4) {
    return 1.35;
  }

  return 1.50;
}


/*
  Base load:

  intensity
  × duration
  × activity type

  This deliberately makes the model
  less aggressive than the previous
  version.
*/
function getEventLoad(event) {
  const intensity =
    Math.max(
      1,
      Math.min(
        5,
        Number(event.intensity || 3)
      )
    );

  const duration =
    getEventDurationHours(event);

  const durationMultiplier =
    getDurationMultiplier(
      duration
    );

  const typeMultiplier =
    getEventTypeMultiplier(
      event.type
    );

  return Number(
    (
      intensity *
      durationMultiplier *
      typeMultiplier
    ).toFixed(2)
  );
}


/*
  Calculates how close two events
  are on the same day.

  Only small gaps add extra load.

  0–30 min  = strongest penalty
  31–60 min = moderate penalty
  61–120 min = small penalty
  >120 min = no penalty
*/
function getGapPenalty(
  firstEvent,
  secondEvent
) {
  const firstEnd =
    timeToMinutes(
      firstEvent.endTime
    );

  const secondStart =
    timeToMinutes(
      secondEvent.startTime
    );

  if (
    firstEnd === null ||
    secondStart === null
  ) {
    return 0;
  }

  const gap =
    secondStart - firstEnd;

  if (gap < 0) {
    return 1.4;
  }

  if (gap <= 30) {
    return 1.0;
  }

  if (gap <= 60) {
    return 0.65;
  }

  if (gap <= 120) {
    return 0.30;
  }

  return 0;
}


function calculateSpacingLoad(events) {
  if (events.length < 2) {
    return 0;
  }

  const sorted =
    [...events]
      .sort(
        (a, b) =>
          (
            a.startTime || ""
          ).localeCompare(
            b.startTime || ""
          )
      );

  let penalty = 0;

  for (
    let i = 1;
    i < sorted.length;
    i++
  ) {
    penalty +=
      getGapPenalty(
        sorted[i - 1],
        sorted[i]
      );
  }

  return Number(
    penalty.toFixed(2)
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
    nearby
      .filter(
        event =>
          event.date === targetDate
      )
      .sort(
        (a, b) =>
          (
            a.startTime || ""
          ).localeCompare(
            b.startTime || ""
          )
      );

  const readiness =
    getRecentReadiness(
      user,
      5
    );


  const exactLoad =
    exact.reduce(
      (sum, event) =>
        sum +
        getEventLoad(event),
      0
    );


  /*
    Previous/next day have only
    a small effect now.
  */
  const nearbyLoad =
    nearby
      .filter(
        event =>
          event.date !== targetDate
      )
      .reduce(
        (sum, event) =>
          sum +
          getEventLoad(event) *
          0.12,
        0
      );


  const spacingLoad =
    calculateSpacingLoad(
      exact
    );


  /*
    Quantity alone should not make
    two normal activities "High".

    A small density penalty starts
    only when the schedule becomes
    genuinely crowded.
  */
  let densityLoad = 0;

  if (exact.length >= 4) {
    densityLoad += 0.75;
  }

  if (exact.length >= 6) {
    densityLoad += 1.25;
  }


  /*
    Readiness changes the result,
    but not aggressively enough to
    turn a normal schedule into High
    by itself.
  */
  let readinessMultiplier = 1;

  if (readiness >= 80) {
    readinessMultiplier = 0.90;
  }

  else if (readiness >= 65) {
    readinessMultiplier = 1.00;
  }

  else if (readiness >= 50) {
    readinessMultiplier = 1.07;
  }

  else {
    readinessMultiplier = 1.14;
  }


  const rawLoad =
    exactLoad +
    nearbyLoad +
    spacingLoad +
    densityLoad;


  const adjustedLoad =
    Number(
      (
        rawLoad *
        readinessMultiplier
      ).toFixed(1)
    );


  /*
    Recalibrated thresholds.

    High and Super High now require
    substantially more accumulated
    cognitive demand.
  */
  let tier =
    "Super Light";

  if (adjustedLoad >= 15) {
    tier = "Super High";
  }

  else if (adjustedLoad >= 10.5) {
    tier = "High";
  }

  else if (adjustedLoad >= 5.5) {
    tier = "Moderate";
  }

  else if (adjustedLoad >= 2.5) {
    tier = "Light";
  }


  return {
    tier,

    load:
      adjustedLoad,

    exactCount:
      exact.length,

    density:
      nearby.length,

    readiness,

    exactLoad:
      Number(
        exactLoad.toFixed(1)
      ),

    nearbyLoad:
      Number(
        nearbyLoad.toFixed(1)
      ),

    spacingLoad:
      Number(
        spacingLoad.toFixed(1)
      ),

    events:
      nearby
  };
}


function getCalendarSuggestion(risk) {
  if (
    risk.tier === "Super High"
  ) {
    return (
      "This is a very demanding schedule. " +
      "Consider moving one high-demand activity, increasing the gap between demanding events, or starting part of the work earlier."
    );
  }

  if (
    risk.tier === "High"
  ) {
    return (
      "This day has a high estimated cognitive workload. " +
      "A longer recovery gap between demanding activities could make the schedule more manageable."
    );
  }

  if (
    risk.tier === "Moderate"
  ) {
    return (
      "Your planned workload is moderate. " +
      "The schedule still looks manageable, but keep recovery time between demanding activities."
    );
  }

  if (
    risk.tier === "Light"
  ) {
    return (
      "Your planned cognitive workload is light. " +
      "The current spacing and activity mix do not suggest substantial overload."
    );
  }

  return (
    "Your planned cognitive workload is very light."
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
      localDateKey(date);

    const events =
      (
        user.brainCalendar ||
        []
      )
        .filter(
          event =>
            event.date === key
        )
        .sort(
          (a, b) =>
            (
              a.startTime || ""
            ).localeCompare(
              b.startTime || ""
            )
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