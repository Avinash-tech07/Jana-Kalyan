/* =========================================================================
   JANA KALYAN — LOANS (loans.html)
   -------------------------------------------------------------------------
   Spec rules implemented here:
   1. "Personal loan" is renamed "Kalyan loan" everywhere in the UI.
   2. Kalyan loan interest rate is fixed at 13%.
   3. Other loan types are visible in the list but disabled (not selectable).
   4. Loan duration is a dropdown, and the available months depend on the
      chosen loan amount (see LOAN_DURATION_MAP below — taken directly
      from the client's table).
   ========================================================================= */

const KALYAN_LOAN_INTEREST_RATE = 0.13; // 13%

/** Loan amount -> array of available durations (months), exactly as specified. */
const LOAN_DURATION_MAP = {
  6000: [3, 6],
  12000: [3, 6, 12],
  18000: [3, 6, 12, 18],
  24000: [3, 6, 12, 18, 24],
  60000: [3, 6, 12, 18, 24, 30],
  360000: [3, 6, 12, 18, 24, 30, 36], // also applies to any amount >= 360,000
};

document.addEventListener("DOMContentLoaded", function () {
  const session = JK.requireAuth(false);
  if (!session) return;

  const amountSelect = document.getElementById("loan-amount");
  const durationSelect = document.getElementById("loan-duration");
  const summaryEl = document.getElementById("loan-summary");
  const form = document.getElementById("loan-form");

  if (amountSelect && durationSelect) {
    amountSelect.addEventListener("change", () => {
      populateDurations(Number(amountSelect.value), durationSelect);
      updateSummary();
    });
    durationSelect.addEventListener("change", updateSummary);
    populateDurations(Number(amountSelect.value), durationSelect);
    updateSummary();
  }

  function populateDurations(amount, select) {
    const durations = durationsFor(amount);
    select.innerHTML = durations.map((m) => `<option value="${m}">${m} months</option>`).join("");
  }

  function updateSummary() {
    if (!summaryEl) return;
    const amount = Number(amountSelect.value);
    const months = Number(durationSelect.value);
    const { totalInterest, totalPayable, emi } = calculateKalyanLoan(amount, months);

    summaryEl.innerHTML = `
      <div class="passbook-row"><span class="label">Loan amount</span><span class="value">${JK.formatCurrency(amount)}</span></div>
      <div class="passbook-row"><span class="label">Interest rate</span><span class="value">${(KALYAN_LOAN_INTEREST_RATE * 100).toFixed(0)}% p.a.</span></div>
      <div class="passbook-row"><span class="label">Duration</span><span class="value">${months} months</span></div>
      <div class="passbook-row"><span class="label">Total interest</span><span class="value">${JK.formatCurrency(totalInterest)}</span></div>
      <div class="passbook-row"><span class="label">Total payable</span><span class="value">${JK.formatCurrency(totalPayable)}</span></div>
      <div class="passbook-row"><span class="label">Approx. monthly instalment</span><span class="value">${JK.formatCurrency(emi)}</span></div>
    `;
  }

  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      const session2 = JK.requireAuth(false);
      const amount = Number(amountSelect.value);
      const months = Number(durationSelect.value);
      const result = await JK.api("/loans/apply", {
        method: "POST",
        body: JSON.stringify({ memberId: session2.id, loanType: "kalyan", amount, months }),
      });
      const msg = document.getElementById("loan-msg");
      if (msg) {
        msg.textContent = result.success !== false
          ? "Kalyan loan application submitted. The admin will review it shortly."
          : result.message || "Something went wrong. Please try again.";
        msg.classList.add("show", "success");
      }
      form.reset();
    });
  }
});

/** Returns the exact duration list for an amount, or the next matching
 *  bracket for anything at/above 360,000 per the spec's ">=" rule. */
function durationsFor(amount) {
  if (LOAN_DURATION_MAP[amount]) return LOAN_DURATION_MAP[amount];
  if (amount >= 360000) return LOAN_DURATION_MAP[360000];
  return [3, 6]; // safe default for any unlisted amount
}

/** Simple-interest based EMI estimate for the Kalyan loan. */
function calculateKalyanLoan(amount, months) {
  const years = months / 12;
  const totalInterest = Math.round(amount * KALYAN_LOAN_INTEREST_RATE * years);
  const totalPayable = amount + totalInterest;
  const emi = Math.round(totalPayable / months);
  return { totalInterest, totalPayable, emi };
}
