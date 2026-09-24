document.addEventListener(
  "DOMContentLoaded",
  function () {

    let user =
      getCurrentUserObject();

    if (
      !user ||
      !user.onboardingCompleted
    ) {
      window.location.href =
        "index.html";

      return;
    }


    const homeTab =
      document.getElementById(
        "homeTab"
      );

    const improvementTab =
      document.getElementById(
        "improvementTab"
      );

    const calendarTab =
      document.getElementById(
        "calendarTab"
      );

    const journalTab =
      document.getElementById(
        "journalTab"
      );

    const profileTab =
      document.getElementById(
        "profileTab"
      );


    function refreshUser() {
      user =
        getCurrentUserObject();

      ensureBrainCalendar(user);
      ensureBrainJournal(user);
    }


    function getDates() {
      return Object
        .keys(
          user.dailyLogs || {}
        )
        .sort();
    }


    function getLatest() {
      const dates =
        getDates();

      if (!dates.length) {
        return null;
      }

      const date =
        dates[
          dates.length - 1
        ];

      return {
        date,
        log:
          user.dailyLogs[date]
      };
    }


    function formatDateKey(key) {
      const date =
        dateFromKey(key);

      if (!date) {
        return key;
      }

      return date.toLocaleDateString(
        "en-US",
        {
          month: "short",
          day: "numeric",
          year: "numeric"
        }
      );
    }


    function formatTime(time) {
      if (!time) {
        return "";
      }

      const [
        hours,
        minutes
      ] =
        time
          .split(":")
          .map(Number);

      const date =
        new Date();

      date.setHours(
        hours,
        minutes,
        0,
        0
      );

      return date.toLocaleTimeString(
        "en-US",
        {
          hour: "numeric",
          minute: "2-digit"
        }
      );
    }


    function average(values) {
      const valid =
        values
          .map(Number)
          .filter(
            value =>
              Number.isFinite(value)
          );

      if (!valid.length) {
        return null;
      }

      return (
        valid.reduce(
          (sum, value) =>
            sum + value,
          0
        ) /
        valid.length
      );
    }


    function metricCard(
      label,
      value,
      note = ""
    ) {
      return `
        <div class="metric-card">

          <div class="metric-label">
            ${label}
          </div>

          <div class="metric-value">
            ${value}
          </div>

          ${
            note
              ? `
                <div
                  class="muted"
                  style="
                    margin-top:6px;
                    font-size:13px;
                  "
                >
                  ${note}
                </div>
              `
              : ""
          }

        </div>
      `;
    }


    function riskClass(tier) {
      const map = {
        "Super Light":
          "risk-super-light",

        "Light":
          "risk-light",

        "Moderate":
          "risk-moderate",

        "High":
          "risk-high",

        "Super High":
          "risk-super-high"
      };

      return (
        map[tier] ||
        "risk-super-light"
      );
    }


    /*
      ==================================
      TODAY
      ==================================
    */

    function renderHome() {
      refreshUser();

      const today =
        todayKey();

      const todayLog =
        user.dailyLogs?.[today];

      /*
        The Today tab must represent
        TODAY, not simply the latest
        historical log.
      */
      if (!todayLog) {
        homeTab.innerHTML = `

          <div class="hero-card">

            <p class="muted">
              TODAY
            </p>

            <h1 class="section-title">
              Ready for today's check-in?
            </h1>

            <p class="section-subtitle">
              Your previous data is still saved.
              Add today's check-in to update your
              Brain Readiness and daily signals.
            </p>

            <button
              id="todayCheckinBtn"
              class="primary-btn"
              type="button"
            >
              Update today's check-in
            </button>

            <button
              id="previousDaysBtn"
              class="secondary-btn"
              type="button"
              style="margin-top:10px;"
            >
              View previous days
            </button>

          </div>
        `;

        document
          .getElementById(
            "todayCheckinBtn"
          )
          .onclick =
          function () {
            window.location.href =
              "daily-update.html";
          };

        document
          .getElementById(
            "previousDaysBtn"
          )
          .onclick =
          function () {
            window.location.href =
              "previous-days.html";
          };

        return;
      }


      const scores =
        todayLog.scores || {};

      const recentLogs =
        getDates()
          .slice(-7)
          .map(
            date =>
              user.dailyLogs[date]
          );

      const insight =
        buildMainInsight(
          user,
          todayLog,
          scores,
          recentLogs
        );

      const recovery =
        buildRecoveryTool(user);

      const sleepDebt =
        calculateWeeklySleepDebt(
          user.profile,
          recentLogs
        );


      homeTab.innerHTML = `

        <div class="hero-card">

          <p class="muted">
            TODAY
          </p>

          <h1 class="section-title">
            Brain Readiness
          </h1>

          <div
            class="brain-readiness-number"
          >
            ${
              scores.brainReadiness ??
              scores.overall ??
              "--"
            }
          </div>

          <p class="section-subtitle">
            ${
              Number.isFinite(
                Number(
                  scores.brainReadiness ??
                  scores.overall
                )
              )
                ? classifyReadiness(
                    scores.brainReadiness ??
                    scores.overall
                  )
                : ""
            }
          </p>

          <div class="bar-bg">
            <div
              class="bar-fill"
              style="
                width:${
                  scores.brainReadiness ??
                  scores.overall ??
                  0
                }%;
              "
            ></div>
          </div>

        </div>


        <div class="row two">

          ${metricCard(
            "Recovery",
            scores.recovery ?? "--",
            "recharge"
          )}

          ${metricCard(
            "Cognitive Load",
            scores.cognitiveLoad ?? "--",
            "mental demand"
          )}

          ${metricCard(
            "Sleep Debt",
            `${sleepDebt}h`,
            "recent"
          )}

          ${metricCard(
            "Focus",
            `${
              todayLog.focusLevel ??
              "--"
            }/10`,
            "today"
          )}

        </div>


        <div class="card">

          <p class="muted">
            WHY DO I FEEL THIS WAY?
          </p>

          <h2>
            ${insight.title}
          </h2>

          <p>
            ${insight.explanation}
          </p>

        </div>


        <div class="recommendation-card">

          <p class="muted">
            TODAY'S PRIORITY
          </p>

          <h3>
            ${insight.action}
          </h3>

        </div>


        ${
          recovery
            ? `
              <div class="card">

                <p class="muted">
                  RECOVERY TOOL
                </p>

                <h2>
                  ${recovery.type}
                </h2>

                <p>
                  ${recovery.reason}
                </p>

                <div class="recovery-action">
                  ${recovery.action}
                </div>

              </div>
            `
            : ""
        }


        <button
          id="dailyUpdateBtn"
          class="primary-btn"
          type="button"
        >
          Update today's check-in
        </button>

        <button
          id="previousDaysBtn"
          class="secondary-btn"
          type="button"
          style="margin-top:10px;"
        >
          View previous days
        </button>
      `;


      document
        .getElementById(
          "dailyUpdateBtn"
        )
        .onclick =
        function () {
          window.location.href =
            "daily-update.html";
        };


      document
        .getElementById(
          "previousDaysBtn"
        )
        .onclick =
        function () {
          window.location.href =
            "previous-days.html";
        };
    }


        /*
      ==================================
      IMPROVEMENT
      ==================================
    */


    function getRolling30DayItems() {

      const end =
        dateFromKey(
          todayKey()
        );


      if (!end) {
        return [];
      }


      end.setHours(
        12,
        0,
        0,
        0
      );


      const start =
        new Date(
          end
        );


      start.setDate(
        end.getDate() -
        29
      );


      return getDates()
        .filter(
          key => {

            const date =
              dateFromKey(
                key
              );


            if (!date) {
              return false;
            }


            date.setHours(
              12,
              0,
              0,
              0
            );


            return (
              date >= start &&
              date <= end
            );

          }
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


    function getMetricValue(
      item,
      metric
    ) {

      const log =
        item?.log ||
        {};


      const scores =
        log.scores ||
        {};


      if (
        metric ===
        "readiness"
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


      if (
        metric ===
        "recovery"
      ) {

        const value =
          Number(
            scores.recovery
          );


        return Number.isFinite(
          value
        )
          ? value
          : null;

      }


      if (
        metric ===
        "cognitiveLoad"
      ) {

        const value =
          Number(
            scores.cognitiveLoad
          );


        return Number.isFinite(
          value
        )
          ? value
          : null;

      }


      if (
        metric ===
        "focus"
      ) {

        const value =
          Number(
            log.focusLevel
          );


        return Number.isFinite(
          value
        )
          ? value * 10
          : null;

      }


      return null;

    }


    function buildTrend(
      items,
      metric,
      inverse = false
    ) {

      const valid =
        items.filter(
          item =>
            Number.isFinite(
              getMetricValue(
                item,
                metric
              )
            )
        );


      if (
        valid.length <
        4
      ) {

        return {
          direction:
            "learning",

          difference:
            0
        };

      }


      const split =
        Math.floor(
          valid.length /
          2
        );


      const first =
        valid.slice(
          0,
          split
        );


      const second =
        valid.slice(
          split
        );


      const firstAvg =
        average(
          first.map(
            item =>
              getMetricValue(
                item,
                metric
              )
          )
        );


      const secondAvg =
        average(
          second.map(
            item =>
              getMetricValue(
                item,
                metric
              )
          )
        );


      if (
        firstAvg === null ||
        secondAvg === null
      ) {

        return {
          direction:
            "learning",

          difference:
            0
        };

      }


      const raw =
        secondAvg -
        firstAvg;


      const adjusted =
        inverse
          ? -raw
          : raw;


      if (
        adjusted >= 5
      ) {

        return {
          direction:
            "improving",

          difference:
            Math.round(
              Math.abs(
                raw
              )
            )
        };

      }


      if (
        adjusted <= -5
      ) {

        return {
          direction:
            "declining",

          difference:
            Math.round(
              Math.abs(
                raw
              )
            )
        };

      }


      return {
        direction:
          "stable",

        difference:
          Math.round(
            Math.abs(
              raw
            )
          )
      };

    }


    function getWeekdayAnalysis(
      items
    ) {

      const groups =
        {};


      items.forEach(
        item => {

          const date =
            dateFromKey(
              item.date
            );


          if (!date) {
            return;
          }


          const load =
            Number(
              item.log
                ?.scores
                ?.cognitiveLoad
            );


          if (
            !Number.isFinite(
              load
            )
          ) {
            return;
          }


          const day =
            date.toLocaleDateString(
              "en-US",
              {
                weekday:
                  "long"
              }
            );


          if (
            !groups[
              day
            ]
          ) {

            groups[
              day
            ] = [];

          }


          groups[
            day
          ].push(
            load
          );

        }
      );


      /*
        A weekday only becomes a
        pattern after at least
        3 observations.

        One difficult Monday should
        not make Neurovia claim that
        Mondays are difficult.
      */


      return Object
        .entries(
          groups
        )
        .map(
          (
            [
              day,
              values
            ]
          ) => ({

            day,

            value:
              Math.round(
                average(
                  values
                ) ||
                0
              ),

            count:
              values.length

          })
        )
        .filter(
          item =>
            item.count >=
            3
        )
        .sort(
          (
            a,
            b
          ) =>
            b.value -
            a.value
        );

    }


    function buildImprovementPriority(
      items
    ) {

      if (
        !items.length
      ) {

        return {

          title:
            "Start building your pattern",

          text:
            "Complete Daily Check-Ins so Neurovia can identify recurring areas for improvement.",

          steps: [

            "Complete today's check-in.",

            "Keep your entries consistent.",

            "Return after several logged days to compare patterns."

          ]

        };

      }


      const avgSleep =
        average(
          items.map(
            item =>
              Number(
                item.log
                  ?.scores
                  ?.sleepHours
              )
          )
        );


      const avgStress =
        average(
          items.map(
            item =>
              Number(
                item.log
                  ?.stressLevel
              )
          )
        );


      const avgEnergy =
        average(
          items.map(
            item =>
              Number(
                item.log
                  ?.energyLevel
              )
          )
        );


      const avgFocus =
        average(
          items.map(
            item =>
              Number(
                item.log
                  ?.focusLevel
              )
          )
        );


      const avgLoad =
        average(
          items.map(
            item =>
              Number(
                item.log
                  ?.scores
                  ?.cognitiveLoad
              )
          )
        );


      const priorities = [

        {
          key:
            "sleep",

          score:
            avgSleep === null
              ? -1
              : Math.max(
                  0,
                  (
                    8 -
                    avgSleep
                  ) *
                  12
                )
        },

        {
          key:
            "stress",

          score:
            avgStress === null
              ? -1
              : avgStress *
                8
        },

        {
          key:
            "energy",

          score:
            avgEnergy === null
              ? -1
              : (
                  10 -
                  avgEnergy
                ) *
                8
        },

        {
          key:
            "focus",

          score:
            avgFocus === null
              ? -1
              : (
                  10 -
                  avgFocus
                ) *
                8
        },

        {
          key:
            "load",

          score:
            avgLoad === null
              ? -1
              : avgLoad
        }

      ]
        .sort(
          (
            a,
            b
          ) =>
            b.score -
            a.score
        );


      const main =
        priorities[
          0
        ]?.key;


      if (
        main ===
        "sleep"
      ) {

        return {

          title:
            "Protect a more consistent sleep window",

          text:
            "Short or inconsistent sleep is one of the stronger recurring signals in your recent data. The goal is to make enough sleep easier to repeat.",

          steps: [

            "Choose a realistic target bedtime and keep it within a similar window across the week.",

            "Protect enough time for sleep before demanding days.",

            "Prepare tomorrow's essentials earlier so small unfinished tasks do not repeatedly delay sleep.",

            "Use your personal patterns below to see which evening behaviors are associated with better sleep for you."

          ]

        };

      }


      if (
        main ===
        "stress"
      ) {

        return {

          title:
            "Reduce repeated stress accumulation",

          text:
            "Stress is recurring strongly across your recent check-ins. Focus on how demands are distributed across the day instead of relying only on recovery after a difficult day.",

          steps: [

            "Identify the tasks that actually require your highest attention.",

            "Avoid stacking several demanding activities without a real break.",

            "Use the Brain Calendar to move flexible work away from already demanding periods.",

            "Compare your stress with your Cognitive Load across several days."

          ]

        };

      }


      if (
        main ===
        "energy"
      ) {

        return {

          title:
            "Build more recovery into demanding days",

          text:
            "Low energy is recurring in your recent data. Look at whether it appears together with shorter sleep, high Cognitive Load or insufficient breaks.",

          steps: [

            "Leave a real gap between longer demanding activities.",

            "Avoid filling every break with another demanding task.",

            "Protect your sleep opportunity when several low-energy days occur together.",

            "Check your personal Sleep ↔ Energy pattern below as more data becomes available."

          ]

        };

      }


      if (
        main ===
        "focus"
      ) {

        return {

          title:
            "Protect your attention from repeated disruption",

          text:
            "Focus is one of the weaker recurring signals in your recent data. Neurovia can compare it with how distracting your environment was.",

          steps: [

            "Choose one defined task before beginning a focused work block.",

            "Reduce avoidable interruptions during that block.",

            "Separate demanding blocks with a real break.",

            "Use the Distraction ↔ Focus pattern below to see whether the relationship repeats in your own data."

          ]

        };

      }


      return {

        title:
          "Spread cognitive demand more evenly",

        text:
          "Cognitive Load is the strongest recurring strain signal in your recent data. Use your Brain Calendar and break patterns to reduce unnecessary clustering.",

        steps: [

          "Move flexible tasks away from already demanding periods when possible.",

          "Leave longer gaps between high-demand activities.",

          "Start larger tasks earlier instead of compressing them into one day.",

          "Compare days with fewer breaks against days with enough breaks."

        ]

      };

    }


    /*
      ==================================
      7-DAY READINESS AVERAGE
      ==================================

      This is a calendar-day average.

      Missing days are ignored.
      They are NOT converted to zero.
    */


    function buildSevenDayReadinessAverage(
      items
    ) {

      return items.map(
        item => {

          const currentDate =
            dateFromKey(
              item.date
            );


          if (!currentDate) {

            return {
              date:
                item.date,

              value:
                null
            };

          }


          currentDate.setHours(
            12,
            0,
            0,
            0
          );


          const windowStart =
            new Date(
              currentDate
            );


          windowStart.setDate(
            currentDate.getDate() -
            6
          );


          const values =
            items
              .filter(
                candidate => {

                  const date =
                    dateFromKey(
                      candidate.date
                    );


                  if (!date) {
                    return false;
                  }


                  date.setHours(
                    12,
                    0,
                    0,
                    0
                  );


                  return (
                    date >=
                      windowStart &&
                    date <=
                      currentDate
                  );

                }
              )
              .map(
                candidate =>
                  getMetricValue(
                    candidate,
                    "readiness"
                  )
              )
              .filter(
                Number.isFinite
              );


          return {

            date:
              item.date,

            value:
              values.length
                ? average(
                    values
                  )
                : null

          };

        }
      );

    }


    /*
      ==================================
      SIMPLIFIED READINESS GRAPH
      ==================================
    */


    function buildReadinessChartSVG(
      items
    ) {

      const valid =
        items.filter(
          item =>
            Number.isFinite(
              getMetricValue(
                item,
                "readiness"
              )
            )
        );


      if (
        valid.length <
        2
      ) {

        return `
          <div class="chart-empty">
            Add at least two Daily Check-Ins
            to start your Brain Readiness graph.
          </div>
        `;

      }


      const width =
        900;


      const height =
        330;


      const left =
        42;


      const right =
        18;


      const top =
        20;


      const bottom =
        45;


      const usableWidth =
        width -
        left -
        right;


      const usableHeight =
        height -
        top -
        bottom;


      /*
        X is based on actual calendar
        position inside the 30-day window.

        Missing check-ins therefore appear
        as real gaps in time instead of
        compressing the graph.
      */


      const end =
        dateFromKey(
          todayKey()
        );


      end.setHours(
        12,
        0,
        0,
        0
      );


      const start =
        new Date(
          end
        );


      start.setDate(
        end.getDate() -
        29
      );


      function dayOffset(
        dateKey
      ) {

        const date =
          dateFromKey(
            dateKey
          );


        if (!date) {
          return 0;
        }


        date.setHours(
          12,
          0,
          0,
          0
        );


        return Math.round(
          (
            date -
            start
          ) /
          86400000
        );

      }


      function x(
        dateKey
      ) {

        const offset =
          Math.max(
            0,
            Math.min(
              29,
              dayOffset(
                dateKey
              )
            )
          );


        return (
          left +
          (
            offset /
            29
          ) *
          usableWidth
        );

      }


      function y(
        value
      ) {

        const safe =
          Math.max(
            0,
            Math.min(
              100,
              Number(
                value
              )
            )
          );


        return (
          top +
          (
            1 -
            safe /
            100
          ) *
          usableHeight
        );

      }


      const gridLines =
        [
          0,
          25,
          50,
          75,
          100
        ]
          .map(
            value => `
              <line
                x1="${left}"
                x2="${width - right}"
                y1="${y(value)}"
                y2="${y(value)}"
                class="chart-grid-line"
              ></line>

              <text
                x="4"
                y="${y(value) + 4}"
                class="chart-axis-text"
              >
                ${value}
              </text>
            `
          )
          .join(
            ""
          );


      /*
        We use individual segments rather
        than one polyline.

        If there is a missing calendar day,
        the raw Readiness line is broken
        instead of pretending there was
        continuous data.
      */


      let readinessSegments =
        "";


      for (
        let i = 1;
        i < valid.length;
        i++
      ) {

        const previous =
          valid[
            i - 1
          ];


        const current =
          valid[
            i
          ];


        const previousOffset =
          dayOffset(
            previous.date
          );


        const currentOffset =
          dayOffset(
            current.date
          );


        /*
          Only connect consecutive
          calendar days.
        */


        if (
          currentOffset -
          previousOffset !==
          1
        ) {
          continue;
        }


        const previousValue =
          getMetricValue(
            previous,
            "readiness"
          );


        const currentValue =
          getMetricValue(
            current,
            "readiness"
          );


        readinessSegments += `
          <line
            x1="${x(previous.date)}"
            y1="${y(previousValue)}"
            x2="${x(current.date)}"
            y2="${y(currentValue)}"
            class="trend-line chart-readiness"
          ></line>
        `;

      }


      const readinessPoints =
        valid
          .map(
            item => {

              const value =
                getMetricValue(
                  item,
                  "readiness"
                );


              return `
                <circle
                  cx="${x(item.date)}"
                  cy="${y(value)}"
                  r="4"
                  class="chart-readiness-point"
                ></circle>
              `;

            }
          )
          .join(
            ""
          );


      const movingAverage =
        buildSevenDayReadinessAverage(
          valid
        )
          .filter(
            item =>
              Number.isFinite(
                item.value
              )
          );


      const movingAveragePoints =
        movingAverage
          .map(
            item =>
              `${x(item.date)},${y(item.value)}`
          )
          .join(
            " "
          );


      const startLabel =
        start.toLocaleDateString(
          "en-US",
          {
            month:
              "short",

            day:
              "numeric"
          }
        );


      const endLabel =
        end.toLocaleDateString(
          "en-US",
          {
            month:
              "short",

            day:
              "numeric"
          }
        );


      return `

        <div class="trend-chart-scroll">

          <svg
            class="trend-chart"
            viewBox="0 0 ${width} ${height}"
            role="img"
            aria-label="Brain Readiness over the last 30 days"
          >

            ${gridLines}

            ${readinessSegments}

            ${
              movingAveragePoints
                ? `
                  <polyline
                    points="${movingAveragePoints}"
                    class="trend-line chart-readiness-average"
                  ></polyline>
                `
                : ""
            }

            ${readinessPoints}


            <text
              x="${left}"
              y="${height - 8}"
              class="chart-axis-text"
            >
              ${startLabel}
            </text>


            <text
              x="${width - right}"
              y="${height - 8}"
              text-anchor="end"
              class="chart-axis-text"
            >
              ${endLabel}
            </text>

          </svg>

        </div>


        <div class="chart-legend">

          <span class="legend-readiness">
            Daily Brain Readiness
          </span>

          <span class="legend-readiness-average">
            7-day average
          </span>

        </div>

      `;

    }


    /*
      ==================================
      PERSONAL PATTERNS UI
      ==================================
    */


    function personalPatternCard(
      eyebrow,
      title,
      comparison,
      explanation,
      statusClass = ""
    ) {

      return `

        <div class="card personal-pattern-card ${statusClass}">

          <p class="muted">
            ${eyebrow}
          </p>

          <h2>
            ${title}
          </h2>

          <div class="pattern-comparison">
            ${comparison}
          </div>

          <p class="section-subtitle">
            ${explanation}
          </p>

        </div>

      `;

    }


    function buildPersonalPatternsHTML(
      patterns
    ) {

      if (
        !patterns ||
        patterns.sampleSize <
        3
      ) {

        return `

          <div class="card">

            <p class="muted">
              PERSONAL PATTERNS
            </p>

            <h2>
              Neurovia is still learning your routine.
            </h2>

            <p class="section-subtitle">
              Complete more Daily Check-Ins.
              Personal patterns only appear after
              Neurovia has enough observations to
              compare different types of days.
            </p>

          </div>

        `;

      }


      const cards =
        [];


      /*
        SCREEN ↔ SLEEP
      */


      if (
        patterns.screenSleep
      ) {

        const pattern =
          patterns.screenSleep;


        const difference =
          Number(
            pattern.difference
          );


        let title =
          "No clear screen and sleep pattern yet";


        let explanation =
          "Your available data does not currently show a meaningful difference in sleep quality between lower-screen and higher-screen evenings.";


        let statusClass =
          "pattern-neutral";


        if (
          difference >= 1
        ) {

          title =
            "Lower-screen evenings are associated with better sleep quality";

          explanation =
            `In your recent check-ins, sleep quality was about ${Math.abs(difference).toFixed(1)} point(s) higher after lower-screen evenings. This is a personal association in your data, not proof that screen use caused the difference.`;

          statusClass =
            "pattern-positive";

        }


        else if (
          difference <= -1
        ) {

          title =
            "More screen time has not corresponded to worse sleep in your recent data";

          explanation =
            `Your recent check-ins do not show the expected lower sleep-quality pattern on higher-screen evenings. Neurovia will keep observing the relationship as more data is added.`;

          statusClass =
            "pattern-neutral";

        }


        cards.push(

          personalPatternCard(

            "SCREEN ↔ SLEEP",

            title,

            `
              <span>
                ≤15 min screen:
                <strong>
                  ${pattern.lowScreenSleepQuality}/10
                </strong>
              </span>

              <span>
                ≥30 min screen:
                <strong>
                  ${pattern.highScreenSleepQuality}/10
                </strong>
              </span>
            `,

            explanation,

            statusClass

          )

        );

      }


      /*
        DISTRACTION ↔ FOCUS
      */


      if (
        patterns.distractionFocus
      ) {

        const pattern =
          patterns.distractionFocus;


        const difference =
          Number(
            pattern.difference
          );


        let title =
          "No clear distraction and focus pattern yet";


        let explanation =
          "Your available data does not currently show a meaningful focus difference between lower-distraction and higher-distraction days.";


        let statusClass =
          "pattern-neutral";


        if (
          difference >= 1
        ) {

          title =
            "Lower-distraction days are associated with better focus";

          explanation =
            `Your average Focus was about ${Math.abs(difference).toFixed(1)} point(s) higher on lower-distraction days. Consider protecting a less disruptive environment for your most demanding work.`;

          statusClass =
            "pattern-positive";

        }


        else if (
          difference <= -1
        ) {

          title =
            "Distraction has not corresponded to lower focus in your recent data";

          explanation =
            "Your recent check-ins do not show lower Focus on higher-distraction days. Neurovia will keep collecting observations before treating this as a stable pattern.";

          statusClass =
            "pattern-neutral";

        }


        cards.push(

          personalPatternCard(

            "DISTRACTION ↔ FOCUS",

            title,

            `
              <span>
                Low distraction:
                <strong>
                  ${pattern.lowDistractionFocus}/10
                </strong>
              </span>

              <span>
                High distraction:
                <strong>
                  ${pattern.highDistractionFocus}/10
                </strong>
              </span>
            `,

            explanation,

            statusClass

          )

        );

      }


      /*
        BREAKS ↔ COGNITIVE LOAD
      */


      if (
        patterns.breaksLoad
      ) {

        const pattern =
          patterns.breaksLoad;


        const difference =
          Number(
            pattern.difference
          );


        let title =
          "No clear breaks and Cognitive Load pattern yet";


        let explanation =
          "Your available data does not currently show a meaningful Cognitive Load difference between days with fewer breaks and days with more breaks.";


        let statusClass =
          "pattern-neutral";


        if (
          difference >= 5
        ) {

          title =
            "More breaks are associated with lower Cognitive Load";

          explanation =
            `Days with fewer breaks averaged about ${Math.abs(difference)} more Cognitive Load points in your recent data. When possible, avoid stacking demanding activities without a real break.`;

          statusClass =
            "pattern-positive";

        }


        else if (
          difference <= -5
        ) {

          title =
            "More breaks have not corresponded to lower Cognitive Load yet";

          explanation =
            "Your current data shows higher Cognitive Load on days with more breaks. That may reflect harder days causing you to take more breaks, so Neurovia should not interpret this as breaks increasing load.";

          statusClass =
            "pattern-neutral";

        }


        cards.push(

          personalPatternCard(

            "BREAKS ↔ COGNITIVE LOAD",

            title,

            `
              <span>
                None / few:
                <strong>
                  ${pattern.weakBreaksLoad}/100
                </strong>
              </span>

              <span>
                Some / enough:
                <strong>
                  ${pattern.goodBreaksLoad}/100
                </strong>
              </span>
            `,

            explanation,

            statusClass

          )

        );

      }


      /*
        SLEEP ↔ ENERGY
      */


      if (
        patterns.sleepEnergy
      ) {

        const pattern =
          patterns.sleepEnergy;


        const difference =
          Number(
            pattern.difference
          );


        let title =
          "No clear sleep and energy pattern yet";


        let explanation =
          "Your available data does not currently show a meaningful Energy difference between shorter-sleep days and days when you reached your sleep reference.";


        let statusClass =
          "pattern-neutral";


        if (
          difference >= 1
        ) {

          title =
            "Enough sleep is associated with higher energy";

          explanation =
            `Your Energy averaged about ${Math.abs(difference).toFixed(1)} point(s) higher after nights when you reached your age-based sleep reference.`;

          statusClass =
            "pattern-positive";

        }


        else if (
          difference <= -1
        ) {

          title =
            "More sleep has not corresponded to higher energy in your recent data";

          explanation =
            "Your current check-ins do not show higher Energy after nights when you reached the sleep-duration reference. Other factors may be contributing, so Neurovia will keep observing the pattern.";

          statusClass =
            "pattern-neutral";

        }


        cards.push(

          personalPatternCard(

            "SLEEP ↔ ENERGY",

            title,

            `
              <span>
                Reached sleep reference:
                <strong>
                  ${pattern.enoughSleepEnergy}/10
                </strong>
              </span>

              <span>
                Short sleep:
                <strong>
                  ${pattern.shortSleepEnergy}/10
                </strong>
              </span>
            `,

            explanation,

            statusClass

          )

        );

      }


      if (
        !cards.length
      ) {

        return `

          <div class="card">

            <p class="muted">
              PERSONAL PATTERNS
            </p>

            <h2>
              More varied data is needed.
            </h2>

            <p class="section-subtitle">
              You already have ${patterns.sampleSize}
              check-in(s) in the analysis, but Neurovia
              needs at least three observations in both
              sides of a comparison before showing a
              personal pattern.
            </p>

            <p class="section-subtitle">
              Keep logging your real days normally.
              Do not change your answers just to create
              a comparison.
            </p>

          </div>

        `;

      }


      return `

        <div class="card">

          <p class="muted">
            PERSONAL PATTERNS
          </p>

          <h2>
            What tends to happen together
          </h2>

          <p class="section-subtitle">
            These comparisons use your own recent
            check-ins. They describe associations
            in your data and do not establish that
            one factor caused another.
          </p>

        </div>

        <div class="personal-pattern-grid">
          ${cards.join("")}
        </div>

      `;

    }


    /*
      ==================================
      IMPROVEMENT RENDER
      ==================================
    */


    function renderImprovement() {

      refreshUser();


      const items =
        getRolling30DayItems();


      const patterns =
        buildPersonalDailyPatterns(
          user,
          30
        );


      const priority =
        buildImprovementPriority(
          items
        );


      const weekday =
        getWeekdayAnalysis(
          items
        );


      const hardestDay =
        weekday[
          0
        ];


      const readinessTrend =
        buildTrend(
          items,
          "readiness"
        );


      const recoveryTrend =
        buildTrend(
          items,
          "recovery"
        );


      const loadTrend =
        buildTrend(
          items,
          "cognitiveLoad",
          true
        );


      const focusTrend =
        buildTrend(
          items,
          "focus"
        );


      const personalRecovery =
        buildPersonalRecoverySuggestion(
          user
        );


      const topStress =
        getTopStressTags(
          user,
          30,
          3
        );


      const historyMessage =
        items.length >= 20

          ? `
            Neurovia is using ${items.length}
            check-ins from the last 30 calendar days.
          `

          : `
            Neurovia currently has ${items.length}
            check-in(s) from the last 30 calendar days.
            Your history is still being built.
          `;


      improvementTab.innerHTML = `


        <div class="hero-card">

          <p class="muted">
            IMPROVEMENT
          </p>

          <h1 class="section-title">
            Turn patterns into changes.
          </h1>

          <p class="section-subtitle">
            ${historyMessage}
            Missing days are not counted as zero.
            Neurovia looks for repeated patterns
            instead of treating one difficult day
            as a conclusion.
          </p>

        </div>


        <!-- SUPPORTING TRENDS -->


        <div class="row two improvement-metrics">

          ${metricCard(
            "Readiness",
            readinessTrend.direction,
            "recent trend"
          )}

          ${metricCard(
            "Recovery",
            recoveryTrend.direction,
            "recent trend"
          )}

          ${metricCard(
            "Cognitive Load",
            loadTrend.direction,
            "lower is better"
          )}

          ${metricCard(
            "Focus",
            focusTrend.direction,
            "recent trend"
          )}

        </div>


        <!-- PERSONAL PATTERNS -->


        ${buildPersonalPatternsHTML(
          patterns
        )}


        <!-- MAIN ACTION -->


        <div class="recommendation-card">

          <p class="muted">
            MAIN IMPROVEMENT AREA
          </p>

          <h2>
            ${priority.title}
          </h2>

          <p>
            ${priority.text}
          </p>


          <div class="improvement-steps">

            ${
              priority.steps
                .map(
                  step => `

                    <div class="improvement-step">

                      <i
                        class="mdi mdi-check-circle-outline"
                      ></i>

                      <span>
                        ${step}
                      </span>

                    </div>

                  `
                )
                .join(
                  ""
                )
            }

          </div>

        </div>


        <!-- WEEKDAY PATTERN -->


        ${
          hardestDay

            ? `

              <div class="card">

                <p class="muted">
                  WEEKDAY PATTERN
                </p>

                <h2>
                  ${hardestDay.day} has carried
                  the highest repeated Cognitive Load.
                </h2>

                <p>
                  Across the current 30-day window,
                  ${hardestDay.day} has an average
                  Cognitive Load of
                  ${hardestDay.value}/100
                  across ${hardestDay.count}
                  logged occurrences.
                </p>

                <p class="section-subtitle">
                  Neurovia only shows a weekday
                  pattern after at least three
                  observations of that weekday.
                  This pattern can also inform
                  Brain Calendar planning.
                </p>


                <div class="weekday-bars">

                  ${
                    weekday
                      .map(
                        day => `

                          <div class="weekday-row">

                            <span>
                              ${day.day.slice(
                                0,
                                3
                              )}
                            </span>


                            <div class="weekday-bar-bg">

                              <div
                                class="weekday-bar-fill"
                                style="
                                  width:${day.value}%;
                                "
                              ></div>

                            </div>


                            <strong>
                              ${day.value}
                            </strong>

                          </div>

                        `
                      )
                      .join(
                        ""
                      )
                  }

                </div>

              </div>

            `

            : `

              <div class="card">

                <p class="muted">
                  WEEKDAY PATTERN
                </p>

                <h2>
                  Still building weekday patterns.
                </h2>

                <p class="section-subtitle">
                  Neurovia needs at least three
                  logged occurrences of the same
                  weekday before treating it as
                  a repeated weekday pattern.
                </p>

              </div>

            `
        }


        <!-- JOURNAL STRAIN -->


        ${
          topStress.length

            ? `

              <div class="card">

                <p class="muted">
                  RECURRING STRAIN
                </p>

                <h2>
                  What has been making days harder
                </h2>


                <div class="journal-tag-row">

                  ${
                    topStress
                      .map(
                        item => `

                          <span>
                            ${item.tag}
                            ·
                            ${item.count}
                          </span>

                        `
                      )
                      .join(
                        ""
                      )
                  }

                </div>

              </div>

            `

            : ""
        }


        <!-- PERSONAL RECOVERY -->


        ${
          personalRecovery

            ? `

              <div class="card personal-recovery-card">

                <p class="muted">
                  YOUR RECOVERY PATTERN
                </p>

                <h2>
                  ${personalRecovery.tag}
                </h2>

                <p>
                  You have selected this recovery
                  tag ${personalRecovery.occurrences}
                  time(s) recently.
                </p>

                <div class="recovery-action">
                  ${personalRecovery.text}
                </div>

              </div>

            `

            : `

              <div class="card">

                <p class="muted">
                  PERSONAL RECOVERY
                </p>

                <h2>
                  Tell Neurovia what actually helps.
                </h2>

                <p>
                  Use the Journal recovery tags after
                  your days. Once a recovery strategy
                  repeats, Neurovia can suggest it again
                  during more demanding periods.
                </p>

              </div>

            `
        }

      `;

    }

    /*
      ==================================
      BRAIN CALENDAR
      ==================================
    */
function renderCalendar() {
  refreshUser();

  const days =
    getUpcomingBrainDays(
      user,
      14
    );

  const personalRecovery =
    buildPersonalRecoverySuggestion(
      user
    );


  calendarTab.innerHTML = `

    <div class="hero-card">

      <p class="muted">
        BRAIN CALENDAR
      </p>

      <h1 class="section-title">
        See overload before it happens.
      </h1>

      <p class="section-subtitle">
        Neurovia combines activity type,
        mental demand, duration, spacing
        between activities and recent
        Brain Readiness to estimate planned
        cognitive workload.
      </p>

    </div>


    <div class="card">

      <h2>
        Add an event
      </h2>

      <form id="brainEventForm">


        <div class="input-row">

          <label>
            Event
          </label>

          <div class="input-box">

            <i class="mdi mdi-pencil-outline"></i>

            <input
              id="eventTitle"
              type="text"
              placeholder="Biology exam"
              required
            >

          </div>

        </div>


        <div class="input-row">

          <label>
            Date
          </label>

          <div class="input-box">

            <i class="mdi mdi-calendar"></i>

            <input
              id="eventDate"
              type="date"
              min="${todayKey()}"
              required
            >

          </div>

        </div>


        <div class="row two">

          <div class="input-row">

            <label>
              Starts
            </label>

            <div class="input-box">

              <i class="mdi mdi-clock-outline"></i>

              <input
                id="eventStartTime"
                type="time"
                required
              >

            </div>

          </div>


          <div class="input-row">

            <label>
              Ends
            </label>

            <div class="input-box">

              <i class="mdi mdi-clock-outline"></i>

              <input
                id="eventEndTime"
                type="time"
                required
              >

            </div>

          </div>

        </div>


        <div class="input-row">

          <label>
            Activity type
          </label>

          <div class="input-box">

            <select id="eventType">

              <option value="Physical Activity">
                Physical Activity
              </option>

              <option value="Assignment / Task">
                Assignment / Task
              </option>

              <option
                value="Studies"
                selected
              >
                Studies
              </option>

              <option value="Exam">
                Exam
              </option>

              <option value="Other">
                Other
              </option>

            </select>

          </div>

          <p class="field-help">
            Activity type changes the estimated
            cognitive cost. Physical activity has
            the lowest cognitive-load weight;
            exams have the highest.
          </p>

        </div>


        <div class="input-row">

          <label>
            Mental demand
          </label>

          <div class="input-box">

            <select id="eventIntensity">

              <option value="1">
                Super Light
              </option>

              <option value="2">
                Light
              </option>

              <option
                value="3"
                selected
              >
                Moderate
              </option>

              <option value="4">
                High
              </option>

              <option value="5">
                Super High
              </option>

            </select>

          </div>

        </div>


        <!-- REPEAT -->

        <div class="input-row">

          <label>
            Repeat
          </label>

          <div class="input-box">

            <i class="mdi mdi-repeat"></i>

            <select id="eventRepeat">

              <option value="none">
                Does not repeat
              </option>

              <option value="daily">
                Every day
              </option>

              <option value="weekdays">
                Every weekday
              </option>

              <option value="weekly">
                Every week
              </option>

              <option value="custom">
                Custom days
              </option>

            </select>

          </div>

        </div>


        <!-- CUSTOM WEEKDAYS -->

        <div
          id="customDaysSection"
          class="hidden"
        >

          <label>
            Repeat on
          </label>

          <div
            style="
              display:grid;
              grid-template-columns:
                repeat(4, 1fr);
              gap:8px;
              margin-top:10px;
              margin-bottom:18px;
            "
          >

            <label class="tag-option">
              <input
                type="checkbox"
                class="repeat-day"
                value="0"
              >
              Sun
            </label>

            <label class="tag-option">
              <input
                type="checkbox"
                class="repeat-day"
                value="1"
              >
              Mon
            </label>

            <label class="tag-option">
              <input
                type="checkbox"
                class="repeat-day"
                value="2"
              >
              Tue
            </label>

            <label class="tag-option">
              <input
                type="checkbox"
                class="repeat-day"
                value="3"
              >
              Wed
            </label>

            <label class="tag-option">
              <input
                type="checkbox"
                class="repeat-day"
                value="4"
              >
              Thu
            </label>

            <label class="tag-option">
              <input
                type="checkbox"
                class="repeat-day"
                value="5"
              >
              Fri
            </label>

            <label class="tag-option">
              <input
                type="checkbox"
                class="repeat-day"
                value="6"
              >
              Sat
            </label>

          </div>

        </div>


        <!-- REPEAT UNTIL -->

        <div
          id="repeatUntilSection"
          class="input-row hidden"
        >

          <label>
            Repeat until
          </label>

          <div class="input-box">

            <i class="mdi mdi-calendar-end"></i>

            <input
              id="eventRepeatUntil"
              type="date"
              min="${todayKey()}"
            >

          </div>

          <p class="field-help">
            Neurovia will create each occurrence
            automatically until this date.
          </p>

        </div>


        <p
          id="calendarMessage"
          class="message-text"
        ></p>


        <button
          class="primary-btn"
          type="submit"
        >
          Add to Brain Calendar
        </button>

      </form>

    </div>


    <div class="card">

      <h2>
        Overload scale
      </h2>

      <div class="overload-legend">

        <span class="legend-super-light">
          Super Light
        </span>

        <span class="legend-light">
          Light
        </span>

        <span class="legend-moderate">
          Moderate
        </span>

        <span class="legend-high">
          High
        </span>

        <span class="legend-super-high">
          Super High
        </span>

      </div>

    </div>


    <div class="card">

      <h2>
        Next 14 days
      </h2>

      <div class="brain-calendar-list">

        ${
          days
            .map(
              day => {

                const date =
                  dateFromKey(
                    day.date
                  );

                const label =
                  date
                    .toLocaleDateString(
                      "en-US",
                      {
                        weekday:
                          "short",

                        month:
                          "short",

                        day:
                          "numeric"
                      }
                    );

                const overloaded =
                  day.risk.tier ===
                    "High" ||
                  day.risk.tier ===
                    "Super High";

                return `

                  <div
                    class="
                      calendar-day-card
                      ${riskClass(
                        day.risk.tier
                      )}
                    "
                  >

                    <div
                      class="calendar-day-top"
                    >

                      <div>

                        <strong>
                          ${label}
                        </strong>

                        <div
                          class="muted"
                          style="
                            margin-top:4px;
                            font-size:12px;
                          "
                        >
                          Estimated load:
                          ${day.risk.load}
                        </div>

                      </div>


                      <span
                        class="risk-pill"
                      >
                        ${day.risk.tier}
                      </span>

                    </div>


                    ${
                      day.events.length

                        ? day.events
                            .map(
                              event => `

                                <div
                                  class="calendar-event"
                                >

                                  <div>

                                    <strong>
                                      ${event.title}
                                    </strong>

                                    <div class="muted">
                                      ${event.type}
                                      ·
                                      ${getIntensityLabel(
                                        event.intensity
                                      )}
                                    </div>

                                    ${
                                      event.startTime &&
                                      event.endTime

                                        ? `
                                          <div
                                            class="muted"
                                            style="
                                              margin-top:3px;
                                              font-size:12px;
                                            "
                                          >
                                            ${formatTime(
                                              event.startTime
                                            )}
                                            –
                                            ${formatTime(
                                              event.endTime
                                            )}
                                            ·
                                            ${getEventDurationHours(
                                              event
                                            )}h
                                          </div>
                                        `

                                        : ""
                                    }

                                    ${
                                      event.seriesId

                                        ? `
                                          <div
                                            class="muted"
                                            style="
                                              margin-top:3px;
                                              font-size:11px;
                                            "
                                          >
                                            Repeating event
                                          </div>
                                        `

                                        : ""
                                    }

                                  </div>


                                  <button
                                    class="delete-event-btn"
                                    data-id="${event.id}"
                                    type="button"
                                    aria-label="Delete event"
                                  >
                                    ×
                                  </button>

                                </div>
                              `
                            )
                            .join("")

                        : `
                          <p class="muted">
                            No events
                          </p>
                        `
                    }


                    ${
                      day.events.length
                        ? `
                          <div class="calendar-warning">
                            ${getCalendarSuggestion(
                              day.risk
                            )}
                          </div>
                        `
                        : ""
                    }


                    ${
                      overloaded &&
                      personalRecovery

                        ? `
                          <div class="calendar-recovery">

                            <strong>
                              Personal recovery idea:
                            </strong>

                            ${personalRecovery.text}

                          </div>
                        `

                        : ""
                    }

                  </div>
                `;
              }
            )
            .join("")
        }

      </div>

    </div>
  `;


  /*
    ==================================
    REPEAT CONTROLS
    ==================================
  */

  const repeatSelect =
    document.getElementById(
      "eventRepeat"
    );

  const repeatUntilSection =
    document.getElementById(
      "repeatUntilSection"
    );

  const repeatUntilInput =
    document.getElementById(
      "eventRepeatUntil"
    );

  const customDaysSection =
    document.getElementById(
      "customDaysSection"
    );

  const eventDateInput =
    document.getElementById(
      "eventDate"
    );


  function updateRepeatControls() {
    const repeatType =
      repeatSelect.value;


    if (
      repeatType === "none"
    ) {
      repeatUntilSection
        .classList
        .add("hidden");

      customDaysSection
        .classList
        .add("hidden");

      repeatUntilInput.required =
        false;

      repeatUntilInput.value =
        "";

      return;
    }


    repeatUntilSection
      .classList
      .remove("hidden");


    repeatUntilInput.required =
      true;


    if (
      eventDateInput.value
    ) {
      repeatUntilInput.min =
        eventDateInput.value;
    }


    if (
      repeatType === "custom"
    ) {
      customDaysSection
        .classList
        .remove("hidden");
    }

    else {
      customDaysSection
        .classList
        .add("hidden");
    }
  }


  repeatSelect
    .addEventListener(
      "change",
      updateRepeatControls
    );


  eventDateInput
    .addEventListener(
      "change",
      function () {

        if (
          eventDateInput.value
        ) {
          repeatUntilInput.min =
            eventDateInput.value;


          if (
            repeatUntilInput.value &&
            repeatUntilInput.value <
              eventDateInput.value
          ) {
            repeatUntilInput.value =
              "";
          }
        }

      }
    );


  updateRepeatControls();


  /*
    ==================================
    SAVE EVENT
    ==================================
  */

  document
    .getElementById(
      "brainEventForm"
    )
    .addEventListener(
      "submit",
      function (event) {

        event.preventDefault();


        const message =
          document.getElementById(
            "calendarMessage"
          );


        message.textContent =
          "";

        message
          .classList
          .remove(
            "error"
          );


        const title =
          document
            .getElementById(
              "eventTitle"
            )
            .value
            .trim();


        const date =
          eventDateInput.value;


        const startTime =
          document
            .getElementById(
              "eventStartTime"
            )
            .value;


        const endTime =
          document
            .getElementById(
              "eventEndTime"
            )
            .value;


        const repeatType =
          repeatSelect.value;


        const repeatUntil =
          repeatUntilInput.value;


        /*
          END TIME VALIDATION
        */

        if (
          timeToMinutes(
            endTime
          ) <=
          timeToMinutes(
            startTime
          )
        ) {
          message.textContent =
            "End time must be later than start time.";

          message
            .classList
            .add(
              "error"
            );

          return;
        }


        /*
          REPEAT DATE VALIDATION
        */

        if (
          repeatType !==
            "none" &&
          !repeatUntil
        ) {
          message.textContent =
            "Choose when this repeating event should end.";

          message
            .classList
            .add(
              "error"
            );

          return;
        }


        if (
          repeatType !==
            "none" &&
          repeatUntil <
            date
        ) {
          message.textContent =
            "Repeat until cannot be earlier than the first event date.";

          message
            .classList
            .add(
              "error"
            );

          return;
        }


        /*
          CUSTOM WEEKDAYS
        */

        const customDays =
          Array
            .from(
              document
                .querySelectorAll(
                  ".repeat-day:checked"
                )
            )
            .map(
              checkbox =>
                Number(
                  checkbox.value
                )
            );


        if (
          repeatType ===
            "custom" &&
          !customDays.length
        ) {
          message.textContent =
            "Choose at least one day of the week.";

          message
            .classList
            .add(
              "error"
            );

          return;
        }


        const updated =
          getCurrentUserObject();


        /*
          The function in brain-calendar.js
          creates either one event or an
          entire recurring series.
        */

        const created =
          addRecurringBrainEvents(
            updated,
            {
              title,

              date,

              startTime,

              endTime,

              type:
                document
                  .getElementById(
                    "eventType"
                  )
                  .value,

              intensity:
                Number(
                  document
                    .getElementById(
                      "eventIntensity"
                    )
                    .value
                ),

              repeatType,

              repeatUntil,

              customDays
            }
          );


        updateUser(
          updated
        );


        /*
          The form is rebuilt after saving,
          so there is no stale state.
        */

        renderCalendar();
      }
    );


  /*
    ==================================
    DELETE ONE OCCURRENCE
    ==================================

    Deleting an event here removes only
    that specific occurrence.

    Example:
    School repeats Mon-Fri.
    Delete Wednesday -> only Wednesday
    disappears.
  */

  document
    .querySelectorAll(
      ".delete-event-btn"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          function () {

            const updated =
              getCurrentUserObject();


            deleteBrainEvent(
              updated,
              button.dataset.id
            );


            updateUser(
              updated
            );


            renderCalendar();

          }
        );

      }
    );
}


    /*
      ==================================
      BRAIN JOURNAL
      ==================================
    */

    function renderJournal() {
      refreshUser();

      const entries =
        [
          ...user.brainJournal
        ]
          .sort(
            (a, b) =>
              b.date.localeCompare(
                a.date
              )
          );

      const patterns =
        buildJournalPatterns(
          user
        );


      journalTab.innerHTML = `

        <div class="hero-card">

          <p class="muted">
            BRAIN JOURNAL
          </p>

          <h1 class="section-title">
            Track what drains and restores you.
          </h1>

          <p class="section-subtitle">
            No free-text interpretation is needed.
            Select the tags that best describe what
            made the day harder and what helped you
            recover. Repeated recovery tags can later
            be suggested on overloaded days.
          </p>

        </div>


        <div class="card">

          <h2>
            Today's pattern
          </h2>

          <form id="journalForm">


            <div class="journal-group stress-group">

              <p class="journal-group-title">
                What made today harder?
              </p>

              <p class="muted">
                Select every strain that applies.
              </p>

              <div class="journal-tags">

                ${
                  STRESS_TAGS
                    .map(
                      tag => `

                        <label
                          class="
                            journal-tag
                            stress-tag
                          "
                        >

                          <input
                            type="checkbox"
                            name="stressTag"
                            value="${tag}"
                          >

                          <span>
                            ${tag}
                          </span>

                        </label>
                      `
                    )
                    .join("")
                }

              </div>

            </div>


            <div
              class="
                journal-group
                recovery-group
              "
            >

              <p class="journal-group-title">
                What helped you recover?
              </p>

              <p class="muted">
                Choose what actually made you feel
                calmer, more recovered or more focused.
              </p>

              <div class="journal-tags">

                ${
                  RECOVERY_TAGS
                    .map(
                      tag => `

                        <label
                          class="
                            journal-tag
                            recovery-tag
                          "
                        >

                          <input
                            type="checkbox"
                            name="recoveryTag"
                            value="${tag}"
                          >

                          <span>
                            ${tag}
                          </span>

                        </label>
                      `
                    )
                    .join("")
                }

              </div>

            </div>


            <p
              id="journalMessage"
              class="message-text"
            ></p>


            <button
              class="primary-btn"
              type="submit"
            >
              Save today's tags
            </button>

          </form>

        </div>


        <div class="card">

          <p class="muted">
            PATTERN FINDER
          </p>

          <h2>
            What Neurovia is noticing
          </h2>


          ${
            patterns
              .map(
                pattern => `

                  <div class="pattern-card">

                    <strong>
                      ${pattern.title}
                    </strong>

                    <p>
                      ${pattern.text}
                    </p>

                  </div>
                `
              )
              .join("")
          }

        </div>


        <div class="card">

          <h2>
            Recent entries
          </h2>


          ${
            entries.length

              ? entries
                  .slice(
                    0,
                    15
                  )
                  .map(
                    entry => {

                      const stressTags =
                        getEntryStressTags(
                          entry
                        );

                      const recoveryTags =
                        getEntryRecoveryTags(
                          entry
                        );

                      return `

                        <div class="journal-entry">

                          <div
                            class="journal-entry-top"
                          >

                            <strong>
                              ${formatDateKey(
                                entry.date
                              )}
                            </strong>

                            <button
                              class="delete-journal-btn"
                              data-id="${entry.id}"
                              type="button"
                            >
                              ×
                            </button>

                          </div>


                          ${
                            stressTags.length
                              ? `
                                <p class="journal-entry-label">
                                  Strain
                                </p>

                                <div
                                  class="
                                    journal-tag-row
                                    stress-tag-row
                                  "
                                >

                                  ${
                                    stressTags
                                      .map(
                                        tag => `
                                          <span>
                                            ${tag}
                                          </span>
                                        `
                                      )
                                      .join("")
                                  }

                                </div>
                              `
                              : ""
                          }


                          ${
                            recoveryTags.length
                              ? `
                                <p class="journal-entry-label">
                                  Recovery
                                </p>

                                <div
                                  class="
                                    journal-tag-row
                                    recovery-tag-row
                                  "
                                >

                                  ${
                                    recoveryTags
                                      .map(
                                        tag => `
                                          <span>
                                            ${tag}
                                          </span>
                                        `
                                      )
                                      .join("")
                                  }

                                </div>
                              `
                              : ""
                          }

                        </div>
                      `;
                    }
                  )
                  .join("")

              : `
                <p class="muted">
                  No journal entries yet.
                </p>
              `
          }

        </div>
      `;


      document
        .getElementById(
          "journalForm"
        )
        .addEventListener(
          "submit",
          function (event) {

            event.preventDefault();

            const stressTags =
              Array.from(
                document
                  .querySelectorAll(
                    'input[name="stressTag"]:checked'
                  )
              )
                .map(
                  input =>
                    input.value
                );


            const recoveryTags =
              Array.from(
                document
                  .querySelectorAll(
                    'input[name="recoveryTag"]:checked'
                  )
              )
                .map(
                  input =>
                    input.value
                );


            const message =
              document.getElementById(
                "journalMessage"
              );


            if (
              !stressTags.length &&
              !recoveryTags.length
            ) {
              message.textContent =
                "Select at least one tag before saving.";

              message.classList.add(
                "error"
              );

              return;
            }


            const updated =
              getCurrentUserObject();


            /*
              Keep one tag entry per day.
              Saving again replaces today's
              previous journal tags.
            */
            ensureBrainJournal(
              updated
            );

            updated.brainJournal =
              updated.brainJournal
                .filter(
                  entry =>
                    entry.date !==
                    todayKey()
                );


            addJournalEntry(
              updated,
              {
                date:
                  todayKey(),

                stressTags,

                recoveryTags
              }
            );


            updateUser(updated);
            renderJournal();
          }
        );


      document
        .querySelectorAll(
          ".delete-journal-btn"
        )
        .forEach(
          button => {

            button.addEventListener(
              "click",
              function () {

                const updated =
                  getCurrentUserObject();

                deleteJournalEntry(
                  updated,
                  button.dataset.id
                );

                updateUser(updated);
                renderJournal();
              }
            );

          }
        );
    }


    /*
      ==================================
      PROFILE
      ==================================
    */

    function renderProfile() {
      refreshUser();

      const baselineCount =
        user.baselineHistory
          ?.length ||
        (
          user.baseline
            ? 1
            : 0
        );


      profileTab.innerHTML = `

        <div class="hero-card">

          <p class="muted">
            PROFILE
          </p>

          <h1 class="section-title">
            ${user.name}
          </h1>

          <p class="section-subtitle">
            ${
              user.mainConcern ||
              "Your Neurovia profile"
            }
          </p>

        </div>


        <div class="card">

          <div class="profile-title-row">

            <h2>
              Fixed profile
            </h2>

            <button
              id="editProfileBtn"
              class="mini-btn"
              type="button"
            >
              Edit fixed profile
            </button>

          </div>


          <div class="profile-grid">


            <div class="input-row">

              <label>
                Age
              </label>

              <div
                class="input-box locked-field"
                id="ageBox"
              >

                <input
                  id="profileAge"
                  type="number"
                  value="${
                    user.profile?.age ||
                    ""
                  }"
                  disabled
                >

              </div>

            </div>


            <div class="input-row">

              <label>
                Biological sex
              </label>

              <div
                class="input-box locked-field"
                id="sexBox"
              >

                <select
                  id="profileSex"
                  disabled
                >

                  <option
                    value="Female"
                    ${
                      user.profile?.sex ===
                      "Female"
                        ? "selected"
                        : ""
                    }
                  >
                    Female
                  </option>

                  <option
                    value="Male"
                    ${
                      user.profile?.sex ===
                      "Male"
                        ? "selected"
                        : ""
                    }
                  >
                    Male
                  </option>

                  <option
                    value="Prefer not to say"
                    ${
                      user.profile?.sex ===
                      "Prefer not to say"
                        ? "selected"
                        : ""
                    }
                  >
                    Prefer not to say
                  </option>

                </select>

              </div>

            </div>


            <div class="input-row">

              <label>
                Country
              </label>

              <div
                class="input-box locked-field"
                id="countryBox"
              >

                <input
                  id="profileCountry"
                  type="text"
                  value="${
                    user.profile?.country ||
                    ""
                  }"
                  disabled
                >

              </div>

            </div>


            <div class="input-row">

              <label>
                Weight (kg)
              </label>

              <div
                class="input-box locked-field"
                id="weightBox"
              >

                <input
                  id="profileWeight"
                  type="number"
                  value="${
                    user.profile?.weight ||
                    ""
                  }"
                  disabled
                >

              </div>

            </div>


            <div class="input-row">

              <label>
                Height (cm)
              </label>

              <div
                class="input-box locked-field"
                id="heightBox"
              >

                <input
                  id="profileHeight"
                  type="number"
                  value="${
                    user.profile?.height ||
                    ""
                  }"
                  disabled
                >

              </div>

            </div>

          </div>


          <button
            id="saveProfileBtn"
            class="primary-btn hidden-btn"
            type="button"
          >
            Save fixed profile
          </button>


          <p
            id="profileEditMessage"
            class="message-text"
          ></p>

        </div>


        <div class="card">

          <h2>
            Baseline Assessment
          </h2>

          <p class="section-subtitle">
            Your baseline is separate from your
            Daily Check-Ins. Retaking it creates
            a new baseline record without deleting
            your previous baseline history.
          </p>


          <div class="info-table">

            <div class="info-row">

              <strong>
                Baselines completed:
              </strong>

              ${baselineCount}

            </div>


            ${
              user.baseline?.scores
                ? `
                  <div class="info-row">

                    <strong>
                      Current baseline score:
                    </strong>

                    ${
                      user.baseline
                        .scores
                        .overall
                    }/100

                  </div>
                `
                : ""
            }

          </div>


          <button
            id="retakeBaselineBtn"
            class="secondary-btn"
            type="button"
            style="margin-top:14px;"
          >
            Retake baseline
          </button>

        </div>


        <div class="card">

          <h2>
            Your Neurovia data
          </h2>


          <div class="info-table">

            <div class="info-row">
              <strong>
                Daily check-ins:
              </strong>

              ${getDates().length}
            </div>

            <div class="info-row">
              <strong>
                Journal entries:
              </strong>

              ${
                user.brainJournal
                  ?.length || 0
              }
            </div>

            <div class="info-row">
              <strong>
                Calendar events:
              </strong>

              ${
                user.brainCalendar
                  ?.length || 0
              }
            </div>

          </div>


          <div class="profile-actions">

            <button
              id="profilePreviousBtn"
              class="secondary-btn"
              type="button"
            >
              View previous days
            </button>

            <button
              id="weeklyCheckinBtn"
              class="secondary-btn"
              type="button"
            >
              Weekly Check-In
            </button>

            <button
              id="logoutBtn"
              class="ghost-btn"
              type="button"
            >
              Log out
            </button>

          </div>

        </div>
      `;


      const fixedInputs = [
        {
          input:
            "profileAge",
          box:
            "ageBox"
        },
        {
          input:
            "profileSex",
          box:
            "sexBox"
        },
        {
          input:
            "profileCountry",
          box:
            "countryBox"
        },
        {
          input:
            "profileWeight",
          box:
            "weightBox"
        },
        {
          input:
            "profileHeight",
          box:
            "heightBox"
        }
      ];


      document
        .getElementById(
          "editProfileBtn"
        )
        .onclick =
        function () {

          fixedInputs
            .forEach(
              item => {

                document
                  .getElementById(
                    item.input
                  )
                  .disabled =
                  false;

                document
                  .getElementById(
                    item.box
                  )
                  .classList
                  .remove(
                    "locked-field"
                  );
              }
            );


          document
            .getElementById(
              "saveProfileBtn"
            )
            .classList
            .remove(
              "hidden-btn"
            );
        };


      document
        .getElementById(
          "saveProfileBtn"
        )
        .onclick =
        function () {

          const updated =
            getCurrentUserObject();

          updated.profile =
            updated.profile || {};


          updated.profile.age =
            Number(
              document
                .getElementById(
                  "profileAge"
                )
                .value
            );


          updated.profile.sex =
            document
              .getElementById(
                "profileSex"
              )
              .value;


          updated.profile.country =
            document
              .getElementById(
                "profileCountry"
              )
              .value
              .trim();


          updated.profile.weight =
            Number(
              document
                .getElementById(
                  "profileWeight"
                )
                .value
            );


          updated.profile.height =
            Number(
              document
                .getElementById(
                  "profileHeight"
                )
                .value
            );


          /*
            Keep baseline answers aligned
            with the fixed profile when
            these fields already exist.
          */
          if (
            updated.onboardingAnswers
          ) {
            updated.onboardingAnswers.age =
              updated.profile.age;

            updated.onboardingAnswers.sex =
              updated.profile.sex;

            updated.onboardingAnswers.country =
              updated.profile.country;

            updated.onboardingAnswers.weight =
              updated.profile.weight;

            updated.onboardingAnswers.height =
              updated.profile.height;
          }


          updateUser(updated);

          renderProfile();
        };


      document
        .getElementById(
          "retakeBaselineBtn"
        )
        .onclick =
        function () {

          sessionStorage.setItem(
            "neurovia_retake_baseline",
            "true"
          );

          window.location.href =
            "onboarding.html";
        };


      document
        .getElementById(
          "profilePreviousBtn"
        )
        .onclick =
        function () {
          window.location.href =
            "previous-days.html";
        };


      document
        .getElementById(
          "weeklyCheckinBtn"
        )
        .onclick =
        function () {
          window.location.href =
            "weekly-checkin.html";
        };


      document
        .getElementById(
          "logoutBtn"
        )
        .onclick =
        function () {

          logoutUser();

          window.location.href =
            "index.html";
        };
    }


    /*
      ==================================
      NAVIGATION
      ==================================
    */

    const tabMap = {
      home:
        homeTab,

      improvement:
        improvementTab,

      calendar:
        calendarTab,

      journal:
        journalTab,

      profile:
        profileTab
    };


    function renderTab(tab) {
      if (tab === "home") {
        renderHome();
      }

      if (
        tab ===
        "improvement"
      ) {
        renderImprovement();
      }

      if (
        tab ===
        "calendar"
      ) {
        renderCalendar();
      }

      if (
        tab ===
        "journal"
      ) {
        renderJournal();
      }

      if (
        tab ===
        "profile"
      ) {
        renderProfile();
      }
    }


    function showTab(tab) {
      const safeTab =
        tabMap[tab]
          ? tab
          : "home";


      Object
        .values(
          tabMap
        )
        .forEach(
          section =>
            section
              .classList
              .add(
                "hidden"
              )
        );


      document
        .querySelectorAll(
          ".tab-btn"
        )
        .forEach(
          button =>
            button
              .classList
              .toggle(
                "active",
                button.dataset.tab ===
                  safeTab
              )
        );


      renderTab(
        safeTab
      );


      tabMap[
        safeTab
      ]
        .classList
        .remove(
          "hidden"
        );
    }


    document
      .querySelectorAll(
        ".tab-btn"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            function () {
              showTab(
                button.dataset.tab
              );
            }
          );

        }
      );


    /*
      Other pages can choose which
      dashboard tab should reopen.
    */
    const requestedTab =
      localStorage.getItem(
        "neurovia_return_tab"
      );

    localStorage.removeItem(
      "neurovia_return_tab"
    );


    showTab(
      requestedTab ||
      "home"
    );

  }
);