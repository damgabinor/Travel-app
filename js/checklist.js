function renderChecklists(){
  const g=$('checklist-grid');
  if(!D.checklists.length){
    g.innerHTML=`<div class="empty-state" style="grid-column:1/-1"><span class="emoji">📦</span><h3>No checklists yet</h3><p>Create packing lists for your trips.</p></div>`;
    return;
  }
  g.innerHTML=D.checklists.map(cl=>{
    const total=cl.items?.length||0, done=cl.items?.filter(i=>i.checked).length||0;
    const pct=total>0 ? Math.round(done/total*100) : 0;
    const trip=cl.tripId ? D.transport.find(t=>t.id===cl.tripId) : null;
    return `<div class="card">
      <div class="card-title">${cl.name}</div>
      <div class="card-meta">${trip?`<span class="badge badge-blue">✈ ${trip.name}</span>`:''}<span>${done}/${total} done</span></div>
      <div style="background:var(--bg3);border-radius:999px;height:4px;margin:.5rem 0">
        <div style="background:var(--blue);height:4px;border-radius:999px;width:${pct}%;transition:width .3s"></div>
      </div>
      ${(cl.items||[]).map(item=>`
        <div class="checklist-item${item.checked?' done':''}">
          <input type="checkbox" ${item.checked?'checked':''} onchange="toggleCheck('${cl.id}','${item.id}',this.checked)"/>
          <label>${item.text}</label>
          <button class="btn btn-danger btn-sm" onclick="delCheckItem('${cl.id}','${item.id}')">✕</button>
        </div>`).join('')}
      <div class="checklist-add">
        <input type="text" placeholder="Add item..." id="cla-${cl.id}" onkeydown="if(event.key==='Enter')addCheckItem('${cl.id}')"/>
        <button class="btn btn-primary btn-sm" onclick="addCheckItem('${cl.id}')">+</button>
      </div>
      <div class="card-actions" style="margin-top:.75rem">
        <button class="btn btn-danger btn-sm" onclick="delChecklist('${cl.id}')">🗑 Delete</button>
      </div>
    </div>`;
  }).join('');
}

$('btn-add-checklist').addEventListener('click',()=>{
  setVal('cl-name','');
  $('cl-trip').innerHTML='<option value="">None</option>'+D.transport.map(t=>`<option value="${t.id}">${t.name}</option>`).join('');
  openModal('modal-checklist');
});

$('btn-save-checklist').addEventListener('click',()=>{
  const name=getVal('cl-name').trim(); if(!name){ toast('Enter a name','error'); return; }
  D.checklists.push({id:uid(),name,tripId:getVal('cl-trip'),items:[],createdAt:Date.now()});
  closeModal('modal-checklist'); renderChecklists(); saveDrive(); toast('Created!');
});

function addCheckItem(id){
  const inp=$('cla-'+id); const text=inp.value.trim(); if(!text) return;
  const cl=D.checklists.find(x=>x.id===id); if(!cl.items) cl.items=[];
  cl.items.push({id:uid(),text,checked:false}); inp.value=''; renderChecklists(); saveDrive();
}

function toggleCheck(clId, itemId, checked){
  const item=D.checklists.find(x=>x.id===clId)?.items?.find(x=>x.id===itemId);
  if(item){ item.checked=checked; renderChecklists(); saveDrive(); }
}

function delCheckItem(clId, itemId){
  const cl=D.checklists.find(x=>x.id===clId);
  if(cl){ cl.items=cl.items.filter(x=>x.id!==itemId); renderChecklists(); saveDrive(); }
}

function delChecklist(id){
  if(!confirm('Delete checklist?')) return;
  D.checklists=D.checklists.filter(x=>x.id!==id); renderChecklists(); saveDrive(); toast('Deleted');
}
