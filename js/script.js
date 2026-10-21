/* =========================================================================
   JANA KALYAN — SHARED SITE SCRIPT
   -------------------------------------------------------------------------
   Loaded on every page. Handles:
   - Mobile nav toggle (index.html / login.html)
   - Mobile sidebar toggle (dashboard.html / admin.html / loans.html / profile.html)
   - Footer year auto-fill
   - Small helper functions reused by other JS files
   ========================================================================= */

document.addEventListener("DOMContentLoaded", function () {
  /* ---- Public nav (hamburger) ------------------------------------- */
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");
  const navCta = document.querySelector(".nav-cta");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      navLinks.classList.toggle("open");
      if (navCta) navCta.classList.toggle("open");
    });
  }

  /* ---- Dashboard sidebar toggle (mobile) ---------------------------- */
  const sidebarToggle = document.querySelector(".sidebar-toggle");
  const sidebar = document.querySelector(".sidebar");

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener("click", function () {
      sidebar.classList.toggle("open");
    });
  }

  /* ---- Auto-fill copyright year ------------------------------------- */
  document.querySelectorAll(".current-year").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
});

/* ---------------------------------------------------------------------
   Shared helpers (used by auth.js / dashboard.js / loans.js / admin.js)
   These are attached to a single global "JK" namespace so no variable
   names collide between files.
   --------------------------------------------------------------------- */
window.JK = window.JK || {};

/** Format a number as Indian Rupees, e.g. 12000 -> "₹12,000" */
JK.formatCurrency = function (amount) {
  return "₹" + Number(amount).toLocaleString("en-IN");
};

/** Format an ISO date string as DD-MM-YYYY for ledger display */
JK.formatDate = function (isoString) {
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
};

/** Guard a page: redirect to login.html if no session is found.
 *  Call this at the top of dashboard/admin/loans/profile pages. */
JK.requireAuth = function (requireAdmin) {
  const session = JSON.parse(localStorage.getItem("jk_session") || "null");
  if (!session) {
    window.location.href = "login.html";
    return null;
  }
  if (requireAdmin && session.role !== "admin") {
    window.location.href = "dashboard.html";
    return null;
  }
  return session;
};
