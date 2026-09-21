document.addEventListener(
  "DOMContentLoaded",
  function () {

    const user = getCurrentUserObject();

    if (!user || !user.onboardingCompleted) {
      window.location.href = "index.html";
      return;
    }

    const homeTab =
      document.getElementById("homeTab");

    const analysisTab =
      document.getElementById("analysisTab");

    const improvementTab =
      document.getElementById(
        "improvementTab"
      );

    const profileTab =
      document.getElementById("profileTab");

    function sortedDates(userObject) {
      return Object
        .keys(userObject.dailyLogs || {})
        .sort();
    }

    function latestData(userObject) {
      const dates = sortedDates(userObject);

      if (!dates.length) return null;

      const date =
        dates[dates.length - 1];

      return {
        date,
        log: userObject.dailyLogs[date]
      };
    }

    function previousData(userObject) {
      const dates = sortedDates(userObject);

      if (dates.length < 2) return null;

      const date =
        dates[dates.length - 2];

      return {
        date,
        log: userObject.dailyLogs[date]
      };
    }

    function metricCard(
      label,
      value,
      suffix = ""
    ) {
      return `
        <div class="metric-card">
          <div class="metric-label">
            ${label}
          </div>

          <div class="metric-value">
            ${value}${suffix}
          </div>
        </div>
      `;
    }

    function getDayName(dateString) {
      const date =
        new Date(dateString + "T12:00:00");

      return [
        "Sun",
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat"
      ][date.getDay()];
    }

    function drawTrendChart(
      canvasId,
      userObject
    ) {
      const canvas =
        document.getElementById(canvasId);

      if (!canvas) return;

      const ctx =
        canvas.getContext("2d");

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(
        0,
        0,
        width,
        height
      );

      const dates = sortedDates(
        userObject
      ).slice(-7);

      if (!dates.length) return;

      const padding = 35;

      const chartWidth =
        width - padding * 2;

      const chartHeight =
        height - 70;

      ctx.strokeStyle =
        "rgba(255,255,255,.08)";

      ctx.lineWidth = 1;

      for (let i = 0; i <= 4; i++) {
        const y =
          padding +
          (chartHeight / 4) * i;

        ctx.beginPath();

        ctx.moveTo(padding, y);

        ctx.lineTo(
          width - padding,
          y
        );

        ctx.stroke();
      }

      const metrics = [
        {
          key: "brainReadiness",
          color: "#ffffff"
        },
        {
          key: "recovery",
          color: "#57f0c8"
        },
        {
          key: "cognitiveLoad",
          color: "#9b5cff"
        },
        {
          key: "sleep",
          color: "#4da3ff"
        }
      ];

      metrics.forEach(metric => {

        ctx.strokeStyle =
          metric.color;

        ctx.lineWidth = 3;

        ctx.beginPath();

        dates.forEach(
          (dateString, index) => {

            const log =
              userObject.dailyLogs[
                dateString
              ];

            const value =
              Number(
                log?.scores?.[
                  metric.key
                ] || 0
              );

            const x =
              padding +
              (
                dates.length === 1
                  ? chartWidth / 2
                  : index *
                    (
                      chartWidth /
                      (dates.length - 1)
                    )
              );

            const y =
              padding +
              chartHeight -
              (
                value /
                100
              ) *
              chartHeight;

            if (index === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
        );

        ctx.stroke();
      });

      dates.forEach(
        (dateString, index) => {

          const x =
            padding +
            (
              dates.length === 1
                ? chartWidth / 2
                : index *
                  (
                    chartWidth /
                    (dates.length - 1)
                  )
            );

          ctx.fillStyle =
            "#93a4b8";

          ctx.font =
            "11px Arial";

          ctx.textAlign =
            "center";

          ctx.fillText(
            getDayName(dateString),
            x,
            height - 12
          );
        }
      );
    }

    function render() {
      const freshUser =
        getCurrentUserObject();

      const latest =
        latestData(freshUser);

      const previous =
        previousData(freshUser);

      if (!latest) {

        homeTab.innerHTML = `
          <div class="hero-card">

            <p class="muted">
              NEUROVIA
            </p>

            <h1 class="section-title">
              Start understanding
              your brain
            </h1>

            <p class="section-subtitle">
              Complete your first daily
              check-in to estimate your
              cognitive load, recovery,
              sleep debt and brain readiness.
            </p>

            <button
              id="firstCheckinBtn"
              class="primary-btn"
            >
              Start daily check-in
            </button>

          </div>
        `;

        document
          .getElementById(
            "firstCheckinBtn"
          )
          .addEventListener(
            "click",
            function () {
              window.location.href =
                "daily-update.html";
            }
          );

        return;
      }

      const scores =
        latest.log.scores;

      const previousScores =
        previous
          ? previous.log.scores
          : null;

      const recentLogs =
        sortedDates(freshUser)
          .slice(-7)
          .map(
            date =>
              freshUser.dailyLogs[
                date
              ]
          );

      const weeklySleepDebt =
        calculateWeeklySleepDebt(
          freshUser.profile,
          recentLogs
        );

      const insight =
        buildMainInsight(
          freshUser,
          latest.log,
          scores,
          recentLogs
        );

      const weeklyInsight =
        buildWeeklyInsight(
          scores,
          previousScores
        );

      const readinessStatus =
        classifyReadiness(
          scores.brainReadiness
        );

      homeTab.innerHTML = `

        <div class="hero-card">

          <p class="muted">
            TODAY
          </p>

          <h1 class="section-title">
            ${freshUser.name},
            your brain readiness is
            ${scores.brainReadiness}
          </h1>

          <p class="section-subtitle">
            ${readinessStatus}
          </p>

          <div
            class="bar-bg"
            style="margin-top:18px;"
          >
            <div
              class="bar-fill"
              style="
                width:
                ${scores.brainReadiness}%;
              "
            ></div>
          </div>

        </div>

        <div class="card">

          <p class="muted">
            WHAT MAY BE HAPPENING
          </p>

          <h2>
            ${insight.title}
          </h2>

          <p class="muted">
            ${insight.explanation}
          </p>

        </div>

        <div
          class="recommendation-card"
        >

          <p class="muted">
            YOUR NEXT ACTION
          </p>

          <h3>
            ${insight.action}
          </h3>

        </div>

        <div class="row two">

          ${metricCard(
            "Brain Readiness",
            scores.brainReadiness
          )}

          ${metricCard(
            "Recovery",
            scores.recovery
          )}

          ${metricCard(
            "Cognitive Load",
            scores.cognitiveLoad
          )}

          ${metricCard(
            "Sleep",
            scores.sleep
          )}

        </div>

        <div class="card">

          <h2>
            Today's signals
          </h2>

          <div class="info-table">

            <div class="info-row">
              <strong>
                Sleep duration
              </strong>
              <br>
              ${scores.sleepHours} h
            </div>

            <div class="info-row">
              <strong>
                Sleep debt today
              </strong>
              <br>
              ${scores.sleepDebt} h
            </div>

            <div class="info-row">
              <strong>
                7-day sleep debt
              </strong>
              <br>
              ${weeklySleepDebt} h
            </div>

            <div class="info-row">
              <strong>
                Energy
              </strong>
              <br>
              ${latest.log.energyLevel}/10
            </div>

            <div class="info-row">
              <strong>
                Stress
              </strong>
              <br>
              ${latest.log.stressLevel}/10
            </div>

            <div class="info-row">
              <strong>
                Workload
              </strong>
              <br>
              ${latest.log.workloadLevel}/10
            </div>

            <div class="info-row">
              <strong>
                Focus
              </strong>
              <br>
              ${latest.log.focusLevel}/10
            </div>

          </div>

        </div>

        <div class="card">

          <h2>
            Your week
          </h2>

          <p>
            <strong>
              ${weeklyInsight.title}
            </strong>
          </p>

          <p class="muted">
            ${weeklyInsight.text}
          </p>

          <div class="legend-row">

            <div class="legend-item">
              <span
                class="legend-color"
                style="background:#fff;"
              ></span>
              Readiness
            </div>

            <div class="legend-item">
              <span
                class="legend-color"
                style="background:#57f0c8;"
              ></span>
              Recovery
            </div>

            <div class="legend-item">
              <span
                class="legend-color"
                style="background:#9b5cff;"
              ></span>
              Cognitive Load
            </div>

            <div class="legend-item">
              <span
                class="legend-color"
                style="background:#4da3ff;"
              ></span>
              Sleep
            </div>

          </div>

          <div class="chart-box">

            <canvas
              id="brainTrendChart"
              width="760"
              height="280"
              style="
                width:100%;
                max-width:100%;
              "
            ></canvas>

          </div>

        </div>

        <button
          id="dailyCheckinBtn"
          class="primary-btn"
        >
          Update today's check-in
        </button>
      `;

      analysisTab.innerHTML = `

        <div class="hero-card">

          <p class="muted">
            ANALYSIS
          </p>

          <h1 class="section-title">
            Why do you feel this way?
          </h1>

          <p class="section-subtitle">
            Neurovia combines your
            recent sleep, stress,
            energy, workload and focus
            patterns.
          </p>

        </div>

        <div class="card">

          <h2>
            Your current concern
          </h2>

          <p>
            ${
              freshUser.mainConcern ||
              "Not selected"
            }
          </p>

        </div>

        <div class="card">

          <h2>
            Strongest current signal
          </h2>

          <p>
            <strong>
              ${insight.title}
            </strong>
          </p>

          <p class="muted">
            ${insight.explanation}
          </p>

        </div>

        <div class="card">

          <h2>
            Brain Readiness
          </h2>

          <div class="metric-value">
            ${scores.brainReadiness}
          </div>

          <p class="muted">
            A daily estimate based on
            sleep, recovery, focus and
            cognitive demand. It is not
            a medical diagnosis.
          </p>

        </div>

        <div class="card">

          <h2>
            Cognitive Load
          </h2>

          <div class="metric-value">
            ${scores.cognitiveLoad}
          </div>

          <p class="muted">
            Higher values represent
            greater mental demand and
            strain.
          </p>

        </div>

        <div class="card">

          <h2>
            Recovery
          </h2>

          <div class="metric-value">
            ${scores.recovery}
          </div>

          <p class="muted">
            Estimated from your sleep,
            energy and stress signals.
          </p>

        </div>
      `;

      improvementTab.innerHTML = `

        <div class="hero-card">

          <p class="muted">
            IMPROVEMENT
          </p>

          <h1 class="section-title">
            One priority at a time
          </h1>

          <p class="section-subtitle">
            Neurovia focuses on the
            most relevant action instead
            of giving you a long list
            of generic advice.
          </p>

        </div>

        <div
          class="recommendation-card"
        >

          <p class="muted">
            CURRENT PRIORITY
          </p>

          <h2>
            ${insight.title}
          </h2>

          <p>
            ${insight.explanation}
          </p>

          <div
            class="subtle-divider"
          ></div>

          <p class="muted">
            DO THIS NEXT
          </p>

          <h3>
            ${insight.action}
          </h3>

        </div>

        <div class="card">

          <h2>
            Why only one action?
          </h2>

          <p class="muted">
            Changing several things at
            once makes it harder to
            understand what actually
            helped. Neurovia prioritizes
            the strongest current signal
            and watches what changes
            afterward.
          </p>

        </div>

        <button
          id="weeklyCheckinBtn"
          class="secondary-btn"
        >
          Weekly check-in
        </button>
      `;

      profileTab.innerHTML = `

        <div class="hero-card">

          <p class="muted">
            PROFILE
          </p>

          <h1 class="section-title">
            ${freshUser.name}
          </h1>

          <p class="section-subtitle">
            ${
              freshUser.mainConcern ||
              ""
            }
          </p>

        </div>

        <div class="card">

          <h2>
            Baseline profile
          </h2>

          <div class="info-table">

            <div class="info-row">
              <strong>Age:</strong>
              ${freshUser.profile.age || "--"}
            </div>

            <div class="info-row">
              <strong>Sex:</strong>
              ${freshUser.profile.sex || "--"}
            </div>

            <div class="info-row">
              <strong>Country:</strong>
              ${freshUser.profile.country || "--"}
            </div>

            <div class="info-row">
              <strong>Weight:</strong>
              ${
                freshUser.profile.weight ||
                "--"
              } kg
            </div>

            <div class="info-row">
              <strong>Height:</strong>
              ${
                freshUser.profile.height ||
                "--"
              } cm
            </div>

          </div>

        </div>

        <div class="card">

          <h2>
            Latest check-in
          </h2>

          <div class="info-table">

            <div class="info-row">
              <strong>Date:</strong>
              ${latest.date}
            </div>

            <div class="info-row">
              <strong>Sleep:</strong>
              ${latest.log.sleepTime}
              →
              ${latest.log.wakeTime}
            </div>

            <div class="info-row">
              <strong>Stress:</strong>
              ${latest.log.stressLevel}/10
            </div>

            <div class="info-row">
              <strong>Energy:</strong>
              ${latest.log.energyLevel}/10
            </div>

            <div class="info-row">
              <strong>Workload:</strong>
              ${latest.log.workloadLevel}/10
            </div>

            <div class="info-row">
              <strong>Focus:</strong>
              ${latest.log.focusLevel}/10
            </div>

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
            Previous days
          </button>

          <button
            id="logoutBtn"
            class="ghost-btn"
          >
            Log out
          </button>

        </div>
      `;

      setTimeout(
        function () {
          drawTrendChart(
            "brainTrendChart",
            freshUser
          );
        },
        30
      );

      document
        .getElementById(
          "dailyCheckinBtn"
        )
        ?.addEventListener(
          "click",
          function () {
            window.location.href =
              "daily-update.html";
          }
        );

      document
        .getElementById(
          "weeklyCheckinBtn"
        )
        ?.addEventListener(
          "click",
          function () {
            window.location.href =
              "weekly-checkin.html";
          }
        );

      document
        .getElementById(
          "profileDailyBtn"
        )
        ?.addEventListener(
          "click",
          function () {
            window.location.href =
              "daily-update.html";
          }
        );

      document
        .getElementById(
          "profilePreviousBtn"
        )
        ?.addEventListener(
          "click",
          function () {
            window.location.href =
              "previous-days.html";
          }
        );

      document
        .getElementById(
          "logoutBtn"
        )
        ?.addEventListener(
          "click",
          function () {
            logoutUser();

            window.location.href =
              "index.html";
          }
        );
    }

    render();

    document
      .querySelectorAll(".tab-btn")
      .forEach(function (button) {

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

            analysisTab.classList.add(
              "hidden"
            );

            improvementTab.classList.add(
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

            if (tab === "analysis") {
              analysisTab.classList.remove(
                "hidden"
              );
            }

            if (
              tab === "improvement"
            ) {
              improvementTab.classList.remove(
                "hidden"
              );
            }

            if (tab === "profile") {
              profileTab.classList.remove(
                "hidden"
              );
            }
          }
        );
      });

  }
);