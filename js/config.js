const CLIENT_ID = '633441558716-3lbaitogvc09hr2pu4hqp254fbgci2s5.apps.googleusercontent.com';
const SHARED_FILE_ID = '1w6Sf2uHMfmxh90mEC5mIgU-GWulIf0DZ';
const SCOPES = 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/calendar.events';
const DATA_FILE = 'travel-app-data.json';

let D = { wishlist:[], activities:[], transport:[], accommodation:[], checklists:[], budget:[] };
let driveFileId = null, tokenClient = null, editId = null, gcalOk = false;
let gapiReady = new Promise(r => { window._resolveGapi = r; });
let calDate = new Date(), calAddDate = null, calAddType = 'activity';
let pf = { a:[], t:[], ac:[] };

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const $ = id => document.getElementById(id);
const setVal = (id, v) => { const el=$(id); if(el) el.value = v ?? ''; };
const getVal = id => { const el=$(id); return el ? el.value : ''; };

const TTE = { flight:'✈️', train:'🚆', bus:'🚌', car:'🚗', boat:'⛵', other:'📍' };
const SL = { planning:'📝 Planning', booked:'✅ Booked', completed:'✔ Completed' };
const SB = { planning:'badge-yellow', booked:'badge-blue', completed:'badge-gray' };
const PL = { dream:'⭐ Dream Trip', next:'🔜 Next Up', someday:'☁ Someday' };
const PB = { dream:'badge-blue', next:'badge-yellow', someday:'badge-gray' };
const PBord = { dream:'p-dream', next:'p-next', someday:'p-someday' };
