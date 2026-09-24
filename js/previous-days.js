document.addEventListener(
  "DOMContentLoaded",
  function () {

    const user =
      getCurrentUserObject();


    if (
      !user ||
      !user.onboardingCompleted
    ) {
      window.location.href =
        "index.html";

      return;
    }


    const selectedDate =
      document.getElementById(
        "selectedDate"
      );

    const message =
      document.getElementById(
        "previousMessage"
      );

    const dayView =
      document.getElementById(
        "dayView"
      );

    const editDaySection =
      document.getElementById(
        "editDaySection"
      );

    const today =
      todayKey();


    selectedDate.max =
      today;


    function formatDateKey(key) {
      const date =
        dateFromKey(key);

      if (!date) {
        return key;
      }

      return date.toLocaleDateString(
        "en-US",
        {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric"
        }
      );
    }


    function formatTime(time) {
      if (!time) {
        return "--";
      }

      const parts =
        time.split(":");

      if (
        parts.length !== 2
      ) {
        return time;
      }

      const date =
        new Date();

      date.setHours(
        Number(parts[0]),
        Number(parts[1]),
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


    function setText(
      id,
      value
    ) {
      const element =
        document.getElementById(
          id
        );

      if (element) {
        element.textContent =
          value;
      }
    }


    function setValue(
      id,
      value
    ) {
      const element =
        document.getElementById(
          id
        );

      if (
        element &&
        value !== undefined &&
        value !== null
      ) {
        element.value =
          value;
      }
    }


    function clearEditFields() {
      [
        "sleepTime",
        "wakeTime",
        "sleepQuality",
        "stressLevel",
        "energyLevel",
        "workloadLevel",
        "focusLevel"
      ]
        .forEach(id => {
          const element =
            document.getElementById(
              id
            );

          if (element) {
            element.value = "";
          }
        });
    }


    function calculateSleepHours(
      sleepTime,
      wakeTime
    ) {
      if (
        !sleepTime ||
        !wakeTime
      ) {
        return null;
      }

      const [
        sleepHour,
        sleepMinute
      ] =
        sleepTime
          .split(":")
          .map(Number);

      const [
        wakeHour,
        wakeMinute
      ] =
        wakeTime
          .split(":")
          .map(Number);


      let sleep =
        sleepHour * 60 +
        sleepMinute;

      let wake =
        wakeHour * 60 +
        wakeMinute;


      if (wake <= sleep) {
        wake +=
          24 * 60;
      }


      return Number(
        (
          (wake - sleep) /
          60
        ).toFixed(1)
      );
    }


    function hideEverything() {
      dayView
        .classList
        .add(
          "hidden"
        );

      editDaySection
        .classList
        .add(
          "hidden"
        );
    }


    function populateEditForm(
      log
    ) {
      clearEditFields();

      setValue(
        "sleepTime",
        log.sleepTime
      );

      setValue(
        "wakeTime",
        log.wakeTime
      );

      setValue(
        "sleepQuality",
        log.sleepQuality
      );

      setValue(
        "stressLevel",
        log.stressLevel
      );

      setValue(
        "energyLevel",
        log.energyLevel
      );

      setValue(
        "workloadLevel",
        log.workloadLevel
      );

      setValue(
        "focusLevel",
        log.focusLevel
      );
    }


    function renderDay(
      date
    ) {
      const freshUser =
        getCurrentUserObject();

      const log =
        freshUser.dailyLogs?.[
          date
        ];


      message.textContent = "";
      message
        .classList
        .remove(
          "error"
        );


      editDaySection
        .classList
        .add(
          "hidden"
        );


      if (!log) {
        dayView
          .classList
          .add(
            "hidden"
          );

        message.textContent =
          "No Daily Check-In was recorded for this date.";

        return;
      }


      const scores =
        log.scores || {};


      const readiness =
        Number(
          scores.brainReadiness ??
          scores.overall
        );


      const sleepHours =
        Number.isFinite(
          Number(
            scores.sleepHours
          )
        )
          ? Number(
              scores.sleepHours
            )
          : calculateSleepHours(
              log.sleepTime,
              log.wakeTime
            );


      setText(
        "viewDate",
        formatDateKey(
          date
        )
      );


      setText(
        "readinessNumber",
        Number.isFinite(
          readiness
        )
          ? Math.round(
              readiness
            )
          : "--"
      );


      document
        .getElementById(
          "readinessBar"
        )
        .style
        .width =
        Number.isFinite(
          readiness
        )
          ? `${
              Math.max(
                0,
                Math.min(
                  100,
                  readiness
                )
              )
            }%`
          : "0%";


      setText(
        "viewRecovery",
        scores.recovery ??
        "--"
      );


      setText(
        "viewCognitiveLoad",
        scores.cognitiveLoad ??
        "--"
      );


      setText(
        "viewFocus",
        log.focusLevel
          ? `${log.focusLevel}/10`
          : "--"
      );


      setText(
        "viewSleep",
        sleepHours !== null
          ? `${sleepHours}h`
          : "--"
      );


      setText(
        "viewSleepTime",
        formatTime(
          log.sleepTime
        )
      );


      setText(
        "viewWakeTime",
        formatTime(
          log.wakeTime
        )
      );


      setText(
        "viewSleepQuality",
        log.sleepQuality
          ? `${log.sleepQuality}/10`
          : "--"
      );


      setText(
        "viewStress",
        log.stressLevel
          ? `${log.stressLevel}/10`
          : "--"
      );


      setText(
        "viewEnergy",
        log.energyLevel
          ? `${log.energyLevel}/10`
          : "--"
      );


      setText(
        "viewWorkload",
        log.workloadLevel
          ? `${log.workloadLevel}/10`
          : "--"
      );


      setText(
        "viewFocusDetail",
        log.focusLevel
          ? `${log.focusLevel}/10`
          : "--"
      );


      populateEditForm(
        log
      );


      dayView
        .classList
        .remove(
          "hidden"
        );
    }


    selectedDate
      .addEventListener(
        "change",
        function () {

          if (
            !selectedDate.value
          ) {
            hideEverything();
            return;
          }


          if (
            selectedDate.value >
            today
          ) {
            selectedDate.value =
              "";

            hideEverything();

            message.textContent =
              "Future dates belong in the Brain Calendar.";

            message
              .classList
              .add(
                "error"
              );

            return;
          }


          renderDay(
            selectedDate.value
          );
        }
      );


    document
      .getElementById(
        "editDayBtn"
      )
      .addEventListener(
        "click",
        function () {

          editDaySection
            .classList
            .remove(
              "hidden"
            );

          editDaySection
            .scrollIntoView({
              behavior:
                "smooth",

              block:
                "start"
            });
        }
      );


    document
      .getElementById(
        "cancelEditBtn"
      )
      .addEventListener(
        "click",
        function () {

          editDaySection
            .classList
            .add(
              "hidden"
            );
        }
      );


    document
      .getElementById(
        "previousDayForm"
      )
      .addEventListener(
        "submit",
        function (event) {

          event.preventDefault();


          const date =
            selectedDate.value;


          if (!date) {
            message.textContent =
              "Please select a date.";

            message
              .classList
              .add(
                "error"
              );

            return;
          }


          const updated =
            getCurrentUserObject();


          updated.dailyLogs =
            updated.dailyLogs || {};


          const log = {

            sleepTime:
              document
                .getElementById(
                  "sleepTime"
                )
                .value,


            wakeTime:
              document
                .getElementById(
                  "wakeTime"
                )
                .value,


            sleepQuality:
              Number(
                document
                  .getElementById(
                    "sleepQuality"
                  )
                  .value
              ),


            stressLevel:
              Number(
                document
                  .getElementById(
                    "stressLevel"
                  )
                  .value
              ),


            energyLevel:
              Number(
                document
                  .getElementById(
                    "energyLevel"
                  )
                  .value
              ),


            workloadLevel:
              Number(
                document
                  .getElementById(
                    "workloadLevel"
                  )
                  .value
              ),


            focusLevel:
              Number(
                document
                  .getElementById(
                    "focusLevel"
                  )
                  .value
              )
          };


          const scores =
            calculateScores(
              updated.profile,
              log
            );


          updated.dailyLogs[
            date
          ] = {
            ...log,

            scores,

            updatedAt:
              new Date()
                .toISOString()
          };


          updateUser(
            updated
          );


          message.textContent =
            "Changes saved.";

          message
            .classList
            .remove(
              "error"
            );


          editDaySection
            .classList
            .add(
              "hidden"
            );


          renderDay(
            date
          );
        }
      );


    document
      .getElementById(
        "backDashboardBtn"
      )
      .addEventListener(
        "click",
        function () {

          localStorage.setItem(
            "neurovia_return_tab",
            "home"
          );

          window.location.href =
            "dashboard.html";
        }
      );

  }
);