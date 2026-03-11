async function initGcal(){
  gcalState('syncing','Syncing...');
  try{
    await gapi.client.calendar.calendarList.list({maxResults:1});
    gcalOk=true; gcalState('ok','Synced with Google Calendar');
    await syncAllGcal();
  } catch(e){ gcalOk=false; gcalState('err','Google Calendar unavailable'); }
}

async function forceSyncAllGcal(){
  if(!gcalOk){ toast('Google Calendar not connected','error'); return; }
  const btn=$('btn-sync-gcal'); btn.disabled=true; btn.textContent='Syncing...';
  let added=0;
  for(const item of D.activities){
    if(item.status==='booked' && item.startDate){
      const eid=await mkGcalEvent('🎯 '+item.name, item.notes||'', item.startDate, item.endDate||null, false);
      if(eid){ item.gcalEventId=eid; added++; }
    }
  }
  for(const item of D.transport){
    if(item.status==='booked' && item.startDate){
      const eid=await mkGcalEvent(`${TTE[item.type]||'✈️'} ${item.name}`, `${item.from||''}→${item.to||''}`, item.startDate, item.endDate||null, false);
      if(eid){ item.gcalEventId=eid; added++; }
    }
  }
  for(const item of D.accommodation){
    if(item.status==='booked' && item.checkin){
      const eid=await mkGcalEvent('🏨 '+item.name, item.notes||'', item.checkin, item.checkout||null, false);
      if(eid){ item.gcalEventId=eid; added++; }
    }
  }
  await saveDrive(); renderCalendar();
  btn.disabled=false; btn.textContent='📅 Sync to my Calendar';
  toast(added>0 ? `${added} event${added!==1?'s':''} added to your Calendar!` : 'All booked items already synced ✓');
}

async function forceSyncAllGcal(){
  if(!gcalOk){ toast('Google Calendar not connected','error'); return; }
  const btn=$('btn-sync-gcal'); btn.disabled=true; btn.textContent='Syncing...';
  let added=0;

  for(const item of D.activities){
    if(item.status==='booked' && item.startDate && !item.gcalEventId){ // ← added !item.gcalEventId
      const eid=await mkGcalEvent('🎯 '+item.name, item.notes||'', item.startDate, item.endDate||null, false);
      if(eid){ item.gcalEventId=eid; added++; }
    }
  }
  for(const item of D.transport){
    if(item.status==='booked' && item.startDate && !item.gcalEventId){ // ← added !item.gcalEventId
      const eid=await mkGcalEvent(`${TTE[item.type]||'✈️'} ${item.name}`, `${item.from||''}→${item.to||''}`, item.startDate, item.endDate||null, false);
      if(eid){ item.gcalEventId=eid; added++; }
    }
  }
  for(const item of D.accommodation){
    if(item.status==='booked' && item.checkin && !item.gcalEventId){ // ← added !item.gcalEventId
      const eid=await mkGcalEvent('🏨 '+item.name, item.notes||'', item.checkin, item.checkout||null, false);
      if(eid){ item.gcalEventId=eid; added++; }
    }
  }

  await saveDrive(); renderCalendar();
  btn.disabled=false; btn.textContent='📅 Sync to my Calendar';
  toast(added>0 ? `${added} event${added!==1?'s':''} added to your Calendar!` : 'All booked items already synced ✓');
}

async function mkGcalEvent(summary, description, start, end, allDay){
  try{
    const s=new Date(start), e=end ? new Date(end) : new Date(s.getTime()+3600000);
    const body=allDay
      ? {summary,description,start:{date:start.slice(0,10)},end:{date:(end||start).slice(0,10)}}
      : {summary,description,start:{dateTime:s.toISOString()},end:{dateTime:e.toISOString()}};
    return (await gapi.client.calendar.events.insert({calendarId:'primary',resource:body})).result.id;
  } catch(e){ return null; }
}

async function rmGcalEvent(id){
  if(gcalOk && id) try{ await gapi.client.calendar.events.delete({calendarId:'primary',eventId:id}); } catch(e){}
}

function renderCalendar(){
  const y=calDate.getFullYear(), m=calDate.getMonth();
  const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
  $('cal-lbl').textContent=`${MONTHS[m]} ${y}`;
  const firstDay=new Date(y,m,1).getDay(), daysInMonth=new Date(y,m+1,0).getDate();
  const today=new Date();
  const events=[];
  D.activities.forEach(a=>{ if(a.status==='booked'&&a.startDate) events.push({type:'act',lbl:a.name,s:new Date(a.startDate),e:a.endDate?new Date(a.endDate):new Date(new Date(a.startDate).getTime()+3600000)}); });
  D.transport.forEach(t=>{ if(t.status==='booked'&&t.startDate) events.push({type:'trp',lbl:`${TTE[t.type]||'✈️'} ${t.name}`,s:new Date(t.startDate),e:t.endDate?new Date(t.endDate):new Date(new Date(t.startDate).getTime()+3600000)}); });
  D.accommodation.forEach(a=>{ if(a.status==='booked'&&a.checkin) events.push({type:'acc',lbl:a.name,s:new Date(a.checkin),e:a.checkout?new Date(a.checkout):new Date(new Date(a.checkin).getTime()+86400000)}); });
  const DAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  let html=DAYS.map(d=>`<div class="cal-day-hdr">${d}</div>`).join('');
  for(let i=0;i<firstDay;i++) html+=`<div class="cal-day other-month"><span class="cal-dn"></span></div>`;
  for(let d=1;d<=daysInMonth;d++){
    const date=new Date(y,m,d);
    const isToday=date.toDateString()===today.toDateString();
    const dayEvs=events.filter(ev=>{ const s=new Date(ev.s); s.setHours(0,0,0,0); const en=new Date(ev.e); en.setHours(23,59,59,999); return date>=s&&date<=en; });
    html+=`<div class="cal-day${isToday?' today':''}${dayEvs.length?' has-ev':''}" onclick="calClick(${y},${m},${d})">
      <span class="cal-dn">${d}</span>
      ${dayEvs.map(ev=>`<div class="cal-ev ${ev.type}" title="${ev.lbl}">${ev.lbl}</div>`).join('')}
      <span class="cal-add-hint">+ add</span>
    </div>`;
  }
  const rem=(7-(firstDay+daysInMonth)%7)%7;
  for(let i=0;i<rem;i++) html+=`<div class="cal-day other-month"><span class="cal-dn"></span></div>`;
  $('cal-grid').innerHTML=html;
}

$('cal-prev').addEventListener('click',()=>{ calDate=new Date(calDate.getFullYear(),calDate.getMonth()-1,1); renderCalendar(); });
$('cal-next').addEventListener('click',()=>{ calDate=new Date(calDate.getFullYear(),calDate.getMonth()+1,1); renderCalendar(); });
$('cal-today').addEventListener('click',()=>{ calDate=new Date(); renderCalendar(); });

function calClick(y,m,d){
  calAddDate=new Date(y,m,d);
  $('cal-add-title').textContent=`Add for ${calAddDate.toLocaleDateString([],{month:'long',day:'numeric'})}`;
  setCalAddType('activity');
  openModal('modal-cal-add');
}

function setCalAddType(type){
  calAddType=type;
  const types=['activity','transport','accommodation'];
  const labels=['🎯 Activity','✈️ Transport','🏨 Accommodation'];
  $('cal-add-tabs').innerHTML=types.map((t,i)=>`<button class="btn ${t===type?'btn-primary':'btn-secondary'} btn-sm" onclick="setCalAddType('${t}')">${labels[i]}</button>`).join('');
  const ds=calAddDate ? calAddDate.toISOString().slice(0,10) : '';
  const def9=`${ds}T09:00`, def10=`${ds}T10:00`;
  const forms={
    activity:`
      <div class="form-group"><label class="form-label">Name *</label><input class="form-input" id="caf-name" placeholder="e.g. Cooking class"/></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Start</label><input class="form-input" type="datetime-local" id="caf-start" value="${def9}"/></div>
        <div class="form-group"><label class="form-label">End (optional)</label><input class="form-input" type="datetime-local" id="caf-end" value="${def10}"/></div>
      </div>
      <div class="form-group"><label class="form-label">Notes</label><textarea class="form-textarea" id="caf-notes"></textarea></div>
      <div class="form-actions"><button class="btn btn-secondary" data-close="modal-cal-add">Cancel</button><button class="btn btn-primary" onclick="saveCalItem()">Save</button></div>`,
    transport:`
      <div class="form-group"><label class="form-label">Name / Reference *</label><input class="form-input" id="caf-name" placeholder="e.g. Flight AA123"/></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Type</label><select class="form-select" id="caf-ttype"><option value="flight">✈️ Flight</option><option value="train">🚆 Train</option><option value="bus">🚌 Bus</option><option value="car">🚗 Car</option><option value="boat">⛵ Boat</option><option value="other">📍 Other</option></select></div>
        <div class="form-group"><label class="form-label">Departure</label><input class="form-input" type="datetime-local" id="caf-start" value="${def9}"/></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">From</label><input class="form-input" id="caf-from" placeholder="Origin"/></div>
        <div class="form-group"><label class="form-label">To</label><input class="form-input" id="caf-to" placeholder="Destination"/></div>
      </div>
      <div class="form-actions"><button class="btn btn-secondary" data-close="modal-cal-add">Cancel</button><button class="btn btn-primary" onclick="saveCalItem()">Save</button></div>`,
    accommodation:`
      <div class="form-group"><label class="form-label">Name *</label><input class="form-input" id="caf-name" placeholder="e.g. Hotel Tokyo"/></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Check-in</label><input class="form-input" type="datetime-local" id="caf-start" value="${def9}"/></div>
        <div class="form-group"><label class="form-label">Check-out</label><input class="form-input" type="datetime-local" id="caf-end"/></div>
      </div>
      <div class="form-group"><label class="form-label">Location</label><input class="form-input" id="caf-loc" placeholder="City, Country"/></div>
      <div class="form-actions"><button class="btn btn-secondary" data-close="modal-cal-add">Cancel</button><button class="btn btn-primary" onclick="saveCalItem()">Save</button></div>`
  };
  $('cal-add-form').innerHTML=forms[type];
}

async function saveCalItem(){
  const name=$('caf-name')?.value.trim(); if(!name){ toast('Enter a name','error'); return; }
  const start=$('caf-start')?.value||'';
  closeModal('modal-cal-add');
  if(calAddType==='activity'){
    const item={id:uid(),name,country:'',type:'other',status:'booked',startDate:start,endDate:$('caf-end')?.value||'',notes:$('caf-notes')?.value||'',mapsLink:'',files:[],gcalEventId:null,createdAt:Date.now()};
    D.activities.push(item); renderActivities(); await saveDrive();
    if(start&&gcalOk){ item.gcalEventId=await mkGcalEvent('🎯 '+name,'',start,item.endDate||null,false); if(item.gcalEventId){ D.activities=D.activities.map(x=>x.id===item.id?item:x); await saveDrive(); } }
  } else if(calAddType==='transport'){
    const item={id:uid(),name,type:$('caf-ttype')?.value||'flight',status:'booked',from:$('caf-from')?.value||'',to:$('caf-to')?.value||'',startDate:start,endDate:'',notes:'',files:[],gcalEventId:null,createdAt:Date.now()};
    D.transport.push(item); renderTransport(); populateBudgetSel(); await saveDrive();
    if(start&&gcalOk){ item.gcalEventId=await mkGcalEvent(`${TTE[item.type]||'✈️'} ${name}`,`${item.from}→${item.to}`,start,null,false); if(item.gcalEventId){ D.transport=D.transport.map(x=>x.id===item.id?item:x); await saveDrive(); } }
  } else {
    const item={id:uid(),name,location:$('caf-loc')?.value||'',status:'booked',checkin:start,checkout:$('caf-end')?.value||'',mapsLink:'',notes:'',files:[],gcalEventId:null,createdAt:Date.now()};
    D.accommodation.push(item); renderAccommodation(); await saveDrive();
    if(start&&gcalOk){ item.gcalEventId=await mkGcalEvent('🏨 '+name,'',start,item.checkout||null,false); if(item.gcalEventId){ D.accommodation=D.accommodation.map(x=>x.id===item.id?item:x); await saveDrive(); } }
  }
  renderCalendar(); toast('Added!');
}

$('btn-sync-gcal').addEventListener('click', forceSyncAllGcal);
