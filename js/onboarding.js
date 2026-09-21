document.addEventListener(
  "DOMContentLoaded",
  function () {

    const user =
      getCurrentUserObject();


    if (!user) {

      window.location.href =
        "index.html";

      return;
    }


    const isRetake =
      sessionStorage.getItem(
        "neurovia_retake_baseline"
      ) ===
      "true";


    /*
      Completed users normally
      should not enter onboarding.

      Exception:
      explicit baseline retake.
    */

    if (
      user.onboardingCompleted &&
      !isRetake
    ) {

      window.location.href =
        "dashboard.html";

      return;
    }


    let currentQuestionIndex =
      0;


    /*
      On a baseline retake,
      prefill previous answers.

      On first onboarding,
      start empty.
    */

    const answers =
      isRetake
        ? {
            ...(
              user.onboardingAnswers ||
              {}
            )
          }
        : {};


    const progressDots =
      document.getElementById(
        "progressDots"
      );


    const progressLabel =
      document.getElementById(
        "progressLabel"
      );


    const questionTitle =
      document.getElementById(
        "questionTitle"
      );


    const questionInputArea =
      document.getElementById(
        "questionInputArea"
      );


    const onboardingMessage =
      document.getElementById(
        "onboardingMessage"
      );


    const backBtn =
      document.getElementById(
        "backBtn"
      );


    const nextBtn =
      document.getElementById(
        "nextBtn"
      );


    function renderProgressDots() {

      progressDots.innerHTML =
        "";


      QUESTIONS.forEach(
        (
          _,
          index
        ) => {

          const dot =
            document.createElement(
              "div"
            );


          dot.className =
            "progress-dot" +
            (
              index <=
              currentQuestionIndex
                ? " active"
                : ""
            );


          progressDots
            .appendChild(
              dot
            );

        }
      );
    }


    function renderQuestion() {

      const q =
        QUESTIONS[
          currentQuestionIndex
        ];


      questionTitle.textContent =
        q.question;


      progressLabel.textContent =
        isRetake
          ? `Baseline update · Question ${currentQuestionIndex + 1} of ${QUESTIONS.length}`
          : `Question ${currentQuestionIndex + 1} of ${QUESTIONS.length}`;


      onboardingMessage.textContent =
        "";


      onboardingMessage
        .classList
        .remove(
          "error"
        );


      renderProgressDots();


      questionInputArea.innerHTML =
        "";


      if (
        q.type ===
          "number" ||
        q.type ===
          "time" ||
        q.type ===
          "text"
      ) {

        const row =
          document.createElement(
            "div"
          );


        row.className =
          "input-row";


        row.innerHTML = `

          <div class="input-box">

            <i
              class="mdi mdi-pencil-outline"
            ></i>

            <input
              id="dynamicInput"
              type="${q.type}"
              placeholder="${q.placeholder || ""}"
              value="${answers[q.id] || ""}"
            >

          </div>
        `;


        questionInputArea
          .appendChild(
            row
          );
      }


      else if (
        q.type ===
        "options"
      ) {

        const list =
          document.createElement(
            "div"
          );


        list.className =
          "options-list";


        q.options.forEach(
          option => {

            const btn =
              document.createElement(
                "button"
              );


            btn.type =
              "button";


            btn.className =
              "option-btn" +
              (
                answers[q.id] ===
                option
                  ? " selected"
                  : ""
              );


            btn.textContent =
              option;


            btn.addEventListener(
              "click",
              function () {

                answers[q.id] =
                  option;


                renderQuestion();
              }
            );


            list.appendChild(
              btn
            );

          }
        );


        questionInputArea
          .appendChild(
            list
          );
      }


      backBtn.style.visibility =
        currentQuestionIndex ===
        0
          ? "hidden"
          : "visible";


      nextBtn.textContent =
        currentQuestionIndex ===
        QUESTIONS.length - 1

          ? (
              isRetake
                ? "Save New Baseline"
                : "Finish Baseline"
            )

          : "Next";
    }


    function saveCurrentAnswer() {

      const q =
        QUESTIONS[
          currentQuestionIndex
        ];


      if (
        q.type ===
          "number" ||
        q.type ===
          "time" ||
        q.type ===
          "text"
      ) {

        const input =
          document.getElementById(
            "dynamicInput"
          );


        const value =
          input.value.trim();


        if (!value) {

          onboardingMessage.textContent =
            "Please answer before continuing.";


          onboardingMessage
            .classList
            .add(
              "error"
            );


          return false;
        }


        answers[q.id] =
          value;


        return true;
      }


      if (
        q.type ===
        "options"
      ) {

        if (
          !answers[
            q.id
          ]
        ) {

          onboardingMessage.textContent =
            "Please select an option before continuing.";


          onboardingMessage
            .classList
            .add(
              "error"
            );


          return false;
        }


        return true;
      }


      return false;
    }


    backBtn.addEventListener(
      "click",
      function () {

        if (
          currentQuestionIndex >
          0
        ) {

          currentQuestionIndex--;


          renderQuestion();
        }
      }
    );


    nextBtn.addEventListener(
      "click",
      function () {

        if (
          !saveCurrentAnswer()
        ) {

          return;
        }


        if (
          currentQuestionIndex <
          QUESTIONS.length - 1
        ) {

          currentQuestionIndex++;


          renderQuestion();


          return;
        }


        const updatedUser =
          getCurrentUserObject();


        const profile = {};


        STATIC_FIELDS.forEach(
          key => {

            profile[
              key
            ] =
              answers[
                key
              ];

          }
        );


        const baselineScores =
          calculateBaselineScores(
            profile,
            answers
          );


        updatedUser.profile =
          profile;


        updatedUser.onboardingAnswers = {
          ...answers
        };


        updatedUser.baseline = {

          answers: {
            ...answers
          },

          scores:
            baselineScores,

          completedAt:
            new Date()
              .toISOString()

        };


        updatedUser.baselineHistory =
          updatedUser.baselineHistory ||
          [];


        updatedUser
          .baselineHistory
          .push({

            date:
              todayKey(),

            scores:
              baselineScores,

            completedAt:
              new Date()
                .toISOString()

          });


        updatedUser.dailyLogs =
          updatedUser.dailyLogs ||
          {};


        updatedUser.brainCalendar =
          updatedUser.brainCalendar ||
          [];


        updatedUser.brainJournal =
          updatedUser.brainJournal ||
          [];


        updatedUser.weeklyCheckins =
          updatedUser.weeklyCheckins ||
          [];


        updatedUser.onboardingCompleted =
          true;


        updateUser(
          updatedUser
        );


        /*
          Remove retake mode after
          successful completion.
        */

        sessionStorage.removeItem(
          "neurovia_retake_baseline"
        );


        /*
          First baseline:
          go to first Daily Check-In.

          Baseline retake:
          return to dashboard because
          daily history already exists.
        */

        if (
          isRetake
        ) {

          window.location.href =
            "dashboard.html";

        }

        else {

          window.location.href =
            "daily-update.html";

        }

      }
    );


    renderQuestion();

  }
);