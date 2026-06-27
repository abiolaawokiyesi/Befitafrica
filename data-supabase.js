/* ============================================================
   BefitAfrica — Supabase data layer  (data-supabase.js)
   ------------------------------------------------------------
   Loads AFTER data.js and OVERRIDES only the storage functions so
   the app uses the cloud database instead of browser localStorage.

   IMPORTANT: This file must not RE-DECLARE names that data.js already
   declares (MEMBERS, persist, getEvents, ...). Doing so would throw
   "Identifier already declared" and stop the app. Instead it ASSIGNS
   to those existing global names. New names (bfaLogin, bfaRegister...)
   are attached to window so app.js can detect the cloud backend.
   ============================================================ */
(function(){

  /* ---------- 1. CONFIG ---------- */
  var SUPABASE_URL = "https://uhtwarstkylpqjvzunna.supabase.co";
  var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVodHdhcnN0a3lscHFqdnp1bm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1ODIwMTEsImV4cCI6MjA5ODE1ODAxMX0.nomwxiPCao-pgSHlC79xbVuqksYit2k6VmPL-aQa89o";

  /* ---------- 2. client ---------- */
  if(!window.supabase || !window.supabase.createClient){
    console.error("[BFA] Supabase library not loaded. Ensure the supabase-js <script> loads before data-supabase.js. Falling back to local storage.");
    return;
  }
  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  window.bfaClient = sb;

  /* ---------- 3. in-memory mirrors ---------- */
  var _events = [], _challenges = [], _messages = {general:[],interhub:[],intrahub:[]};
  var _attendance = {open:{}, log:[]};
  var _activities = {};
  var _healthLogs = {};
  var _session = null;

  /* ---------- 4. row <-> app mapping ---------- */
  function rowToMember(r){
    return {id:r.id,email:r.email,name:r.name,role:r.role,occupation:r.occupation,country:r.country,
      state:r.state,lga:r.lga,address:r.address,hub:r.hub,gender:r.gender,phone:r.phone,avatar:r.avatar,
      status:r.status,verified:r.verified,streak:r.streak,sessions:r.sessions,km:Number(r.km),
      bmi:Number(r.bmi),bp:r.bp,hr:r.hr,weight:Number(r.weight),height:Number(r.height),
      goals:r.goals||[],monthlyKm:r.monthly_km||[],joined:r.joined,attendance:[]};
  }
  function memberToRow(m){
    return {id:m.id,email:m.email,name:m.name,role:m.role||'member',occupation:m.occupation,country:m.country,
      state:m.state,lga:m.lga,address:m.address,hub:m.hub,gender:m.gender,phone:m.phone,avatar:m.avatar,
      status:m.status,verified:m.verified,streak:m.streak||0,sessions:m.sessions||0,km:m.km||0,
      bmi:m.bmi||0,bp:m.bp||'\u2014',hr:m.hr||0,weight:m.weight||0,height:m.height||0,
      goals:m.goals||[],monthly_km:m.monthlyKm||[],joined:m.joined};
  }

  /* ---------- 5. bootstrap ---------- */
  async function bfaLoadAll(){
    var res = await Promise.all([
      sb.from('members').select('*'),
      sb.from('events').select('*').order('created_at',{ascending:false}),
      sb.from('challenges').select('*').order('created_at',{ascending:false}),
      sb.from('messages').select('*').order('created_at',{ascending:true}),
      sb.from('attendance').select('*').order('created_at',{ascending:false}),
      sb.from('attendance_open').select('*'),
      sb.from('activities').select('*'),
      sb.from('health_logs').select('*').order('created_at',{ascending:true})
    ]);
    var members=res[0],events=res[1],challenges=res[2],messages=res[3],attLog=res[4],attOpen=res[5],acts=res[6],health=res[7];
    MEMBERS.length=0;
    (members.data||[]).forEach(function(r){MEMBERS.push(rowToMember(r));});
    _events = events.data||[];
    _challenges = challenges.data||[];
    _messages = {general:[],interhub:[],intrahub:[]};
    (messages.data||[]).forEach(function(m){var ch=m.channel||'general';(_messages[ch]=_messages[ch]||[]).push(m);});
    _attendance = {open:{}, log:(attLog.data||[]).map(function(r){return {id:r.id,memberId:r.member_id,name:r.name,avatar:r.avatar,hub:r.hub,program:r.program,inAt:r.in_at,outAt:r.out_at,durationMs:r.duration_ms,date:r.date};})};
    (attOpen.data||[]).forEach(function(o){_attendance.open[o.member_id]={program:o.program,hub:o.hub,inAt:o.in_at,name:o.name};});
    _activities={};(acts.data||[]).forEach(function(a){(_activities[a.member_id]=_activities[a.member_id]||[]).push({type:a.type,km:Number(a.km),steps:a.steps,durationSec:a.duration_sec,avgBpm:a.avg_bpm,route:a.route,date:a.date,ts:a.ts});});
    _healthLogs={};(health.data||[]).forEach(function(hl){(_healthLogs[hl.member_id]=_healthLogs[hl.member_id]||[]).push({weight:Number(hl.weight),bp:hl.bp,hr:hl.hr,steps:hl.steps,bloodSugar:Number(hl.blood_sugar),waist:Number(hl.waist),date:hl.date,month:hl.month});});
    MEMBERS.forEach(function(m){m.attendance=_attendance.log.filter(function(r){return r.memberId===m.id;});});
  }

  /* ---------- 6. AUTH ---------- */
  async function bfaRegister(profile, password){
    var r = await sb.auth.signUp({email:profile.email,password:password,options:{emailRedirectTo:window.location.origin}});
    if(r.error) return {error:r.error.message};
    var uid = r.data.user && r.data.user.id;
    if(!uid) return {error:"Sign-up failed"};
    var row = memberToRow(Object.assign({},profile,{id:uid,verified:false}));
    var e2 = await sb.from('members').insert(row);
    if(e2.error) return {error:e2.error.message};
    return {ok:true, userId:uid};
  }
  async function bfaLogin(email,password){
    var r = await sb.auth.signInWithPassword({email:email,password:password});
    if(r.error) return {error:r.error.message};
    _session = {id:r.data.user.id,email:r.data.user.email};
    await bfaLoadAll();
    return {ok:true, user:MEMBERS.find(function(m){return m.id===r.data.user.id;})};
  }
  async function bfaLogout(){ try{await sb.auth.signOut();}catch(e){} _session=null; }
  async function bfaResetPassword(email){
    var r = await sb.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin});
    return r.error?{error:r.error.message}:{ok:true};
  }
  async function bfaRestoreSession(){
    var r = await sb.auth.getSession();
    if(r.data && r.data.session){_session={id:r.data.session.user.id,email:r.data.session.user.email};await bfaLoadAll();return MEMBERS.find(function(m){return m.id===_session.id;})||null;}
    return null;
  }

  /* ---------- 7. OVERRIDE globals declared in data.js (reassign, no keyword) ---------- */
  persist = async function(){ try{ await sb.from('members').upsert(MEMBERS.map(memberToRow)); }catch(e){console.error("persist",e);} };
  loadSession = function(){ return _session; };
  saveSession = function(){};
  loadRemembered = function(){ return null; };
  saveRemembered = function(){};
  nextMemberId = function(){ return null; };
  makeToken = function(){ return Math.random().toString(36).slice(2); };
  loadPending = function(){ return {}; };
  savePending = function(){};

  getEvents = function(){ return _events; };
  setEvents = function(list){ _events=list; };
  getChallenges = function(){ return _challenges; };
  setChallenges = function(list){ _challenges=list; };
  getMessages = function(){ return _messages; };
  setMessages = function(obj){ _messages=obj; };
  loadAtt = function(){ return _attendance; };
  saveAtt = function(a){ _attendance=a; };
  getActivities = function(memberId){ return _activities[memberId]||[]; };
  addActivity = async function(memberId,rec){
    (_activities[memberId]=_activities[memberId]||[]).push(rec);
    try{ await sb.from('activities').insert({member_id:memberId,type:rec.type,km:rec.km,steps:rec.steps,duration_sec:rec.durationSec,avg_bpm:rec.avgBpm,route:rec.route,date:rec.date,ts:rec.ts}); }catch(e){console.error("addActivity",e);}
  };
  getHealthLog = function(memberId){ return _healthLogs[memberId]||[]; };
  addHealthLog = async function(memberId,entry){
    (_healthLogs[memberId]=_healthLogs[memberId]||[]).push(entry);
    try{ await sb.from('health_logs').insert({member_id:memberId,weight:entry.weight,bp:entry.bp,hr:entry.hr,steps:entry.steps,blood_sugar:entry.bloodSugar,waist:entry.waist,date:entry.date,month:entry.month}); }catch(e){console.error("addHealthLog",e);}
  };
  getHubs = function(){ return (typeof HUBS_SEED!=="undefined") ? JSON.parse(JSON.stringify(HUBS_SEED)) : []; };

  /* ---------- 8. cloud helpers on window (used by app.js) ---------- */
  window.bfaLogin = bfaLogin;
  window.bfaRegister = bfaRegister;
  window.bfaLogout = bfaLogout;
  window.bfaResetPassword = bfaResetPassword;
  window.bfaRestoreSession = bfaRestoreSession;
  window.bfaLoadAll = bfaLoadAll;
  window.bfaSaveMember = async function(m){ try{ await sb.from('members').upsert(memberToRow(m)); }catch(e){console.error(e);} };
  window.bfaDeleteMember = async function(id){ try{ await sb.from('members').delete().eq('id',id); }catch(e){console.error(e);} };
  window.bfaUpsertEvent = async function(ev){ var r=await sb.from('events').upsert(ev).select(); if(r.data&&r.data[0]){var i=_events.findIndex(function(e){return e.id===r.data[0].id;});if(i>=0)_events[i]=r.data[0];else _events.unshift(r.data[0]);} return r.data&&r.data[0]; };
  window.bfaDeleteEvent = async function(id){ await sb.from('events').delete().eq('id',id); _events=_events.filter(function(e){return e.id!==id;}); };
  window.bfaUpsertChallenge = async function(ch){ var r=await sb.from('challenges').upsert(ch).select(); if(r.data&&r.data[0]){var i=_challenges.findIndex(function(c){return c.id===r.data[0].id;});if(i>=0)_challenges[i]=r.data[0];else _challenges.unshift(r.data[0]);} return r.data&&r.data[0]; };
  window.bfaDeleteChallenge = async function(id){ await sb.from('challenges').delete().eq('id',id); _challenges=_challenges.filter(function(c){return c.id!==id;}); };
  window.bfaSendMessage = async function(channel,msg){ try{ await sb.from('messages').insert({channel:channel,member_id:_session&&_session.id,name:msg.user,avatar:msg.avatar,hub:msg.hub,text:msg.text}); }catch(e){console.error(e);} (_messages[channel]=_messages[channel]||[]).push(msg); };
  window.bfaClockIn = async function(rec){ try{ await sb.from('attendance_open').upsert({member_id:_session.id,name:rec.name,hub:rec.hub,program:rec.program,in_at:rec.inAt}); }catch(e){console.error(e);} _attendance.open[_session.id]={program:rec.program,hub:rec.hub,inAt:rec.inAt,name:rec.name}; };
  window.bfaClockOut = async function(rec){
    try{ await sb.from('attendance_open').delete().eq('member_id',_session.id);
      var r=await sb.from('attendance').insert({member_id:rec.memberId,name:rec.name,avatar:rec.avatar,hub:rec.hub,program:rec.program,in_at:rec.inAt,out_at:rec.outAt,duration_ms:rec.durationMs,date:rec.date}).select();
      if(r.data&&r.data[0]){var x=r.data[0];_attendance.log.unshift({id:x.id,memberId:x.member_id,name:x.name,avatar:x.avatar,hub:x.hub,program:x.program,inAt:x.in_at,outAt:x.out_at,durationMs:x.duration_ms,date:x.date});}
    }catch(e){console.error(e);}
    delete _attendance.open[_session.id];
  };

  console.log("[BFA] Supabase cloud backend active.");
})();
