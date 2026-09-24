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


    /*
      false = editing existing log
      true  = creating forgotten log
    */
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
          weekday:
            "long",

          month:
            "long",

          day:
            "numeric",

          year:
            "numeric"
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
          hour:
            "numeric",

          minute:
            "2-digit"
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


    function clearForm() {
      [
        "sleepTime",
        "wakeTime",
        "sleepQuality",
        "stressLevel",
        "energyLevel",
        "workloadLevel",
        "focusLevel"
      ]
        .forEach(
          id => {

            const element =
              document.getElementById(
                id
              );


            if (element) {
              element.value =
                "";
            }

          }
        );
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


      /*
        Example:
        sleep 23:00
        wake 07:00

        Wake time is technically
        "smaller", so add 24h.
      */
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


    function showMissingDay(
      date
    ) {
      creatingMissingDay =
        true;


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


      setText(
        "missingDateTitle",
        `No check-in for ${formatDateKey(
          date
        )}`
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


      const scores =
        log.scores || {};


      const readiness =
        Number(
          scores.brainReadiness ??
          scores.overall
        );


      const calculatedSleep =
        calculateSleepHours(
          log.sleepTime,
          log.wakeTime
        );


      const scoreSleep =
        Number(
          scores.sleepHours
        );


      const sleepHours =
        Number.isFinite(
          scoreSleep
        )
          ? scoreSleep
          : calculatedSleep;


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


      const readinessBar =
        document.getElementById(
          "readinessBar"
        );


      readinessBar.style.width =
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
        Number.isFinite(
          Number(
            scores.recovery
          )
        )
          ? Math.round(
              Number(
                scores.recovery
              )
            )
          : "--"
      );


      setText(
        "viewCognitiveLoad",
        Number.isFinite(
          Number(
            scores.cognitiveLoad
          )
        )
          ? Math.round(
              Number(
                scores.cognitiveLoad
              )
            )
          : "--"
      );


      setText(
        "viewFocus",
        Number.isFinite(
          Number(
            log.focusLevel
          )
        )
          ? `${log.focusLevel}/10`
          : "--"
      );


      setText(
        "viewSleep",
        Number.isFinite(
          Number(
            sleepHours
          )
        )
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
        Number.isFinite(
          Number(
            log.sleepQuality
          )
        )
          ? `${log.sleepQuality}/10`
          : "--"
      );


      setText(
        "viewStress",
        Number.isFinite(
          Number(
            log.stressLevel
          )
        )
          ? `${log.stressLevel}/10`
          : "--"
      );


      setText(
        "viewEnergy",
        Number.isFinite(
          Number(
            log.energyLevel
          )
        )
          ? `${log.energyLevel}/10`
          : "--"
      );


      setText(
        "viewWorkload",
        Number.isFinite(
          Number(
            log.workloadLevel
          )
        )
          ? `${log.workloadLevel}/10`
          : "--"
      );


      setText(
        "viewFocusDetail",
        Number.isFinite(
          Number(
            log.focusLevel
          )
        )
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


    function renderSelectedDay() {
      const date =
        selectedDate.value;


      message.textContent =
        "";

      message
        .classList
        .remove(
          "error"
        );


      hideViews();


      if (!date) {
        return;
      }


      if (
        date > today
      ) {
        selectedDate.value =
          "";


        message.textContent =
          "Future dates belong in the Brain Calendar.";


        message
          .classList
          .add(
            "error"
          );


        return;
      }


      const freshUser =
        getCurrentUserObject();


      const log =
        freshUser.dailyLogs?.[
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


      missingDayView
        .classList
        .add(
          "hidden"
        );


      dayView
        .classList
        .add(
          "hidden"
        );


      setText(
        "formModeLabel",
        "ADD CHECK-IN"
      );


      setText(
        "formTitle",
        `Add ${formatDateKey(
          date
        )}`
      );


      setText(
        "formSubtitle",
        "Complete the signals you remember from this day. The check-in will be saved under the selected date."
      );


      setText(
        "saveDayBtn",
        "Save Check-In"
      );


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


    function openEditForm() {
      const date =
        selectedDate.value;


      if (!date) {
        return;
      }


      const freshUser =
        getCurrentUserObject();


      const log =
        freshUser.dailyLogs?.[
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


      setText(
        "formModeLabel",
        "EDIT CHECK-IN"
      );


      setText(
        "formTitle",
        `Edit ${formatDateKey(
          date
        )}`
      );


      setText(
        "formSubtitle",
        "Update any information that was entered incorrectly for this day."
      );


      setText(
        "saveDayBtn",
        "Save changes"
      );


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


    selectedDate
      .addEventListener(
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

          /*
            Return to whichever state
            this selected date belongs to.
          */
          renderSelectedDay();

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


          if (
            date > today
          ) {
            message.textContent =
              "Future dates belong in the Brain Calendar, not the Daily Check-In.";


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


          const sleepTime =
            document
              .getElementById(
                "sleepTime"
              )
              .value;


          const wakeTime =
            document
              .getElementById(
                "wakeTime"
              )
              .value;


          const sleepQuality =
            Number(
              document
                .getElementById(
                  "sleepQuality"
                )
                .value
            );


          const stressLevel =
            Number(
              document
                .getElementById(
                  "stressLevel"
                )
                .value
            );


          const energyLevel =
            Number(
              document
                .getElementById(
                  "energyLevel"
                )
                .value
            );


          const workloadLevel =
            Number(
              document
                .getElementById(
                  "workloadLevel"
                )
                .value
            );


          const focusLevel =
            Number(
              document
                .getElementById(
                  "focusLevel"
                )
                .value
            );


          const log = {
            sleepTime,
            wakeTime,
            sleepQuality,
            stressLevel,
            energyLevel,
            workloadLevel,
            focusLevel
          };


          /*
            calculateScores uses exactly
            the same scoring logic as the
            normal Daily Check-In.
          */
          const scores =
            calculateScores(
              updated.profile,
              log
            );


          /*
            If there was already a record,
            preserve createdAt if available.

            If this is a forgotten day,
            create a historical record now.
          */
          const previous =
            updated.dailyLogs[
              date
            ];


          updated.dailyLogs[
            date
          ] = {
            ...log,

            scores,

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


          const wasCreating =
            creatingMissingDay;


          creatingMissingDay =
            false;


          /*
            After saving we do NOT send
            the user back to Dashboard.

            Instead, immediately show the
            newly created/edited day.
          */
          renderSelectedDay();


          message.textContent =
            wasCreating
              ? "Check-In added successfully."
              : "Changes saved successfully.";


          message
            .classList
            .remove(
              "error"
            );


          window.scrollTo({
            top: 0,
            behavior:
              "smooth"
          });

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