function renderActivities() {
  const g = $("activities-grid");
  if (!D.activities.length) {
    g.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><span class="emoji">🎯</span><h3>No activities yet</h3><p>Add activities you plan to do on your trips.</p></div>`;
    return;
  }
  const te = {
    adventure: "🧗",
    food: "🍜",
    cultural: "🏛",
    nature: "🌿",
    entertainment: "🎭",
    sport: "⚽",
    other: "📍",
  };
  g.innerHTML = D.activities
    .map(
      (a) => `
    <div class="card s-${a.status || "planning"}">
      <div class="card-title">${te[a.type] || "📍"} ${a.name}</div>
      <div class="card-meta">
        ${a.country ? `<span>${a.country}</span>` : ""}
        <span class="badge ${SB[a.status || "planning"]}">${SL[a.status || "planning"]}</span>
        ${a.gcalEventId ? `<span style="font-size:.72rem;color:var(--text3)">📅</span>` : ""}
      </div>
      ${a.startDate ? `<div style="font-size:.82rem;color:var(--text3);margin-bottom:.4rem">🕐 ${fmtDT(a.startDate)}${a.endDate ? " → " + fmtDT(a.endDate) : " (1h)"}</div>` : ""}
      ${a.mapsLink ? `<a class="maps-link" href="${a.mapsLink}" target="_blank">📍 Maps ↗</a>` : ""}
      ${a.notes ? `<p style="font-size:.85rem;color:var(--text2);margin-top:.4rem;line-height:1.5">${a.notes}</p>` : ""}
      <div class="card-actions">
        ${a.status === "booked" && a.startDate && !a.gcalEventId && gcalOk ? `<button class="btn btn-secondary btn-sm" onclick="addActGcal('${a.id}')">📅</button>` : ""}
        ${(a.files || []).length ? `<button class="btn btn-secondary btn-sm" onclick="viewDocs('activity','${a.id}')" title="${a.files.length} document${a.files.length !== 1 ? "s" : ""}">📁 Docs</button>` : ""}
        <button class="btn btn-secondary btn-sm" onclick="editActivity('${a.id}')">✏ Edit</button>
        <button class="btn btn-danger btn-sm" onclick="delActivity('${a.id}')">🗑</button>
      </div>
    </div>`,
    )
    .join("");
}

function populateTripSel(selId) {
  $(selId).innerHTML =
    '<option value="">None</option>' +
    D.transport
      .map((t) => `<option value="${t.id}">${t.name}</option>`)
      .join("");
}

$("btn-add-activity").addEventListener("click", () => {
  editId = null;
  pf.a = [];
  $("act-title").textContent = "Add Activity";
  ["a-name", "a-country", "a-maps", "a-notes", "a-start", "a-end"].forEach(
    (id) => setVal(id, ""),
  );
  setVal("a-status", "planning");
  setVal("a-type", "adventure");
  $("a-file-list").innerHTML = "";
  $("a-upload-prog").innerHTML = "";
  $("a-file-input").value = "";
  openModal("modal-activity");
});

$("a-file-input").addEventListener("change", async (e) => {
  const up = await uploadFiles(Array.from(e.target.files), "a-upload-prog");
  pf.a = [...pf.a, ...up];
  renderFiles(pf.a, "a-file-list", "delPfA");
});

function delPfA(fid) {
  pf.a = pf.a.filter((f) => f.fileId !== fid);
  renderFiles(pf.a, "a-file-list", "delPfA");
}

function editActivity(id) {
  const a = D.activities.find((x) => x.id === id);
  if (!a) return;
  editId = id;
  pf.a = [...(a.files || [])];
  $("act-title").textContent = "Edit Activity";
  setVal("a-name", a.name);
  setVal("a-country", a.country);
  setVal("a-type", a.type || "adventure");
  setVal("a-status", a.status || "planning");
  setVal("a-start", a.startDate);
  setVal("a-end", a.endDate);
  setVal("a-maps", a.mapsLink);
  setVal("a-notes", a.notes);
  $("a-upload-prog").innerHTML = "";
  renderFiles(pf.a, "a-file-list", "delPfA");
  openModal("modal-activity");
}

$("btn-save-activity").addEventListener("click", async () => {
  const name = getVal("a-name").trim();
  if (!name) {
    toast("Enter a name", "error");
    return;
  }
  const ex = editId ? D.activities.find((x) => x.id === editId) : null;
  const ns = getVal("a-status");
  if (ex?.gcalEventId && ns !== "booked") await rmGcalEvent(ex.gcalEventId);
  const item = {
    id: editId || uid(),
    name,
    country: getVal("a-country").trim(),
    type: getVal("a-type"),
    status: ns,
    startDate: getVal("a-start"),
    endDate: getVal("a-end"),
    mapsLink: getVal("a-maps").trim(),
    notes: getVal("a-notes").trim(),
    files: [...pf.a],
    gcalEventId: ns === "booked" ? ex?.gcalEventId || null : null,
    createdAt: ex?.createdAt || Date.now(),
  };
  if (editId)
    D.activities = D.activities.map((x) => (x.id === editId ? item : x));
  else D.activities.push(item);
  closeModal("modal-activity");
  renderActivities();
  await saveDrive();
  if (
    item.status === "booked" &&
    item.startDate &&
    !item.gcalEventId &&
    gcalOk
  ) {
    item.gcalEventId = await mkGcalEvent(
      "🎯 " + item.name,
      item.notes || "",
      item.startDate,
      item.endDate || null,
      false,
    );
    if (item.gcalEventId) {
      D.activities = D.activities.map((x) => (x.id === item.id ? item : x));
      await saveDrive();
      renderCalendar();
    }
  }
  toast(editId ? "Updated!" : "Activity added!");
});

async function addActGcal(id) {
  const a = D.activities.find((x) => x.id === id);
  if (!a) return;
  a.gcalEventId = await mkGcalEvent(
    "🎯 " + a.name,
    a.notes || "",
    a.startDate,
    a.endDate || null,
    false,
  );
  if (a.gcalEventId) {
    await saveDrive();
    renderActivities();
    renderCalendar();
    toast("Added to Calendar!");
  } else toast("Calendar error", "error");
}

async function delActivity(id) {
  if (!confirm("Delete this activity?")) return;
  const a = D.activities.find((x) => x.id === id);
  if (a?.gcalEventId) await rmGcalEvent(a.gcalEventId);
  D.activities = D.activities.filter((x) => x.id !== id);
  renderActivities();
  await saveDrive();
  toast("Deleted");
}
