const API_BASE = "http://localhost:3000/api";

const form = document.getElementById("loginForm");
const btn = document.getElementById("loginBtn");
const errorBox = document.getElementById("errorMsg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  error("");

  const username = usernameField().value.trim();
  const password = passwordField().value;

  if (!username || !password) {
    return error("Username and password are required");
  }

  btn.disabled = true;
  btn.textContent = "Signing in...";

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    location.href = "admin.html";

  } catch (err) {
    error(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Sign In";
  }
});

function error(msg) {
  if (!msg) {
    errorBox.style.display = "none";
    return;
  }
  errorBox.textContent = msg;
  errorBox.style.display = "block";
}

function usernameField() {
  return document.getElementById("username");
}
function passwordField() {
  return document.getElementById("password");
}

/* Password toggle */
document.getElementById("togglePassword").onclick = () => {
  const p = passwordField();
  p.type = p.type === "password" ? "text" : "password";
};

/* Auto redirect if logged in */
const token = localStorage.getItem("token");
if (token) {
  fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => {
    if (r.ok) location.href = "admin.html";
    else localStorage.clear();
  });
}
