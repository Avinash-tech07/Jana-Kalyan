/* =========================================================================
   JANA KALYAN — ADMIN DASHBOARD (admin.html)
   -------------------------------------------------------------------------
   Spec: "The Admin must be able to view each member's deposit and balance."
   ========================================================================= */

document.addEventListener("DOMContentLoaded", async function () {
  const session = JK.requireAuth(true); // must be an admin
  if (!session) return;

  const members = await loadAllMembers();
  renderMemberTable(members);
  renderAdminStats(members);

  const search = document.getElementById("member-search");
  if (search) {
    search.addEventListener("input", () => {
      const q = search.value.trim().toLowerCase();
      const filtered = members.filter(
        (m) => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)
      );
      renderMemberTable(filtered);
    });
  }
});

async function loadAllMembers() {
  const result = await JK.api("/admin/members", { method: "GET" });
  if (result && result.members) return result.members;
  return JSON.parse(localStorage.getItem("jk_members") || "[]");
}

function totalDeposits(member) {
  return (member.transactions || [])
    .filter((t) => t.type === "deposit")
    .reduce((sum, t) => sum + t.amount, 0);
}

function renderAdminStats(members) {
  const totalMembersEl = document.getElementById("stat-total-members");
  const totalBalanceEl = document.getElementById("stat-total-balance");
  const totalDepositsEl = document.getElementById("stat-total-deposits");

  if (totalMembersEl) totalMembersEl.textContent = members.length;
  if (totalBalanceEl) {
    const sum = members.reduce((s, m) => s + (m.balance || 0), 0);
    totalBalanceEl.textContent = JK.formatCurrency(sum);
  }
  if (totalDepositsEl) {
    const sum = members.reduce((s, m) => s + totalDeposits(m), 0);
    totalDepositsEl.textContent = JK.formatCurrency(sum);
  }
}

function renderMemberTable(members) {
  const tbody = document.getElementById("members-body");
  if (!tbody) return;

  if (members.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5">No members found.</td></tr>`;
    return;
  }

  tbody.innerHTML = members
    .map(
      (m) => `
      <tr>
        <td>${m.id}</td>
        <td>${m.name}</td>
        <td>${m.email || m.phone || "—"}</td>
        <td class="amount-credit">${JK.formatCurrency(totalDeposits(m))}</td>
        <td>${JK.formatCurrency(m.balance || 0)}</td>
      </tr>`
    )
    .join("");
}
