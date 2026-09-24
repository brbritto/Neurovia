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

    function getLast30LoggedDays() {
      return getDates()
        .slice(-30)
        .map(
          date => ({
            date,
            log:
              user.dailyLogs[date]
          })
        );
    }


    function getMetricValue(
      item,
      metric
    ) {
      const log =
        item.log || {};

      const scores =
        log.scores || {};

      if (
        metric ===
        "readiness"
      ) {
        return Number(
          scores.brainReadiness ??
          scores.overall
        );
      }

      if (
        metric ===
        "recovery"
      ) {
        return Number(
          scores.recovery
        );
      }

      if (
        metric ===
        "cognitiveLoad"
      ) {
        return Number(
          scores.cognitiveLoad
        );
      }

      if (
        metric ===
        "focus"
      ) {
        return Number(
          log.focusLevel
        ) * 10;
      }

      return null;
    }


    function buildTrend(
      items,
      metric,
      inverse = false
    ) {
      if (
        items.length < 4
      ) {
        return {
          direction: "learning",
          difference: 0
        };
      }

      const split =
        Math.floor(
          items.length / 2
        );

      const first =
        items.slice(
          0,
          split
        );

      const second =
        items.slice(
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
          direction: "learning",
          difference: 0
        };
      }

      const raw =
        secondAvg -
        firstAvg;

      const difference =
        inverse
          ? -raw
          : raw;

      if (difference >= 5) {
        return {
          direction: "improving",
          difference:
            Math.round(
              Math.abs(raw)
            )
        };
      }

      if (difference <= -5) {
        return {
          direction: "declining",
          difference:
            Math.round(
              Math.abs(raw)
            )
        };
      }

      return {
        direction: "stable",
        difference:
          Math.round(
            Math.abs(raw)
          )
      };
    }


    function getWeekdayAnalysis(
      items
    ) {
      const groups = {};

      items.forEach(item => {
        const date =
          dateFromKey(
            item.date
          );

        if (!date) {
          return;
        }

        const day =
          date.toLocaleDateString(
            "en-US",
            {
              weekday: "long"
            }
          );

        if (!groups[day]) {
          groups[day] = [];
        }

        const scores =
          item.log.scores || {};

        const load =
          Number(
            scores.cognitiveLoad
          );

        if (
          Number.isFinite(load)
        ) {
          groups[day].push(
            load
          );
        }
      });


      return Object
        .entries(groups)
        .map(
          ([day, values]) => ({
            day,
            value:
              Math.round(
                average(values) || 0
              ),
            count:
              values.length
          })
        )
        .sort(
          (a, b) =>
            b.value - a.value
        );
    }


    function buildImprovementPriority(
      items
    ) {
      if (!items.length) {
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
          key: "sleep",
          score:
            avgSleep === null
              ? -1
              : Math.max(
                  0,
                  (8 - avgSleep) *
                  12
                )
        },

        {
          key: "stress",
          score:
            avgStress === null
              ? -1
              : avgStress * 8
        },

        {
          key: "energy",
          score:
            avgEnergy === null
              ? -1
              : (10 - avgEnergy) * 8
        },

        {
          key: "focus",
          score:
            avgFocus === null
              ? -1
              : (10 - avgFocus) * 8
        },

        {
          key: "load",
          score:
            avgLoad === null
              ? -1
              : avgLoad
        }
      ]
        .sort(
          (a, b) =>
            b.score - a.score
        );


      const main =
        priorities[0]?.key;


      if (main === "sleep") {
        return {
          title:
            "Protect a more consistent sleep window",

          text:
            "Short or inconsistent sleep is one of the strongest recurring signals in your recent data. The goal is not simply to 'sleep more' tonight, but to make enough sleep easier to repeat.",

          steps: [
            "Choose a realistic target bedtime and keep it within roughly the same window across the week.",
            "Move optional work and stimulating screen use away from the final part of your evening.",
            "Prepare tomorrow's essentials earlier so bedtime is not delayed by small unfinished tasks.",
            "Use a short wind-down routine that you can repeat instead of relying on motivation at the end of the day."
          ]
        };
      }


      if (main === "stress") {
        return {
          title:
            "Reduce repeated stress accumulation",

          text:
            "Stress is recurring strongly across your recent check-ins. Focus on changing how demands are distributed instead of waiting until the end of a difficult day to recover.",

          steps: [
            "Identify the one or two tasks that actually need your highest attention each day.",
            "Avoid stacking multiple high-demand activities without a real break.",
            "Use the Brain Calendar to move flexible work away from already demanding periods.",
            "Protect a lower-stimulation transition before sleep on high-stress days."
          ]
        };
      }


      if (main === "energy") {
        return {
          title:
            "Build more recovery into demanding days",

          text:
            "Low energy is recurring in your recent pattern. Instead of treating recovery as something that happens only after all work is finished, place recovery periods inside demanding days.",

          steps: [
            "Leave a real gap between longer demanding activities.",
            "Keep physical activity in the schedule when it usually helps you recover.",
            "Avoid filling every break with another task.",
            "Protect your sleep opportunity when several low-energy days occur together."
          ]
        };
      }


      if (main === "focus") {
        return {
          title:
            "Protect your attention from repeated switching",

          text:
            "Focus is one of the weaker recurring signals in your recent data. The most useful change is to make focused work easier to sustain, not simply to try harder.",

          steps: [
            "Choose one defined task before beginning a work block.",
            "Remove avoidable notifications and task switching during that block.",
            "Separate demanding blocks with a real break.",
            "Place your most important focused work at times when your energy is usually stronger."
          ]
        };
      }


      return {
        title:
          "Spread cognitive demand more evenly",

        text:
          "Cognitive Load is the strongest recurring strain signal in your recent data. The Brain Calendar can help you avoid concentrating too much demanding work into the same period.",

        steps: [
          "Move flexible assignments away from exam-heavy periods when possible.",
          "Leave longer gaps between high-demand activities.",
          "Start larger study tasks earlier instead of compressing them into one day.",
          "Use lighter activities between demanding work blocks."
        ]
      };
    }


    function buildChartSVG(
      items
    ) {
      if (
        items.length < 2
      ) {
        return `
          <div class="chart-empty">
            Add at least two Daily Check-Ins
            to start the 30-day graph.
          </div>
        `;
      }


      const metrics = [
        {
          key: "readiness",
          label: "Readiness",
          className: "chart-readiness"
        },
        {
          key: "recovery",
          label: "Recovery",
          className: "chart-recovery"
        },
        {
          key: "cognitiveLoad",
          label: "Cognitive Load",
          className: "chart-load"
        },
        {
          key: "focus",
          label: "Focus",
          className: "chart-focus"
        }
      ];


      const width = 900;
      const height = 330;
      const left = 42;
      const right = 18;
      const top = 20;
      const bottom = 40;

      const usableWidth =
        width -
        left -
        right;

      const usableHeight =
        height -
        top -
        bottom;


      function x(index) {
        if (
          items.length === 1
        ) {
          return left;
        }

        return (
          left +
          (
            index /
            (items.length - 1)
          ) *
          usableWidth
        );
      }


      function y(value) {
        return (
          top +
          (
            1 -
            Math.max(
              0,
              Math.min(
                100,
                value
              )
            ) /
            100
          ) *
          usableHeight
        );
      }


      const gridLines =
        [0, 25, 50, 75, 100]
          .map(value => `
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
          `)
          .join("");


      const lines =
        metrics
          .map(metric => {

            const points =
              items
                .map(
                  (item, index) => {
                    const value =
                      getMetricValue(
                        item,
                        metric.key
                      );

                    if (
                      !Number.isFinite(
                        value
                      )
                    ) {
                      return null;
                    }

                    return (
                      `${x(index)},${y(value)}`
                    );
                  }
                )
                .filter(Boolean)
                .join(" ");

            if (!points) {
              return "";
            }

            return `
              <polyline
                points="${points}"
                class="trend-line ${metric.className}"
              ></polyline>
            `;
          })
          .join("");


      const firstDate =
        formatDateKey(
          items[0].date
        );

      const lastDate =
        formatDateKey(
          items[
            items.length - 1
          ].date
        );


      return `
        <div class="trend-chart-scroll">

          <svg
            class="trend-chart"
            viewBox="0 0 ${width} ${height}"
            role="img"
            aria-label="30 day Neurovia trend chart"
          >

            ${gridLines}
            ${lines}

            <text
              x="${left}"
              y="${height - 8}"
              class="chart-axis-text"
            >
              ${firstDate}
            </text>

            <text
              x="${width - right}"
              y="${height - 8}"
              text-anchor="end"
              class="chart-axis-text"
            >
              ${lastDate}
            </text>

          </svg>

        </div>


        <div class="chart-legend">

          <span class="legend-readiness">
            Readiness
          </span>

          <span class="legend-recovery">
            Recovery
          </span>

          <span class="legend-load">
            Cognitive Load
          </span>

          <span class="legend-focus">
            Focus
          </span>

        </div>
      `;
    }


    function renderImprovement() {
      refreshUser();

      const items =
        getLast30LoggedDays();

      const priority =
        buildImprovementPriority(
          items
        );

      const weekday =
        getWeekdayAnalysis(
          items
        );

      const hardestDay =
        weekday[0];

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


      improvementTab.innerHTML = `

        <div class="hero-card">

          <p class="muted">
            IMPROVEMENT
          </p>

          <h1 class="section-title">
            Turn patterns into changes.
          </h1>

          <p class="section-subtitle">
            This view uses up to 30 logged days
            to compare Brain Readiness, Recovery,
            Cognitive Load and Focus. It looks for
            recurring strain, whether your signals
            are improving, and which weekdays tend
            to carry more cognitive demand.
          </p>

        </div>


        <div class="card">

          <p class="muted">
            30-DAY OVERVIEW
          </p>

          <h2>
            Your four main signals
          </h2>

          <p class="section-subtitle">
            Each line uses the same 0–100 visual scale.
            Focus is converted from your 1–10 answer to
            0–100 only for comparison on this chart.
            Higher Readiness, Recovery and Focus are
            generally favorable signals; higher Cognitive
            Load means greater estimated mental demand.
          </p>

          ${buildChartSVG(items)}

        </div>


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
                      <i class="mdi mdi-check-circle-outline"></i>
                      <span>${step}</span>
                    </div>
                  `
                )
                .join("")
            }

          </div>

        </div>


        ${
          hardestDay
            ? `
              <div class="card">

                <p class="muted">
                  WEEKDAY PATTERN
                </p>

                <h2>
                  ${hardestDay.day} currently carries
                  the highest average cognitive load.
                </h2>

                <p>
                  Across your available 30-day data,
                  ${hardestDay.day} has an average
                  Cognitive Load of
                  ${hardestDay.value}/100
                  from ${hardestDay.count}
                  logged occurrence(s).
                </p>

                <p class="section-subtitle">
                  Neurovia uses this pattern together
                  with your Brain Calendar so you can
                  avoid adding unnecessary demanding
                  events to days that are repeatedly
                  difficult.
                </p>

                <div class="weekday-bars">

                  ${
                    weekday
                      .map(
                        day => `
                          <div class="weekday-row">

                            <span>
                              ${day.day.slice(0, 3)}
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
                      .join("")
                  }

                </div>

              </div>
            `
            : ""
        }


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
                      .join("")
                  }

                </div>

              </div>
            `
            : ""
        }


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