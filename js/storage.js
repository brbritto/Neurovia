const STORAGE_KEY =
  "neurovia_users";

const CURRENT_USER_KEY =
  "neurovia_current_user";


function getUsers() {

  const raw =
    localStorage.getItem(
      STORAGE_KEY
    );

  return raw
    ? JSON.parse(raw)
    : [];
}


function saveUsers(users) {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(users)
  );
}


function findUserByEmail(email) {

  return getUsers().find(
    user =>
      user.email.toLowerCase() ===
      email.toLowerCase()
  );
}


function saveCurrentUser(email) {

  localStorage.setItem(
    CURRENT_USER_KEY,
    email
  );
}


function getCurrentUserEmail() {

  return localStorage.getItem(
    CURRENT_USER_KEY
  );
}


function logoutUser() {

  localStorage.removeItem(
    CURRENT_USER_KEY
  );
}


function getCurrentUserObject() {

  const email =
    getCurrentUserEmail();

  if (!email) {
    return null;
  }

  return findUserByEmail(
    email
  );
}


function updateUser(updatedUser) {

  const users =
    getUsers();

  const index =
    users.findIndex(
      user =>
        user.email.toLowerCase() ===
        updatedUser.email.toLowerCase()
    );

  if (index !== -1) {

    users[index] =
      updatedUser;

    saveUsers(
      users
    );
  }
}


/*
  =========================
  LOCAL DATE HELPERS
  =========================

  Neurovia is a day-based app.

  We deliberately avoid:
  new Date().toISOString().slice(0, 10)

  because toISOString() uses UTC and
  can produce the wrong calendar day
  depending on the user's timezone.
*/


function localDateKey(date = new Date()) {

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  return (
    `${year}-${month}-${day}`
  );
}


function todayKey() {

  return localDateKey(
    new Date()
  );
}


function dateOffsetKey(daysAgo) {

  const date =
    new Date();

  date.setHours(
    12,
    0,
    0,
    0
  );

  date.setDate(
    date.getDate() -
    daysAgo
  );

  return localDateKey(
    date
  );
}


function getLast7Dates() {

  const dates = [];

  for (
    let i = 6;
    i >= 0;
    i--
  ) {

    dates.push(
      dateOffsetKey(i)
    );
  }

  return dates;
}


/*
  Creates a local Date object
  from YYYY-MM-DD without UTC
  timezone conversion.
*/

function dateFromKey(key) {

  if (!key) {
    return null;
  }

  const [
    year,
    month,
    day
  ] =
    key
      .split("-")
      .map(Number);

  return new Date(
    year,
    month - 1,
    day,
    12,
    0,
    0,
    0
  );
}