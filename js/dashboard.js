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
      return Object.keys(
        user.dailyLogs || {}
      ).sort();
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
          user.dailyLogs[
            date
          ]
      };
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
                <div class="muted"
                  style="margin-top:6px;font-size:13px;">
                  ${note}
                </div>
              `
              : ""
          }

        </div>
      `;
    }


    function riskClass(tier) {
      if (tier === "High") {
        return "risk-high";
      }

      if (
        tier ===
        "Moderate"
      ) {
        return "risk-moderate";
      }

      return "risk-low";
    }


    function renderHome() {
      refreshUser();

      const latest =
        getLatest();

      if (!latest) {

        homeTab.innerHTML = `
          <div class="hero-card">

            <p class="muted">
              NEUROVIA
            </p>

            <h1 class="section-title">
              What's your brain like today?
            </h1>

            <p class="section-subtitle">
              Complete your first daily check-in
              to start building your cognitive
              baseline.
            </p>

            <button
              id="firstDailyBtn"
              class="primary-btn"
            >
              Start daily check-in
            </button>

          </div>
        `;

        document
          .getElementById(
            "firstDailyBtn"
          )
          .onclick =
          function () {
            window.location.href =
              "daily-update.html";
          };

        return;
      }


      const scores =
        latest.log.scores;

      const recentLogs =
        getDates()
          .slice(-7)
          .map(
            date =>
              user.dailyLogs[
                date
              ]
          );

      const insight =
        buildMainInsight(
          user,
          latest.log,
          scores,
          recentLogs
        );

      const recovery =
        buildRecoveryTool(
          user
        );

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
              scores.overall
            }
          </div>

          <p class="section-subtitle">
            ${
              classifyReadiness(
                scores.brainReadiness ??
                scores.overall
              )
            }
          </p>

          <div class="bar-bg">

            <div
              class="bar-fill"
              style="
                width:${
                  scores.brainReadiness ??
                  scores.overall
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
            `${latest.log.focusLevel ?? "--"}/10`,
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


        <div
          class="recommendation-card"
        >

          <p class="muted">
            ONE THING TO DO
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

                <div
                  class="recovery-action"
                >
                  ${recovery.action}
                </div>

              </div>
            `
            : ""
        }


        <div class="card">

          <h2>
            Today's inputs
          </h2>

          <div class="signal-grid">

            <div>
              <span>Sleep</span>
              <strong>
                ${scores.sleepHours ?? "--"}h
              </strong>
            </div>

            <div>
              <span>Stress</span>
              <strong>
                ${latest.log.stressLevel ?? "--"}/10
              </strong>
            </div>

            <div>
              <span>Energy</span>
              <strong>
                ${latest.log.energyLevel ?? "--"}/10
              </strong>
            </div>

            <div>
              <span>Workload</span>
              <strong>
                ${latest.log.workloadLevel ?? "--"}/10
              </strong>
            </div>

            <div>
              <span>Focus</span>
              <strong>
                ${latest.log.focusLevel ?? "--"}/10
              </strong>
            </div>

          </div>

        </div>


        <button
          id="dailyUpdateBtn"
          class="primary-btn"
        >
          Update today's check-in
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
    }


    function renderCalendar() {
      refreshUser();

      const days =
        getUpcomingBrainDays(
          user,
          14
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
            Neurovia combines upcoming deadlines
            with your recent Brain Readiness to
            flag mentally demanding periods.
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
                  required
                >
              </div>
            </div>


            <div class="input-row">
              <label>
                Type
              </label>

              <div class="input-box">

                <select
                  id="eventType"
                >
                  <option>Exam</option>
                  <option>Assignment</option>
                  <option>Presentation</option>
                  <option>Activity</option>
                  <option>Other</option>
                </select>

              </div>
            </div>


            <div class="input-row">
              <label>
                Mental demand
              </label>

              <div class="input-box">

                <select
                  id="eventIntensity"
                >
                  <option value="1">
                    Light
                  </option>

                  <option
                    value="2"
                    selected
                  >
                    Moderate
                  </option>

                  <option value="3">
                    High
                  </option>
                </select>

              </div>
            </div>


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
            Next 14 days
          </h2>

          <div
            class="brain-calendar-list"
          >

            ${
              days
                .map(day => {

                  const date =
                    new Date(
                      day.date +
                      "T12:00:00"
                    );

                  const label =
                    date.toLocaleDateString(
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

                  return `

                    <div
                      class="calendar-day-card ${riskClass(
                        day.risk.tier
                      )}"
                    >

                      <div
                        class="calendar-day-top"
                      >

                        <div>
                          <strong>
                            ${label}
                          </strong>
                        </div>

                        <span
                          class="risk-pill"
                        >
                          ${
                            day.risk.tier
                          }
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

                                      <div
                                        class="muted"
                                      >
                                        ${event.type}
                                      </div>
                                    </div>

                                    <button
                                      class="delete-event-btn"
                                      data-id="${event.id}"
                                      type="button"
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
                        day.risk.tier !==
                        "Low"
                          ? `
                              <div
                                class="calendar-warning"
                              >
                                ${getCalendarSuggestion(
                                  day.risk
                                )}
                              </div>
                            `
                          : ""
                      }

                    </div>
                  `;
                })
                .join("")
            }

          </div>

        </div>
      `;


      document
        .getElementById(
          "brainEventForm"
        )
        .addEventListener(
          "submit",
          function (event) {

            event.preventDefault();

            const updated =
              getCurrentUserObject();

            addBrainEvent(
              updated,
              {
                title:
                  document
                    .getElementById(
                      "eventTitle"
                    )
                    .value
                    .trim(),

                date:
                  document
                    .getElementById(
                      "eventDate"
                    )
                    .value,

                type:
                  document
                    .getElementById(
                      "eventType"
                    )
                    .value,

                intensity:
                  document
                    .getElementById(
                      "eventIntensity"
                    )
                    .value
              }
            );

            updateUser(
              updated
            );

            renderCalendar();
          }
        );


      document
        .querySelectorAll(
          ".delete-event-btn"
        )
        .forEach(button => {

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
        });
    }


    function renderJournal() {
      refreshUser();

      const entries =
        [...user.brainJournal]
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
            Notice what changes your brain.
          </h1>

          <p class="section-subtitle">
            Keep it short. Log what drained your
            energy and what helped you focus.
          </p>

        </div>


        <div class="card">

          <h2>
            Today's note
          </h2>

          <form id="journalForm">

            <div class="input-row">

              <label>
                What drained your energy?
              </label>

              <div class="input-box">

                <textarea
                  id="journalDrained"
                  rows="3"
                  placeholder="A long study session, poor sleep..."
                ></textarea>

              </div>

            </div>


            <div class="input-row">

              <label>
                What helped you focus?
              </label>

              <div class="input-box">

                <textarea
                  id="journalHelped"
                  rows="3"
                  placeholder="Quiet room, exercise, good sleep..."
                ></textarea>

              </div>

            </div>


            <p class="muted">
              Tags
            </p>

            <div
              class="journal-tags"
            >

              ${
                JOURNAL_TAGS
                  .map(
                    tag => `
                      <label
                        class="journal-tag"
                      >

                        <input
                          type="checkbox"
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


            <button
              class="primary-btn"
              type="submit"
              style="margin-top:16px;"
            >
              Save journal entry
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
                  <div
                    class="pattern-card"
                  >

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
                  .slice(0, 10)
                  .map(
                    entry => `

                      <div
                        class="journal-entry"
                      >

                        <div
                          class="journal-entry-top"
                        >

                          <strong>
                            ${entry.date}
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
                          entry.drained
                            ? `
                                <p>
                                  <strong>
                                    Drained:
                                  </strong>

                                  ${entry.drained}
                                </p>
                              `
                            : ""
                        }


                        ${
                          entry.helped
                            ? `
                                <p>
                                  <strong>
                                    Helped:
                                  </strong>

                                  ${entry.helped}
                                </p>
                              `
                            : ""
                        }


                        <div
                          class="journal-tag-row"
                        >

                          ${
                            (
                              entry.tags ||
                              []
                            )
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

                      </div>
                    `
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

            const updated =
              getCurrentUserObject();

            const tags =
              Array.from(
                document
                  .querySelectorAll(
                    ".journal-tag input:checked"
                  )
              )
              .map(
                input =>
                  input.value
              );

            addJournalEntry(
              updated,
              {
                drained:
                  document
                    .getElementById(
                      "journalDrained"
                    )
                    .value
                    .trim(),

                helped:
                  document
                    .getElementById(
                      "journalHelped"
                    )
                    .value
                    .trim(),

                tags
              }
            );

            updateUser(
              updated
            );

            renderJournal();
          }
        );


      document
        .querySelectorAll(
          ".delete-journal-btn"
        )
        .forEach(button => {

          button.addEventListener(
            "click",
            function () {

              const updated =
                getCurrentUserObject();

              deleteJournalEntry(
                updated,
                button.dataset.id
              );

              updateUser(
                updated
              );

              renderJournal();
            }
          );
        });
    }


    function renderProfile() {
      refreshUser();

      const latest =
        getLatest();


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

          <h2>
            Baseline
          </h2>

          <div class="info-table">

            <div class="info-row">
              <strong>Age:</strong>
              ${user.profile?.age || "--"}
            </div>

            <div class="info-row">
              <strong>Sex:</strong>
              ${user.profile?.sex || "--"}
            </div>

            <div class="info-row">
              <strong>Country:</strong>
              ${user.profile?.country || "--"}
            </div>

            <div class="info-row">
              <strong>Weight:</strong>
              ${user.profile?.weight || "--"} kg
            </div>

            <div class="info-row">
              <strong>Height:</strong>
              ${user.profile?.height || "--"} cm
            </div>

          </div>

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
                Calendar events:
              </strong>
              ${
                user.brainCalendar
                  ?.length || 0
              }
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

            ${
              latest
                ? `
                    <div class="info-row">
                      <strong>
                        Latest check-in:
                      </strong>
                      ${latest.date}
                    </div>
                  `
                : ""
            }

          </div>

        </div>


        <div class="profile-actions">

          <button
            id="profileDailyBtn"
            class="primary-btn"
          >
            Daily check-in
          </button>

          <button
            id="profilePreviousBtn"
            class="secondary-btn"
          >
            Edit previous days
          </button>

          <button
            id="logoutBtn"
            class="ghost-btn"
          >
            Log out
          </button>

        </div>
      `;


      document
        .getElementById(
          "profileDailyBtn"
        )
        .onclick =
        function () {
          window.location.href =
            "daily-update.html";
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
          "logoutBtn"
        )
        .onclick =
        function () {

          logoutUser();

          window.location.href =
            "index.html";
        };
    }


    function renderEverything() {
      renderHome();
      renderCalendar();
      renderJournal();
      renderProfile();
    }


    renderEverything();


    document
      .querySelectorAll(
        ".tab-btn"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          function () {

            document
              .querySelectorAll(
                ".tab-btn"
              )
              .forEach(
                item =>
                  item.classList.remove(
                    "active"
                  )
              );

            button.classList.add(
              "active"
            );


            homeTab.classList.add(
              "hidden"
            );

            calendarTab.classList.add(
              "hidden"
            );

            journalTab.classList.add(
              "hidden"
            );

            profileTab.classList.add(
              "hidden"
            );


            const tab =
              button.dataset.tab;


            if (tab === "home") {
              homeTab.classList.remove(
                "hidden"
              );
            }


            if (
              tab === "calendar"
            ) {
              renderCalendar();

              calendarTab
                .classList
                .remove(
                  "hidden"
                );
            }


            if (
              tab === "journal"
            ) {
              renderJournal();

              journalTab
                .classList
                .remove(
                  "hidden"
                );
            }


            if (
              tab === "profile"
            ) {
              renderProfile();

              profileTab
                .classList
                .remove(
                  "hidden"
                );
            }
          }
        );
      });

  }
);