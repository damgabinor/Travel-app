function toast(msg, type = "success") {
  const t = $("toast");
  t.textContent = msg;
  t.className = `show ${type}`;
  setTimeout(() => (t.className = ""), 3200);
}

function syncState(s, txt, time = "") {
  $("sync-dot").className = `sync-dot ${s}`;
  $("sync-text").textContent = txt;
  $("sync-time").textContent = time;
}

function gcalState(s, txt) {
  $("gcal-dot").className = `gcal-dot ${s}`;
  $("gcal-text").textContent = txt;
}

function fmtDT(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  return isNaN(d)
    ? dt
    : d.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

const openModal = (id) => $(id).classList.add("open");
const closeModal = (id) => $(id).classList.remove("open");

document
  .querySelectorAll("[data-close]")
  .forEach((b) =>
    b.addEventListener("click", () => closeModal(b.dataset.close)),
  );
document.querySelectorAll(".modal-overlay").forEach((o) =>
  o.addEventListener("click", (e) => {
    if (e.target === o) o.classList.remove("open");
  }),
);
