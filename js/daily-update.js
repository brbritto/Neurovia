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


    form.addEventListener(
      "submit",
      function (event) {

        event.preventDefault();


        const updated =
          getCurrentUserObject();


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


        const today =
          todayKey();


        updated.dailyLogs =
          updated.dailyLogs ||
          {};


        updated.dailyLogs[
          today
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