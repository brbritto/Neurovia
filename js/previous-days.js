document.addEventListener("DOMContentLoaded", function () {

  const user = getCurrentUserObject();

  if (!user || !user.onboardingCompleted) {
    window.location.href = "index.html";
    return;
  }

  const selectedDate =
    document.getElementById("selectedDate");

  const message =
    document.getElementById("previousMessage");

  const today = todayKey();

  selectedDate.max = today;

  function setValue(id, value) {
    const element =
      document.getElementById(id);

    if (element && value !== undefined && value !== null) {
      element.value = value;
    }
  }

  function clearFields() {
    [
      "sleepTime",
      "wakeTime",
      "sleepQuality",
      "stressLevel",
      "energyLevel",
      "workloadLevel",
      "focusLevel"
    ].forEach(id => {
      document.getElementById(id).value = "";
    });
  }

  function loadExistingDay(date) {

    const freshUser =
      getCurrentUserObject();

    const log =
      freshUser.dailyLogs?.[date];

    clearFields();

    message.textContent = "";
    message.classList.remove("error");

    if (!log) {
      message.textContent =
        "No check-in exists for this date yet. You can create one.";
      return;
    }

    setValue("sleepTime", log.sleepTime);
    setValue("wakeTime", log.wakeTime);
    setValue("sleepQuality", log.sleepQuality);
    setValue("stressLevel", log.stressLevel);
    setValue("energyLevel", log.energyLevel);
    setValue("workloadLevel", log.workloadLevel);
    setValue("focusLevel", log.focusLevel);

    message.textContent =
      "Existing check-in loaded. Edit anything you want and save.";
  }

  selectedDate.addEventListener("change", function () {

    if (!selectedDate.value) return;

    if (selectedDate.value > today) {
      selectedDate.value = "";
      message.textContent =
        "You cannot create a daily check-in for a future date.";
      message.classList.add("error");
      return;
    }

    loadExistingDay(
      selectedDate.value
    );
  });

  document
    .getElementById("previousDayForm")
    .addEventListener("submit", function (event) {

      event.preventDefault();

      const date =
        selectedDate.value;

      if (!date) {
        message.textContent =
          "Please select a date.";
        message.classList.add("error");
        return;
      }

      if (date > today) {
        message.textContent =
          "Future dates belong in the Brain Calendar, not the Daily Check-In.";
        message.classList.add("error");
        return;
      }

      const updated =
        getCurrentUserObject();

      updated.dailyLogs =
        updated.dailyLogs || {};

      const log = {
        sleepTime:
          document.getElementById("sleepTime").value,

        wakeTime:
          document.getElementById("wakeTime").value,

        sleepQuality:
          Number(
            document.getElementById("sleepQuality").value
          ),

        stressLevel:
          Number(
            document.getElementById("stressLevel").value
          ),

        energyLevel:
          Number(
            document.getElementById("energyLevel").value
          ),

        workloadLevel:
          Number(
            document.getElementById("workloadLevel").value
          ),

        focusLevel:
          Number(
            document.getElementById("focusLevel").value
          )
      };

      const scores =
        calculateScores(
          updated.profile,
          log
        );

      updated.dailyLogs[date] = {
        ...log,
        scores,
        updatedAt:
          new Date().toISOString()
      };

      updateUser(updated);

      localStorage.setItem(
        "neurovia_return_tab",
        "profile"
      );

      window.location.href =
        "dashboard.html";
    });

  document
    .getElementById("backDashboardBtn")
    .addEventListener("click", function () {

      window.location.href =
        "dashboard.html";
    });

});