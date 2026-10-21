/* =========================================================================
   JANA KALYAN — MEMBER DASHBOARD (dashboard.html)
   -------------------------------------------------------------------------
   Naming note (per client spec — do not "fix" these, they are intentional):
     - Panel labelled "Account statement"  ->  shows the FULL transaction
       history (this used to be called "Recent Transaction").
     - Panel labelled "Recent Transaction" ->  shows only the latest
       deposits (this used to be called "Recent deposit").
   ========================================================================= */

document.addEventListener("DOMContentLoaded", async function () {
  const session = JK.requireAuth(false);
  if (!session) return;

  const member = await loadMember(session.id);
  if (!member) return;

  applyQuarterlyInterestIfDue(member);

  renderProfileHeader(member);
  renderStats(member);
  renderAccountStatement(member); // full history
  renderRecentTransaction(member); // latest deposits only
});

/** Fetch the logged-in member's full record (falls back to local demo store). */
async function loadMember(id) {
  const result = await JK.api("/members/" + id, { method: "GET" });
  if (result && result.member) return result.member;

  // local fallback lookup
  const members = JSON.parse(localStorage.getItem("jk_members") || "[]");
  return members.find((m) => m.id === id) || null;
}

function saveMemberLocal(member) {
  const members = JSON.parse(localStorage.getItem("jk_members") || "[]");
  const idx = members.findIndex((m) => m.id === member.id);
  if (idx > -1) {
    members[idx] = member;
    localStorage.setItem("jk_members", JSON.stringify(members));
  }
}

/* -------------------------------------------------------------------------
   QUARTERLY INTEREST — 4% added on 31/03, 30/06, 30/09, 31/12
   Runs client-side for the demo store. In production this must run as a
   scheduled job on the server/database (see backend/java for the OOP
   model) so it applies once per quarter regardless of whether a member
   logs in that day.
   ----------------------------------------------------------------------- */
function applyQuarterlyInterestIfDue(member) {
  const QUARTER_ENDS = ["03-31", "06-30", "09-30", "12-31"];
  const today = new Date();
  const mmdd = String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
  const year = today.getFullYear();

  if (!QUARTER_ENDS.includes(mmdd)) return;

  const alreadyApplied = (member.transactions || []).some(
    (t) => t.type === "interest" && t.quarterKey === `${year}-${mmdd}`
  );
  if (alreadyApplied || !member.balance) return;

  const interest = Math.round(member.balance * 0.04 * 100) / 100;
  member.balance += interest;
  member.transactions = member.transactions || [];
  member.transactions.unshift({
    id: "TXN" + Date.now(),
    type: "interest",
    label: "Quarterly Interest (4%)",
    amount: interest,
    date: today.toISOString(),
    quarterKey: `${year}-${mmdd}`,
  });

  saveMemberLocal(member);
  JK.api("/members/" + member.id + "/interest", {
    method: "POST",
    body: JSON.stringify({ amount: interest, quarterKey: `${year}-${mmdd}` }),
  });
}

/* -------------------------------------------------------------------------
   RENDERING
   ----------------------------------------------------------------------- */
function renderProfileHeader(member) {
  const nameEl = document.getElementById("member-name");
  const idEl = document.getElementById("member-id");
  const photoEl = document.getElementById("member-photo");

  if (nameEl) nameEl.textContent = member.name;
  if (idEl) idEl.textContent = member.id;

  // Show member photo if one exists; otherwise fall back to initials.
  if (photoEl) {
    if (member.photo) {
      photoEl.innerHTML = `<img src="${member.photo}" alt="${member.name}'s photo" />`;
    } else {
      const initials = member.name ? member.name.slice(0, 2).toUpperCase() : "JK";
      photoEl.textContent = initials;
    }
  }
}

function renderStats(member) {
  const balanceEl = document.getElementById("stat-balance");
  const depositsEl = document.getElementById("stat-deposits");
  const memberSinceEl = document.getElementById("stat-since");

  if (balanceEl) balanceEl.textContent = JK.formatCurrency(member.balance || 0);
  if (depositsEl) {
    const totalDeposits = (member.transactions || [])
      .filter((t) => t.type === "deposit")
      .reduce((sum, t) => sum + t.amount, 0);
    depositsEl.textContent = JK.formatCurrency(totalDeposits);
  }
  if (memberSinceEl) memberSinceEl.textContent = JK.formatDate(member.createdAt);
}

/** "Account statement" panel — complete transaction history. */
function renderAccountStatement(member) {
  const tbody = document.getElementById("account-statement-body");
  if (!tbody) return;
  const txns = member.transactions || [];

  if (txns.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4">No transactions yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = txns
    .map(
      (t) => `
      <tr>
        <td>${JK.formatDate(t.date)}</td>
        <td>${t.label}</td>
        <td><span class="badge ${t.type === "interest" ? "badge-accent" : ""}">${t.type}</span></td>
        <td class="${t.type === "withdrawal" ? "amount-debit" : "amount-credit"}">
          ${t.type === "withdrawal" ? "-" : "+"}${JK.formatCurrency(t.amount)}
        </td>
      </tr>`
    )
    .join("");
}

/** "Recent Transaction" panel — latest deposits only (renamed from "Recent deposit"). */
function renderRecentTransaction(member) {
  const tbody = document.getElementById("recent-transaction-body");
  if (!tbody) return;
  const deposits = (member.transactions || []).filter((t) => t.type === "deposit").slice(0, 5);

  if (deposits.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3">No recent deposits.</td></tr>`;
    return;
  }

  tbody.innerHTML = deposits
    .map(
      (t) => `
      <tr>
        <td>${JK.formatDate(t.date)}</td>
        <td>${t.label}</td>
        <td class="amount-credit">+${JK.formatCurrency(t.amount)}</td>
      </tr>`
    )
    .join("");
}

/* -------------------------------------------------------------------------
   DEMO-ONLY: quick "make a deposit" action so the dashboard is testable
   without a backend. Wire the #deposit-form (if present) to your real
   POST /members/:id/deposit endpoint in production.
   ----------------------------------------------------------------------- */
document.addEventListener("submit", async function (e) {
  if (e.target.id !== "deposit-form") return;
  e.preventDefault();
  const session = JK.requireAuth(false);
  const member = await loadMember(session.id);
  const amount = Number(e.target.amount.value);
  if (!amount || amount <= 0) return;

  member.balance = (member.balance || 0) + amount;
  member.transactions = member.transactions || [];
  member.transactions.unshift({
    id: "TXN" + Date.now(),
    type: "deposit",
    label: "Member Deposit",
    amount,
    date: new Date().toISOString(),
  });
  saveMemberLocal(member);
  await JK.api("/members/" + member.id + "/deposit", { method: "POST", body: JSON.stringify({ amount }) });
  window.location.reload();
});
