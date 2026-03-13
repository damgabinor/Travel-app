function renderAccommodation() {
  const g = $("accommodation-grid");
  if (!D.accommodation.length) {
    g.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><span class="emoji">🏨</span><h3>No accommodation yet</h3><p>Add hotels, hostels, Airbnbs and more.</p></div>`;
    return;
  }
  g.innerHTML = D.accommodation
    .map(
      (a) => `
    <div class="card s-${a.status || "planning"}">
      <div class="card-title">🏨 ${a.name}</div>
      <div class="card-meta">
        ${a.location ? `<span>${a.location}</span>` : ""}
        <span class="badge ${SB[a.status || "planning"]}">${SL[a.status || "planning"]}</span>
        ${a.gcalEventId ? `<span style="font-size:.72rem;color:var(--text3)">📅</span>` : ""}
      </div>
      ${a.checkin ? `<div style="font-size:.82rem;color:var(--text3);margin-bottom:.4rem">📅 Check-in: ${fmtDT(a.checkin)}${a.checkout ? " · Check-out: " + fmtDT(a.checkout) : ""}</div>` : ""}
      ${a.mapsLink ? `<a class="maps-link" href="${a.mapsLink}" target="_blank">📍 Maps ↗</a>` : ""}
      ${a.notes ? `<p style="font-size:.85rem;color:var(--text2);margin-top:.4rem;line-height:1.5">${a.notes}</p>` : ""}
      <div class="card-actions">
        ${(a.files || []).length ? `<button class="btn btn-secondary btn-sm" onclick="viewDocs('accommodation','${a.id}')" title="${a.files.length} document${a.files.length !== 1 ? "s" : ""}">📁 Docs</button>` : ""}
        <button class="btn btn-secondary btn-sm" onclick="editAccommodation('${a.id}')">✏ Edit</button>
        <button class="btn btn-danger btn-sm" onclick="delAccommodation('${a.id}')">🗑</button>
      </div>
    </div>`,
    )
    .join("");
}

$("btn-add-accommodation").addEventListener("click", () => {
  editId = null;
  pf.ac = [];
  $("acc-title").textContent = "Add Accommodation";
  [
    "ac-name",
    "ac-location",
    "ac-maps",
    "ac-notes",
    "ac-checkin",
    "ac-checkout",
  ].forEach((id) => setVal(id, ""));
  setVal("ac-status", "planning");
  $("ac-file-list").innerHTML = "";
  $("ac-upload-prog").innerHTML = "";
  $("ac-file-input").value = "";
  openModal("modal-accommodation");
});

$("ac-file-input").addEventListener("change", async (e) => {
  const up = await uploadFiles(Array.from(e.target.files), "ac-upload-prog");
  pf.ac = [...pf.ac, ...up];
  renderFiles(pf.ac, "ac-file-list", "delPfAc");
});

function delPfAc(fid) {
  pf.ac = pf.ac.filter((f) => f.fileId !== fid);
  renderFiles(pf.ac, "ac-file-list", "delPfAc");
}

function editAccommodation(id) {
  const a = D.accommodation.find((x) => x.id === id);
  if (!a) return;
  editId = id;
  pf.ac = [...(a.files || [])];
  $("acc-title").textContent = "Edit Accommodation";
  setVal("ac-name", a.name);
  setVal("ac-location", a.location);
  setVal("ac-status", a.status || "planning");
  setVal("ac-checkin", a.checkin);
  setVal("ac-checkout", a.checkout);
  setVal("ac-maps", a.mapsLink);
  setVal("ac-notes", a.notes);
  $("ac-upload-prog").innerHTML = "";
  renderFiles(pf.ac, "ac-file-list", "delPfAc");
  openModal("modal-accommodation");
}

$("btn-save-accommodation").addEventListener("click", async () => {
  const name = getVal("ac-name").trim();
  if (!name) {
    toast("Enter a name", "error");
    return;
  }
  const ex = editId ? D.accommodation.find((x) => x.id === editId) : null;
  const ns = getVal("ac-status");
  if (ex?.gcalEventId && ns !== "booked") await rmGcalEvent(ex.gcalEventId);
  const item = {
    id: editId || uid(),
    name,
    location: getVal("ac-location").trim(),
    status: ns,
    checkin: getVal("ac-checkin"),
    checkout: getVal("ac-checkout"),
    mapsLink: getVal("ac-maps").trim(),
    notes: getVal("ac-notes").trim(),
    files: [...pf.ac],
    gcalEventId: ns === "booked" ? ex?.gcalEventId || null : null,
    createdAt: ex?.createdAt || Date.now(),
  };
  if (editId)
    D.accommodation = D.accommodation.map((x) => (x.id === editId ? item : x));
  else D.accommodation.push(item);
  closeModal("modal-accommodation");
  renderAccommodation();
  await saveDrive();
  if (item.status === "booked" && item.checkin && !item.gcalEventId && gcalOk) {
    item.gcalEventId = await mkGcalEvent(
      "🏨 " + item.name,
      item.notes || "",
      item.checkin,
      item.checkout || null,
      false,
    );
    if (item.gcalEventId) {
      D.accommodation = D.accommodation.map((x) =>
        x.id === item.id ? item : x,
      );
      await saveDrive();
      renderCalendar();
    }
  }
  toast(editId ? "Updated!" : "Accommodation added!");
});

async function delAccommodation(id) {
  if (!confirm("Delete?")) return;
  const a = D.accommodation.find((x) => x.id === id);
  if (a?.gcalEventId) await rmGcalEvent(a.gcalEventId);
  D.accommodation = D.accommodation.filter((x) => x.id !== id);
  renderAccommodation();
  await saveDrive();
  toast("Deleted");
}
