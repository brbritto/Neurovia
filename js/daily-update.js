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


    const form =
      document.getElementById(
        "dailyUpdateForm"
      );


    function numberValue(
      id
    ) {

      return Number(
        document
          .getElementById(
            id
          )
          .value
      );

    }


    form.addEventListener(
      "submit",
      function (event) {

        event.preventDefault();


        const updated =
          getCurrentUserObject();


        /*
          Everything below represents
          something that actually
          happened on this day.
        */


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


        /*
          The scoring engine uses
          the user's Baseline context
          plus today's signals.
        */


        const scores =
          calculateScores(
            updated.profile,
            log
          );


        const today =
          todayKey();


        updated.dailyLogs =
          updated.dailyLogs ||
          {};


        const previous =
          updated.dailyLogs[
            today
          ];


        updated.dailyLogs[
          today
        ] = {

          ...log,

          scores,


          /*
            Preserve original creation
            time when today's check-in
            is edited/replaced.
          */


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