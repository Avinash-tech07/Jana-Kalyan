/* =========================================================================
   JANA KALYAN — AUTH LOGIC (login.html)
   -------------------------------------------------------------------------
   Supports two sign-in methods:
     1. Google (OAuth) — button is wired for Google Identity Services.
     2. Phone number + password — posted to your backend.

   HOW THIS TALKS TO A REAL BACKEND
   ---------------------------------------------------------------------
   All calls go through JK.api() below. Point API_BASE_URL at your live
   server (e.g. a Spring Boot / Node service backed by the SQL schema in
   backend/sql/schema.sql) and every call in this file will hit real
   endpoints and store real accounts.

   If API_BASE_URL is unreachable (e.g. you are just previewing the
   static files with no server running), this file automatically falls
   back to localStorage so you can still click through every screen.
   Remove FALLBACK_TO_LOCAL_STORAGE once your backend is live.
   ========================================================================= */

const API_BASE_URL = "/api"; // <-- point this at your deployed backend
const FALLBACK_TO_LOCAL_STORAGE = true;

/** Generic fetch wrapper with graceful local fallback. */
JK.api = async function (path, options) {
  try {
    const res = await fetch(API_BASE_URL + path, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!res.ok) throw new Error("Request failed: " + res.status);
    return await res.json();
  } catch (err) {
    if (!FALLBACK_TO_LOCAL_STORAGE) throw err;
    console.warn("[JanaKalyan] Backend not reachable, using local demo store for:", path);
    return JK.localFallback(path, options);
  }
};

/* -------------------------------------------------------------------------
   LOCAL DEMO STORE (used only when the real backend isn't running)
   Mirrors the shape of what the real API returns so swapping is painless.
   ----------------------------------------------------------------------- */
JK.localFallback = function (path, options) {
  const body = options && options.body ? JSON.parse(options.body) : {};
  const members = JSON.parse(localStorage.getItem("jk_members") || "[]");

  if (path === "/auth/signup") {
    const exists = members.some(
      (m) => m.email === body.email || (body.phone && m.phone === body.phone)
    );
    if (exists) return { success: false, message: "An account already exists with these details." };

    const newMember = {
      id: "JK" + Date.now().toString().slice(-8),
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      password: body.password || null, // demo only — never store plain-text passwords in production
      provider: body.provider || "phone",
      role: "member",
      photo: null,
      nomineeName: "",
      nomineeId: "",
      balance: 0,
      createdAt: new Date().toISOString(),
      transactions: [],
    };
    members.push(newMember);
    localStorage.setItem("jk_members", JSON.stringify(members));
    return { success: true, member: newMember };
  }

  if (path === "/auth/login") {
    // Hard-coded demo admin so the Admin dashboard can be reached without a backend.
    if (body.identifier === "admin" && body.password === "admin123") {
      return { success: true, member: { id: "ADMIN01", name: "Society Admin", role: "admin" } };
    }
    const member = members.find(
      (m) =>
        (m.email === body.identifier || m.phone === body.identifier) &&
        m.password === body.password
    );
    if (!member) return { success: false, message: "Invalid credentials. Please try again." };
    return { success: true, member };
  }

  if (path === "/auth/google") {
    // In production this exchanges a Google ID token for a session server-side.
    let member = members.find((m) => m.email === body.email);
    if (!member) {
      member = {
        id: "JK" + Date.now().toString().slice(-8),
        name: body.name,
        email: body.email,
        phone: null,
        provider: "google",
        role: "member",
        photo: body.photo || null,
        nomineeName: "",
        nomineeId: "",
        balance: 0,
        createdAt: new Date().toISOString(),
        transactions: [],
      };
      members.push(member);
      localStorage.setItem("jk_members", JSON.stringify(members));
    }
    return { success: true, member };
  }

  return { success: false, message: "Unknown endpoint." };
};

/* -------------------------------------------------------------------------
   UI WIRING
   ----------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", function () {
  /* Tabs: Login / Sign up */
  const tabButtons = document.querySelectorAll(".tab-btn");
  const panels = document.querySelectorAll(".auth-panel");
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabButtons.forEach((b) => b.classList.remove("active"));
      panels.forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.target).classList.add("active");
    });
  });

  /* Method toggle: Email / Phone (per form) */
  document.querySelectorAll(".method-toggle").forEach((toggle) => {
    const buttons = toggle.querySelectorAll("button");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        buttons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const form = toggle.closest("form");
        form.querySelectorAll("[data-method-field]").forEach((field) => {
          field.style.display = field.dataset.methodField === btn.dataset.method ? "block" : "none";
        });
        form.dataset.activeMethod = btn.dataset.method;
      });
    });
  });

  /* ---- LOGIN FORM ---- */
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const msg = document.getElementById("login-msg");
      const identifier = loginForm.identifier.value.trim();
      const password = loginForm.password.value;

      const result = await JK.api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password }),
      });

      showAuthMessage(msg, result.success, result.success ? "Login successful. Redirecting…" : result.message);

      if (result.success) {
        localStorage.setItem(
          "jk_session",
          JSON.stringify({ id: result.member.id, name: result.member.name, role: result.member.role })
        );
        setTimeout(() => {
          window.location.href = result.member.role === "admin" ? "admin.html" : "dashboard.html";
        }, 700);
      }
    });
  }

  /* ---- SIGNUP FORM ---- */
  const signupForm = document.getElementById("signup-form");
  if (signupForm) {
    signupForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const msg = document.getElementById("signup-msg");
      const method = signupForm.dataset.activeMethod || "email";

      if (signupForm.password.value !== signupForm.confirmPassword.value) {
        showAuthMessage(msg, false, "Passwords do not match.");
        return;
      }

      const payload = {
        name: signupForm.name.value.trim(),
        password: signupForm.password.value,
        provider: method,
      };
      if (method === "email") payload.email = signupForm.email.value.trim();
      if (method === "phone") payload.phone = signupForm.phone.value.trim();

      const result = await JK.api("/auth/signup", { method: "POST", body: JSON.stringify(payload) });
      showAuthMessage(msg, result.success, result.success ? "Account created! You can log in now." : result.message);

      if (result.success) {
        signupForm.reset();
        setTimeout(() => document.querySelector('.tab-btn[data-target="panel-login"]').click(), 900);
      }
    });
  }

  /* ---- GOOGLE SIGN-IN (demo) ----
     Real integration: load the Google Identity Services script, initialize
     with your OAuth client ID, and send the returned ID token to
     `${API_BASE_URL}/auth/google` for server-side verification. */
  document.querySelectorAll(".google-btn").forEach((btn) => {
    btn.addEventListener("click", async function () {
      const demoEmail = prompt("Demo mode: enter the Gmail address to continue with Google");
      if (!demoEmail) return;
      const result = await JK.api("/auth/google", {
        method: "POST",
        body: JSON.stringify({ email: demoEmail, name: demoEmail.split("@")[0] }),
      });
      if (result.success) {
        localStorage.setItem(
          "jk_session",
          JSON.stringify({ id: result.member.id, name: result.member.name, role: result.member.role })
        );
        window.location.href = "dashboard.html";
      }
    });
  });

  function showAuthMessage(el, success, text) {
    if (!el) return;
    el.textContent = text;
    el.classList.remove("success", "error");
    el.classList.add("show", success ? "success" : "error");
  }
});
