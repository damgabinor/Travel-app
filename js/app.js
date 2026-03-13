document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document
      .querySelectorAll(".tab")
      .forEach((t) => t.classList.remove("active"));
    document
      .querySelectorAll(".section")
      .forEach((s) => s.classList.remove("active"));
    tab.classList.add("active");
    $("section-" + tab.dataset.tab).classList.add("active");
    if (tab.dataset.tab === "calendar") renderCalendar();
  });
});

function renderAll() {
  renderWishlist();
  renderActivities();
  renderTransport();
  renderAccommodation();
  renderChecklists();
  populateBudgetSel();
  renderBudget();
}

initGoogle();
