function renderWishlist() {
  const g = $("wishlist-grid");
  if (!D.wishlist.length) {
    g.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><span class="emoji">🗺️</span><h3>No places yet</h3><p>Add destinations you dream of visiting together.</p></div>`;
    return;
  }
  const te = {
    city: "🏙",
    beach: "🏖",
    nature: "🌿",
    cultural: "🏛",
    adventure: "🧗",
    other: "📍",
  };
  g.innerHTML = D.wishlist
    .map(
      (w) => `
    <div class="card ${PBord[w.priority || "dream"]}">
      <div class="card-title">${te[w.type] || "📍"} ${w.name}</div>
      <div class="card-meta">
        ${w.country ? `<span>${w.country}</span>` : ""}
        <span class="badge ${PB[w.priority || "dream"]}">${PL[w.priority || "dream"]}</span>
        <span>by ${w.suggestedBy || "—"}</span>
      </div>
      ${w.mapsLink ? `<a class="maps-link" href="${w.mapsLink}" target="_blank">📍 Open in Maps ↗</a>` : ""}
      ${w.notes ? `<p style="font-size:.85rem;color:var(--text2);margin-top:.5rem;line-height:1.5">${w.notes}</p>` : ""}
      <div class="card-actions">
        <button class="btn btn-secondary btn-sm" onclick="editWish('${w.id}')">✏ Edit</button>
        <button class="btn btn-danger btn-sm" onclick="delWish('${w.id}')">🗑</button>
      </div>
    </div>`,
    )
    .join("");
}

$("btn-add-wish").addEventListener("click", () => {
  editId = null;
  $("wish-title").textContent = "Add Place";
  ["w-name", "w-country", "w-maps", "w-notes"].forEach((id) => setVal(id, ""));
  setVal("w-priority", "dream");
  setVal("w-type", "city");
  setVal("w-by", "me");
  openModal("modal-wish");
});

function editWish(id) {
  const w = D.wishlist.find((x) => x.id === id);
  if (!w) return;
  editId = id;
  $("wish-title").textContent = "Edit Place";
  setVal("w-name", w.name);
  setVal("w-country", w.country);
  setVal("w-type", w.type || "city");
  setVal("w-priority", w.priority || "dream");
  setVal("w-by", w.suggestedBy || "me");
  setVal("w-maps", w.mapsLink);
  setVal("w-notes", w.notes);
  openModal("modal-wish");
}

$("btn-save-wish").addEventListener("click", () => {
  const name = getVal("w-name").trim();
  if (!name) {
    toast("Enter a place name", "error");
    return;
  }
  const ex = editId ? D.wishlist.find((x) => x.id === editId) : null;
  const item = {
    id: editId || uid(),
    name,
    country: getVal("w-country").trim(),
    type: getVal("w-type"),
    priority: getVal("w-priority"),
    suggestedBy: getVal("w-by"),
    mapsLink: getVal("w-maps").trim(),
    notes: getVal("w-notes").trim(),
    createdAt: ex?.createdAt || Date.now(),
  };
  if (editId) D.wishlist = D.wishlist.map((x) => (x.id === editId ? item : x));
  else D.wishlist.push(item);
  closeModal("modal-wish");
  renderWishlist();
  saveDrive();
  toast(editId ? "Updated!" : "Place added!");
});

function delWish(id) {
  if (!confirm("Remove this place?")) return;
  D.wishlist = D.wishlist.filter((x) => x.id !== id);
  renderWishlist();
  saveDrive();
  toast("Removed");
}
