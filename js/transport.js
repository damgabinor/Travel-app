function renderTransport() {
  const g = $("transport-grid");
  if (!D.transport.length) {
    g.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><span class="emoji">✈️</span><h3>No transport yet</h3><p>Add flights, trains, buses and more.</p></div>`;
    return;
  }
  g.innerHTML = D.transport
    .map(
      (t) => `
    <div class="card s-${t.status || "planning"}">
      <div class="card-title">${TTE[t.type] || "✈️"} ${t.name}</div>
      <div class="card-meta">
        <span class="badge ${SB[t.status || "planning"]}">${SL[t.status || "planning"]}</span>
        ${t.gcalEventId ? `<span style="font-size:.72rem;color:var(--text3)">📅</span>` : ""}
      </div>
      ${t.from || t.to ? `<div style="font-size:.85rem;color:var(--text2);margin-bottom:.4rem">📍 ${t.from || "?"} → ${t.to || "?"}</div>` : ""}
      ${t.startDate ? `<div style="font-size:.82rem;color:var(--text3);margin-bottom:.4rem">🕐 ${fmtDT(t.startDate)}${t.endDate ? " → " + fmtDT(t.endDate) : ""}</div>` : ""}
      ${t.notes ? `<p style="font-size:.85rem;color:var(--text2);margin-top:.4rem;line-height:1.5">${t.notes}</p>` : ""}
      <div class="card-actions">
        ${(t.files || []).length ? `<button class="btn btn-secondary btn-sm" onclick="viewDocs('transport','${t.id}')" title="${t.files.length} document${t.files.length !== 1 ? "s" : ""}">📁 Docs</button>` : ""}
        <button class="btn btn-secondary btn-sm" onclick="editTransport('${t.id}')">✏ Edit</button>
        <button class="btn btn-danger btn-sm" onclick="delTransport('${t.id}')">🗑</button>
      </div>
    </div>`,
    )
    .join("");
}

$("btn-add-transport").addEventListener("click", () => {
  editId = null;
  pf.t = [];
  $("trp-title").textContent = "Add Transport";
  ["t-name", "t-from", "t-to", "t-notes", "t-start", "t-end"].forEach((id) =>
    setVal(id, ""),
  );
  setVal("t-type", "flight");
  setVal("t-status", "planning");
  $("t-file-list").innerHTML = "";
  $("t-upload-prog").innerHTML = "";
  $("t-file-input").value = "";
  openModal("modal-transport");
});

$("t-file-input").addEventListener("change", async (e) => {
  const up = await uploadFiles(Array.from(e.target.files), "t-upload-prog");
  pf.t = [...pf.t, ...up];
  renderFiles(pf.t, "t-file-list", "delPfT");
});

function delPfT(fid) {
  pf.t = pf.t.filter((f) => f.fileId !== fid);
  renderFiles(pf.t, "t-file-list", "delPfT");
}

function editTransport(id) {
  const t = D.transport.find((x) => x.id === id);
  if (!t) return;
  editId = id;
  pf.t = [...(t.files || [])];
  $("trp-title").textContent = "Edit Transport";
  setVal("t-name", t.name);
  setVal("t-type", t.type || "flight");
  setVal("t-status", t.status || "planning");
  setVal("t-from", t.from);
  setVal("t-to", t.to);
  setVal("t-start", t.startDate);
  setVal("t-end", t.endDate);
  setVal("t-notes", t.notes);
  $("t-upload-prog").innerHTML = "";
  renderFiles(pf.t, "t-file-list", "delPfT");
  openModal("modal-transport");
}

$("btn-save-transport").addEventListener("click", async () => {
  const name = getVal("t-name").trim();
  if (!name) {
    toast("Enter a name/reference", "error");
    return;
  }
  const ex = editId ? D.transport.find((x) => x.id === editId) : null;
  const ns = getVal("t-status");
  if (ex?.gcalEventId && ns !== "booked") await rmGcalEvent(ex.gcalEventId);
  const item = {
    id: editId || uid(),
    name,
    type: getVal("t-type"),
    status: ns,
    from: getVal("t-from").trim(),
    to: getVal("t-to").trim(),
    startDate: getVal("t-start"),
    endDate: getVal("t-end"),
    notes: getVal("t-notes").trim(),
    files: [...pf.t],
    gcalEventId: ns === "booked" ? ex?.gcalEventId || null : null,
    createdAt: ex?.createdAt || Date.now(),
  };
  if (editId)
    D.transport = D.transport.map((x) => (x.id === editId ? item : x));
  else D.transport.push(item);
  closeModal("modal-transport");
  renderTransport();
  populateBudgetSel();
  await saveDrive();
  if (
    item.status === "booked" &&
    item.startDate &&
    !item.gcalEventId &&
    gcalOk
  ) {
    item.gcalEventId = await mkGcalEvent(
      `${TTE[item.type] || "✈️"} ${item.name}`,
      `${item.from}→${item.to}\n${item.notes || ""}`,
      item.startDate,
      item.endDate || null,
      false,
    );
    if (item.gcalEventId) {
      D.transport = D.transport.map((x) => (x.id === item.id ? item : x));
      await saveDrive();
      renderCalendar();
    }
  }
  toast(editId ? "Updated!" : "Transport added!");
});

async function delTransport(id) {
  if (!confirm("Delete this transport?")) return;
  const t = D.transport.find((x) => x.id === id);
  if (t?.gcalEventId) await rmGcalEvent(t.gcalEventId);
  D.transport = D.transport.filter((x) => x.id !== id);
  renderTransport();
  populateBudgetSel();
  await saveDrive();
  toast("Deleted");
}
