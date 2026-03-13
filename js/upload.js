async function uploadFiles(fileList, progId) {
  const token = gapi.client.getToken()?.access_token;
  if (!token) {
    toast("Not authenticated", "error");
    return [];
  }
  const uploaded = [],
    prog = $(progId);
  for (const file of fileList) {
    if (prog)
      prog.innerHTML = `<span class="spinner"></span> Uploading ${file.name}...`;
    try {
      const form = new FormData();
      form.append(
        "metadata",
        new Blob([JSON.stringify({ name: file.name })], {
          type: "application/json",
        }),
      );
      form.append("file", file);
      const res = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        },
      );
      const data = await res.json();
      await fetch(
        `https://www.googleapis.com/drive/v3/files/${data.id}/permissions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role: "reader", type: "anyone" }),
        },
      ).catch(() => {});
      uploaded.push({
        name: file.name,
        fileId: data.id,
        url: data.webViewLink,
      });
    } catch (e) {
      toast(`Failed: ${file.name}`, "error");
    }
  }
  if (prog) prog.innerHTML = "";
  return uploaded;
}

function viewDocs(type, id) {
  const map = {
    activity: D.activities,
    transport: D.transport,
    accommodation: D.accommodation,
  };
  const files = (map[type] || []).find((x) => x.id === id)?.files || [];
  $("docs-list").innerHTML = files.length
    ? files
        .map(
          (f) =>
            `<a href="${f.url}" target="_blank" rel="noopener noreferrer" style="display:flex;align-items:center;gap:.75rem;text-decoration:none;padding:.65rem .75rem;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:.4rem;transition:border-color .2s" onmouseover="this.style.borderColor='var(--blue-dim)'" onmouseout="this.style.borderColor='var(--border)'"><span style="flex:1;font-size:.9rem;color:var(--text2)">📄 ${f.name}</span><span style="font-size:.8rem;color:var(--blue)">↗ Open</span></a>`,
        )
        .join("")
    : `<p style="color:var(--text3);text-align:center;padding:1.5rem 0">No documents attached.</p>`;
  openModal("modal-docs");
}

function renderFiles(files, listId, delFn) {
  const el = $(listId);
  if (!el) return;
  el.innerHTML = files
    .map(
      (f) => `
    <div class="file-item">
      <div class="file-item-name">📄 <span>${f.name}</span></div>
      <div style="display:flex;gap:.5rem">
        <a href="${f.url}" target="_blank" class="btn btn-secondary btn-sm">↗</a>
        <button class="btn btn-danger btn-sm" onclick="${delFn}('${f.fileId}')">🗑</button>
      </div>
    </div>`,
    )
    .join("");
}
