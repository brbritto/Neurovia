const QUESTIONS = [

  {
    id: "age",
    question: "How old are you?",
    type: "number",
    placeholder: "Enter your age",
    static: true
  },

  {
    id: "country",
    question: "Which country do you live in?",
    type: "text",
    placeholder: "Enter your country",
    static: true
  },

  {
    id: "sleepTime",
    question: "What time do you usually go to sleep?",
    type: "time",
    static: false
  },

  {
    id: "wakeTime",
    question: "What time do you usually wake up?",
    type: "time",
    static: false
  },

  {
    id: "fallAsleepDifficulty",
    question: "How often do you usually have difficulty falling asleep?",
    type: "options",
    static: false,
    options: [
      "Never",
      "Rarely",
      "Sometimes",
      "Often",
      "Always"
    ]
  },

  {
    id: "mentalDemandHours",
    question: "How many hours of mentally demanding work or study do you usually have per day?",
    type: "options",
    static: false,
    options: [
      "Less than 1 hour",
      "1 to 2 hours",
      "3 to 4 hours",
      "5 to 6 hours",
      "More than 6 hours"
    ]
  }

];


const STATIC_FIELDS =
  QUESTIONS
    .filter(
      question =>
        question.static
    )
    .map(
      question =>
        question.id
    );


const BASELINE_ROUTINE_FIELDS =
  QUESTIONS
    .filter(
      question =>
        !question.static
    )
    .map(
      question =>
        question.id
    );