const STORAGE_KEY = "neurovia_users";
const CURRENT_USER_KEY = "neurovia_current_user";

function getUsers() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function findUserByEmail(email) {
  return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
}

function saveCurrentUser(email) {
  localStorage.setItem(CURRENT_USER_KEY, email);
}

function getCurrentUserEmail() {
  return localStorage.getItem(CURRENT_USER_KEY);
}

function logoutUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

function getCurrentUserObject() {
  const email = getCurrentUserEmail();
  if (!email) return null;
  return findUserByEmail(email);
}

function updateUser(updatedUser) {
  const users = getUsers();
  const index = users.findIndex(u => u.email.toLowerCase() === updatedUser.email.toLowerCase());
  if (index !== -1) {
    users[index] = updatedUser;
    saveUsers(users);
  }
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function dateOffsetKey(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function getLast7Dates() {
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    dates.push(dateOffsetKey(i));
  }
  return dates;
}