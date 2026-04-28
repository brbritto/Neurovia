const QUESTIONS = [
  { id: "age", question: "How old are you?", type: "number", placeholder: "Enter your age", static: true },
  { id: "sex", question: "What is your biological sex?", type: "options", static: true, options: ["Female", "Male", "Prefer not to say"] },
  { id: "country", question: "Which country do you live in?", type: "text", placeholder: "Enter your country", static: true },
  { id: "weight", question: "What is your approximate weight in kg?", type: "number", placeholder: "Enter your weight in kg", static: true },
  { id: "height", question: "What is your approximate height in cm?", type: "number", placeholder: "Enter your height in cm", static: true },

  { id: "sleepTime", question: "What time do you usually go to sleep?", type: "time", static: false },
  { id: "wakeTime", question: "What time do you usually wake up?", type: "time", static: false },
  { id: "rested", question: "How rested do you usually feel when you wake up?", type: "options", static: false, options: ["Never", "Rarely", "Sometimes", "Often", "Always"] },
  { id: "stressLevel", question: "How would you rate your stress level this week? (1 to 10)", type: "options", static: false, options: ["1","2","3","4","5","6","7","8","9","10"] },
  { id: "studyEnvironment", question: "How would you describe your study environment?", type: "options", static: false, options: ["Very quiet and comfortable", "Mostly quiet with good lighting", "Moderately distracting", "Noisy or poorly lit", "Very distracting"] },
  { id: "screenUseBeforeSleep", question: "How much screen time do you have before going to sleep?", type: "options", static: false, options: ["Less than 1 hour", "1 to 2 hours", "2 to 3 hours", "More than 3 hours"] },
  { id: "exerciseFrequency", question: "How often do you exercise?", type: "options", static: false, options: ["Never", "1 time per week", "2 to 3 times per week", "4 to 5 times per week", "Daily"] },
  { id: "breakfastHabits", question: "How would you describe your breakfast habits?", type: "options", static: false, options: ["I never eat breakfast", "I rarely eat breakfast", "I eat breakfast sometimes", "I usually eat breakfast", "I always eat breakfast"] },
  { id: "waterIntake", question: "How much water do you usually drink per day?", type: "options", static: false, options: ["Less than 1 liter", "1 to 2 liters", "2 to 3 liters", "More than 3 liters"] },
  { id: "studyHours", question: "How many hours do you study per day on average?", type: "options", static: false, options: ["Less than 1 hour", "1 to 2 hours", "3 to 4 hours", "5 to 6 hours", "More than 6 hours"] },
  { id: "studyBreaks", question: "How often do you take breaks while studying?", type: "options", static: false, options: ["Almost never", "Every 2+ hours", "Every 60 to 90 minutes", "Every 30 to 60 minutes", "Very frequently"] },
  { id: "fallAsleepDifficulty", question: "How often do you have difficulty falling asleep?", type: "options", static: false, options: ["Never", "Rarely", "Sometimes", "Often", "Always"] },
  { id: "daytimeFatigue", question: "How often do you feel mentally fatigued during the day?", type: "options", static: false, options: ["Never", "Rarely", "Sometimes", "Often", "Always"] }
];

const STATIC_FIELDS = QUESTIONS.filter(q => q.static).map(q => q.id);
const DAILY_FIELDS = QUESTIONS.filter(q => !q.static).map(q => q.id);
//note: these questions should always start from the user's realcomplaint, not just standart ones