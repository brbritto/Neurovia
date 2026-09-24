const STRESS_TAGS = [
  "Lack of sleep",
  "Studies",
  "Exam",
  "Assignment",
  "Work",
  "High workload",
  "Social stress",
  "Screen time",
  "Poor routine",
  "Low energy",
  "No breaks",
  "Time pressure"
];


const RECOVERY_TAGS = [
  "Music",
  "Walking",
  "Exercise",
  "Relaxing shower",
  "Good sleep",
  "Quiet time",
  "Friends",
  "Family",
  "Reading",
  "Stretching",
  "Time outside",
  "Taking a break"
];


/*
  Kept for compatibility with any
  older code/data that still expects
  JOURNAL_TAGS.
*/
const JOURNAL_TAGS = [
  ...STRESS_TAGS,
  ...RECOVERY_TAGS
];


function ensureBrainJournal(
  user
) {
  if (!user.brainJournal) {
    user.brainJournal = [];
  }

  return user.brainJournal;
}


function addJournalEntry(
  user,
  data
) {
  ensureBrainJournal(user);

  const entry = {
    id:
      Date.now().toString() +
      Math.random()
        .toString(16)
        .slice(2),

    date:
      data.date ||
      todayKey(),

    stressTags:
      data.stressTags || [],

    recoveryTags:
      data.recoveryTags || [],

    /*
      Combined tags make new entries
      compatible with the old pattern
      system.
    */
    tags: [
      ...(data.stressTags || []),
      ...(data.recoveryTags || [])
    ],

    createdAt:
      new Date()
        .toISOString()
  };

  user.brainJournal.push(
    entry
  );

  return entry;
}


function deleteJournalEntry(
  user,
  entryId
) {
  ensureBrainJournal(user);

  user.brainJournal =
    user.brainJournal.filter(
      entry =>
        entry.id !== entryId
    );
}


function getEntryStressTags(entry) {
  if (
    Array.isArray(
      entry.stressTags
    )
  ) {
    return entry.stressTags;
  }

  /*
    Old entries cannot reliably be
    separated into stress/recovery,
    so only clearly negative legacy
    tags are migrated here.
  */
  return (
    entry.tags || []
  ).filter(
    tag =>
      STRESS_TAGS.includes(tag) ||
      [
        "Short sleep",
        "High workload",
        "Exam",
        "Screen time",
        "Low energy"
      ].includes(tag)
  );
}


function getEntryRecoveryTags(entry) {
  if (
    Array.isArray(
      entry.recoveryTags
    )
  ) {
    return entry.recoveryTags;
  }

  return (
    entry.tags || []
  ).filter(
    tag =>
      RECOVERY_TAGS.includes(tag) ||
      [
        "Good sleep",
        "Exercise",
        "Good focus"
      ].includes(tag)
  );
}


function getJournalScoreForDate(
  user,
  date,
  scoreKey
) {
  const log =
    user.dailyLogs?.[date];

  const scores =
    log?.scores;

  if (!scores) {
    return null;
  }

  if (
    scoreKey ===
    "brainReadiness"
  ) {
    const value =
      Number(
        scores.brainReadiness ??
        scores.overall
      );

    return Number.isFinite(value)
      ? value
      : null;
  }

  if (
    scoreKey ===
    "focus"
  ) {
    const rawFocus =
      Number(
        log.focusLevel ??
        scores.focus
      );

    if (
      !Number.isFinite(
        rawFocus
      )
    ) {
      return null;
    }

    return Math.round(
      rawFocus * 10
    );
  }

  const value =
    Number(
      scores[scoreKey]
    );

  return Number.isFinite(value)
    ? value
    : null;
}


function averageNumbers(
  values
) {
  const valid =
    values.filter(
      value =>
        Number.isFinite(value)
    );

  if (!valid.length) {
    return null;
  }

  return Math.round(
    valid.reduce(
      (sum, value) =>
        sum + value,
      0
    ) / valid.length
  );
}


function countJournalTags(
  user,
  type,
  days = 30
) {
  ensureBrainJournal(user);

  const cutoff =
    new Date();

  cutoff.setHours(
    12,
    0,
    0,
    0
  );

  cutoff.setDate(
    cutoff.getDate() -
    (days - 1)
  );

  const counts = {};

  user.brainJournal
    .filter(entry => {
      const date =
        dateFromKey(
          entry.date
        );

      return (
        date &&
        date >= cutoff
      );
    })
    .forEach(entry => {
      const tags =
        type === "recovery"
          ? getEntryRecoveryTags(entry)
          : getEntryStressTags(entry);

      tags.forEach(tag => {
        counts[tag] =
          (counts[tag] || 0) + 1;
      });
    });

  return Object
    .entries(counts)
    .map(
      ([tag, count]) => ({
        tag,
        count
      })
    )
    .sort(
      (a, b) =>
        b.count - a.count
    );
}


function getTopRecoveryTags(
  user,
  days = 30,
  limit = 3
) {
  return countJournalTags(
    user,
    "recovery",
    days
  ).slice(
    0,
    limit
  );
}


function getTopStressTags(
  user,
  days = 30,
  limit = 3
) {
  return countJournalTags(
    user,
    "stress",
    days
  ).slice(
    0,
    limit
  );
}


function getRecoverySuggestionFromTag(
  tag
) {
  const suggestions = {
    "Music":
      "Music appears repeatedly in your recovery log. On overloaded days, consider protecting 15–20 minutes for music without combining it with work.",

    "Walking":
      "Walking appears in your recovery log. On demanding days, try placing a short walk between two mentally demanding activities.",

    "Exercise":
      "Exercise appears in your recovery pattern. Keep physical activity in your schedule when possible, especially on high-workload days.",

    "Relaxing shower":
      "A relaxing shower appears in your recovery pattern. Consider using it as a transition between demanding work and your evening wind-down.",

    "Good sleep":
      "Good sleep appears in your recovery pattern. Protect a consistent sleep opportunity and avoid pushing optional work late into the evening.",

    "Quiet time":
      "Quiet time appears to help your recovery. Protect a short low-stimulation period after demanding work.",

    "Friends":
      "Time with friends appears in your recovery log. When your schedule allows, preserve some social recovery time instead of filling every gap with work.",

    "Family":
      "Time with family appears in your recovery log. Consider protecting some low-pressure family time on demanding days.",

    "Reading":
      "Reading appears in your recovery pattern. A short non-work reading period may be useful during your evening wind-down.",

    "Stretching":
      "Stretching appears in your recovery log. Consider a short stretching break between longer work blocks.",

    "Time outside":
      "Time outside appears in your recovery pattern. Consider adding a short outdoor break to demanding days.",

    "Taking a break":
      "Taking a real break appears in your recovery pattern. Avoid filling every break with another task or screen-based work."
  };

  return (
    suggestions[tag] ||
    `Your journal shows that ${tag.toLowerCase()} has helped you recover before. Consider making room for it on demanding days.`
  );
}


function buildPersonalRecoverySuggestion(
  user
) {
  const top =
    getTopRecoveryTags(
      user,
      30,
      1
    );

  if (!top.length) {
    return null;
  }

  return {
    tag:
      top[0].tag,

    occurrences:
      top[0].count,

    text:
      getRecoverySuggestionFromTag(
        top[0].tag
      )
  };
}


function buildJournalPatterns(
  user
) {
  ensureBrainJournal(user);

  const stress =
    getTopStressTags(
      user,
      30,
      3
    );

  const recovery =
    getTopRecoveryTags(
      user,
      30,
      3
    );

  const patterns = [];

  if (stress.length) {
    patterns.push({
      title:
        "Most recurring strain",

      text:
        `${stress[0].tag} is your most frequently logged strain tag in the recent journal, appearing ${stress[0].count} time(s).`
    });
  }

  if (recovery.length) {
    patterns.push({
      title:
        "Most recurring recovery tool",

      text:
        `${recovery[0].tag} is your most frequently logged recovery tag, appearing ${recovery[0].count} time(s).`
    });
  }

  if (
    !patterns.length
  ) {
    patterns.push({
      title:
        "Still learning your patterns",

      text:
        "Add strain and recovery tags after your days. Neurovia will use repeated tags to identify recurring patterns without interpreting free text."
    });
  }

  return patterns;
}