(()=>{'use strict';
/* ---------- helpers ---------- */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const p2=n=>String(n).padStart(2,'0');
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const MN=['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
const MS=['ינו׳','פבר׳','מרץ','אפר׳','מאי','יוני','יולי','אוג׳','ספט׳','אוק׳','נוב׳','דצמ׳'];
const DN=['יום א׳','יום ב׳','יום ג׳','יום ד׳','יום ה׳','יום ו׳','שבת'];
const PAL=['#2f6fed','#f59e0b','#8e4ec6','#12a5b8','#e5484d','#d6409f','#6b7f2a','#a16207','#64748b','#0b6e99'];
const fmt=n=>(n<0?'−':'')+'₪'+Math.round(Math.abs(n)).toLocaleString('he-IL');
const fmtK=n=>{const a=Math.abs(n);return (n<0?'−':'')+'₪'+(a>=1000?(a/1000).toFixed(a>=10000?0:1).replace(/\.0$/,'')+'K':Math.round(a))};
const rid=(n=12)=>{const a=new Uint8Array(n);crypto.getRandomValues(a);return [...a].map(b=>'abcdefghijklmnopqrstuvwxyz0123456789'[b%36]).join('')};
const HEX=/^#[0-9a-f]{6}$/i,YMD=/^\d{4}-\d{2}-\d{2}$/;
const T0=new Date();
const todayStr=`${T0.getFullYear()}-${p2(T0.getMonth()+1)}-${p2(T0.getDate())}`;
const nowYm=todayStr.slice(0,7);
const ymOf=d=>String(d).slice(0,7);
const shiftYm=(ym,k)=>{const [y,m]=ym.split('-').map(Number);const d=new Date(y,m-1+k,1);return `${d.getFullYear()}-${p2(d.getMonth()+1)}`};
const mIdx=ym=>+ym.slice(5)-1;
const APP_URL=location.origin+location.pathname;

const DEF=()=>[
  {id:'c1',k:'exp',name:'מגורים ושכירות',color:'#2f6fed',pct:30},
  {id:'c2',k:'exp',name:'סופר ואוכל',color:'#f59e0b',pct:15},
  {id:'c3',k:'exp',name:'תחבורה ודלק',color:'#8e4ec6',pct:8},
  {id:'c4',k:'exp',name:'חשבונות ותקשורת',color:'#12a5b8',pct:7},
  {id:'c5',k:'exp',name:'בילויים ומסעדות',color:'#e5484d',pct:8},
  {id:'c6',k:'exp',name:'ציוד ועבודה',color:'#d6409f',pct:7},
  {id:'c7',k:'exp',name:'בריאות וביטוחים',color:'#6b7f2a',pct:5},
  {id:'c8',k:'exp',name:'חיסכון והשקעות',color:'#a16207',pct:15,sav:true},
  {id:'c9',k:'exp',name:'שונות',color:'#64748b',pct:5},
  {id:'i1',k:'inc',name:'משכורת',color:'#00a862',sal:true},
  {id:'i2',k:'inc',name:'עבודות צד',color:'#12a5b8'},
  {id:'i3',k:'inc',name:'הכנסה אחרת',color:'#6b7f2a'}];
const blank=()=>({cats:DEF().map(normCat),tx:[],items:[],goal:2000,alertPct:80,su:0,profile:{name:''}});
function sampleData(){
  let s=20261127;const r=()=>(s=s*16807%2147483647)/2147483647;const tx=[];
  for(let k=5;k>=0;k--){
    const ym=shiftYm(nowYm,-k),lim=k===0?T0.getDate():28,m=mIdx(ym)+1;
    const add=(day,t,a,c,n)=>{if(day<=lim)tx.push({id:rid(),d:`${ym}-${p2(day)}`,t,a:Math.round(a),c,n,img:'',u:0})};
    add(10,'inc',9800+(k%3===0?450:0),'i1','משכורת חודשית');
    if(r()>.45)add(3+Math.floor(r()*22),'inc',700+r()*2300,'i2','צילום אירוע');
    add(1,'exp',2900,'c1','שכר דירה');
    if(m%2===0)add(2,'exp',310,'c1','ארנונה');
    ['רמי לוי','שופרסל','מכולת','שוק'].forEach((n,i)=>add(4+i*7,'exp',260+r()*280,'c2',n));
    add(6,'exp',220+r()*90,'c3','דלק');add(20,'exp',190+r()*110,'c3','דלק');
    add(8,'exp',59,'c4','סלולר');add(8,'exp',99,'c4','אינטרנט');if(m%2)add(15,'exp',330+r()*140,'c4','חשמל');
    add(12,'exp',120+r()*110,'c5','מסעדה');add(23,'exp',60+r()*90,'c5','קפה ובילוי');
    if(r()>.45)add(16,'exp',150+r()*600,'c6','ציוד צילום');
    add(11,'exp',185,'c7','ביטוח בריאות');
    add(11,'exp',1500,'c8','העברה לחיסכון');
    if(r()>.5)add(24,'exp',60+r()*160,'c9','מתנה');
  }
  return {...blank(),tx};
}
function normCat(c){if(!c||typeof c!=='object')return null;return {id:String(c.id||rid()),k:c.k==='inc'?'inc':'exp',name:String(c.name||'ללא שם').slice(0,40),color:HEX.test(c.color||'')?c.color:'#64748b',pct:clamp(Math.round(+c.pct||0),0,100),sal:!!c.sal,sav:!!c.sav}}
function normTx(t){if(!t||!YMD.test(t.d))return null;const o={id:String(t.id||rid()),d:t.d,t:t.t==='inc'?'inc':'exp',a:Math.round(Math.abs(+t.a||0)*100)/100,c:String(t.c||''),n:String(t.n||'').slice(0,200),img:String(t.img||''),u:+t.u||0};const nt=String(t.note||'').slice(0,500);if(nt)o.note=nt;if(t.del)o.del=1;return o}
function normItem(it){if(!it||(it.k!=='msg'&&it.k!=='pic'))return null;const id=String(it.id||'').replace(/[^a-z0-9]/gi,'').slice(0,40);if(!id)return null;const o={id,k:it.k,u:+it.u||0,by:String(it.by||'').slice(0,40),dv:String(it.dv||'').replace(/[^a-z0-9]/gi,'').slice(0,20),ts:+it.ts||0,text:String(it.text||'').slice(0,2000),img:String(it.img||'').replace(/[^a-z0-9]/gi,'').slice(0,40)};if(it.del)o.del=1;return o}
function norm(d){
  const o=blank();if(!d||typeof d!=='object')return o;
  if(Array.isArray(d.cats)){const cs=d.cats.map(normCat).filter(Boolean);if(cs.some(c=>c.k==='exp')&&cs.some(c=>c.k==='inc'))o.cats=cs}
  if(Array.isArray(d.tx))o.tx=d.tx.map(normTx).filter(Boolean);
  if(Array.isArray(d.items))o.items=d.items.map(normItem).filter(Boolean);
  o.goal=d.goal===undefined?2000:Math.max(0,+d.goal||0);
  o.alertPct=clamp(+d.alertPct||80,50,100);
  o.su=+d.su||0;o.profile={name:String(d.profile?.name||'').slice(0,40)};
  return o;
}

/* ---------- state ---------- */
const LS='kesef-li-v1',LSY='kesef-sync-v1',LSU='kesef-ui-v1';
let S=blank(),sample=false,hist=[];
let SY={on:false,url:'',key:'',since:0,dirty:[],idirty:[],cfgDirty:false,last:0,err:'',sheet:'',sv:0};
const wide=matchMedia('(min-width:900px)').matches;
const ui={view:'home',cur:nowYm,scope:'month',typeF:'all',catF:'',q:'',sortK:'d',sortD:-1,mode:wide?'grid':'list',me:'',dev:'',read:0,ss:{int:8,idle:0,info:true},bg:{mode:'hero',int:10}};
function load(){
  let raw=null;try{raw=localStorage.getItem(LS)}catch{}
  if(raw){try{S=norm(JSON.parse(raw));sample=false}catch{S=norm(sampleData());sample=true}}else{S=norm(sampleData());sample=true}
  try{const y=JSON.parse(localStorage.getItem(LSY)||'null');if(y&&typeof y==='object')SY={...SY,...y,dirty:Array.isArray(y.dirty)?y.dirty:[],idirty:Array.isArray(y.idirty)?y.idirty:[]}}catch{}
  try{const u=JSON.parse(localStorage.getItem(LSU)||'null');if(u){if(u.mode==='list'||u.mode==='grid')ui.mode=u.mode;ui.me=String(u.me||'').slice(0,40);ui.dev=String(u.dev||'');ui.read=+u.read||0;if(u.ss)ui.ss={int:clamp(+u.ss.int||8,3,120),idle:clamp(+u.ss.idle||0,0,60),info:u.ss.info!==false};if(u.bg)ui.bg={mode:['hero','app','off'].includes(u.bg.mode)?u.bg.mode:'hero',int:clamp(+u.bg.int||10,3,300)}}}catch{}
  if(!/^[a-z0-9]{8,}$/.test(ui.dev))ui.dev=rid(10);
}
let saveT=null,storageOk=true;
function persist(){clearTimeout(saveT);saveT=setTimeout(persistNow,150)}
function persistNow(){
  try{if(!sample)localStorage.setItem(LS,JSON.stringify(S));localStorage.setItem(LSY,JSON.stringify(SY));localStorage.setItem(LSU,JSON.stringify({mode:ui.mode,me:ui.me,dev:ui.dev,read:ui.read,ss:ui.ss,bg:ui.bg}));storageOk=true}
  catch{storageOk=false}
  chrome();
}
window.addEventListener('pagehide',persistNow);

const TX=()=>S.tx.filter(t=>!t.del);
const ITEMS=k=>S.items.filter(i=>i.k===k&&!i.del).sort((a,b)=>a.ts-b.ts);
const unread=()=>ITEMS('msg').filter(m=>m.dv!==ui.dev&&m.ts>ui.read).length;
const cat=id=>S.cats.find(c=>c.id===id);
const col=c=>HEX.test(c?.color||'')?c.color:'#64748b';
const exps=()=>S.cats.filter(c=>c.k==='exp');
const incs=()=>S.cats.filter(c=>c.k==='inc');
const inM=ym=>TX().filter(t=>t.d.slice(0,7)===ym);
const tot=(ym,k)=>inM(ym).filter(t=>t.t===k).reduce((s,t)=>s+(+t.a||0),0);
const salary=ym=>inM(ym).filter(t=>t.t==='inc'&&cat(t.c)?.sal).reduce((s,t)=>s+(+t.a||0),0);
const spent=(ym,id)=>inM(ym).filter(t=>t.c===id).reduce((s,t)=>s+(+t.a||0),0);
const G=()=>Math.max(0,+S.goal||0);
const AP=()=>clamp(+S.alertPct||80,50,100);
const budgetOf=(ym,c)=>salary(ym)*(+c.pct||0)/100;
const savedIn=ym=>S.cats.filter(c=>c.sav).reduce((s,c)=>s+spent(ym,c.id),0);
const defDate=()=>ui.cur===nowYm?todayStr:ui.cur+'-01';
function lvl(ym,id){const c=cat(id);if(!c||c.k!=='exp'||c.sav)return 0;const b=budgetOf(ym,c);if(!b)return 0;const r=spent(ym,id)/b;return r>1.0001?2:r>=AP()/100?1:0}
function snapLv(yms){const o={};[...new Set(yms)].forEach(ym=>exps().forEach(c=>o[ym+'|'+c.id]=lvl(ym,c.id)));return o}
function crossMsg(before){for(const k in before){const [ym,id]=k.split('|');const n=lvl(ym,id);if(n>before[k]){const c=cat(id),b=budgetOf(ym,c),sp=spent(ym,id);return n===2?`שים לב: ${c.name} חרגה מהתקציב ב־${fmt(sp-b)}.`:`שים לב: ${c.name} הגיעה ל־${Math.round(sp/b*100)}% מהתקציב.`}}return ''}

/* ---------- mutations ---------- */
function pushHist(){hist.push(JSON.stringify(S));if(hist.length>60)hist.shift()}
function markDirty(id){if(SY.on&&!SY.dirty.includes(id))SY.dirty.push(id)}
function markIDirty(id){if(SY.on&&!SY.idirty.includes(id))SY.idirty.push(id)}
function change(fn,{tx=[],items=[],cfg=false,undo=true}={}){
  if(undo)pushHist();
  sample=false;
  const r=fn();const t=Date.now();
  tx.forEach(id=>{const x=S.tx.find(y=>y.id===id);if(x){x.u=t;markDirty(id)}});
  items.forEach(id=>{const x=S.items.find(y=>y.id===id);if(x){x.u=t;markIDirty(id)}});
  if(cfg){S.su=t;if(SY.on)SY.cfgDirty=true}
  persist();render();Sync.schedule();
  return r;
}
function removeItem(id){const i=S.items.findIndex(t=>t.id===id);if(i<0)return;if(SY.on){S.items[i].del=1}else S.items.splice(i,1)}
function removeTx(id){const i=S.tx.findIndex(t=>t.id===id);if(i<0)return;if(SY.on){S.tx[i].del=1}else S.tx.splice(i,1)}
function replaceAll(next){
  const t=Date.now();
  if(SY.on){
    const prev=new Map(S.tx.map(x=>[x.id,x]));const nids=new Set(next.tx.map(x=>x.id));
    const strip=x=>JSON.stringify({...x,u:0});
    next.tx.forEach(x=>{const p=prev.get(x.id);if(!p||strip(p)!==strip(x)){x.u=t;markDirty(x.id)}});
    prev.forEach((p,id)=>{if(!nids.has(id)&&!p.del){next.tx.push({...p,del:1,u:t});markDirty(id)}});
    const prevI=new Map(S.items.map(x=>[x.id,x]));const nI=new Set(next.items.map(x=>x.id));
    next.items.forEach(x=>{const p=prevI.get(x.id);if(!p||strip(p)!==strip(x)){x.u=t;markIDirty(x.id)}});
    prevI.forEach((p,id)=>{if(!nI.has(id)&&!p.del){next.items.push({...p,del:1,u:t});markIDirty(id)}});
    SY.cfgDirty=true;
  }
  next.su=t;S=next;sample=false;persist();render();Sync.schedule();
}
function undo(){if(!hist.length){toast('אין מה לבטל');return}replaceAll(norm(JSON.parse(hist.pop())));toast('הפעולה האחרונה בוטלה')}

/* ---------- images (IndexedDB) ---------- */
const IDB={p:null,
  open(){return this.p||(this.p=new Promise((res,rej)=>{if(!window.indexedDB)return rej(new Error('noidb'));const r=indexedDB.open('kesef',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}))},
  async run(mode,fn){const db=await this.open();return new Promise((res,rej)=>{const t=db.transaction('kv',mode);const q=fn(t.objectStore('kv'));t.oncomplete=()=>res(q&&q.result);t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error)})},
  get(k){return this.run('readonly',s=>s.get(k))},put(k,v){return this.run('readwrite',s=>s.put(v,k))},del(k){return this.run('readwrite',s=>s.delete(k))}
};
const URLS=new Map(),PEND=new Map();
function bufToB64(buf){const b=new Uint8Array(buf);let s='';for(let i=0;i<b.length;i+=0x8000)s+=String.fromCharCode.apply(null,b.subarray(i,i+0x8000));return btoa(s)}
function b64ToBuf(b64){const s=atob(b64);const a=new Uint8Array(s.length);for(let i=0;i<s.length;i++)a[i]=s.charCodeAt(i);return a.buffer}
async function imgURL(k){
  if(!k)return null;if(URLS.has(k))return URLS.get(k);if(PEND.has(k))return PEND.get(k);
  const p=(async()=>{
    let v=null;try{v=await IDB.get('i:'+k)}catch{}
    if(!v&&SY.on&&navigator.onLine){try{const r=await Sync.call({action:'getimg',id:k});if(r.ok&&r.b64){v={buf:b64ToBuf(r.b64),type:r.mime||'image/jpeg',up:true};IDB.put('i:'+k,v).catch(()=>{})}}catch{}}
    if(!v)return null;const u=URL.createObjectURL(new Blob([v.buf],{type:v.type||'image/jpeg'}));URLS.set(k,u);return u;
  })();
  PEND.set(k,p);const u=await p;PEND.delete(k);return u;
}
function hydrate(root){$$('img[data-img]',root).forEach(async im=>{const u=await imgURL(im.dataset.img);if(u&&im.isConnected)im.src=u})}
async function compress(file,max=1400){
  const url=URL.createObjectURL(file);
  try{
    const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('img'));i.src=url});
    const sc=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));const w=Math.max(1,Math.round(img.naturalWidth*sc)),h=Math.max(1,Math.round(img.naturalHeight*sc));
    const cv=document.createElement('canvas');cv.width=w;cv.height=h;const g=cv.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,w,h);g.drawImage(img,0,0,w,h);
    const blob=await new Promise(r=>cv.toBlob(r,'image/jpeg',.74));if(!blob)throw new Error('img');
    return {buf:await blob.arrayBuffer(),type:'image/jpeg'};
  }finally{URL.revokeObjectURL(url)}
}

/* ---------- sync with Google Sheets ---------- */
const Sync={busy:false,again:false,timer:null,upBusy:false,
  async call(body,url=SY.url,key=SY.key){
    const ctl=new AbortController();const to=setTimeout(()=>ctl.abort(),45000);
    try{
      const r=await fetch(url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({...body,key}),redirect:'follow',signal:ctl.signal});
      const t=await r.text();try{return JSON.parse(t)}catch{throw new Error('notjson')}
    }finally{clearTimeout(to)}
  },
  schedule(ms=1500){if(!SY.on)return;clearTimeout(this.timer);this.timer=setTimeout(()=>this.run(),ms)},
  async run(full=false){
    if(!SY.on)return;if(this.busy){this.again=true;return}
    if(!navigator.onLine){setSync('offline');return}
    this.busy=true;setSync('busy');
    try{
      const ids=[...new Set(SY.dirty)],sentU={};
      const tx=ids.map(id=>{const t=S.tx.find(x=>x.id===id);if(!t)return null;sentU[id]=t.u;return {id:t.id,d:t.d,t:t.t,a:t.a,c:t.c,cn:cat(t.c)?.name||'',n:t.n,note:t.note||'',img:t.img||'',u:t.u,del:t.del?1:0}}).filter(Boolean);
      const iids=[...new Set(SY.idirty)],sentI={};
      const items=iids.map(id=>{const t=S.items.find(x=>x.id===id);if(!t)return null;sentI[id]=t.u;return {...t,del:t.del?1:0}}).filter(Boolean);
      const cfgSent=SY.cfgDirty,su=S.su;
      const res=await this.call({action:'sync',since:full?0:SY.since,full,tx,items,cfg:cfgSent?{cats:S.cats,goal:G(),alertPct:AP(),name:S.profile.name,u:S.su}:null});
      if(!res||!res.ok)throw new Error(res&&res.err||'server');
      SY.dirty=SY.dirty.filter(id=>{const t=S.tx.find(x=>x.id===id);return t&&t.u!==sentU[id]});
      if(cfgSent&&S.su===su)SY.cfgDirty=false;
      SY.sv=+res.v||2;
      if(SY.sv>=3)SY.idirty=SY.idirty.filter(id=>{const t=S.items.find(x=>x.id===id);return t&&t.u!==sentI[id]});
      const changed=applyRemote(res,full);
      S.tx=S.tx.filter(t=>!(t.del&&!SY.dirty.includes(t.id)));
      if(SY.sv>=3)S.items=S.items.filter(t=>!(t.del&&!SY.idirty.includes(t.id)));
      SY.since=+res.now||SY.since;SY.last=Date.now();SY.err='';if(res.sheet)SY.sheet=res.sheet;
      persist();if(changed)render();setSync('ok');
      this.uploadImgs();
    }catch(e){SY.err=errText(e);persist();setSync('err')}
    this.busy=false;
    if(this.again||SY.dirty.length||SY.cfgDirty){this.again=false;if(SY.err==='')this.schedule(400)}
  },
  async uploadImgs(){
    if(!SY.on||this.upBusy)return;this.upBusy=true;
    try{
      const used=[...new Set(TX().map(t=>t.img).concat(ITEMS('pic').map(p=>p.img)).filter(Boolean))];
      for(const k of used){let v=null;try{v=await IDB.get('i:'+k)}catch{}if(!v||v.up)continue;
        const r=await this.call({action:'img',id:k,b64:bufToB64(v.buf),mime:v.type});
        if(r&&r.ok){v.up=true;await IDB.put('i:'+k,v).catch(()=>{})}}
    }catch{}
    this.upBusy=false;
  }
};
function errText(e){
  const m=String(e&&e.message||e);
  if(m==='notjson')return 'הכתובת לא מחזירה נתונים. בדוק שבפריסה נבחר Who has access: Anyone ושהדבקת את כתובת ה־Web app.';
  if(m==='key')return 'קוד ההצטרפות לא מתאים לגיליון הזה.';
  if(m==='paired')return 'הגיליון הזה כבר מחובר לחשבון. כדי להצטרף אליו צריך קוד הצטרפות מהמכשיר הראשון.';
  if(m==='busy')return 'הגיליון עסוק כרגע, ננסה שוב בעוד רגע.';
  if(m==='server')return 'שגיאה בסקריפט של הגיליון. נסה לפרוס אותו מחדש.';
  if(/abort/i.test(m))return 'הגיליון לא ענה בזמן. ננסה שוב.';
  return 'אין חיבור לגיליון כרגע. השינויים נשמרים במכשיר ויישלחו אחר כך.';
}
function resolveCat(name,id,kind){
  name=String(name||'').trim();
  let c=S.cats.find(x=>x.id===id&&x.name===name)||S.cats.find(x=>x.name===name&&x.k===kind)||S.cats.find(x=>x.name===name)||(id&&S.cats.find(x=>x.id===id));
  if(!c&&name){c={id:rid(8),k:kind,name:name.slice(0,40),color:PAL[S.cats.length%PAL.length],pct:0,sal:false,sav:false};S.cats.push(c);S.su=Date.now();if(SY.on)SY.cfgDirty=true}
  if(!c)c=S.cats.find(x=>x.k===kind&&/שונות|אחרת/.test(x.name))||S.cats.find(x=>x.k===kind)||S.cats[0];
  return c.id;
}
function applyRemote(res,full){
  let changed=false;
  if(res.cfg&&!SY.cfgDirty&&(+res.cfg.u||0)>(S.su||0)){
    const cs=Array.isArray(res.cfg.cats)?res.cfg.cats.map(normCat).filter(Boolean):[];
    if(cs.some(c=>c.k==='exp')&&cs.some(c=>c.k==='inc'))S.cats=cs;
    if(res.cfg.goal!==undefined)S.goal=Math.max(0,+res.cfg.goal||0);
    if(res.cfg.alertPct)S.alertPct=clamp(+res.cfg.alertPct,50,100);
    if(typeof res.cfg.name==='string')S.profile.name=res.cfg.name.slice(0,40);
    S.su=+res.cfg.u;changed=true;
  }
  (res.tx||[]).forEach(r=>{
    if(!r||!r.id)return;
    const i=S.tx.findIndex(x=>x.id===r.id),loc=S.tx[i];
    if(loc&&SY.dirty.includes(r.id)&&(loc.u||0)>(r.u||0))return;
    if(r.del||!YMD.test(r.d)){if(i>=0){S.tx.splice(i,1);changed=true}return}
    const kind=r.t==='inc'?'inc':'exp';
    const o={id:String(r.id),d:r.d,t:kind,a:Math.round(Math.abs(+r.a||0)*100)/100,c:resolveCat(r.cn,r.c,kind),n:String(r.n||'').slice(0,200),img:String(r.img||''),u:+r.u||0};
    if(r.note!==undefined){const nt=String(r.note||'').slice(0,500);if(nt)o.note=nt}else if(loc&&loc.note)o.note=loc.note;
    if(loc&&JSON.stringify(loc)===JSON.stringify(o))return;
    if(i>=0)S.tx[i]=o;else S.tx.push(o);changed=true;
  });
  if(full&&Array.isArray(res.ids)){const set=new Set(res.ids.map(String));const n=S.tx.length;S.tx=S.tx.filter(t=>set.has(t.id)||SY.dirty.includes(t.id));if(S.tx.length!==n)changed=true}
  const fresh=[];
  (res.items||[]).forEach(r=>{
    const o=normItem(r);if(!o)return;
    const i=S.items.findIndex(x=>x.id===o.id),loc=S.items[i];
    if(loc&&SY.idirty.includes(o.id)&&(loc.u||0)>(o.u||0))return;
    if(o.del){if(i>=0){S.items.splice(i,1);changed=true}return}
    if(loc&&JSON.stringify(loc)===JSON.stringify(o))return;
    if(!loc&&o.k==='msg'&&o.dv!==ui.dev&&o.ts>ui.read)fresh.push(o);
    if(i>=0)S.items[i]=o;else S.items.push(o);changed=true;
  });
  if(full&&Array.isArray(res.itemIds)){const set=new Set(res.itemIds.map(String));const n=S.items.length;S.items=S.items.filter(t=>set.has(t.id)||SY.idirty.includes(t.id));if(S.items.length!==n)changed=true}
  if(fresh.length&&ui.view!=='msgs'){const m=fresh[fresh.length-1];toast(`הודעה חדשה${m.by?' מ'+m.by:''}: ${m.text.slice(0,60)}`)}
  return changed;
}
let syncState='off';
function setSync(st){syncState=SY.on?st:'off';chrome();if(ui.view==='sync')renderSync()}
function agoText(ms){if(!ms)return 'עוד לא';const s=Math.round((Date.now()-ms)/1000);if(s<60)return 'הרגע';const m=Math.round(s/60);if(m<60)return `לפני ${m} דק׳`;const h=Math.round(m/60);if(h<24)return `לפני ${h} שע׳`;return new Date(ms).toLocaleDateString('he-IL')}
const enc=o=>'KSF1.'+btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
function dec(code){const s=String(code||'').replace(/\s+/g,'');const m=s.match(/KSF1\.([A-Za-z0-9_-]+)/);if(!m)return null;try{let b=m[1].replace(/-/g,'+').replace(/_/g,'/');while(b.length%4)b+='=';const o=JSON.parse(decodeURIComponent(escape(atob(b))));return o&&o.u&&o.k?o:null}catch{return null}}
const inviteCode=()=>enc({u:SY.url,k:SY.key});
const validUrl=u=>/^https:\/\/script\.google(usercontent)?\.com\/.+/.test(u);
function urlProblem(u){
  if(!/^https:\/\/script\.google\.com\//.test(u))return 'זו לא כתובת של Apps Script. היא צריכה להתחיל ב־https://script.google.com';
  if(/\/library\//.test(u))return 'זו כתובת של ספרייה (Library), לא של אפליקציית ווב. חזור ל־Deploy ← New deployment, ובגלגל השיניים בחר Web app במקום Library.';
  if(/\/dev(\?|$)/.test(u))return 'זו כתובת בדיקה שמסתיימת ב־/dev. צריך את ה־Web app URL שמופיע אחרי Deploy, זה שמסתיים ב־/exec.';
  if(!/\/exec(\?.*)?$/.test(u))return 'הכתובת צריכה להסתיים ב־/exec. העתק את כל ה־Web app URL מחלון הפריסה.';
  return '';
}
const CONNECT_HELP='לא הצלחתי להתחבר לגיליון. בדוק שבחלון הפריסה נבחר Web app, ש־Who has access הוא Anyone (ולא Anyone with Google account), ושאישרת את ההרשאות. אם שינית משהו, צריך לפרוס שוב ולהעתיק את הכתובת החדשה.';

async function connectNew(url){
  url=url.trim();if(!validUrl(url))throw new Error('url');
  const key=rid(24);const res=await Sync.call({action:'pair'},url,key);
  if(!res||!res.ok)throw new Error(res&&res.err||'server');
  await startSync(url,key,true,res.sheet,res.v);
}
async function connectJoin(code,merge){
  const o=dec(code);if(!o)throw new Error('code');
  const res=await Sync.call({action:'ping'},o.u,o.k);
  if(!res||!res.ok)throw new Error(res&&res.err||'server');
  await startSync(o.u,o.k,merge,res.sheet,res.v);
}
async function startSync(url,key,merge,sheet,v){
  if(sample){S=blank();sample=false}
  SY={on:true,url,key,since:0,dirty:[],idirty:[],cfgDirty:false,last:0,err:'',sheet:sheet||'',sv:+v||2};
  if(merge){S.tx=S.tx.filter(t=>!t.del);S.tx.forEach(t=>{t.u=t.u||Date.now();SY.dirty.push(t.id)});S.items=S.items.filter(t=>!t.del);S.items.forEach(t=>{t.u=t.u||Date.now();SY.idirty.push(t.id)});S.su=Date.now();SY.cfgDirty=true}
  else{S.tx=[];S.items=[];S.su=0}
  if(merge){const used=[...new Set(TX().map(t=>t.img).concat(ITEMS('pic').map(p=>p.img)).filter(Boolean))];
    for(const k of used){try{const x=await IDB.get('i:'+k);if(x&&x.up){x.up=false;await IDB.put('i:'+k,x)}}catch{}}}
  hist=[];persistNow();render();Sync.run(true);
}

/* ---------- toast, dialogs ---------- */
let tt;
function toast(msg,undoable){$('#tmsg').textContent=msg;$('#tundo').hidden=!undoable;$('#toast').classList.add('on');clearTimeout(tt);tt=setTimeout(()=>$('#toast').classList.remove('on'),6000)}
function show(d){try{d.showModal()}catch{d.setAttribute('open','')}}
function hide(d){try{d.close()}catch{d.removeAttribute('open')}}
function ask(title,text,ok='אישור',danger=false){return new Promise(res=>{const d=$('#dAsk');$('#askT').textContent=title;$('#askX').textContent=text;const b=$('#askOk');b.textContent=ok;b.className='btn '+(danger?'solid danger':'solid');
  const done=v=>{b.onclick=null;$('#askNo').onclick=null;d.onclose=null;hide(d);res(v)};b.onclick=()=>done(true);$('#askNo').onclick=()=>done(false);d.onclose=()=>res(false);show(d)})}
function showText(title,text,body){$('#textT').textContent=title;$('#textX').textContent=text;$('#textA').value=body;show($('#dText'));setTimeout(()=>{$('#textA').focus();$('#textA').select()},80)}
async function copyText(s,okMsg,title){try{await navigator.clipboard.writeText(s);toast(okMsg)}catch{showText(title||'העתקה','ההעתקה האוטומטית לא זמינה כאן. סמן את הטקסט והעתק.',s)}}
async function dl(name,blob){
  try{const f=new File([blob],name,{type:blob.type});if(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)&&navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],title:name});return true}}catch(e){if(e&&e.name==='AbortError')return false}
  const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);return true;
}
let xlsxP=null;
function loadXLSX(){if(window.XLSX)return Promise.resolve();return xlsxP||(xlsxP=new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';s.onload=()=>res();s.onerror=()=>{xlsxP=null;rej(new Error('xlsx'))};document.head.appendChild(s)}))}

/* ---------- chrome: drawer, router, status ---------- */
const TITLES={home:'סקירה',tx:'תנועות',budget:'תקציב ויעד',msgs:'הודעות',album:'תמונות ורקע',import:'ייבוא מאקסל ושיטס',sync:'סנכרון משותף',backup:'גיבוי וייצוא',profile:'פרופיל והתקנה'};
function openDrawer(){$('#drawer').classList.add('open');$('#scrim').hidden=false;$('#menuBtn').setAttribute('aria-expanded','true');setTimeout(()=>$('#drawer .menu a.on, #drawer .menu a')?.focus(),50)}
function closeDrawer(){$('#drawer').classList.remove('open');$('#scrim').hidden=true;$('#menuBtn').setAttribute('aria-expanded','false')}
function openSpeed(){$('#speed').hidden=false;$('#scrim2').hidden=false;$('#fab').setAttribute('aria-expanded','true')}
function closeSpeed(){$('#speed').hidden=true;$('#scrim2').hidden=true;$('#fab').setAttribute('aria-expanded','false')}
function route(){
  const v=(location.hash||'#home').slice(1);ui.view=TITLES[v]?v:'home';
  $$('.view').forEach(s=>s.hidden=s.dataset.view!==ui.view);document.body.dataset.view=ui.view;$('#msgF').hidden=ui.view!=='msgs';
  $$('[data-nav]').forEach(a=>{const on=a.dataset.nav===ui.view;a.classList.toggle('on',on);if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
  $('#vTitle').textContent=TITLES[ui.view];
  $('#mnav').hidden=!['home','tx','budget'].includes(ui.view);
  closeDrawer();closeSpeed();render();if(ui.view==='msgs')scrollChat();else window.scrollTo(0,0);
}
let avatarURL=null;
async function loadAvatar(){let v=null;try{v=await IDB.get('profile')}catch{}if(avatarURL){URL.revokeObjectURL(avatarURL);avatarURL=null}if(v)avatarURL=URL.createObjectURL(new Blob([v.buf],{type:v.type}));
  $$('.avatar').forEach(a=>{const im=$('img',a),sp=$('span',a);if(avatarURL){im.src=avatarURL;im.hidden=false;sp.hidden=true}else{im.hidden=true;im.removeAttribute('src');sp.hidden=false}});$('#pPhotoDel').hidden=!avatarURL}
function chrome(){
  const nm=S.profile.name||'הכסף שלי';$('#hhName').textContent=nm;document.title=nm;$('meta[name=apple-mobile-web-app-title]')?.setAttribute('content',nm);
  const un=unread();$$('[data-unread]').forEach(b=>{b.hidden=!un;b.textContent=un>9?'9+':String(un)});
  $('#mlabel').textContent=MN[mIdx(ui.cur)]+' '+ui.cur.slice(0,4);
  const sd=$('#sdot');sd.className='sdot '+(SY.on?syncState:'');
  const txt=!SY.on?(storageOk?'שמור במכשיר הזה':'הדפדפן חוסם שמירה, הורד גיבוי'):syncState==='busy'?'מסנכרן…':syncState==='err'?'הסנכרון נכשל, יש שינויים שמחכים':syncState==='offline'?'אין אינטרנט, השינויים מחכים':`מסונכרן עם הגיליון, ${agoText(SY.last)}`;
  $('#dSync').textContent=txt;sd.setAttribute('aria-label','מצב סנכרון: '+txt);sd.title=txt;
  $('#mSync').className='mbadge'+(SY.on?(syncState==='err'?' err':' ok'):'');
}

/* ---------- render: home ---------- */
function renderHome(){
  const cur=ui.cur,pm=shiftYm(cur,-1),inc=tot(cur,'inc'),exp=tot(cur,'exp'),net=inc-exp,pi=tot(pm,'inc'),pe=tot(pm,'exp');
  const days=cur===nowYm?T0.getDate():new Date(+cur.slice(0,4),+cur.slice(5),0).getDate();
  const sv=savedIn(cur),mn=MN[mIdx(cur)],spend=exp-sv,pspend=pe-savedIn(pm);
  $('#big').textContent=!inc&&!exp?`עוד אין תנועות ב${mn}`:net>=0?`נשארו לך ${fmt(net)} ב${mn}`:`חרגת ב־${fmt(-net)} ב${mn}`;
  let top=null,tv=0;exps().forEach(c=>{const v=spent(cur,c.id);if(v>tv){tv=v;top=c}});
  $('#sub').textContent=inc?`הוצאת ${Math.round(spend/inc*100)}% מההכנסות${top?`, והכי הרבה הלך על ${top.name}`:''}.`:exp?`הוצאת ${fmt(exp)} ועוד לא נרשמה הכנסה החודש.`:'הוסף משכורת או הוצאה ראשונה כדי להתחיל.';
  const ch=(a,b)=>b?`${a>=b?'↑':'↓'} ${Math.abs(Math.round((a-b)/b*100))}% מהחודש הקודם`:'אין נתון לחודש הקודם';
  const f=[['הכנסות',fmt(inc),ch(inc,pi)],['הוצאות',fmt(spend),ch(spend,pspend)],['הופרש לחיסכון',fmt(sv),inc?`${Math.round(sv/inc*100)}% מההכנסות`:'לפי קטגוריית החיסכון'],['הוצאה ממוצעת ליום',fmt(exp/days),`על פני ${days} ימים`]];
  $('#figs').innerHTML=f.map(x=>`<div><span>${esc(x[0])}</span><b>${esc(x[1])}</b><small>${esc(x[2])}</small></div>`).join('');
  $('#noteHome').hidden=!sample;$('#hName').textContent=S.profile.name;
  renderHomeMsg();renderHomeAlbum();
  renderAlerts();renderGoal();renderCats();drawChart();
  const rec=inM(cur).sort((a,b)=>a.d<b.d?1:a.d>b.d?-1:0).slice(0,6);
  $('#recent').innerHTML=rec.length?`<div class="dayl">${rec.map(t=>txRow(t,true)).join('')}</div>`:'<p class="empty">אין תנועות בחודש הזה.</p>';
  hydrate($('#recent'));
}
function renderAlerts(){
  const out=[],cur=ui.cur,inc=tot(cur,'inc'),exp=tot(cur,'exp'),ap=AP();
  if(inc&&exp>inc)out.push(['over','ההוצאות עברו את ההכנסות',`הוצאת ${fmt(exp-inc)} יותר ממה שנכנס החודש.`]);
  exps().filter(c=>!c.sav).map(c=>({c,b:budgetOf(cur,c),s:spent(cur,c.id)})).filter(r=>r.b&&r.s/r.b>=ap/100).sort((a,b)=>b.s/b.b-a.s/a.b).forEach(r=>{
    const p=Math.round(r.s/r.b*100);
    out.push(r.s>r.b+.5?['over',`${r.c.name}: חריגה של ${fmt(r.s-r.b)}`,`הוצאת ${p}% מהתקציב (${fmt(r.s)} מתוך ${fmt(r.b)}).`]:['warn',`${r.c.name}: ניצלת ${p}% מהתקציב`,`נשארו ${fmt(r.b-r.s)} עד סוף החודש.`]);
  });
  const g=G(),sv=savedIn(cur);
  if(g&&sv<g&&cur===nowYm)out.push(['warn',`חסרים ${fmt(g-sv)} ליעד החיסכון`,`הפרשת ${fmt(sv)} מתוך ${fmt(g)} החודש.`]);
  if(!salary(cur)&&inM(cur).length)out.push(['warn','עוד לא נרשמה משכורת החודש','בלי משכורת אין תקציב לקטגוריות, אז אין גם התראות חריגה.']);
  const list=out.length?out:[['ok','הכול בתוך התקציב','אף קטגוריה לא קרובה לחריגה החודש.']];
  $('#alList').innerHTML=list.map(a=>`<li class="${a[0]}"><div><b>${esc(a[1])}</b><small>${esc(a[2])}</small></div></li>`).join('');
}
function renderGoal(){
  const cur=ui.cur,g=G(),sv=savedIn(cur),left=Math.max(0,tot(cur,'inc')-tot(cur,'exp')),mn=MN[mIdx(cur)];
  $('#gSaved').textContent=fmt(sv);$('#gOf').textContent=g?`מתוך יעד של ${fmt(g)} ב${mn}`:'לא הוגדר יעד';
  const pct=g?Math.min(100,sv/g*100):0,miss=Math.max(0,g-sv),pot=g?Math.min(miss,left)/g*100:0;
  $('#gBar').style.width=pct.toFixed(1)+'%';const gp=$('#gPot');gp.style.insetInlineStart=pct.toFixed(1)+'%';gp.style.width=pot.toFixed(1)+'%';
  $('#gTr').setAttribute('aria-label',`${Math.round(pct)}% מהיעד`);
  $('#gNote').textContent=!g?'הגדר יעד חודשי כדי לעקוב אחרי ההתקדמות.':!miss?`עמדת ביעד${sv>g?` ואף עברת אותו ב־${fmt(sv-g)}`:''}.`:left>=miss?`חסרים ${fmt(miss)}. היתרה שלך החודש (${fmt(left)}) מכסה את זה, החלק המקווקו מראה כמה תגיע אם תעביר.`:left>0?`חסרים ${fmt(miss)}. גם אם תעביר את כל היתרה (${fmt(left)}) עוד יחסרו ${fmt(miss-left)}.`:`חסרים ${fmt(miss)}, ואין כרגע יתרה פנויה החודש.`;
  $('#gHist').innerHTML=[0,1,2,3,4,5].map(i=>{const k=shiftYm(cur,i-5),s2=savedIn(k),ok=g&&s2>=g;return `<div class="${ok?'ok':''}${k===cur?' now':''}" title="${esc(MN[mIdx(k)]+': '+fmt(s2))}"><span></span>${MS[mIdx(k)]}</div>`}).join('');
}
function renderCats(){
  const cur=ui.cur,sal=salary(cur);
  const rows=exps().map(c=>({c,s:spent(cur,c.id),b:budgetOf(cur,c)})).filter(r=>r.s||r.b).sort((a,b)=>b.s-a.s||b.b-a.b);
  const maxS=Math.max(1,...rows.map(r=>r.s));
  $('#catHint').textContent=sal?`התקציב נגזר מחלוקת המשכורת של החודש (${fmt(sal)}). הקו השחור מסמן את התקציב.`:'עוד לא נרשמה משכורת החודש, לכן מוצגות רק ההוצאות בפועל.';
  $('#cats').innerHTML=rows.length?rows.map(r=>{const den=r.b?Math.max(r.b,r.s):maxS,over=r.b&&r.s>r.b+.5;const note=r.b?(over?`חריגה של ${fmt(r.s-r.b)}`:`נשארו ${fmt(r.b-r.s)} מתוך ${fmt(r.b)}`):'ללא תקציב';
    return `<div class="cr${over?' over':''}"><span class="cn"><i style="background:${col(r.c)}"></i>${esc(r.c.name)}</span><div class="tr"><b style="width:${(r.s/den*100).toFixed(1)}%;background:${col(r.c)}"></b>${r.b?`<u style="inset-inline-start:calc(${(r.b/den*100).toFixed(1)}% - 1px)"></u>`:''}</div><span class="cv">${fmt(r.s)}<small>${esc(note)}</small></span></div>`}).join(''):'<p class="empty">אין הוצאות בחודש הזה.</p>';
}
const svg=$('#chart');
const niceStep=x=>{const p=10**Math.floor(Math.log10(x||1)),f=x/p;return (f<=1?1:f<=2?2:f<=5?5:10)*p};
function drawChart(){
  const W=svg.clientWidth,H=svg.clientHeight;if(!W||!H)return;
  const cur=ui.cur,end=cur<=nowYm&&cur>=shiftYm(nowYm,-5)?nowYm:cur;
  const d=[0,1,2,3,4,5].map(i=>{const k=shiftYm(end,i-5);return {k,i:tot(k,'inc'),e:tot(k,'exp')}});
  const mx=Math.max(1,...d.map(x=>Math.max(x.i,x.e))),step=niceStep(mx/3),top=Math.ceil(mx/step)*step;
  const L=6,R=W<520?46:60,T=28,B=30,ih=H-T-B,iw=W-L-R,cw=iw/6,bw=Math.max(8,Math.min(30,cw*.3));const y=v=>T+ih-(v/top)*ih;
  let g='';
  d.forEach((m,i)=>{if(m.k===cur)g+=`<rect x="${L+cw*i+2}" y="2" width="${cw-4}" height="${H-4}" rx="10" fill="var(--mist)"/>`});
  for(let v=0;v<=top+1e-6;v+=step)g+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${W-R+8}" y="${y(v)+4}">${esc(fmtK(v))}</text>`;
  d.forEach((m,i)=>{const cx=L+cw*i+cw/2,sel=m.k===cur,n=m.i-m.e;
    g+=`<rect x="${cx-bw-2}" y="${y(m.i)}" width="${bw}" height="${T+ih-y(m.i)}" rx="3" fill="var(--inc)"/><rect x="${cx+2}" y="${y(m.e)}" width="${bw}" height="${T+ih-y(m.e)}" rx="3" fill="var(--ink)"/>`;
    if((m.i||m.e)&&(cw>=60||sel))g+=`<text x="${cx}" y="${Math.min(y(m.i),y(m.e))-8}" text-anchor="middle" style="fill:${n>=0?'var(--inc)':'var(--over)'};font-weight:700">${n>=0?'+':''}${esc(fmtK(n))}</text>`;
    g+=`<text x="${cx}" y="${H-9}" text-anchor="middle" style="${sel?'fill:var(--ink);font-weight:700':''}">${(cw<70?MS:MN)[mIdx(m.k)]}</text><rect data-k="${m.k}" x="${L+cw*i}" y="0" width="${cw}" height="${H}" fill="transparent" style="cursor:pointer"><title>${MN[mIdx(m.k)]}: הכנסות ${esc(fmt(m.i))}, הוצאות ${esc(fmt(m.e))}</title></rect>`});
  svg.innerHTML=g;
}
const chartRO=new ResizeObserver(drawChart);chartRO.observe(svg);

/* ---------- render: transactions ---------- */
function dayLabel(d){const [y,m,dd]=d.split('-').map(Number);const dt=new Date(y,m-1,dd);const t=new Date(T0.getFullYear(),T0.getMonth(),T0.getDate());const diff=Math.round((t-dt)/864e5);
  const base=`${DN[dt.getDay()]}, ${dd} ב${MN[m-1]}${y!==T0.getFullYear()?' '+y:''}`;return diff===0?'היום, '+base:diff===1?'אתמול, '+base:base}
function txRow(t,withDate){const c=cat(t.c),inc=t.t==='inc';
  const sub=(c?.name||'ללא קטגוריה')+(withDate?', '+t.d.slice(8)+'/'+t.d.slice(5,7):'');
  return `<button class="txr" data-open="${esc(t.id)}"><span class="tav" style="--c:${col(c)}">${esc((c?.name||'?').slice(0,1))}${t.img?`<img data-img="${esc(t.img)}" alt="">`:''}</span><span class="tm"><b>${esc(t.n||c?.name||'ללא תיאור')}</b><small>${esc(sub)}</small>${t.note?`<small class="tnote"><svg class="ic"><use href="#i-note"/></svg>${esc(t.note)}</small>`:''}</span><span class="ta${inc?' inc':''}">${inc?'+':''}${fmt(t.a)}</span></button>`}
function catOpts(sel){const o=c=>`<option value="${esc(c.id)}"${c.id===sel?' selected':''}>${esc(c.name)}</option>`;return `<optgroup label="הוצאות">${exps().map(o).join('')}</optgroup><optgroup label="הכנסות">${incs().map(o).join('')}</optgroup>`}
function currentList(){
  let l=ui.scope==='month'?inM(ui.cur):TX();
  if(ui.typeF!=='all')l=l.filter(t=>t.t===ui.typeF);
  if(ui.catF)l=l.filter(t=>t.c===ui.catF);
  if(ui.q){const k=ui.q.toLowerCase();l=l.filter(t=>(t.n||'').toLowerCase().includes(k)||(t.note||'').toLowerCase().includes(k)||(cat(t.c)?.name||'').toLowerCase().includes(k)||String(t.a).includes(k))}
  const val=t=>ui.sortK==='a'?(t.t==='inc'?1:-1)*(+t.a||0):ui.sortK==='c'?(cat(t.c)?.name||''):ui.sortK==='n'?(t.n||''):t.d;
  return l.sort((a,b)=>{const x=val(a),z=val(b);return ((x<z?-1:x>z?1:0)*ui.sortD)||(a.d<b.d?1:a.d>b.d?-1:0)});
}
function setSeg(el,v){$$('button',el).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===v)))}
function renderTx(){
  $('#noteTx').hidden=!sample;
  $('#catF').innerHTML='<option value="">כל הקטגוריות</option>'+catOpts(ui.catF);
  setSeg($('#typeF'),ui.typeF);setSeg($('#scope'),ui.scope);setSeg($('#modeSeg'),ui.mode);
  const l=currentList();
  const ti=l.filter(t=>t.t==='inc').reduce((s,t)=>s+t.a,0),te=l.filter(t=>t.t==='exp').reduce((s,t)=>s+t.a,0);
  $('#tsum').textContent=`${l.length} תנועות, הכנסות ${fmt(ti)}, הוצאות ${fmt(te)}`;
  const grid=ui.mode==='grid';$('#txGrid').hidden=!grid;$('#txList').hidden=grid;$('#addRow').hidden=!grid;
  if(!grid){
    const by=new Map();l.slice().sort((a,b)=>a.d<b.d?1:a.d>b.d?-1:0).forEach(t=>{if(!by.has(t.d))by.set(t.d,[]);by.get(t.d).push(t)});
    $('#txList').innerHTML=l.length?[...by].map(([d,ts])=>{const net=ts.reduce((s,t)=>s+(t.t==='inc'?t.a:-t.a),0);return `<div class="day"><div class="dayh"><span>${esc(dayLabel(d))}</span><span>${net>0?'+':''}${fmt(net)}</span></div><div class="dayl">${ts.map(t=>txRow(t)).join('')}</div></div>`}).join(''):`<div class="card empty">${TX().length?'אין תנועות שמתאימות לסינון.':'עוד אין תנועות. לחץ על + כדי להוסיף, או ייבא מאקסל.'}</div>`;
    hydrate($('#txList'));return;
  }
  $$('#tbl th[data-s]').forEach(th=>{const b=$('button',th);b.textContent=b.textContent.replace(/ [↑↓]$/,'');if(th.dataset.s===ui.sortK){th.setAttribute('aria-sort',ui.sortD>0?'ascending':'descending');b.textContent+=ui.sortD>0?' ↑':' ↓'}else th.removeAttribute('aria-sort')});
  $('#tb').innerHTML=l.length?l.map(t=>{const c=cat(t.c);return `<tr data-id="${esc(t.id)}">
<td class="dt"><input type="date" data-f="d" value="${esc(t.d)}" aria-label="תאריך"></td>
<td class="nt"><input data-f="n" value="${esc(t.n)}" maxlength="120" placeholder="תיאור" aria-label="תיאור"></td>
<td class="ct" style="border-inline-start-color:${col(c)}"><select data-f="c" aria-label="קטגוריה">${catOpts(t.c)}</select></td>
<td class="amt ${t.t==='inc'?'inc':''}"><input type="number" inputmode="decimal" min="0" step="0.01" data-f="a" value="${+t.a||0}" aria-label="סכום"></td>
<td class="nto"><input data-f="note" value="${esc(t.note||'')}" maxlength="500" placeholder="הערה" aria-label="הערה"></td>
<td class="x px"><button class="mini" data-open="${esc(t.id)}" aria-label="פרטים ותמונה">${t.img?`<img data-img="${esc(t.img)}" alt="">`:'<svg class="ic"><use href="#i-cam"/></svg>'}</button></td>
<td class="x"><button data-del aria-label="מחק שורה"><svg class="ic"><use href="#i-x"/></svg></button></td></tr>`}).join(''):`<tr><td colspan="7" class="empty">${TX().length?'אין תנועות שמתאימות לסינון.':'עוד אין תנועות.'}</td></tr>`;
  hydrate($('#tb'));
}

/* ---------- render: budget ---------- */
function renderBudget(){
  const gi=$('#goalIn'),ai=$('#apIn');if(document.activeElement!==gi)gi.value=G();if(document.activeElement!==ai)ai.value=AP();
  const sal=salary(ui.cur);let sum=0;
  $('#setE').innerHTML=exps().map(c=>{sum+=+c.pct||0;return `<tr data-cid="${esc(c.id)}">
<td data-a="k"><input type="color" data-k="color" value="${col(c)}" aria-label="צבע"></td>
<td data-a="n"><input data-k="name" value="${esc(c.name)}" maxlength="40" aria-label="שם קטגוריה"></td>
<td data-a="p" data-l="% מהמשכורת" class="amt"><input type="number" min="0" max="100" step="1" inputmode="numeric" data-k="pct" value="${+c.pct||0}" aria-label="אחוז מהמשכורת"></td>
<td data-a="b" data-l="תקציב החודש" class="num">${fmt(sal*(+c.pct||0)/100)}</td>
<td data-a="a" data-l="הוצאת בפועל" class="num">${fmt(spent(ui.cur,c.id))}</td>
<td data-a="x" class="x"><button data-cdel aria-label="מחק קטגוריה"><svg class="ic"><use href="#i-x"/></svg></button></td></tr>`}).join('');
  const ps=$('#pctSum');ps.textContent=`מוקצה ${sum}% מהמשכורת`+(sum<100?`, ${100-sum}% נשארים חופשיים.`:sum>100?', יותר מ־100%. כדאי להוריד באחת הקטגוריות.':'. כל השקל מתוכנן.');ps.className='hint'+(sum>100?' bad':'');
  $('#setI').innerHTML=incs().map(c=>`<tr data-cid="${esc(c.id)}">
<td data-a="k"><input type="color" data-k="color" value="${col(c)}" aria-label="צבע"></td>
<td data-a="n"><input data-k="name" value="${esc(c.name)}" maxlength="40" aria-label="שם קטגוריה"></td>
<td data-a="s"><input type="checkbox" data-k="sal"${c.sal?' checked':''} aria-label="נכנסת לחלוקה"><span class="mob">נכנסת לחלוקה</span></td>
<td data-a="x" class="x"><button data-cdel aria-label="מחק קטגוריה"><svg class="ic"><use href="#i-x"/></svg></button></td></tr>`).join('');
}

/* ---------- render: sync ---------- */
let GS='';
fetch('apps-script.gs',{cache:'no-cache'}).then(r=>r.ok?r.text():'').then(t=>{GS=t}).catch(()=>{});
function renderSync(){
  const b=$('#syncBody');
  if(SY.on){
    const pend=SY.dirty.length+(SY.cfgDirty?1:0);const bad=syncState==='err';
    b.innerHTML=`<div class="card">
<div class="status${bad?' err':''}"><svg class="ic"><use href="#i-${bad?'alert':'check'}"/></svg><div><b>${bad?'הסנכרון נכשל':'מחובר לגיליון משותף'}</b><small>${esc(bad?SY.err:`עודכן ${agoText(SY.last)}${pend?`, ${pend} שינויים מחכים`:''}`)}</small></div></div>
<p class="hint">כל שינוי שאתה עושה נשלח לגיליון, והאפליקציה בודקת עדכונים מהמכשירים האחרים כל 20 שניות. אפשר גם לערוך ישירות בגיליון, והשינויים יגיעו לאפליקציה.</p>
<div class="btnrow"><button class="btn solid" data-act="sync-now">סנכרן עכשיו</button>${SY.sheet&&/^https:\/\//.test(SY.sheet)?`<a class="btn" href="${esc(SY.sheet)}" target="_blank" rel="noopener"><svg class="ic"><use href="#i-sheet"/></svg>פתח את הגיליון</a>`:''}</div></div>
${SY.sv&&SY.sv<4?`<div class="card"><h2>עדכון הסקריפט בגיליון</h2><p class="hint">יש גרסה חדשה של הסקריפט${SY.sv<3?' עם תמונות, הודעות והערות משותפות':' שמסנכרנת גם את ההערות על הוצאות'}. עד שתעדכן, הן נשמרות רק במכשיר ויישלחו אחרי העדכון. מעדכנים פעם אחת, ממכשיר אחד:</p><ol class="steps"><li><div><b>פותחים את עורך הסקריפטים</b><p>בגיליון: <kbd>Extensions</kbd> ← <kbd>Apps Script</kbd>.</p></div></li><li><div><b>מחליפים את הקוד</b><p>מוחקים את כל הקוד הישן, מדביקים את החדש ושומרים.</p><button class="btn solid sm" data-act="copy-gs">העתק את הקוד החדש</button></div></li><li><div><b>מפרסמים גרסה חדשה</b><p><kbd>Deploy</kbd> ← <kbd>Manage deployments</kbd> ← סמל העיפרון ← ב־<kbd>Version</kbd> בוחרים <kbd>New version</kbd> ← <kbd>Deploy</kbd>. הכתובת לא משתנה ואין צורך לחבר מחדש.</p></div></li></ol><button class="btn sm" data-act="sync-now">בדוק שוב</button></div>`:''}
<div class="card"><h2>הוספת שותף</h2><p class="hint">שלח את הקוד הזה למי שמנהל איתך את החשבון. הוא פותח את האפליקציה, נכנס לסנכרון משותף ובוחר "הצטרפות עם קוד". מי שיש לו את הקוד יכול לראות ולשנות את הנתונים, אז שלח אותו רק למי שאתה סומך עליו.</p>
<textarea class="field code" readonly rows="3" id="invTxt">${esc(inviteCode())}</textarea>
<div class="btnrow"><button class="btn solid" data-act="share-code">שלח קוד הצטרפות</button><button class="btn" data-act="copy-code">העתק</button></div></div>
<div class="card"><h2>ניתוק</h2><p class="hint">המכשיר יפסיק לסנכרן. הגיליון והמכשירים האחרים ממשיכים כרגיל. אם חיברת את החשבון בשביל מישהו אחר, בחר "נתק ומחק", ולא יישאר אצלך כלום מהנתונים שלהם.</p><div class="btnrow"><button class="btn sm" data-act="disconnect">נתק והשאר את הנתונים</button><button class="btn danger sm" data-act="disconnect-wipe">נתק ומחק מהמכשיר</button></div></div>`;
    return;
  }
  const last=sessionStorage.getItem('kesef-url')||'';
  b.innerHTML=`<div class="card"><h2>ניהול משותף דרך גוגל שיטס</h2>
<p class="hint" style="margin:0">מחברים את האפליקציה לגיליון גוגל שלכם. כל מה שמישהו מוסיף מופיע אצל כולם ובגיליון עצמו, אפשר לערוך גם בגיליון, והקבלות נשמרות בתיקייה בדרייב. הנתונים נשארים בחשבון הגוגל שלכם בלבד.</p></div>
<div class="card"><h2>יש לך קוד הצטרפות?</h2><p class="hint">אם השותף שלך כבר חיבר גיליון, הדבק כאן את הקוד שהוא שלח.</p>
<textarea class="field code" id="joinCode" rows="3" placeholder="KSF1.…" aria-label="קוד הצטרפות"></textarea>
<label class="chk"><input type="checkbox" id="joinMerge"${!sample&&TX().length?'':' disabled'}>הוסף לגיליון גם את התנועות שכבר יש לי במכשיר</label>
<p class="err" id="joinErr"></p>
<button class="btn solid" data-act="join">הצטרף</button></div>
<div class="card"><h2>חיבור גיליון חדש</h2><p class="hint">פעם אחת, כחמש דקות. הכי נוח לעשות את זה במחשב, ואחר כך כל השאר מצטרפים מהטלפון עם קוד.</p>
<ol class="steps">
<li><div><b>פותחים גיליון חדש</b><p>נכנסים ל־<a href="https://sheets.new" target="_blank" rel="noopener">sheets.new</a> ונותנים לו שם, למשל "הכסף שלי".</p></div></li>
<li><div><b>פותחים את עורך הסקריפטים</b><p>בתפריט של הגיליון: <kbd>Extensions</kbd> ← <kbd>Apps Script</kbd> (בעברית: תוספים ← Apps Script).</p></div></li>
<li><div><b>מדביקים את הקוד</b><p>מוחקים את מה שכתוב בעורך, מדביקים את הקוד ושומרים (סמל הדיסקט).</p><div class="btnrow" style="margin:0"><button class="btn solid sm" data-act="copy-gs">העתק את הקוד</button><button class="btn sm" data-act="show-gs">הצג את הקוד</button></div></div></li>
<li><div><b>פורסים כאפליקציית ווב</b><p><kbd>Deploy</kbd> ← <kbd>New deployment</kbd> ← בגלגל השיניים שליד Select type בוחרים <kbd>Web app</kbd> (לא Library). ב־<kbd>Execute as</kbd> בוחרים <kbd>Me</kbd>, וב־<kbd>Who has access</kbd> בוחרים <kbd>Anyone</kbd>. לוחצים <kbd>Deploy</kbd>.</p></div></li>
<li><div><b>מאשרים הרשאות</b><p><kbd>Authorize access</kbd> ← בוחרים את החשבון ← <kbd>Advanced</kbd> ← <kbd>Go to … (unsafe)</kbd> ← <kbd>Allow</kbd>. גוגל מזהירה כי זה סקריפט שלא עבר אישור שלהם. זה הסקריפט שלך, בגיליון שלך, והוא ניגש רק לגיליון הזה ולתיקיית הקבלות.</p></div></li>
<li><div><b>מדביקים כאן את הכתובת</b><p>אחרי Deploy מופיע <kbd>Web app URL</kbd>. מעתיקים אותו, כתובת שמתחילה ב־script.google.com/macros/s/ ומסתיימת ב־<kbd>/exec</kbd>, ומדביקים:</p>
<input class="field code" id="gsUrl" placeholder="https://script.google.com/macros/s/…/exec" value="${esc(last)}" aria-label="כתובת ה־Web app">
<p class="err" id="gsErr"></p><button class="btn solid" data-act="connect">חבר את הגיליון</button></div></li>
</ol>
<p class="hint">${sample?'נתוני הדוגמה לא יעלו לגיליון.':'התנועות שכבר יש לך במכשיר יעלו לגיליון.'}</p></div>`;
}

/* ---------- import ---------- */
const IMP={name:'',wb:null,sheet:'',aoa:[],hdr:0,map:{},opts:{auto:true,newCats:true,dedupe:true,defType:'exp',skipCard:false},parsed:null};
const CARDPAY=/חיוב כרטיס|מקס איט|ישראכרט|isracard|כאל |לאומי קארד|אמריקן אקספרס|דיינרס|חיוב חודשי כרטיס/i;
const FIELDS=[['d','תאריך'],['n','תיאור'],['o','הערה'],['a','סכום'],['out','סכום הוצאה (חובה)'],['in','סכום הכנסה (זכות)'],['t','סוג (הכנסה/הוצאה)'],['c','קטגוריה']];
const HRX={d:/תאריך|date|^יום$/i,n:/תיאור|פירוט|בית ה?עסק|שם ה?עסק|description|desc|payee|פרטים|אסמכתא.*תיאור/i,o:/^הער|note|memo|remark/i,a:/סכום|amount|sum|סה"?כ|total/i,out:/חובה|debit|withdraw|הוצאה|חיוב/i,in:/זכות|credit|deposit|זיכוי|הכנסה/i,t:/^סוג$|type|^סוג תנועה/i,c:/קטגוריה|category|ענף/i};
const RULES=[['סופר ואוכל',/שופרסל|רמי לוי|ויקטורי|יוחננוף|אושר עד|מגה|טיב טעם|חצי חינם|יינות ביתן|סופר|מכולת|קרפור|carrefour|פרש מרקט|מאפי|ירקות|קצביה/i],['תחבורה ודלק',/פז |סונול|דור אלון|דלק|yellow|רב.?קו|רכבת|אגד|gett|מונית|חניון|פנגו|pango|cellopark|סלופארק|כביש 6|נתיבי/i],['חשבונות ותקשורת',/סלקום|פרטנר|פלאפון|הוט |hot |בזק|גולן טלקום|we4g|חברת החשמל|חשמל|מקורות|תאגיד מים|ארנונה|סופרגז|אמישראגז|netflix|spotify|apple\.com|google/i],['בילויים ומסעדות',/ארומה|קפה|מקדונלד|בורגר|פיצה|וולט|wolt|תן ביס|10bis|מסעד|סינמה|קולנוע|גלידה|שווארמה|פלאפל|בר /i],['בריאות וביטוחים',/מכבי|כללית|מאוחדת|לאומית|סופר.?פארם|בי פארם|ביטוח|הראל|מגדל|הפניקס|מנורה|רופא|מרפאה/i],['מגורים ושכירות',/שכירות|שכר דירה|ועד בית|משכנתא/i],['חיסכון והשקעות',/חיסכון|השקע|גמל|קרן השתלמות|פיקדון|פקדון/i],['ציוד ועבודה',/ksp|באג |איבורי|ivory|מחסני חשמל|צילום|canon|קנון|amazon|אמזון|aliexpress|עלי אקספרס/i]];
const IRULES=[['משכורת',/משכורת|שכר עבודה|salary|payroll/i]];
function okDate(y,m,d){y=+y;m=+m;d=+d;if(y<1990||y>2100||m<1||m>12||d<1||d>31)return '';return `${y}-${p2(m)}-${p2(d)}`}
function cellDate(v){
  if(v instanceof Date&&!isNaN(v))return okDate(v.getFullYear(),v.getMonth()+1,v.getDate());
  if(typeof v==='number'&&v>20000&&v<80000){const d=new Date(Math.round((v-25569)*864e5));return okDate(d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate())}
  const s=String(v??'').trim();let m;
  if((m=s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/)))return okDate(m[1],m[2],m[3]);
  if((m=s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/))){let y=+m[3];if(y<100)y+=2000;return okDate(y,m[2],m[1])}
  return '';
}
function num(v){
  if(typeof v==='number')return v;let s=String(v??'').trim();if(!s)return 0;
  const neg=/^[-−]|[-−]$|^\(.*\)$/.test(s);s=s.replace(/[^\d.,]/g,'');
  if(s.includes(',')&&s.includes('.'))s=s.replace(/,/g,'');else if(/^\d{1,3}(,\d{3})+$/.test(s))s=s.replace(/,/g,'');else s=s.replace(',','.');
  const n=parseFloat(s)||0;return neg?-n:n;
}
function guessMap(){
  const h=(IMP.aoa[IMP.hdr]||[]).map(x=>String(x??'').trim());const used=new Set(),m={};
  for(const f of ['d','c','t','out','in','a','n','o']){const i=h.findIndex((x,j)=>!used.has(j)&&x&&HRX[f].test(x));if(i>=0){m[f]=i;used.add(i)}}
  if(m.a===undefined&&m.out===undefined&&m.in===undefined){const r=IMP.aoa.slice(IMP.hdr+1,IMP.hdr+20);const ncol=Math.max(0,...IMP.aoa.map(r=>r.length));for(let j=0;j<ncol;j++){if(used.has(j))continue;if(r.filter(x=>typeof x[j]==='number'||/^[-−]?[\d,.]+$/.test(String(x[j]??'').trim())).length>=r.length*.6&&r.length){m.a=j;used.add(j);break}}}
  if(m.d===undefined){const r=IMP.aoa.slice(IMP.hdr+1,IMP.hdr+20);const ncol=Math.max(0,...IMP.aoa.map(r=>r.length));for(let j=0;j<ncol;j++){if(!used.has(j)&&r.length&&r.filter(x=>cellDate(x[j])).length>=r.length*.6){m.d=j;used.add(j);break}}}
  IMP.map=m;
}
function findHeader(){let best=0,score=0;IMP.aoa.slice(0,20).forEach((r,i)=>{const sc=r.filter(x=>Object.values(HRX).some(rx=>rx.test(String(x??'').trim()))).length;if(sc>score){score=sc;best=i}});IMP.hdr=score>=2?best:0}
async function readFile(f){
  IMP.name=f.name;$('#impErr').textContent='';
  try{await loadXLSX()}catch{$('#impErr').textContent='לא הצלחתי לטעון את רכיב האקסל. בדוק את החיבור לאינטרנט ונסה שוב.';return}
  try{
    const buf=await f.arrayBuffer();let wb;
    if(/\.(csv|tsv|txt)$/i.test(f.name)||/csv|text/.test(f.type)){let text;try{text=new TextDecoder('utf-8',{fatal:true}).decode(buf)}catch{text=new TextDecoder('windows-1255').decode(buf)}text=text.replace(/^\ufeff/,'');wb=XLSX.read(text,{type:'string',raw:true,FS:/\.tsv$/i.test(f.name)?'\t':undefined})}
    else wb=XLSX.read(buf,{type:'array',cellDates:false});
    IMP.wb=wb;const rc=n=>{const r=wb.Sheets[n]['!ref'];return r?XLSX.utils.decode_range(r).e.r:0};IMP.sheet=wb.SheetNames.reduce((b,n)=>rc(n)>rc(b)?n:b,wb.SheetNames[0]);loadSheet();
  }catch{$('#impErr').textContent='לא הצלחתי לקרוא את הקובץ. נסה לשמור אותו כ־xlsx או csv.';}
}
function loadSheet(){const ws=IMP.wb.Sheets[IMP.sheet];IMP.aoa=XLSX.utils.sheet_to_json(ws,{header:1,raw:true,defval:'',blankrows:false});findHeader();guessMap();parseImp();renderImport();}
function ruleCat(n,kind){for(const [name,rx] of (kind==='inc'?IRULES:RULES))if(rx.test(n)){const c=S.cats.find(x=>x.k===kind&&x.name===name);if(c)return c.id}return ''}
function parseImp(){
  const m=IMP.map,rows=IMP.aoa.slice(IMP.hdr+1),out=[];let bad=0,dup=0,cardN=0;
  const has=k=>m[k]!==undefined&&m[k]!=='';
  const hasNeg=has('a')&&rows.some(r=>num(r[m.a])<0);
  const seen=new Set(TX().map(t=>`${t.d}|${(+t.a).toFixed(2)}|${(t.n||'').trim()}`));
  const newCats=new Map();
  rows.forEach(r=>{
    const d=has('d')?cellDate(r[m.d]):'';let a=0,t='exp';
    if(has('out')||has('in')){const o=has('out')?num(r[m.out]):0,i=has('in')?num(r[m.in]):0;if(o>0){a=o;t='exp'}else if(o<0){a=-o;t='inc'}else if(i>0){a=i;t='inc'}else if(i<0){a=-i;t='exp'}}
    else if(has('a')){const v=num(r[m.a]);a=Math.abs(v);if(has('t'))t=/הכנס|זכות|income|credit|^in$|זיכוי/i.test(String(r[m.t]))?'inc':'exp';else if(hasNeg)t=v<0?'exp':'inc';else t=IMP.opts.defType}
    const n=has('n')?String(r[m.n]??'').trim().slice(0,120):'';
    if(!d||!(a>0)){if(r.some(x=>String(x??'').trim()))bad++;return}
    if(t==='exp'&&CARDPAY.test(n)){cardN++;if(IMP.opts.skipCard)return}
    a=Math.round(a*100)/100;
    let c='',cnNew='';
    if(has('c')){const nm=String(r[m.c]??'').trim();if(nm){const ex=S.cats.find(x=>x.name===nm&&x.k===t)||S.cats.find(x=>x.name===nm);if(ex)c=ex.id;else if(IMP.opts.newCats)cnNew=nm.slice(0,40)}}
    if(!c&&!cnNew&&IMP.opts.auto)c=ruleCat(n,t);
    if(!c&&!cnNew)c=(S.cats.find(x=>x.k===t&&/שונות|אחרת/.test(x.name))||S.cats.find(x=>x.k===t)).id;
    if(cnNew){const k=cnNew+'|'+t;if(!newCats.has(k))newCats.set(k,{id:rid(8),k:t,name:cnNew,color:PAL[(S.cats.length+newCats.size)%PAL.length],pct:0,sal:false,sav:false});c=newCats.get(k).id}
    const isDup=IMP.opts.dedupe&&seen.has(`${d}|${a.toFixed(2)}|${n}`);if(isDup)dup++;
    const o=has('o')?String(r[m.o]??'').trim().slice(0,500):'';
    out.push({d,a,t,c,n,o,dup:isDup});
  });
  IMP.parsed={rows:out,bad,dup,cardN,newCats:[...newCats.values()]};
}
function renderImport(){
  const b=$('#impBody');if(!IMP.aoa.length){b.hidden=true;return}b.hidden=false;
  const h=IMP.aoa[IMP.hdr]||[],ncol=Math.max(...IMP.aoa.slice(0,50).map(r=>r.length),h.length);
  const L=j=>j<26?String.fromCharCode(65+j):'C'+(j+1);
  const opt=f=>`<option value="">לא בשימוש</option>`+Array.from({length:ncol},(_,j)=>`<option value="${j}"${IMP.map[f]===j?' selected':''}>${L(j)}: ${esc(String(h[j]??'').slice(0,24)||'ללא כותרת')}</option>`).join('');
  const P=IMP.parsed,good=P.rows.filter(r=>!r.dup),allCats=[...S.cats,...P.newCats];
  const M=IMP.map,needDef=M.a!==undefined&&M.t===undefined&&M.out===undefined&&M.in===undefined&&!IMP.aoa.slice(IMP.hdr+1).some(r=>num(r[M.a])<0);
  b.innerHTML=`<div class="ch"><h2>${esc(IMP.name)}</h2>${IMP.wb.SheetNames.length>1?`<label class="lbl" style="margin:0">גיליון <select class="field" id="impSheet" style="width:auto">${IMP.wb.SheetNames.map(n=>`<option${n===IMP.sheet?' selected':''}>${esc(n)}</option>`).join('')}</select></label>`:''}</div>
<p class="hint">זיהיתי את העמודות לבד. בדוק שהן נכונות ותקן אם צריך. לקובץ בנק עם עמודות חובה וזכות, בחר אותן במקום "סכום".</p>
<div class="mapg"><label>שורת הכותרות<input class="field" type="number" min="1" max="${IMP.aoa.length}" id="impHdr" value="${IMP.hdr+1}"></label>${FIELDS.map(([f,l])=>`<label>${l}<select class="field" data-map="${f}">${opt(f)}</select></label>`).join('')}</div>
<label class="chk"><input type="checkbox" data-opt="auto"${IMP.opts.auto?' checked':''}>שיוך אוטומטי לקטגוריות לפי שם העסק (שופרסל לסופר, פז לדלק וכו׳)</label>
<label class="chk"><input type="checkbox" data-opt="newCats"${IMP.opts.newCats?' checked':''}>ליצור קטגוריות חדשות לפי עמודת הקטגוריה בקובץ</label>
<label class="chk"><input type="checkbox" data-opt="dedupe"${IMP.opts.dedupe?' checked':''}>לדלג על תנועות שכבר קיימות (אותו תאריך, סכום ותיאור)</label>
${P.cardN?`<label class="chk"><input type="checkbox" data-opt="skipCard"${IMP.opts.skipCard?' checked':''}>לדלג על ${P.cardN} תשלומי כרטיס אשראי. סמן אם אתה מייבא גם את פירוט הכרטיס, אחרת אותן הוצאות ייספרו פעמיים</label>`:''}
${needDef?`<div class="lbl" style="margin-top:8px">כל הסכומים בקובץ חיוביים. הם:</div><div class="seg" id="impDef"><button type="button" data-v="exp" aria-pressed="${IMP.opts.defType==='exp'}">הוצאות</button><button type="button" data-v="inc" aria-pressed="${IMP.opts.defType==='inc'}">הכנסות</button></div>`:''}
<p style="margin:14px 0 0"><b>${good.length} תנועות לייבוא</b>${P.dup?`, ${P.dup} כפולות ידולגו`:''}${P.bad?`, ${P.bad} שורות בלי תאריך או סכום לא ייקראו`:''}${P.newCats.length?`, ${P.newCats.length} קטגוריות חדשות`:''}.</p>
<div class="sheet prev"><div class="scroll"><table><thead><tr><th>תאריך</th><th>תיאור</th><th style="text-align:end">סכום</th><th>קטגוריה</th></tr></thead><tbody>${P.rows.slice(0,12).map(r=>{const c=allCats.find(x=>x.id===r.c);return `<tr class="${r.dup?'skip':''}"><td>${esc(r.d.split('-').reverse().join('/'))}</td><td class="n">${esc(r.n)}</td><td class="num${r.t==='inc'?' okt':''}">${r.t==='inc'?'+':''}${fmt(r.a)}</td><td><i class="sw" style="background:${col(c)}"></i> ${esc(c?.name||'')}</td></tr>`}).join('')||'<tr><td colspan="4" class="empty">לא נמצאו שורות. בדוק את שורת הכותרות ואת עמודות התאריך והסכום.</td></tr>'}</tbody></table></div></div>
<div class="btnrow"><button class="btn solid" data-act="imp-go"${good.length?'':' disabled'}>ייבא ${good.length} תנועות</button><button class="btn" data-act="imp-cancel">ביטול</button></div>`;
}
function doImport(){
  const P=IMP.parsed,good=P.rows.filter(r=>!r.dup);if(!good.length)return;
  const ids=[];const usedNew=new Set(good.map(r=>r.c));
  change(()=>{P.newCats.filter(c=>usedNew.has(c.id)).forEach(c=>S.cats.push(normCat(c)));good.forEach(r=>{const id=rid();ids.push(id);S.tx.push({id,d:r.d,t:r.t,a:r.a,c:r.c,n:r.n,img:'',u:0,...(r.o?{note:r.o}:{})})})},{tx:ids,cfg:true});
  IMP.aoa=[];IMP.parsed=null;$('#impFile').value='';
  const months=[...new Set(good.map(r=>r.d.slice(0,7)))].sort();ui.scope='all';ui.cur=months[months.length-1]||ui.cur;
  location.hash='#tx';toast(`יובאו ${good.length} תנועות`,true);
}

/* ---------- render all ---------- */
function render(){
  chrome();
  if(ui.view==='home')renderHome();else if(ui.view==='tx')renderTx();else if(ui.view==='budget')renderBudget();else if(ui.view==='sync')renderSync();else if(ui.view==='import')renderImport();else if(ui.view==='msgs')renderMsgs();else if(ui.view==='album')renderAlbum();else if(ui.view==='profile'){$('#pName').value=S.profile.name;$('#pMe').value=ui.me}
  if(ui.view!=='home')stopHomeAlbum();
  BG.apply();
}

/* ---------- transaction sheet ---------- */
let edit=null,txType='exp',pend={data:null,removed:false,url:null};
function txChips(sel){const l=S.cats.filter(c=>c.k===txType);const s=sel&&l.some(c=>c.id===sel)?sel:l[0]?.id;$('#txC').innerHTML=l.map(c=>`<label><input type="radio" name="txc" value="${esc(c.id)}"${c.id===s?' checked':''}><span><i class="sw" style="background:${col(c)}"></i>${esc(c.name)}</span></label>`).join('')}
function setPic(url){const f=$('#txPicFig');if(url){$('#txPicImg').src=url;f.hidden=false;$('#txPicBtn').hidden=true}else{f.hidden=true;$('#txPicImg').removeAttribute('src');$('#txPicBtn').hidden=false}}
async function openTx({type='exp',id=null}={}){
  edit=id?S.tx.find(t=>t.id===id&&!t.del):null;
  if(pend.url)URL.revokeObjectURL(pend.url);pend={data:null,removed:false,url:null};
  txType=edit?edit.t:type;setSeg($('#txSeg'),txType);
  $('#txTitle').textContent=edit?'עריכת תנועה':txType==='exp'?'הוצאה חדשה':'הכנסה חדשה';
  $('#txA').value=edit?edit.a:'';$('#txN').value=edit?edit.n:'';$('#txO').value=edit?.note||'';$('#txD').value=edit?edit.d:defDate();$('#txErr').textContent='';
  txChips(edit?.c);$('#txDel').hidden=!edit;setPic(null);
  show($('#dTx'));
  if(edit?.img){const u=await imgURL(edit.img);if(u&&!pend.data&&!pend.removed)setPic(u)}
  else if(!edit)setTimeout(()=>{if($('#dTx').open&&!$('#txFile').dataset.picking)$('#txA').focus();delete $('#txFile').dataset.picking},80);
}
$('#txSeg').addEventListener('click',e=>{const v=e.target.closest('button')?.dataset.v;if(!v)return;txType=v;setSeg($('#txSeg'),v);if(!edit)$('#txTitle').textContent=v==='exp'?'הוצאה חדשה':'הכנסה חדשה';txChips()});
$('#txPicBtn').addEventListener('click',()=>$('#txFile').click());
$('#txPicChg').addEventListener('click',()=>$('#txFile').click());
$('#txPicDel').addEventListener('click',()=>{if(pend.url)URL.revokeObjectURL(pend.url);pend={data:null,removed:true,url:null};setPic(null)});
$('#txPicImg').addEventListener('click',()=>viewImg($('#txPicImg').src));
$('#txFile').addEventListener('change',async e=>{const f=e.target.files[0];e.target.value='';delete e.target.dataset.picking;if(!f)return;
  try{const d=await compress(f);if(pend.url)URL.revokeObjectURL(pend.url);pend={data:d,removed:false,url:URL.createObjectURL(new Blob([d.buf],{type:d.type}))};setPic(pend.url);if(!$('#txA').value)$('#txA').focus()}
  catch{$('#txErr').textContent='לא הצלחתי לקרוא את התמונה. נסה תמונה אחרת.'}});
$('#txF').addEventListener('submit',async e=>{e.preventDefault();
  const a=parseFloat($('#txA').value),d=$('#txD').value,c=$('input[name=txc]:checked')?.value,n=$('#txN').value.trim().slice(0,120),note=$('#txO').value.trim().slice(0,500);
  if(!(a>0)){$('#txErr').textContent='צריך סכום גדול מאפס.';$('#txA').focus();return}
  if(!YMD.test(d)){$('#txErr').textContent='צריך תאריך.';return}
  if(!c){$('#txErr').textContent='בחר קטגוריה.';return}
  let img=edit?edit.img:'';
  if(pend.data){img=rid(16);try{await IDB.put('i:'+img,{buf:pend.data.buf,type:pend.data.type,up:false})}catch{img=edit?edit.img:'';toast('לא הצלחתי לשמור את התמונה במכשיר')}}
  else if(pend.removed)img='';
  const am=Math.round(a*100)/100,bl=snapLv([ymOf(d),edit?ymOf(edit.d):ymOf(d)]);
  if(edit){const id=edit.id;change(()=>{const t=S.tx.find(x=>x.id===id);Object.assign(t,{t:txType,a:am,c,d,n,img});if(note)t.note=note;else delete t.note},{tx:[id]})}
  else{const id=rid();change(()=>S.tx.push({id,d,t:txType,a:am,c,n,img,u:0,...(note?{note}:{})}),{tx:[id]})}
  const was=!!edit;hide($('#dTx'));ui.cur=ymOf(d);render();
  toast(`${was?'התנועה עודכנה':(txType==='exp'?'הוצאה':'הכנסה')+' של '+fmt(am)+' נוספה'}. ${crossMsg(bl)}`.trim().replace(/\.\s*$/,'.'),true);
  if(pend.data)Sync.schedule(500);
});
$('#txDel').addEventListener('click',()=>{if(!edit)return;const id=edit.id;hide($('#dTx'));change(()=>removeTx(id),{tx:[id]});toast('התנועה נמחקה',true)});
function viewImg(src){if(!src)return;$('#viewImg').src=src;show($('#dImg'))}

/* ---------- salary sheet ---------- */
let draft=[];
function openSal(){
  const sc=incs(),first=sc.find(x=>x.sal)||sc[0];
  $('#salC').innerHTML=sc.map(c=>`<option value="${esc(c.id)}"${c===first?' selected':''}>${esc(c.name)}</option>`).join('');
  $('#salA').value='';$('#salN').value='משכורת חודשית';$('#salD').value=defDate();$('#salErr').textContent='';
  draft=exps().map(c=>({id:c.id,p:+c.pct||0}));
  $('#split').innerHTML=exps().map(c=>`<div class="sp"><span class="cn"><i style="background:${col(c)}"></i>${esc(c.name)}</span><input class="field" type="number" min="0" max="100" step="1" inputmode="numeric" data-sid="${esc(c.id)}" value="${+c.pct||0}" aria-label="אחוז ל${esc(c.name)}"><b data-sv="${esc(c.id)}"></b></div>`).join('');
  updSplit();show($('#dSal'));setTimeout(()=>$('#salA').focus(),80);
}
function updSplit(){const a=parseFloat($('#salA').value)||0;let sum=0;draft.forEach(x=>{sum+=x.p;const el=$(`[data-sv="${CSS.escape(x.id)}"]`);if(el)el.textContent=fmt(a*x.p/100)});
  const el=$('#splitSum');el.textContent=`סה״כ ${sum}%`+(sum<100?`, ${fmt(a*(100-sum)/100)} נשארים לא מוקצים`:sum>100?', יותר מ־100%':', כל השקל מוקצה');el.className='sumline'+(sum>100?' bad':'')}
$('#salA').addEventListener('input',updSplit);
$('#split').addEventListener('input',e=>{const id=e.target.dataset.sid;if(!id)return;const x=draft.find(d=>d.id===id);if(x){x.p=clamp(Math.round(+e.target.value||0),0,100);updSplit()}});
$('#salF').addEventListener('submit',e=>{e.preventDefault();
  const a=parseFloat($('#salA').value),d=$('#salD').value,c=$('#salC').value,sum=draft.reduce((s,x)=>s+x.p,0);
  if(!(a>0)){$('#salErr').textContent='צריך סכום משכורת.';return}
  if(!YMD.test(d)){$('#salErr').textContent='צריך תאריך.';return}
  if(sum>100){$('#salErr').textContent='החלוקה עוברת 100%. הורד אחוזים באחת הקטגוריות.';return}
  const id=rid();
  change(()=>{S.tx.push({id,d,t:'inc',a:Math.round(a*100)/100,c,n:$('#salN').value.trim().slice(0,120)||'משכורת',img:'',u:0});draft.forEach(x=>{const k=cat(x.id);if(k)k.pct=x.p});const ic=cat(c);if(ic)ic.sal=true},{tx:[id],cfg:true});
  hide($('#dSal'));ui.cur=ymOf(d);render();toast(`משכורת של ${fmt(a)} נכנסה וחולקה לקטגוריות`,true);
});

/* ---------- events ---------- */
const ACT={
  exp:()=>openTx({type:'exp'}),inc:()=>openTx({type:'inc'}),salary:openSal,
  photo:()=>{$('#txFile').dataset.picking='1';openTx({type:'exp'});$('#txFile').click()},
  undo,
  fresh:async()=>{if(!(await ask('להתחיל טבלה ריקה?','נתוני הדוגמה יימחקו והקטגוריות יחזרו לברירת המחדל.','התחל מאפס')))return;pushHist();replaceAll(blank());toast('הטבלה ריקה ומוכנה',true)},
  wipe:async()=>{if(!(await ask('למחוק את כל הנתונים?',SY.on?'כל התנועות יימחקו מהמכשיר ומהגיליון המשותף, אצל כל המחוברים. אפשר לבטל מיד אחרי.':'כל התנועות יימחקו מהמכשיר. אפשר לבטל מיד אחרי.','מחק הכול',true)))return;pushHist();replaceAll({...blank(),profile:S.profile});toast('כל הנתונים נמחקו',true)},
  'sync-now':()=>Sync.run(true),
  'copy-code':()=>copyText(inviteCode(),'קוד ההצטרפות הועתק','קוד הצטרפות'),
  'share-code':async()=>{const text=`קוד הצטרפות לחשבון המשותף שלנו ב"הכסף שלי":\n${inviteCode()}\n\nפותחים את ${APP_URL} ← תפריט ← סנכרון משותף ← הצטרפות עם קוד.`;if(navigator.share){try{await navigator.share({title:'הכסף שלי, קוד הצטרפות',text});return}catch(e){if(e&&e.name==='AbortError')return}}copyText(text,'ההזמנה הועתקה, הדבק אותה בוואטסאפ','הזמנה')},
  disconnect:async()=>{if(!(await ask('לנתק את המכשיר?','המכשיר יפסיק לסנכרן. הנתונים נשארים במכשיר ובגיליון, ואפשר להצטרף שוב עם הקוד.','נתק')))return;SY={...SY,on:false,dirty:[],idirty:[],cfgDirty:false};S.tx=S.tx.filter(t=>!t.del);S.items=S.items.filter(t=>!t.del);persistNow();setSync('off');render();toast('המכשיר נותק מהגיליון')},
  'disconnect-wipe':async()=>{if(!(await ask('לנתק ולמחוק מהמכשיר?','המכשיר יתנתק, וכל התנועות, ההודעות והתמונות יימחקו ממנו. בגיליון ואצל המחוברים האחרים לא ישתנה כלום.','נתק ומחק',true)))return;
    const imgs=[...new Set(S.tx.map(t=>t.img).concat(S.items.map(i=>i.img)).filter(Boolean))];for(const k of imgs){try{await IDB.del('i:'+k)}catch{}}
    SY={on:false,url:'',key:'',since:0,dirty:[],idirty:[],cfgDirty:false,last:0,err:'',sheet:'',sv:0};S=blank();sample=false;hist=[];ui.read=0;
    URLS.forEach(u=>URL.revokeObjectURL(u));URLS.clear();persistNow();setSync('off');render();toast('המכשיר נותק והנתונים נמחקו ממנו')},
  'copy-gs':()=>{if(!GS){toast('הקוד עוד לא נטען, נסה שוב בעוד רגע');return}copyText(GS,'הקוד הועתק. הדבק אותו בעורך של Apps Script','קוד הסקריפט')},
  'show-gs':()=>{if(GS)showText('קוד הסקריפט','מעתיקים את כל הטקסט ומדביקים בעורך של Apps Script.',GS)},
  connect:async(btn)=>{const url=$('#gsUrl').value.trim(),er=$('#gsErr');er.textContent='';try{sessionStorage.setItem('kesef-url',url)}catch{}
    const pr=urlProblem(url);if(pr){er.textContent=pr;return}
    btn.disabled=true;btn.textContent='מתחבר…';try{await connectNew(url);toast('הגיליון חובר. עכשיו אפשר לשלוח קוד הצטרפות לשותף');location.hash='#sync';renderSync()}catch(e){const m=String(e&&e.message||'');er.textContent=(m==='paired'||m==='busy'||m==='server')?errText(e):CONNECT_HELP;btn.disabled=false;btn.textContent='חבר את הגיליון'}},
  join:async(btn)=>{const er=$('#joinErr');er.textContent='';const code=$('#joinCode').value;if(!dec(code)){er.textContent='הקוד לא נראה תקין. הוא מתחיל ב־KSF1.';return}
    btn.disabled=true;btn.textContent='מצטרף…';try{await connectJoin(code,$('#joinMerge').checked);toast('הצטרפת לחשבון המשותף');renderSync()}catch(e){er.textContent=e.message==='code'?'הקוד לא תקין.':errText(e);btn.disabled=false;btn.textContent='הצטרף'}},
  ss:()=>SS.start(),
  'imp-go':doImport,
  'imp-cancel':()=>{IMP.aoa=[];IMP.parsed=null;$('#impFile').value='';renderImport()}
};
document.addEventListener('click',e=>{
  const a=e.target.closest('[data-act]');if(a){e.preventDefault();closeSpeed();ACT[a.dataset.act]?.(a);return}
  const o=e.target.closest('[data-open]');if(o&&!e.target.closest('input,select')){openTx({id:o.dataset.open});return}
  const cl=e.target.closest('[data-close]');if(cl){hide(cl.closest('dialog'));return}
});
$$('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d)hide(d)}));
$('#menuBtn').addEventListener('click',openDrawer);$('#moreBtn').addEventListener('click',openDrawer);$('#dClose').addEventListener('click',closeDrawer);$('#scrim').addEventListener('click',closeDrawer);
$('#fab').addEventListener('click',()=>$('#speed').hidden?openSpeed():closeSpeed());$('#scrim2').addEventListener('click',closeSpeed);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeDrawer();closeSpeed()}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!e.target.closest('input,select,textarea')){e.preventDefault();undo()}});
$('#tundo').addEventListener('click',()=>{$('#toast').classList.remove('on');undo()});
$('#prev').addEventListener('click',()=>{ui.cur=shiftYm(ui.cur,-1);render()});
$('#next').addEventListener('click',()=>{ui.cur=shiftYm(ui.cur,1);render()});
$('#mlabel').addEventListener('click',()=>{ui.cur=nowYm;render()});
svg.addEventListener('click',e=>{const k=e.target.closest('[data-k]')?.dataset.k;if(k){ui.cur=k;render()}});
window.addEventListener('hashchange',route);

$('#q').addEventListener('input',e=>{ui.q=e.target.value.trim();renderTx()});
$('#catF').addEventListener('change',e=>{ui.catF=e.target.value;renderTx()});
$('#typeF').addEventListener('click',e=>{const v=e.target.closest('button')?.dataset.v;if(v){ui.typeF=v;renderTx()}});
$('#scope').addEventListener('click',e=>{const v=e.target.closest('button')?.dataset.v;if(v){ui.scope=v;renderTx()}});
$('#modeSeg').addEventListener('click',e=>{const v=e.target.closest('button')?.dataset.v;if(v){ui.mode=v;persist();renderTx()}});
$('#tbl thead').addEventListener('click',e=>{const th=e.target.closest('th[data-s]');if(!th)return;const k=th.dataset.s;if(ui.sortK===k)ui.sortD=-ui.sortD;else{ui.sortK=k;ui.sortD=k==='d'||k==='a'?-1:1}renderTx()});
$('#tb').addEventListener('change',e=>{
  const el=e.target,tr=el.closest('tr[data-id]');if(!tr)return;const t=S.tx.find(x=>x.id===tr.dataset.id);if(!t)return;
  const f=el.dataset.f,old=ymOf(t.d);if(f==='d'&&!YMD.test(el.value)){renderTx();return}
  const bl=snapLv([old,f==='d'?ymOf(el.value):old]);
  change(()=>{if(f==='a')t.a=Math.round(Math.abs(parseFloat(el.value)||0)*100)/100;else if(f==='d')t.d=el.value;else if(f==='c'){t.c=el.value;t.t=cat(el.value)?.k||t.t}else if(f==='n')t.n=el.value.slice(0,120);else if(f==='note'){const v=el.value.trim().slice(0,500);if(v)t.note=v;else delete t.note}},{tx:[t.id]});
  const cm=crossMsg(bl);if(cm)toast(cm,true);
});
$('#tb').addEventListener('click',e=>{if(!e.target.closest('[data-del]'))return;const id=e.target.closest('tr').dataset.id;change(()=>removeTx(id),{tx:[id]});toast('השורה נמחקה',true)});
$('#addRow').addEventListener('click',()=>{const c=exps()[0];if(!c)return;const id=rid();ui.typeF='all';ui.catF='';ui.q='';$('#q').value='';ui.sortK='d';ui.sortD=-1;
  change(()=>S.tx.push({id,d:defDate(),t:'exp',a:0,c:c.id,n:'',img:'',u:0}),{tx:[id]});$(`#tb tr[data-id="${id}"] input[data-f=n]`)?.focus()});
$('#copyTsv').addEventListener('click',()=>{const rows=[['תאריך','תיאור','קטגוריה','סוג','סכום','הערה']].concat(currentList().map(t=>[t.d,t.n||'',cat(t.c)?.name||'',t.t==='inc'?'הכנסה':'הוצאה',t.a,t.note||'']));
  copyText(rows.map(r=>r.map(v=>String(v).replace(/[\t\n]/g,' ')).join('\t')).join('\n'),'הטבלה הועתקה. הדבק אותה באקסל או בשיטס','העתקה לאקסל')});

$('#goalIn').addEventListener('change',e=>{const v=Math.max(0,Math.round(+e.target.value||0));if(v===G())return;change(()=>{S.goal=v},{cfg:true});toast(`היעד החודשי עודכן ל־${fmt(v)}`,true)});
$('#apIn').addEventListener('change',e=>{const v=clamp(Math.round(+e.target.value||80),50,100);if(v===AP()){e.target.value=v;return}change(()=>{S.alertPct=v},{cfg:true})});
function setChange(e){const el=e.target,tr=el.closest('tr[data-cid]');if(!tr)return;const c=cat(tr.dataset.cid);if(!c)return;const k=el.dataset.k;
  if(k==='name'&&!el.value.trim()){el.value=c.name;return}
  change(()=>{if(k==='color'){if(HEX.test(el.value))c.color=el.value}else if(k==='name')c.name=el.value.trim().slice(0,40);else if(k==='pct')c.pct=clamp(Math.round(+el.value||0),0,100);else if(k==='sal')c.sal=el.checked},{cfg:true})}
function setClick(e){if(!e.target.closest('[data-cdel]'))return;const c=cat(e.target.closest('tr').dataset.cid);if(!c)return;
  const same=S.cats.filter(x=>x.k===c.k&&x.id!==c.id);if(!same.length){toast('צריך לפחות קטגוריה אחת מכל סוג');return}
  const fb=same.find(x=>/שונות|אחרת/.test(x.name))||same[same.length-1];const moved=TX().filter(t=>t.c===c.id).map(t=>t.id);
  change(()=>{moved.forEach(id=>{S.tx.find(t=>t.id===id).c=fb.id});S.cats=S.cats.filter(x=>x.id!==c.id);if(ui.catF===c.id)ui.catF=''},{tx:moved,cfg:true});
  toast(moved.length?`הקטגוריה נמחקה, ${moved.length} תנועות עברו ל${fb.name}`:'הקטגוריה נמחקה',true)}
['#setE','#setI'].forEach(s=>{$(s).addEventListener('change',setChange);$(s).addEventListener('click',setClick)});
function addCat(k){const id=rid(8);change(()=>S.cats.push({id,k,name:k==='exp'?'קטגוריה חדשה':'הכנסה חדשה',color:PAL[S.cats.length%PAL.length],pct:0,sal:false,sav:false}),{cfg:true});$(`tr[data-cid="${id}"] input[data-k=name]`)?.select()}
$('#addE').addEventListener('click',()=>addCat('exp'));$('#addI').addEventListener('click',()=>addCat('inc'));

/* import events */
$('#impFile').addEventListener('change',e=>{const f=e.target.files[0];if(f)readFile(f)});
const drop=$('#drop');
['dragenter','dragover'].forEach(t=>drop.addEventListener(t,e=>{e.preventDefault();drop.classList.add('over')}));
['dragleave','drop'].forEach(t=>drop.addEventListener(t,e=>{e.preventDefault();drop.classList.remove('over')}));
drop.addEventListener('drop',e=>{const f=e.dataTransfer?.files?.[0];if(f)readFile(f)});
$('#impBody').addEventListener('change',e=>{const el=e.target;
  if(el.id==='impSheet'){IMP.sheet=el.value;loadSheet();return}
  if(el.id==='impHdr'){IMP.hdr=clamp((+el.value||1)-1,0,Math.max(0,IMP.aoa.length-1));guessMap()}
  else if(el.dataset.map){const v=el.value;if(v==='')delete IMP.map[el.dataset.map];else{const j=+v;Object.keys(IMP.map).forEach(k=>{if(IMP.map[k]===j)delete IMP.map[k]});IMP.map[el.dataset.map]=j}}
  else if(el.dataset.opt)IMP.opts[el.dataset.opt]=el.checked;
  parseImp();renderImport()});
$('#impBody').addEventListener('click',e=>{const b=e.target.closest('#impDef button');if(b){IMP.opts.defType=b.dataset.v;parseImp();renderImport()}});

/* backup + export */
$('#bkDown').addEventListener('click',async()=>{
  const imgs={};for(const k of new Set(TX().map(t=>t.img).filter(Boolean))){try{const v=await IDB.get('i:'+k);if(v)imgs[k]={b64:bufToB64(v.buf),type:v.type}}catch{}}
  const ok=await dl(`kesef-backup-${todayStr}.json`,new Blob([JSON.stringify({app:'kesef',v:3,saved:new Date().toISOString(),data:{...S,tx:TX()},imgs})],{type:'application/json'}));
  if(ok)toast('קובץ הגיבוי מוכן. שמור אותו ב"קבצים" או בדרייב');
});
$('#bkFile').addEventListener('change',async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
  try{const j=JSON.parse(await f.text()),d=j&&j.data?j.data:j;if(!d||!Array.isArray(d.tx))throw 0;
    if(!(await ask('לשחזר מהגיבוי?',`הנתונים הנוכחיים יוחלפו ב־${d.tx.length} תנועות מהקובץ${SY.on?', גם בגיליון המשותף':''}. אפשר לבטל מיד אחרי.`,'שחזר')))return;
    if(j.imgs&&typeof j.imgs==='object')for(const k in j.imgs){const v=j.imgs[k];if(v&&v.b64&&/^[a-z0-9]+$/i.test(k)){try{await IDB.put('i:'+k,{buf:b64ToBuf(v.b64),type:v.type||'image/jpeg',up:false})}catch{}}}
    pushHist();const n=norm(d);n.profile=S.profile.name?S.profile:n.profile;replaceAll(n);toast(`הגיבוי שוחזר: ${n.tx.length} תנועות`,true);
  }catch{toast('הקובץ הזה לא נראה כמו גיבוי של הכסף שלי')}});
$('#csvDown').addEventListener('click',()=>{const q=v=>{v=String(v);return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
  const rows=[['תאריך','סוג','קטגוריה','תיאור','סכום','הערה']].concat(TX().slice().sort((a,b)=>a.d<b.d?-1:1).map(t=>[t.d,t.t==='inc'?'הכנסה':'הוצאה',cat(t.c)?.name||'',t.n||'',t.a,t.note||'']));
  dl(`kesef-${todayStr}.csv`,new Blob(['\ufeff'+rows.map(r=>r.map(q).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}))});
$('#xlsxDown').addEventListener('click',async e=>{const b=e.currentTarget;b.disabled=true;
  try{await loadXLSX();
    const txs=TX().slice().sort((a,b)=>a.d<b.d?-1:1);
    const t1=[['תאריך','סוג','קטגוריה','תיאור','סכום','הערה']].concat(txs.map(t=>{const [y,m,d]=t.d.split('-').map(Number);return [new Date(Date.UTC(y,m-1,d)),t.t==='inc'?'הכנסה':'הוצאה',cat(t.c)?.name||'',t.n||'',t.t==='inc'?t.a:-t.a,t.note||'']}));
    const ws1=XLSX.utils.aoa_to_sheet(t1,{cellDates:true});ws1['!cols']=[{wch:12},{wch:8},{wch:18},{wch:30},{wch:12},{wch:40}];
    for(let r=1;r<t1.length;r++){const c=ws1[XLSX.utils.encode_cell({r,c:0})];if(c)c.z='dd/mm/yyyy';const a=ws1[XLSX.utils.encode_cell({r,c:4})];if(a)a.z='#,##0.00'}
    const months=[...new Set(txs.map(t=>t.d.slice(0,7)))];
    const t2=[['חודש','הכנסות','הוצאות','נשאר','לחיסכון']].concat(months.map(m=>[MN[mIdx(m)]+' '+m.slice(0,4),tot(m,'inc'),tot(m,'exp'),tot(m,'inc')-tot(m,'exp'),savedIn(m)]));
    const t3=[['קטגוריה','סוג','% מהמשכורת']].concat(S.cats.map(c=>[c.name,c.k==='inc'?'הכנסה':'הוצאה',c.k==='exp'?c.pct:'']));
    const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws1,'תנועות');XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(t2),'סיכום חודשי');XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(t3),'קטגוריות');
    wb.Workbook={Views:[{RTL:true}]};
    const out=XLSX.write(wb,{bookType:'xlsx',type:'array'});
    await dl(`kesef-${todayStr}.xlsx`,new Blob([out],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
  }catch{toast('לא הצלחתי ליצור את קובץ האקסל. בדוק את החיבור לאינטרנט.')}
  b.disabled=false});

/* profile */
$('#pName').addEventListener('change',e=>{const v=e.target.value.trim().slice(0,40);if(v===S.profile.name)return;change(()=>{S.profile.name=v},{cfg:true,undo:false});route()});
$('#pMe').addEventListener('change',e=>{ui.me=e.target.value.trim().slice(0,40);persist();toast('השם נשמר')});
$('#pPhoto').addEventListener('click',()=>$('#pFile').click());$('#pAvatar').addEventListener('click',()=>$('#pFile').click());
$('#pFile').addEventListener('change',async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{const d=await compress(f,512);await IDB.put('profile',d);await loadAvatar();toast('התמונה עודכנה')}catch{toast('לא הצלחתי לשמור את התמונה')}});
$('#pPhotoDel').addEventListener('click',async()=>{try{await IDB.del('profile')}catch{}loadAvatar()});

/* ---------- messages ---------- */
const hm=ts=>{const d=new Date(ts);return `${p2(d.getHours())}:${p2(d.getMinutes())}`};
const dkey=ts=>{const d=new Date(ts);return `${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())}`};
function updNote(el,what){
  if(!SY.on){el.innerHTML=`${what} נשמרים במכשיר הזה. כדי שיגיעו גם למי שמנהל איתך את החשבון, <a href="#sync">חבר סנכרון משותף</a>.`;el.hidden=false;return}
  if(SY.sv&&SY.sv<3){el.innerHTML=`כדי ש${what} יגיעו לשותף צריך לעדכן את הסקריפט בגיליון. זה לוקח שתי דקות: <a href="#sync">איך מעדכנים</a>.`;el.hidden=false;return}
  el.hidden=true;
}
function renderMsgs(){
  updNote($('#msgUpd'),'ההודעות');
  const list=ITEMS('msg');let last='';
  $('#chat').innerHTML=list.length?list.map(m=>{const mine=m.dv===ui.dev,dk=dkey(m.ts);let sep='';if(dk!==last){last=dk;sep=`<div class="cday">${esc(dayLabel(dk))}</div>`}
    return `${sep}<div class="msg${mine?' me':''}${SY.on&&SY.idirty.includes(m.id)?' pend':''}"><p>${esc(m.text)}</p><div class="mm"><span>${mine?'':`<b>${esc(m.by||'שותף')}</b> `}${hm(m.ts)}</span>${mine?`<button class="mx" data-mdel="${esc(m.id)}">מחק</button>`:''}</div></div>`}).join('')
    :'<div class="card empty">עוד אין הודעות. כתבו כאן תזכורות, בקשות או סתם מילה טובה, וכל מי שמחובר לחשבון יראה.</div>';
  $('#meIn').hidden=!!ui.me;
  const mx=Math.max(0,...list.filter(m=>m.dv!==ui.dev).map(m=>m.ts));if(mx>ui.read){ui.read=mx;persist()}
}
function scrollChat(){requestAnimationFrame(()=>window.scrollTo(0,document.body.scrollHeight))}
function renderHomeMsg(){
  const c=$('#homeMsg'),list=ITEMS('msg');
  if(!list.length&&!SY.on){c.hidden=true;return}c.hidden=false;const un=unread();
  c.innerHTML=`<div class="ch"><h2>הודעות${un?` <span class="cnt" style="vertical-align:3px">${un}</span>`:''}</h2><a href="#msgs" class="lnk">${list.length?'לכל ההודעות':'כתוב הודעה'}</a></div>`+
    (list.length?list.slice(-2).map(m=>`<a class="mrow" href="#msgs" style="color:inherit;text-decoration:none"><small>${esc(m.dv===ui.dev?'אני':(m.by||'שותף'))}, ${esc(dayLabel(dkey(m.ts)).split(',')[0])} ${hm(m.ts)}</small><span>${esc(m.text)}</span></a>`).join(''):'<p class="hint" style="margin:0">השאירו כאן הודעות זה לזה. הן יופיעו אצל כל מי שמחובר לחשבון.</p>');
}
$('#msgF').addEventListener('submit',e=>{e.preventDefault();
  if(!ui.me){const v=$('#meIn').value.trim().slice(0,40);if(!v){$('#meIn').focus();toast('כתוב קודם איך קוראים לך');return}ui.me=v}
  const text=$('#msgIn').value.trim().slice(0,2000);if(!text)return;
  const it={id:rid(16),k:'msg',by:ui.me,dv:ui.dev,ts:Date.now(),text,img:'',u:0};
  change(()=>S.items.push(it),{items:[it.id],undo:false});
  $('#msgIn').value='';$('#msgIn').style.height='';scrollChat();Sync.schedule(300);
});
$('#msgIn').addEventListener('input',e=>{const t=e.target;t.style.height='';t.style.height=Math.min(140,t.scrollHeight+2)+'px'});
$('#msgIn').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing&&matchMedia('(hover:hover)').matches){e.preventDefault();$('#msgF').requestSubmit()}});
$('#chat').addEventListener('click',e=>{const b=e.target.closest('[data-mdel]');if(!b)return;const id=b.dataset.mdel;change(()=>removeItem(id),{items:[id]});toast('ההודעה נמחקה',true)});

/* ---------- album ---------- */
function renderAlbum(){
  updNote($('#albUpd'),'התמונות');
  const list=ITEMS('pic').reverse();
  $('#albCount').textContent=list.length?`${list.length} תמונות`:'';
  $('#agrid').innerHTML=list.length?list.map(p=>`<button class="aitem" data-pic="${esc(p.id)}" aria-label="${esc(p.text||'תמונה')}"><img data-img="${esc(p.img)}" alt="">${p.text?`<small>${esc(p.text)}</small>`:''}</button>`).join(''):'<p class="hint" style="grid-column:1/-1;margin:0">עוד אין תמונות. הוסיפו תמונות של הבית, של הזוג או של מה שאתם חוסכים בשבילו.</p>';
  hydrate($('#agrid'));
  $('#bgMode').value=ui.bg.mode;$('#bgInt').value=String(ui.bg.int);$('#ssInt').value=String(ui.ss.int);$('#ssIdle').value=String(ui.ss.idle);$('#ssInfo').checked=ui.ss.info;
}
$('#albAdd').addEventListener('click',()=>$('#albFile').click());
$('#albFile').addEventListener('change',async e=>{const fs=[...e.target.files];e.target.value='';if(!fs.length)return;
  const made=[];toast(`מוסיף ${fs.length} תמונות…`);
  for(const f of fs){try{const d=await compress(f,1600);const img=rid(16);await IDB.put('i:'+img,{buf:d.buf,type:d.type,up:false});made.push({id:rid(16),k:'pic',by:ui.me,dv:ui.dev,ts:Date.now()+made.length,text:'',img,u:0})}catch{}}
  if(!made.length){toast('לא הצלחתי להוסיף את התמונות');return}
  change(()=>made.forEach(m=>S.items.push(m)),{items:made.map(m=>m.id)});
  toast(made.length===1?'התמונה נוספה':`נוספו ${made.length} תמונות`,true);Sync.schedule(400);
});
let picId=null;
$('#agrid').addEventListener('click',async e=>{const b=e.target.closest('[data-pic]');if(!b)return;const p=S.items.find(x=>x.id===b.dataset.pic);if(!p)return;picId=p.id;
  $('#picCap').value=p.text||'';$('#picBy').textContent=`${p.by?p.by+', ':''}${new Date(p.ts).toLocaleDateString('he-IL')}`;$('#picImg').removeAttribute('src');show($('#dPic'));const u=await imgURL(p.img);if(u)$('#picImg').src=u});
$('#picSave').addEventListener('click',()=>{const id=picId,v=$('#picCap').value.trim().slice(0,200);change(()=>{const p=S.items.find(x=>x.id===id);if(p)p.text=v},{items:[id]});hide($('#dPic'));toast('הכיתוב נשמר')});
$('#picDel').addEventListener('click',async()=>{const id=picId;if(!(await ask('למחוק את התמונה?',SY.on?'התמונה תימחק גם אצל כל מי שמחובר לחשבון.':'התמונה תימחק מהמכשיר.','מחק',true)))return;hide($('#dPic'));change(()=>removeItem(id),{items:[id]});toast('התמונה נמחקה',true)});
$('#ssInt').addEventListener('change',e=>{ui.ss.int=clamp(+e.target.value||8,3,120);persist()});
$('#ssIdle').addEventListener('change',e=>{ui.ss.idle=clamp(+e.target.value||0,0,60);persist();resetIdle();if(ui.ss.idle)toast(`שומר המסך יופעל אחרי ${ui.ss.idle===1?'דקה':ui.ss.idle+' דקות'} בלי נגיעה`)});
$('#ssInfo').addEventListener('change',e=>{ui.ss.info=e.target.checked;persist()});
let homeT=null,homeI=0,homeL=0;
function stopHomeAlbum(){clearInterval(homeT);homeT=null}
async function homeNext(){const list=ITEMS('pic');const c=$('#homeAlbum');if(!list.length||c.hidden)return;const p=list[homeI++%list.length];const u=await imgURL(p.img);if(!u)return;
  const ls=$$('.ssimg',c);if(ls.length<2)return;const a=ls[homeL],b=ls[1-homeL];homeL=1-homeL;a.style.backgroundImage=`url("${u}")`;a.classList.remove('on');void a.offsetWidth;a.classList.add('on');b.classList.remove('on');const cap=$('.cap',c);if(cap)cap.textContent=p.text||''}
function renderHomeAlbum(){
  const c=$('#homeAlbum'),list=ITEMS('pic');c.hidden=false;
  if(list.length&&ui.bg.mode!=='off'){stopHomeAlbum();c.hidden=true;return}
  if(!list.length){stopHomeAlbum();c.className='card albumcard empty';c.innerHTML=`<div class="ch"><h2>התמונות שלנו</h2><a href="#album" class="lnk">הוסף תמונות</a></div><p class="hint" style="margin:0">הוסיפו תמונות והן יתחלפו ברקע של האפליקציה, אצל כל מי שמחובר לחשבון.</p>`;return}
  if(homeT&&c.dataset.n===String(list.length))return;
  c.className='card albumcard';c.dataset.n=String(list.length);
  c.innerHTML=`<div class="ssimg"></div><div class="ssimg"></div><div class="ac"><div><b>${esc(S.profile.name||'התמונות שלנו')}</b><span class="cap"></span></div><div class="btnrow" style="margin:0"><a class="btn sm" href="#album">לאלבום</a></div></div>`;
  stopHomeAlbum();homeI=Math.floor(Math.random()*list.length);homeNext();homeT=setInterval(homeNext,7000);
}

/* ---------- photos in the background ---------- */
const BG={t:null,i:-1,layer:0,el:null,
  apply(){
    const pics=ITEMS('pic'),mode=ui.bg.mode,on=pics.length>0&&mode!=='off';
    document.body.classList.toggle('bg-app',on&&mode==='app');
    $('#hero').classList.toggle('photo',on);
    const target=!on||document.visibilityState!=='visible'?null:mode==='app'?$('#bgfx'):(ui.view==='home'?$('#herobg'):null);
    if(target===this.el&&this.t)return;
    this.stop();this.el=target;if(!target)return;
    if(this.i<0)this.i=Math.floor(Math.random()*pics.length);
    this.next();this.t=setInterval(()=>this.next(),ui.bg.int*1000);
  },
  stop(){clearInterval(this.t);this.t=null;if(this.el)$$('.bgl',this.el).forEach(l=>{l.classList.remove('on');l.style.backgroundImage=''});this.el=null},
  async next(){
    const pics=ITEMS('pic'),el=this.el;if(!pics.length||!el)return;
    const p=pics[this.i++%pics.length];const u=await imgURL(p.img);if(!u||this.el!==el)return;
    const ls=$$('.bgl',el),a=ls[this.layer],b=ls[1-this.layer];this.layer=1-this.layer;
    a.style.backgroundImage=`url("${u}")`;a.classList.remove('on');void a.offsetWidth;a.classList.add('on');b.classList.remove('on');
  }
};
$('#bgMode').addEventListener('change',e=>{ui.bg.mode=e.target.value;persist();BG.stop();BG.apply();toast(ui.bg.mode==='off'?'התמונות לא יוצגו ברקע':ui.bg.mode==='app'?'התמונות יתחלפו ברקע של כל האפליקציה':'התמונות יתחלפו בראש המסך הראשי')});
$('#bgInt').addEventListener('change',e=>{ui.bg.int=clamp(+e.target.value||10,3,300);persist();BG.stop();BG.apply()});
document.addEventListener('visibilitychange',()=>BG.apply());

/* ---------- screensaver ---------- */
const SS={on:false,t:null,clk:null,i:0,list:[],lock:null,layer:0,
  async start(){
    if(this.on)return;this.on=true;closeSpeed();closeDrawer();
    const el=$('#ss');el.hidden=false;this.list=ITEMS('pic').slice().sort(()=>Math.random()-.5);this.i=0;
    el.classList.toggle('noimg',!this.list.length);$('#ssName').textContent=S.profile.name||'הכסף שלי';$('#ssText').textContent=this.list.length?'':'הוסיפו תמונות באלבום כדי שיתחלפו כאן';
    this.info();this.clk=setInterval(()=>this.info(),10000);
    await this.next();this.t=setInterval(()=>this.next(),ui.ss.int*1000);
    this.wake();
  },
  async wake(){try{if(this.on&&navigator.wakeLock&&document.visibilityState==='visible')this.lock=await navigator.wakeLock.request('screen')}catch{}},
  stop(){if(!this.on)return;this.on=false;clearInterval(this.t);clearInterval(this.clk);$('#ss').hidden=true;$$('#ss .ssimg').forEach(e=>{e.classList.remove('on');e.style.backgroundImage=''});try{this.lock?.release()}catch{}this.lock=null;resetIdle()},
  async next(){if(!this.list.length)return;const p=this.list[this.i++%this.list.length];const u=await imgURL(p.img);if(!u||!this.on)return;
    const a=$('#ssA'),b=$('#ssB'),[sh,hd]=this.layer?[a,b]:[b,a];this.layer^=1;sh.style.backgroundImage=`url("${u}")`;sh.classList.remove('on');void sh.offsetWidth;sh.classList.add('on');hd.classList.remove('on');$('#ssText').textContent=p.text||''},
  info(){const on=ui.ss.info;$('#ssInfoBox').hidden=!on;if(!on)return;const d=new Date();$('#ssClock').textContent=`${p2(d.getHours())}:${p2(d.getMinutes())}`;$('#ssDate').textContent=`${DN[d.getDay()]}, ${d.getDate()} ב${MN[d.getMonth()]}`;
    const net=tot(nowYm,'inc')-tot(nowYm,'exp');$('#ssLine').textContent=inM(nowYm).length?(net>=0?`נשארו ${fmt(net)} החודש`:`חריגה של ${fmt(-net)} החודש`):''}
};
$('#ss').addEventListener('pointerdown',()=>SS.stop());
let idleT=null,lastAct=0;
function resetIdle(){clearTimeout(idleT);if(!ui.ss.idle||SS.on)return;idleT=setTimeout(()=>{
  const busy=$$('dialog').some(d=>d.open)||document.activeElement?.matches?.('input,textarea,select')||document.visibilityState!=='visible';
  if(busy)resetIdle();else SS.start()},ui.ss.idle*60000)}
['pointerdown','keydown','wheel','touchstart'].forEach(ev=>window.addEventListener(ev,()=>{const n=Date.now();if(n-lastAct>1000){lastAct=n;resetIdle()}},{passive:true}));
document.addEventListener('keydown',e=>{if(SS.on){e.preventDefault();SS.stop()}},true);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')SS.wake()});

/* ---------- boot ---------- */
load();route();loadAvatar();resetIdle();
if(SY.on){setSync('ok');Sync.run(true)}
setInterval(()=>{if(SY.on&&document.visibilityState==='visible')Sync.run()},20000);
setInterval(()=>{if(SY.on)chrome()},30000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&SY.on)Sync.run();else persistNow()});
window.addEventListener('online',()=>{if(SY.on)Sync.run()});
window.addEventListener('offline',()=>{if(SY.on)setSync('offline')});
try{navigator.storage?.persist?.()}catch{}
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(()=>{});
window.__kesef={get S(){return S},get SY(){return SY},Sync};
})();
