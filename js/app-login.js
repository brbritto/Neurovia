document.addEventListener("DOMContentLoaded", function () {
  const current = getCurrentUserObject();
  if (current) {
    window.location.href = current.onboardingCompleted ? "dashboard.html" : "onboarding.html";
    return;
  }

  document.getElementById("createAccountBtn").addEventListener("click", function () {
    window.location.href = "create-account.html";
  });

  document.getElementById("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const msg = document.getElementById("loginMessage");
    msg.classList.remove("error");

    const user = findUserByEmail(email);
    if (!user) {
      msg.textContent = "Account not found.";
      msg.classList.add("error");
      return;
    }

    if (user.password !== password) {
      msg.textContent = "Incorrect password.";
      msg.classList.add("error");
      return;
    }

    saveCurrentUser(user.email);
    window.location.href = user.onboardingCompleted ? "dashboard.html" : "onboarding.html";
  });
});