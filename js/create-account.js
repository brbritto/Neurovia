document.addEventListener(
  "DOMContentLoaded",
  function () {

    const form =
      document.getElementById(
        "createForm"
      );

    form.addEventListener(
      "submit",
      function (event) {

        event.preventDefault();

        const msg =
          document.getElementById(
            "createMessage"
          );

        msg.textContent = "";
        msg.classList.remove("error");


        const name =
          document
            .getElementById("name")
            .value
            .trim();


        const email =
          document
            .getElementById("email")
            .value
            .trim();


        const password =
          document
            .getElementById("password")
            .value
            .trim();


        const confirmPassword =
          document
            .getElementById(
              "confirmPassword"
            )
            .value
            .trim();


        const mainConcern =
          document
            .getElementById(
              "mainConcern"
            )
            .value;


        if (
          !name ||
          !email ||
          !password ||
          !confirmPassword
        ) {

          msg.textContent =
            "Please fill in all fields.";

          msg.classList.add(
            "error"
          );

          return;
        }


        if (
          password !==
          confirmPassword
        ) {

          msg.textContent =
            "Passwords do not match.";

          msg.classList.add(
            "error"
          );

          return;
        }


        if (
          findUserByEmail(
            email
          )
        ) {

          msg.textContent =
            "This email is already registered.";

          msg.classList.add(
            "error"
          );

          return;
        }


        const users =
          getUsers();


        users.push({

          id:
            "user_" +
            Date.now(),

          name,
          email,
          password,
          mainConcern,

          onboardingCompleted:
            false,

          profile: {},

          onboardingAnswers: {},

          baseline: null,

          baselineHistory: [],

          dailyLogs: {},

          weeklyCheckins: [],

          brainCalendar: [],

          brainJournal: []

        });


        saveUsers(
          users
        );


        saveCurrentUser(
          email
        );


        window.location.href =
          "onboarding.html";

      }
    );

  }
);