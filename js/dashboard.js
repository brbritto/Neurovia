document.addEventListener("DOMContentLoaded", function () {
  const user = getCurrentUserObject();

  if (!user || !user.onboardingCompleted) {
    window.location.href = "index.html";
    return;
  }

  const users = getUsers();

  const homeTab = document.getElementById("homeTab");
  const analysisTab = document.getElementById("analysisTab");
  const improvementTab = document.getElementById("improvementTab");
  const profileTab = document.getElementById("profileTab");

  let currentWeekOffset = 0;

  function getSortedDates(obj) {
    return Object.keys(obj || {}).sort();
  }

  function getLatestDate(freshUser) {
    const dates = getSortedDates(freshUser.dailyLogs);
    return dates.length ? dates[dates.length - 1] : null;
  }

  function getPreviousDate(freshUser) {
    const dates = getSortedDates(freshUser.dailyLogs);
    return dates.length >= 2 ? dates[dates.length - 2] : null;
  }

  function getWeekDates(offsetWeeks = 0) {
    const today = new Date();
    const day = today.getDay();
    const start = new Date(today);

    start.setDate(today.getDate() - day - offsetWeeks * 7);

    const dates = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d.toISOString().slice(0, 10));
    }

    return dates;
  }

  function formatDayLabel(dateStr) {
    const d = new Date(dateStr + "T12:00:00");
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
  }

  function drawWeeklyChart(canvasId, weekDates, dailyLogs) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const metrics = [
      { key: "sleep", color: "#4da3ff", label: "Sleep" },
      { key: "stress", color: "#9b5cff", label: "Stress Control" },
      { key: "cognitive", color: "#57f0c8", label: "Cognitive Load" },
      { key: "physical", color: "#ff6ec7", label: "Physical Wellness" },
      { key: "overall", color: "#ffffff", label: "Overall" }
    ];

    const chartTop = 20;
    const chartBottom = height - 42;
    const chartHeight = chartBottom - chartTop;
    const dayGroupWidth = width / 7;
    const barWidth = Math.max(8, dayGroupWidth / 8);

    weekDates.forEach((dateStr, dayIndex) => {
      const log = dailyLogs[dateStr];
      const scores = log?.scores || {};

      const totalBars = metrics.length;
      const totalBarsWidth = totalBars * barWidth + (totalBars - 1) * 4;
      const startX = dayIndex * dayGroupWidth + (dayGroupWidth - totalBarsWidth) / 2;

      metrics.forEach((metric, metricIndex) => {
        const value = scores[metric.key] || 0;
        const x = startX + metricIndex * (barWidth + 4);
        const barHeight = (value / 100) * chartHeight;
        const y = chartBottom - barHeight;

        ctx.fillStyle = metric.color;
        ctx.fillRect(x, y, barWidth, barHeight);
      });

      ctx.fillStyle = "#93a4b8";
      ctx.font = "11px Arial";
      ctx.fillText(formatDayLabel(dateStr), dayIndex * dayGroupWidth + 10, height - 10);
    });
  }

  function drawComparisonChart(canvasId, labels, userValues, averageValues) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const groupWidth = width / labels.length;
    const barWidth = groupWidth / 4;

    labels.forEach((label, i) => {
      const baseX = i * groupWidth + 30;

      const userHeight = (userValues[i] / 100) * (height - 60);
      const avgHeight = (averageValues[i] / 100) * (height - 60);

      const userY = height - userHeight - 30;
      const avgY = height - avgHeight - 30;

      ctx.fillStyle = "#4da3ff";
      ctx.fillRect(baseX, userY, barWidth, userHeight);

      ctx.fillStyle = "#57f0c8";
      ctx.fillRect(baseX + barWidth + 12, avgY, barWidth, avgHeight);

      ctx.fillStyle = "#93a4b8";
      ctx.font = "12px Arial";
      ctx.fillText(label, baseX, height - 8);
    });
  }

  function drawMetricVsAverageChart(canvasId, labels, userValues, averageValues, metricColors) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const groupWidth = width / labels.length;
    const barWidth = 18;

    labels.forEach((label, i) => {
      const baseX = i * groupWidth + groupWidth / 2 - 22;

      const userHeight = (userValues[i] / 100) * (height - 70);
      const avgHeight = (averageValues[i] / 100) * (height - 70);

      const userY = height - userHeight - 35;
      const avgY = height - avgHeight - 35;

      ctx.fillStyle = metricColors[i];
      ctx.fillRect(baseX, userY, barWidth, userHeight);

      ctx.fillStyle = "#31d7a9";
      ctx.fillRect(baseX + barWidth + 8, avgY, barWidth, avgHeight);

      ctx.fillStyle = "#93a4b8";
      ctx.font = "11px Arial";
      ctx.fillText(label, baseX - 2, height - 10);
    });
  }

  function renderDashboard() {
    const freshUser = getCurrentUserObject();

    const latestDate = getLatestDate(freshUser);
    const previousDate = getPreviousDate(freshUser);

    const latestLog = latestDate ? freshUser.dailyLogs[latestDate] : null;
    const previousLog = previousDate ? freshUser.dailyLogs[previousDate] : null;

    if (!latestLog) {
      homeTab.innerHTML = `
        <div class="hero-card">
          <h1 class="section-title">No daily data yet</h1>
        </div>
      `;
      return;
    }

    const latestScores = latestLog.scores;
    const previousScores = previousLog ? previousLog.scores : null;

    const dates = getSortedDates(freshUser.dailyLogs);
    const pastDatesOnly = dates.filter(d => d !== latestDate).slice(-7);
    const pastLogsOnly = pastDatesOnly.map(d => freshUser.dailyLogs[d]);

    const weeklyAverage = getAverageOfLogs(pastLogsOnly);
    const summary = buildHomeSummary(latestScores, previousScores, weeklyAverage);
    const globalAverage = getGlobalAppAverage(users) || GLOBAL_REFERENCE_BASELINE;

    const cards = buildImprovementCards(
      freshUser.profile,
      latestLog,
      latestScores,
      [latestLog, ...pastLogsOnly]
    );

    const mainInsight = buildMainInsight(
      freshUser,
      latestLog,
      latestScores,
      [latestLog, ...pastLogsOnly]
    );

    const latestWeeklyCheckin =
      freshUser.weeklyCheckins && freshUser.weeklyCheckins.length
        ? freshUser.weeklyCheckins[freshUser.weeklyCheckins.length - 1]
        : null;

    const weekDates = getWeekDates(currentWeekOffset);

    homeTab.innerHTML = `
      <div class="hero-card">
        <p class="muted">HOME</p>
        <h1 class="section-title">Welcome back, ${freshUser.name}</h1>
        <p class="section-subtitle">
          Today: <strong>${summary.todayStatus}</strong> · Trend: <strong>${summary.trendLabel}</strong>
        </p>
      </div>

      <div class="card">
        <h2>Main insight</h2>
        <p><strong>${mainInsight.title}</strong></p>
        <p class="muted">${mainInsight.text}</p>
      </div>

      <div class="row two">
        <div class="metric-card">
          <div class="metric-label">Today overall</div>
          <div class="metric-value">${latestScores.overall}</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Previous day</div>
          <div class="metric-value">${previousScores ? previousScores.overall : "--"}</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Sleep</div>
          <div class="metric-value">${latestScores.sleep}</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Stress Control</div>
          <div class="metric-value">${latestScores.stress}</div>
        </div>
      </div>

      <div class="card">
        <h2>Weekly chart</h2>
        <p class="muted">Each day shows only your personal scores for the five core areas. This chart does not compare you with the average.</p>

        <div class="legend-row">
          <div class="legend-item"><span class="legend-color" style="background:#4da3ff;"></span> Sleep</div>
          <div class="legend-item"><span class="legend-color" style="background:#9b5cff;"></span> Stress Control</div>
          <div class="legend-item"><span class="legend-color" style="background:#57f0c8;"></span> Cognitive Load</div>
          <div class="legend-item"><span class="legend-color" style="background:#ff6ec7;"></span> Physical Wellness</div>
          <div class="legend-item"><span class="legend-color" style="background:#ffffff;"></span> Overall</div>
        </div>

        <div class="profile-actions" style="grid-template-columns:1fr 1fr;">
          <button id="prevWeekBtn" class="secondary-btn" type="button">Previous week</button>
          <button id="nextWeekBtn" class="secondary-btn" type="button">Next week</button>
        </div>

        <div class="chart-box">
          <canvas id="homeChart" width="760" height="280" style="width:100%;max-width:100%;"></canvas>
        </div>

        <p class="muted" style="margin-top:12px;">
          ${
            previousScores
              ? `Compared with the previous logged day, your overall score changed by ${latestScores.overall - previousScores.overall} point(s).`
              : `There is no previous logged day yet for comparison.`
          }
        </p>
      </div>

      <div class="card">
        <h2>Weekly reading</h2>
        <p class="muted">
          ${
            weeklyAverage
              ? `Average of previous logs excluding today: ${weeklyAverage.overall}.`
              : `Weekly average not available yet.`
          }
        </p>
      </div>

      <div class="card">
        <h2>Weekly check-in</h2>
        ${
          latestWeeklyCheckin
            ? `
              <p><strong>Energy:</strong> ${latestWeeklyCheckin.energyWeek}</p>
              <p><strong>Focus:</strong> ${latestWeeklyCheckin.focusWeek}</p>
              <p><strong>Stress:</strong> ${latestWeeklyCheckin.stressWeek}</p>
              <p><strong>Main issue:</strong> ${latestWeeklyCheckin.mainIssueWeek || "--"}</p>
            `
            : `<p class="muted">No weekly check-in saved yet.</p>`
        }
        <button id="goWeeklyCheckinBtn" class="secondary-btn" type="button">Weekly check-in</button>
      </div>
    `;

    analysisTab.innerHTML = `
      <div class="hero-card">
        <p class="muted">ANALYSIS</p>
        <h1 class="section-title">You vs global app average</h1>
        <p class="section-subtitle">Blue shows your current score. Light green shows the global app average.</p>
      </div>

      <div class="card">
        <div class="legend-row">
          <div class="legend-item"><span class="legend-color legend-blue"></span> Your score</div>
          <div class="legend-item"><span class="legend-color legend-green"></span> Global app average</div>
        </div>

        <div class="chart-box">
          <canvas id="analysisChart" width="760" height="260" style="width:100%;max-width:100%;"></canvas>
        </div>

        <p class="muted" style="margin-top:12px;">
          Healthy percentage today: <strong>${latestScores.overall}%</strong>
        </p>
      </div>
    `;

    improvementTab.innerHTML = `
      <div class="hero-card">
        <p class="muted">IMPROVEMENT</p>
        <h1 class="section-title">Recovery plan and comparison</h1>
        <p class="section-subtitle">This section shows where you stand versus the global average and what exactly needs improvement.</p>
      </div>

      <div class="card">
        <h2>Your score vs average</h2>
        <p class="muted">For each topic, the left bar is your current score and the right bar is the global average.</p>

        <div class="legend-row">
          <div class="legend-item"><span class="legend-color" style="background:#4da3ff;"></span> Sleep</div>
          <div class="legend-item"><span class="legend-color" style="background:#9b5cff;"></span> Stress Control</div>
          <div class="legend-item"><span class="legend-color" style="background:#57f0c8;"></span> Cognitive Load</div>
          <div class="legend-item"><span class="legend-color" style="background:#ff6ec7;"></span> Physical Wellness</div>
          <div class="legend-item"><span class="legend-color" style="background:#ffffff;"></span> Overall</div>
          <div class="legend-item"><span class="legend-color" style="background:#31d7a9;"></span> Average</div>
        </div>

        <div class="chart-box">
          <canvas id="improvementCompareChart" width="760" height="280" style="width:100%;max-width:100%;"></canvas>
        </div>
      </div>

      ${cards.map(card => `
        <div class="recommendation-card">
          <h3>${card.area}</h3>
          <p><strong>Issue:</strong> ${card.issue}</p>
          <p><strong>Why:</strong> ${card.why}</p>
          <p><strong>Plan:</strong> ${card.action}</p>
        </div>
      `).join("")}
    `;

    profileTab.innerHTML = `
      <div class="hero-card">
        <p class="muted">PROFILE</p>
        <h1 class="section-title">${freshUser.name}</h1>
        <p class="section-subtitle">Your fixed data, current day data and update shortcuts.</p>
      </div>

      <div class="card">
        <h2>Fixed profile data</h2>

        <div class="info-table">
          <div class="info-row"><strong>Age:</strong> <input id="fixedAge" class="locked-field" type="number" value="${freshUser.profile.age || ""}"></div>
          <div class="info-row"><strong>Sex:</strong> <input id="fixedSex" class="locked-field" type="text" value="${freshUser.profile.sex || ""}"></div>
          <div class="info-row"><strong>Country:</strong> <input id="fixedCountry" class="locked-field" type="text" value="${freshUser.profile.country || ""}"></div>
          <div class="info-row"><strong>Weight:</strong> <input id="fixedWeight" class="locked-field" type="number" value="${freshUser.profile.weight || ""}"></div>
          <div class="info-row"><strong>Height:</strong> <input id="fixedHeight" class="locked-field" type="number" value="${freshUser.profile.height || ""}"></div>
        </div>

        <div class="profile-actions">
          <button id="editFixedProfileBtn" class="secondary-btn" type="button">Edit fixed profile</button>
          <button id="saveFixedProfileBtn" class="primary-btn hidden-btn" type="button">Save fixed profile</button>
        </div>
      </div>

      <div class="card">
        <h2>Today's latest data</h2>

        <div class="info-table">
          <div class="info-row"><strong>Date:</strong> ${latestDate}</div>
          <div class="info-row"><strong>Sleep time:</strong> ${latestLog.sleepTime || "--"}</div>
          <div class="info-row"><strong>Wake-up time:</strong> ${latestLog.wakeTime || "--"}</div>
          <div class="info-row"><strong>Water intake:</strong> ${latestLog.waterIntake || "--"}</div>
          <div class="info-row"><strong>Stress level:</strong> ${latestLog.stressLevel || "--"}</div>
          <div class="info-row"><strong>Fatigue:</strong> ${latestLog.daytimeFatigue || "--"}</div>
        </div>
      </div>

      <div class="card">
        <h2>Previous day data</h2>

        <div class="info-table">
          ${
            previousLog
              ? `
                <div class="info-row"><strong>Date:</strong> ${previousDate}</div>
                <div class="info-row"><strong>Sleep time:</strong> ${previousLog.sleepTime || "--"}</div>
                <div class="info-row"><strong>Wake-up time:</strong> ${previousLog.wakeTime || "--"}</div>
                <div class="info-row"><strong>Water intake:</strong> ${previousLog.waterIntake || "--"}</div>
                <div class="info-row"><strong>Stress level:</strong> ${previousLog.stressLevel || "--"}</div>
                <div class="info-row"><strong>Fatigue:</strong> ${previousLog.daytimeFatigue || "--"}</div>
              `
              : `<div class="info-row">No previous day logged yet.</div>`
          }
        </div>

        <div class="profile-actions">
          <button id="goDailyUpdateBtn" class="primary-btn" type="button">Daily data update</button>
          <button id="goPreviousDaysBtn" class="mini-btn" type="button">Update previous days</button>
          <button id="logoutBtn" class="secondary-btn" type="button">Log Out</button>
        </div>
      </div>
    `;

    setTimeout(() => {
      drawWeeklyChart("homeChart", weekDates, freshUser.dailyLogs);

      drawComparisonChart(
        "analysisChart",
        ["Sleep", "Stress Ctrl", "Cog", "Phys", "Overall"],
        [
          latestScores.sleep,
          latestScores.stress,
          latestScores.cognitive,
          latestScores.physical,
          latestScores.overall
        ],
        [
          globalAverage.sleep,
          globalAverage.stress,
          globalAverage.cognitive,
          globalAverage.physical,
          globalAverage.overall
        ]
      );

      drawMetricVsAverageChart(
        "improvementCompareChart",
        ["Sleep", "Stress Ctrl", "Cog", "Phys", "Overall"],
        [
          latestScores.sleep,
          latestScores.stress,
          latestScores.cognitive,
          latestScores.physical,
          latestScores.overall
        ],
        [
          globalAverage.sleep,
          globalAverage.stress,
          globalAverage.cognitive,
          globalAverage.physical,
          globalAverage.overall
        ],
        ["#4da3ff", "#9b5cff", "#57f0c8", "#ff6ec7", "#ffffff"]
      );
    }, 50);

    document.getElementById("prevWeekBtn").addEventListener("click", function () {
      currentWeekOffset += 1;
      renderDashboard();
    });

    document.getElementById("nextWeekBtn").addEventListener("click", function () {
      if (currentWeekOffset > 0) {
        currentWeekOffset -= 1;
        renderDashboard();
      }
    });

    document.getElementById("editFixedProfileBtn").addEventListener("click", function () {
      ["fixedAge", "fixedSex", "fixedCountry", "fixedWeight", "fixedHeight"].forEach(id => {
        document.getElementById(id).classList.remove("locked-field");
      });

      document.getElementById("saveFixedProfileBtn").classList.remove("hidden-btn");
    });

    document.getElementById("saveFixedProfileBtn").addEventListener("click", function () {
      const updated = getCurrentUserObject();

      updated.profile.age = document.getElementById("fixedAge").value.trim();
      updated.profile.sex = document.getElementById("fixedSex").value.trim();
      updated.profile.country = document.getElementById("fixedCountry").value.trim();
      updated.profile.weight = document.getElementById("fixedWeight").value.trim();
      updated.profile.height = document.getElementById("fixedHeight").value.trim();

      updateUser(updated);

      ["fixedAge", "fixedSex", "fixedCountry", "fixedWeight", "fixedHeight"].forEach(id => {
        document.getElementById(id).classList.add("locked-field");
      });

      document.getElementById("saveFixedProfileBtn").classList.add("hidden-btn");
    });

    document.getElementById("goDailyUpdateBtn").addEventListener("click", function () {
      localStorage.setItem("neurovia_return_tab", "profile");
      window.location.href = "daily-update.html";
    });

    document.getElementById("goPreviousDaysBtn").addEventListener("click", function () {
      localStorage.setItem("neurovia_return_tab", "profile");
      window.location.href = "previous-days.html";
    });

    document.getElementById("logoutBtn").addEventListener("click", function () {
      logoutUser();
      window.location.href = "index.html";
    });

    const weeklyBtn = document.getElementById("goWeeklyCheckinBtn");
    if (weeklyBtn) {
      weeklyBtn.addEventListener("click", function () {
        window.location.href = "weekly-checkin.html";
      });
    }
  }

  renderDashboard();

  const returnTab = localStorage.getItem("neurovia_return_tab");

  if (returnTab === "profile") {
    document.querySelectorAll(".tab-btn").forEach(x => x.classList.remove("active"));
    document.querySelector('.tab-btn[data-tab="profile"]').classList.add("active");

    homeTab.classList.add("hidden");
    analysisTab.classList.add("hidden");
    improvementTab.classList.add("hidden");
    profileTab.classList.remove("hidden");

    localStorage.removeItem("neurovia_return_tab");
  }

  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".tab-btn").forEach(x => x.classList.remove("active"));
      btn.classList.add("active");

      homeTab.classList.add("hidden");
      analysisTab.classList.add("hidden");
      improvementTab.classList.add("hidden");
      profileTab.classList.add("hidden");

      const tab = btn.dataset.tab;

      if (tab === "home") homeTab.classList.remove("hidden");
      if (tab === "analysis") analysisTab.classList.remove("hidden");
      if (tab === "improvement") improvementTab.classList.remove("hidden");
      if (tab === "profile") profileTab.classList.remove("hidden");
    });
  });
});