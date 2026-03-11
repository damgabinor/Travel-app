async function loadDrive(){
  syncState('syncing','Loading from Google Drive...');
  try{
    if(SHARED_FILE_ID){
      driveFileId=SHARED_FILE_ID;
    } else {
      const res=await gapi.client.drive.files.list({q:`name='${DATA_FILE}' and trashed=false`,fields:'files(id)',spaces:'drive'});
      const files=res.result.files;
      if(files.length) driveFileId=files[0].id;
    }
    if(driveFileId){
      const c=await gapi.client.drive.files.get({fileId:driveFileId,alt:'media'});
      const loaded=JSON.parse(c.body);
      // migrate legacy keys
      if(loaded.trips && !loaded.transport){ loaded.transport=loaded.trips; delete loaded.trips; }
      if(loaded.activities){
        const wishes=loaded.activities.filter(a=>a.itemType==='wishlist');
        const acts=loaded.activities.filter(a=>a.itemType==='activity'||!a.itemType);
        if(!loaded.wishlist||!loaded.wishlist.length) loaded.wishlist=wishes;
        loaded.activities=acts.map(a=>{ delete a.itemType; return a; });
      }
      D={wishlist:[],activities:[],transport:[],accommodation:[],checklists:[],budget:[],...loaded};
    } else {
      await saveDrive();
    }
    syncState('synced','Synced with Google Drive','just now');
    renderAll();
  } catch(e){
    syncState('error','Drive error — working offline');
    toast('Could not load from Drive','error');
    renderAll();
  }
}

async function saveDrive(){
  syncState('syncing','Saving...');
  const token=gapi.client.getToken()?.access_token;
  const body=JSON.stringify(D,null,2);
  try{
    if(driveFileId){
      await fetch(`https://www.googleapis.com/upload/drive/v3/files/${driveFileId}?uploadType=media`,{
        method:'PATCH',
        headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
        body
      });
    } else {
      const m=await gapi.client.drive.files.create({resource:{name:DATA_FILE,mimeType:'application/json'},fields:'id'});
      driveFileId=m.result.id;
      await fetch(`https://www.googleapis.com/upload/drive/v3/files/${driveFileId}?uploadType=media`,{
        method:'PATCH',
        headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
        body
      });
    }
    syncState('synced','Synced',`Saved ${new Date().toLocaleTimeString()}`);
  } catch(e){
    syncState('error','Save failed'); toast('Save failed','error');
  }
}

$('btn-sync').addEventListener('click',()=>{ loadDrive(); initGcal(); });
