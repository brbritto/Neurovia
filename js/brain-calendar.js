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
    /*
      Old events may not have
      start/end times.

      We use 1 hour as a neutral
      fallback so old calendar
      entries still work.
    */
    return 1;
  }

  return Number(
    ((end - start) / 60).toFixed(2)
  );
}


function getIntensityLabel(intensity) {
  const value = Number(intensity);

  const labels = {
    1: "Super Light",
    2: "Light",
    3: "Moderate",
    4: "High",
    5: "Super High"
  };

  return labels[value] || "Moderate";
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
      (
        1000 *
        60 *
        60 *
        24
      )
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
        value => value > 0
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


/*
  ==================================================
  CALENDAR LOAD MODEL
  ==================================================

  The calendar no longer treats every event equally.

  Each event contributes according to:

  1. Mental demand:
     Super Light = 1
     Light       = 2
     Moderate    = 3
     High        = 4
     Super High  = 5

  2. Duration:
     Longer activities contribute more.

  3. Same-day concentration:
     Several demanding events on the same day
     add some extra load.

  4. Recent Brain Readiness:
     Lower recent readiness makes the same
     workload harder to absorb.

  This is a Neurovia planning heuristic,
  not a clinical measurement.
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

  /*
    Duration multiplier grows gradually.

    30 min  -> about 0.75
    1 hour  -> 1.00
    2 hours -> 1.35
    4 hours -> 1.75
    6+ hrs  -> capped at 2.00

    This prevents duration from
    completely dominating intensity.
  */

  let durationMultiplier;

  if (duration <= 0.5) {
    durationMultiplier = 0.75;
  }

  else if (duration <= 1) {
    durationMultiplier = 1;
  }

  else if (duration <= 2) {
    durationMultiplier = 1.35;
  }

  else if (duration <= 4) {
    durationMultiplier = 1.75;
  }

  else {
    durationMultiplier = 2;
  }

  return Number(
    (
      intensity *
      durationMultiplier
    ).toFixed(2)
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


  /*
    TODAY'S LOAD
  */

  const exactLoad =
    exact.reduce(
      (sum, event) =>
        sum +
        getEventLoad(event),
      0
    );


  /*
    NEARBY LOAD

    Yesterday/tomorrow matter,
    but less than the target day.
  */

  const nearbyOnly =
    nearby.filter(
      event =>
        event.date !== targetDate
    );

  const nearbyLoad =
    nearbyOnly.reduce(
      (sum, event) =>
        sum +
        getEventLoad(event) * 0.35,
      0
    );


  /*
    Small clustering penalty.

    Quantity alone cannot make
    the day high-risk anymore.
  */

  let clusteringLoad = 0;

  if (exact.length >= 3) {
    clusteringLoad += 1;
  }

  if (exact.length >= 5) {
    clusteringLoad += 1.5;
  }


  /*
    Brain Readiness modifier.

    Good readiness slightly reduces
    the estimated planning load.

    Low readiness increases it.
  */

  let readinessMultiplier = 1;

  if (readiness >= 80) {
    readinessMultiplier = 0.85;
  }

  else if (readiness >= 65) {
    readinessMultiplier = 1;
  }

  else if (readiness >= 50) {
    readinessMultiplier = 1.15;
  }

  else {
    readinessMultiplier = 1.3;
  }


  const rawLoad =
    exactLoad +
    nearbyLoad +
    clusteringLoad;


  const adjustedLoad =
    Number(
      (
        rawLoad *
        readinessMultiplier
      ).toFixed(1)
    );


  /*
    Five overload levels.

    These thresholds are product
    heuristics, not medical limits.
  */

  let tier =
    "Super Light";

  if (adjustedLoad >= 14) {
    tier = "Super High";
  }

  else if (adjustedLoad >= 10) {
    tier = "High";
  }

  else if (adjustedLoad >= 6) {
    tier = "Moderate";
  }

  else if (adjustedLoad >= 3) {
    tier = "Light";
  }


  return {
    tier,

    load:
      adjustedLoad,

    density:
      nearby.length,

    exactCount:
      exact.length,

    readiness,

    exactLoad:
      Number(
        exactLoad.toFixed(1)
      ),

    nearbyLoad:
      Number(
        nearbyLoad.toFixed(1)
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
      "This looks like a very demanding period based on " +
      "event duration, mental demand and your recent Brain Readiness. " +
      "Consider moving, shortening or starting one demanding task earlier."
    );
  }

  if (
    risk.tier === "High"
  ) {
    return (
      "This period has a high estimated cognitive workload. " +
      "Spacing out one demanding activity may make the day more manageable."
    );
  }

  if (
    risk.tier === "Moderate"
  ) {
    return (
      "Your planned cognitive workload is moderate. " +
      "The schedule looks manageable, but demanding activities are starting to accumulate."
    );
  }

  if (
    risk.tier === "Light"
  ) {
    return (
      "Your planned cognitive workload is light. " +
      "There is currently little sign of schedule overload."
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
      date:
        key,

      events,

      risk
    });
  }

  return days;
}