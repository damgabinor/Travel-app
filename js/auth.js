function initGoogle(){
  if(!CLIENT_ID || CLIENT_ID.includes('YOUR_CLIENT_ID')){ $('config-notice').style.display='block'; return; }
  const s1=document.createElement('script');
  s1.src='https://accounts.google.com/gsi/client';
  s1.onload=()=>{
    tokenClient=google.accounts.oauth2.initTokenClient({client_id:CLIENT_ID,scope:SCOPES,callback:onToken});
    const btn=$('btn-login'); btn.disabled=false; btn.style.opacity='1'; btn.style.cursor='pointer';
  };
  document.head.appendChild(s1);
  const s2=document.createElement('script');
  s2.src='https://apis.google.com/js/api.js';
  s2.onload=()=>gapi.load('client',()=>gapi.client.init({
    discoveryDocs:[
      'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
      'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'
    ]
  }).then(()=>window._resolveGapi()));
  document.head.appendChild(s2);
}

async function onToken(r){
  if(r.error){ toast('Sign in failed','error'); return; }
  await gapiReady;
  gapi.client.setToken({ access_token: r.access_token });
  fetch('https://www.googleapis.com/oauth2/v3/userinfo',{headers:{Authorization:'Bearer '+r.access_token}})
    .then(x=>x.json()).then(i=>{ $('user-avatar').src=i.picture||''; $('user-name').textContent=i.name||i.email||''; });
  $('login-screen').style.display='none'; $('app').style.display='block';
  loadDrive(); initGcal();
}

$('btn-login').addEventListener('click',()=>{
  if(!tokenClient){ toast('Set your CLIENT_ID first','error'); return; }
  tokenClient.requestAccessToken();
});

$('btn-signout').addEventListener('click',()=>{
  const t=gapi.client.getToken(); if(t) google.accounts.oauth2.revoke(t.access_token);
  gapi.client.setToken(null);
  $('app').style.display='none'; $('login-screen').style.display='flex';
  driveFileId=null; gcalOk=false;
});
