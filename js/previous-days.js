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


    const missingDayView =
      document.getElementById(
        "missingDayView"
      );


    const editDaySection =
      document.getElementById(
        "editDaySection"
      );


    const today =
      todayKey();


    selectedDate.max =
      today;


    let creatingMissingDay =
      false;


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


      if (!element) {
        return;
      }


      element.value =
        value ??
        "";

    }


    function clearForm() {

      [
        "sleepTime",
        "wakeTime",
        "sleepQuality",
        "restedLevel",
        "screenBeforeSleep",
        "stressLevel",
        "energyLevel",
        "workloadLevel",
        "distractionLevel",
        "breaksLevel",
        "focusLevel"
      ]
        .forEach(
          id => {

            setValue(
              id,
              ""
            );

          }
        );

    }


    function hideViews() {

      dayView
        .classList
        .add(
          "hidden"
        );


      missingDayView
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

      clearForm();


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


      /*
        Old logs may not have
        these new fields yet.

        We deliberately leave
        them empty instead of
        inventing historical data.
      */


      setValue(
        "restedLevel",
        log.restedLevel
      );


      setValue(
        "screenBeforeSleep",
        log.screenBeforeSleep
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
        "distractionLevel",
        log.distractionLevel
      );


      setValue(
        "breaksLevel",
        log.breaksLevel
      );


      setValue(
        "focusLevel",
        log.focusLevel
      );

    }


    function showMissingDay(
      date
    ) {

      creatingMissingDay =
        true;


      hideViews();


      setText(
        "missingDateTitle",
        `No check-in for ${formatDateKey(date)}`
      );


      missingDayView
        .classList
        .remove(
          "hidden"
        );

    }


    function renderExistingDay(
      date,
      log
    ) {

      creatingMissingDay =
        false;


      hideViews();


      const scores =
        log.scores ||
        {};


      const readiness =
        Number(
          scores.brainReadiness ??
          scores.overall ??
          0
        );


      const sleepHours =
        Number(
          scores.sleepHours ??
          calculateSleepHours(
            log.sleepTime,
            log.wakeTime
          )
        );


      setText(
        "viewDate",
        formatDateKey(
          date
        )
      );


      setText(
        "readinessNumber",
        Math.round(
          readiness
        )
      );


      const readinessBar =
        document.getElementById(
          "readinessBar"
        );


      if (
        readinessBar
      ) {

        readinessBar.style.width =
          `${Math.max(
            0,
            Math.min(
              100,
              readiness
            )
          )}%`;

      }


      setText(
        "viewRecovery",
        Math.round(
          Number(
            scores.recovery ||
            0
          )
        )
      );


      setText(
        "viewCognitiveLoad",
        Math.round(
          Number(
            scores.cognitiveLoad ||
            0
          )
        )
      );


      setText(
        "viewFocus",
        `${log.focusLevel ?? "--"}/10`
      );


      setText(
        "viewSleep",
        Number.isFinite(
          sleepHours
        )
          ? `${sleepHours.toFixed(1)}h`
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
        "viewSleepHours",
        Number.isFinite(
          sleepHours
        )
          ? `${sleepHours.toFixed(1)} hours`
          : "--"
      );


      setText(
        "viewSleepQuality",
        log.sleepQuality !== undefined
          ? `${log.sleepQuality}/10`
          : "--"
      );


      setText(
        "viewRested",
        log.restedLevel !== undefined
          ? `${log.restedLevel}/10`
          : "Not recorded"
      );


      setText(
        "viewScreenBeforeSleep",
        log.screenBeforeSleep ||
        "Not recorded"
      );


      setText(
        "viewStress",
        log.stressLevel !== undefined
          ? `${log.stressLevel}/10`
          : "--"
      );


      setText(
        "viewEnergy",
        log.energyLevel !== undefined
          ? `${log.energyLevel}/10`
          : "--"
      );


      setText(
        "viewWorkload",
        log.workloadLevel !== undefined
          ? `${log.workloadLevel}/10`
          : "--"
      );


      setText(
        "viewDistraction",
        log.distractionLevel !== undefined
          ? `${log.distractionLevel}/5`
          : "Not recorded"
      );


      setText(
        "viewBreaks",
        log.breaksLevel ||
        "Not recorded"
      );


      setText(
        "viewFocusDetail",
        log.focusLevel !== undefined
          ? `${log.focusLevel}/10`
          : "--"
      );


      dayView
        .classList
        .remove(
          "hidden"
        );

    }


    function renderSelectedDay() {

      message.textContent =
        "";


      hideViews();


      const date =
        selectedDate.value;


      if (!date) {
        return;
      }


      if (
        date >
        today
      ) {

        message.textContent =
          "Future days cannot be edited.";

        selectedDate.value =
          "";

        return;

      }


      user =
        getCurrentUserObject();


      const log =
        user.dailyLogs?.[
          date
        ];


      if (!log) {

        showMissingDay(
          date
        );

        return;

      }


      renderExistingDay(
        date,
        log
      );

    }


    function openCreateForm() {

      const date =
        selectedDate.value;


      if (!date) {
        return;
      }


      creatingMissingDay =
        true;


      clearForm();


      hideViews();


      setText(
        "formModeLabel",
        "ADD CHECK-IN"
      );


      setText(
        "formTitle",
        formatDateKey(
          date
        )
      );


      setText(
        "formSubtitle",
        "Add the information you remember for this day."
      );


      editDaySection
        .classList
        .remove(
          "hidden"
        );

    }


    function openEditForm() {

      const date =
        selectedDate.value;


      if (!date) {
        return;
      }


      user =
        getCurrentUserObject();


      const log =
        user.dailyLogs?.[
          date
        ];


      if (!log) {

        openCreateForm();

        return;

      }


      creatingMissingDay =
        false;


      populateEditForm(
        log
      );


      hideViews();


      setText(
        "formModeLabel",
        "EDIT CHECK-IN"
      );


      setText(
        "formTitle",
        formatDateKey(
          date
        )
      );


      setText(
        "formSubtitle",
        "Update the information recorded for this day."
      );


      editDaySection
        .classList
        .remove(
          "hidden"
        );

    }


    selectedDate.addEventListener(
      "change",
      renderSelectedDay
    );


    document
      .getElementById(
        "addMissingDayBtn"
      )
      .addEventListener(
        "click",
        openCreateForm
      );


    document
      .getElementById(
        "editDayBtn"
      )
      .addEventListener(
        "click",
        openEditForm
      );


    document
      .getElementById(
        "cancelEditBtn"
      )
      .addEventListener(
        "click",
        function () {

          renderSelectedDay();

        }
      );


    document
      .getElementById(
        "previousDayForm"
      )
      .addEventListener(
        "submit",
        function (
          event
        ) {

          event.preventDefault();


          const date =
            selectedDate.value;


          if (
            !date ||
            date > today
          ) {
            return;
          }


          const updated =
            getCurrentUserObject();


          updated.dailyLogs =
            updated.dailyLogs ||
            {};


          const previous =
            updated.dailyLogs[
              date
            ];


          const numberValue =
            id =>
              Number(
                document
                  .getElementById(
                    id
                  )
                  .value
              );


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
              numberValue(
                "sleepQuality"
              ),


            restedLevel:
              numberValue(
                "restedLevel"
              ),


            screenBeforeSleep:
              document
                .getElementById(
                  "screenBeforeSleep"
                )
                .value,


            stressLevel:
              numberValue(
                "stressLevel"
              ),


            energyLevel:
              numberValue(
                "energyLevel"
              ),


            workloadLevel:
              numberValue(
                "workloadLevel"
              ),


            distractionLevel:
              numberValue(
                "distractionLevel"
              ),


            breaksLevel:
              document
                .getElementById(
                  "breaksLevel"
                )
                .value,


            focusLevel:
              numberValue(
                "focusLevel"
              )

          };


          log.scores =
            calculateScores(
              updated.profile,
              log
            );


          updated.dailyLogs[
            date
          ] = {

            ...log,

            createdAt:
              previous?.createdAt ||
              new Date()
                .toISOString(),

            updatedAt:
              new Date()
                .toISOString()

          };


          updateUser(
            updated
          );


          user =
            getCurrentUserObject();


          creatingMissingDay =
            false;


          renderSelectedDay();

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


    hideViews();

  }
);