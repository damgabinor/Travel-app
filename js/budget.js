function populateBudgetSel() {
  // Trip selection removed — expenses are not linked to transport
}

function renderBudget() {
  const tbody = $("budget-tbody");
  const ce = {
    flights: "✈️",
    accommodation: "🏨",
    food: "🍜",
    transport: "🚌",
    activities: "🎭",
    shopping: "🛍",
    other: "📌",
  };
  const expenses = D.budget || [];
  const est = expenses.reduce((s, x) => s + (parseFloat(x.estimated) || 0), 0);
  const act = expenses.reduce((s, x) => s + (parseFloat(x.actual) || 0), 0);
  const rem = est - act;
  $("bs-est").textContent = "$" + est.toFixed(2);
  $("bs-act").textContent = "$" + act.toFixed(2);
  const re = $("bs-rem");
  re.textContent = "$" + Math.abs(rem).toFixed(2) + (rem < 0 ? " over" : "");
  re.style.color = rem < 0 ? "var(--red)" : "var(--blue)";
  tbody.innerHTML = expenses.length
    ? expenses
        .map(
          (e) => `<tr>
        <td>${ce[e.category] || "📌"} ${e.category}</td>
        <td>${e.description}</td>
        <td>$${parseFloat(e.estimated || 0).toFixed(2)}</td>
        <td class="${parseFloat(e.actual || 0) > parseFloat(e.estimated || 0) ? "amount-over" : "amount-pos"}">$${parseFloat(e.actual || 0).toFixed(2)}</td>
        <td>${e.paidBy}</td>
        <td><button class="btn btn-danger btn-sm" onclick="delExpense('${e.id}')">🗑</button></td>
      </tr>`,
        )
        .join("")
    : `<tr><td colspan="6" style="text-align:center;color:var(--text3);padding:2rem">No expenses yet</td></tr>`;
}

$("btn-add-expense").addEventListener("click", () => {
  ["ex-desc", "ex-est", "ex-act"].forEach((id) => setVal(id, ""));
  setVal("ex-cat", "flights");
  setVal("ex-paidby", "me");
  openModal("modal-expense");
});

$("btn-save-expense").addEventListener("click", () => {
  const desc = getVal("ex-desc").trim();
  if (!desc) {
    toast("Enter a description", "error");
    return;
  }
  D.budget.push({
    id: uid(),
    category: getVal("ex-cat"),
    description: desc,
    estimated: getVal("ex-est"),
    actual: getVal("ex-act"),
    paidBy: getVal("ex-paidby"),
    createdAt: Date.now(),
  });
  closeModal("modal-expense");
  renderBudget();
  saveDrive();
  toast("Expense added!");
});

function delExpense(id) {
  if (!confirm("Remove?")) return;
  D.budget = D.budget.filter((x) => x.id !== id);
  renderBudget();
  saveDrive();
  toast("Removed");
}
