const JOURNAL_TAGS = [

  "Good sleep",

  "Short sleep",

  "High workload",

  "Exam",

  "Presentation",

  "Exercise",

  "Social",

  "Screen time",

  "Good focus",

  "Low energy"

];


function ensureBrainJournal(
  user
) {

  if (
    !user.brainJournal
  ) {

    user.brainJournal =
      [];
  }


  return user.brainJournal;
}


function addJournalEntry(
  user,
  data
) {

  ensureBrainJournal(
    user
  );


  const entry = {

    id:
      Date.now()
        .toString() +

      Math.random()
        .toString(16)
        .slice(2),


    date:
      data.date ||
      todayKey(),


    drained:
      data.drained ||
      "",


    helped:
      data.helped ||
      "",


    tags:
      data.tags ||
      [],


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

  ensureBrainJournal(
    user
  );


  user.brainJournal =
    user.brainJournal.filter(
      entry =>
        entry.id !==
        entryId
    );
}


function getJournalScoreForDate(
  user,
  date,
  scoreKey
) {

  const log =
    user.dailyLogs?.[
      date
    ];


  const scores =
    log?.scores;


  if (
    !scores
  ) {
    return null;
  }


  /*
    Brain Readiness already
    uses the 0–100 scale.
  */

  if (
    scoreKey ===
    "brainReadiness"
  ) {

    const value =
      Number(
        scores.brainReadiness ??
        scores.overall
      );


    return Number.isFinite(
      value
    )
      ? value
      : null;
  }


  /*
    Focus is entered as 1–10
    in the Daily Check-In.

    For Journal pattern output
    we convert it to 0–100 so
    all displayed Neurovia
    scores use the same scale.
  */

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
      scores[
        scoreKey
      ]
    );


  return Number.isFinite(
    value
  )
    ? value
    : null;
}


function averageNumbers(
  values
) {

  const valid =
    values.filter(
      value =>
        Number.isFinite(
          value
        )
    );


  if (
    !valid.length
  ) {

    return null;
  }


  return Math.round(

    valid.reduce(
      (
        sum,
        value
      ) =>
        sum + value,
      0
    ) /
    valid.length

  );
}


function buildJournalPatterns(
  user
) {

  ensureBrainJournal(
    user
  );


  const entries =
    user.brainJournal;


  /*
    Neurovia waits for a
    reasonable amount of data
    before surfacing patterns.
  */

  if (
    entries.length < 10
  ) {

    return [
      {

        title:
          "Still learning your patterns",

        text:
          "Keep adding short journal entries. Neurovia will surface patterns after it has enough repeated observations."

      }
    ];
  }


  const tagMap =
    {};


  entries.forEach(
    entry => {

      (
        entry.tags ||
        []
      )
        .forEach(
          tag => {

            if (
              !tagMap[
                tag
              ]
            ) {

              tagMap[
                tag
              ] = [];
            }


            tagMap[
              tag
            ].push(
              entry
            );

          }
        );

    }
  );


  const patterns =
    [];


  Object
    .keys(
      tagMap
    )
    .forEach(
      tag => {

        const taggedEntries =
          tagMap[
            tag
          ];


        /*
          Require repeated
          observations before
          displaying a pattern.
        */

        if (
          taggedEntries.length <
          4
        ) {

          return;
        }


        const readinessValues =
          taggedEntries
            .map(
              entry =>
                getJournalScoreForDate(
                  user,
                  entry.date,
                  "brainReadiness"
                )
            )
            .filter(
              value =>
                value !==
                null
            );


        const averageReadiness =
          averageNumbers(
            readinessValues
          );


        if (
          averageReadiness ===
          null
        ) {

          return;
        }


        patterns.push({

          tag,

          occurrences:
            taggedEntries.length,

          averageReadiness,

          title:
            `${tag} appears in your brain-health pattern`,

          text:
            `On days tagged "${tag}", your average Brain Readiness was ${averageReadiness}/100. This is based on ${taggedEntries.length} logged occurrences.`

        });

      }
    );


  /*
    Specific sleep/focus
    comparison.
  */

  const goodSleep =
    tagMap[
      "Good sleep"
    ] || [];


  const shortSleep =
    tagMap[
      "Short sleep"
    ] || [];


  if (
    goodSleep.length >= 4 &&
    shortSleep.length >= 4
  ) {

    const goodFocus =
      averageNumbers(

        goodSleep
          .map(
            entry =>
              getJournalScoreForDate(
                user,
                entry.date,
                "focus"
              )
          )
          .filter(
            value =>
              value !==
              null
          )

      );


    const shortFocus =
      averageNumbers(

        shortSleep
          .map(
            entry =>
              getJournalScoreForDate(
                user,
                entry.date,
                "focus"
              )
          )
          .filter(
            value =>
              value !==
              null
          )

      );


    if (
      goodFocus !== null &&
      shortFocus !== null
    ) {

      patterns.unshift({

        title:
          "Sleep and focus pattern",

        text:
          `Your average Focus score is ${goodFocus}/100 on days tagged "Good sleep" and ${shortFocus}/100 on days tagged "Short sleep".`

      });
    }
  }


  if (
    !patterns.length
  ) {

    patterns.push({

      title:
        "No strong repeated pattern yet",

      text:
        "You have enough journal entries to start analysis, but no tag has repeated often enough with matching daily scores yet."

    });
  }


  return patterns;
}