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
  {id:'i3',k:'inc',name:'הכנסה אחרת',color:'#6b7f2a'},
  {id:'t1',k:'exp',name:'העברות בין חשבונות',color:'#94a3b8',int:true}];
const blank=()=>({cats:DEF().map(normCat),tx:[],items:[],rec:[],rules:{},weekly:{emails:[],on:false,freq:'month',mday:11},goal:2000,alertPct:80,su:0,profile:{name:''},ex:normEx()});
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
function normCat(c){if(!c||typeof c!=='object')return null;const int=!!c.int,k=c.k==='inc'?'inc':'exp';return {id:String(c.id||rid()),k,name:String(c.name||'ללא שם').slice(0,40),color:HEX.test(c.color||'')?c.color:'#64748b',pct:int?0:clamp(Math.round(+c.pct||0),0,100),sal:!int&&k==='inc'&&!!c.sal,sav:!int&&k==='exp'&&!!c.sav,int}}
function normX(x){if(!x||typeof x!=='object')return null;const o={};
  if(x.rv)o.rv=1;if(['card','bank','cash'].includes(x.ac))o.ac=x.ac;if(YMD.test(x.bd||''))o.bd=x.bd;
  if(Array.isArray(x.sp)){const sp=x.sp.map(p=>{const q={n:String(p?.n||'').trim().slice(0,30),a:Math.round(Math.abs(+p?.a||0)*100)/100};if(p?.ok)q.ok=1;if(p?.lk)q.lk=String(p.lk).slice(0,40);return q}).filter(p=>p.n&&p.a>0).slice(0,12);if(sp.length)o.sp=sp}
  if(x.lk)o.lk=String(x.lk).slice(0,40);
  if(x.in&&+x.in.n>1)o.in={i:clamp(Math.round(+x.in.i||1),1,99),n:clamp(Math.round(+x.in.n),2,99)};
  if(x.ab)o.ab=1;if(/^[A-Z]{2}$/.test(x.cc||''))o.cc=x.cc;if(x.cur)o.cur=String(x.cur).slice(0,24);
  return Object.keys(o).length?o:null}
function normTx(t){if(!t||!YMD.test(t.d))return null;const o={id:String(t.id||rid()),d:t.d,t:t.t==='inc'?'inc':'exp',a:Math.round(Math.abs(+t.a||0)*100)/100,c:String(t.c||''),n:String(t.n||'').slice(0,200),img:String(t.img||''),u:+t.u||0};const nt=String(t.note||'').slice(0,500);if(nt)o.note=nt;const tg=normTags(t.tags);if(tg.length)o.tags=tg;const xx=normX(t.x);if(xx)o.x=xx;if(t.del)o.del=1;return o}
function normEx(e){e=e&&typeof e==='object'?e:{};const str=(a,n=30,m=40)=>Array.isArray(a)?[...new Set(a.map(x=>String(x||'').trim().slice(0,m)).filter(Boolean))].slice(0,n):[];
  const bal=e.bal&&YMD.test(e.bal.d||'')&&isFinite(+e.bal.v)?{d:e.bal.d,v:Math.round(+e.bal.v*100)/100}:null;
  return {self:str(e.self,6),own:str(e.own,20),nosub:str(e.nosub,80,60),bill:clamp(Math.round(+e.bill||10),1,28),cut:clamp(Math.round(+e.cut||7),1,28),bal,minBal:Math.round(+e.minBal||0),people:str(e.people,40,30)}}
function normTags(a){return Array.isArray(a)?[...new Set(a.map(x=>String(x||'').replace(/,/g,' ').trim().slice(0,30)).filter(Boolean))].slice(0,8):[]}
function normRec(r){if(!r||typeof r!=='object')return null;const id=String(r.id||'').replace(/[^a-z0-9]/g,'').slice(0,8);if(id.length!==8)return null;const a=Math.round(Math.abs(+r.a||0)*100)/100;if(!(a>0))return null;return {id,n:String(r.n||'').slice(0,60),a,t:r.t==='inc'?'inc':'exp',c:String(r.c||''),day:clamp(Math.round(+r.day||1),1,31),start:/^\d{4}-\d{2}$/.test(r.start)?r.start:nowYm,skip:Array.isArray(r.skip)?r.skip.filter(x=>/^\d{4}-\d{2}$/.test(x)).slice(-60):[],on:r.on!==false}}
function normRules(o){const r={};if(o&&typeof o==='object')Object.keys(o).slice(0,600).forEach(k=>{if(k&&k.length<=60&&typeof o[k]==='string')r[k]=o[k].slice(0,40)});return r}
function normWeekly(w){return {emails:Array.isArray(w?.emails)?w.emails.map(String).slice(0,5):[],on:!!w?.on,freq:['week','month','both'].includes(w?.freq)?w.freq:'month',mday:clamp(Math.round(+w?.mday||11),1,28)}}
function normItem(it){if(!it||(it.k!=='msg'&&it.k!=='pic'))return null;const id=String(it.id||'').replace(/[^a-z0-9]/gi,'').slice(0,40);if(!id)return null;const o={id,k:it.k,u:+it.u||0,by:String(it.by||'').slice(0,40),dv:String(it.dv||'').replace(/[^a-z0-9]/gi,'').slice(0,20),ts:+it.ts||0,text:String(it.text||'').slice(0,2000),img:String(it.img||'').replace(/[^a-z0-9]/gi,'').slice(0,40)};if(it.del)o.del=1;return o}
function norm(d){
  const o=blank();if(!d||typeof d!=='object')return o;
  if(Array.isArray(d.cats)){const cs=d.cats.map(normCat).filter(Boolean);if(cs.some(c=>c.k==='exp'&&!c.int)&&cs.some(c=>c.k==='inc'&&!c.int))o.cats=cs}
  if(Array.isArray(d.tx))o.tx=d.tx.map(normTx).filter(Boolean);
  if(Array.isArray(d.items))o.items=d.items.map(normItem).filter(Boolean);
  if(Array.isArray(d.rec))o.rec=d.rec.map(normRec).filter(Boolean);
  o.rules=normRules(d.rules);o.weekly=normWeekly(d.weekly);
  o.goal=d.goal===undefined?2000:Math.max(0,+d.goal||0);
  o.alertPct=clamp(+d.alertPct||80,50,100);
  o.su=+d.su||0;o.profile={name:String(d.profile?.name||'').slice(0,40)};o.ex=normEx(d.ex);
  return o;
}

/* ---------- state ---------- */
const LS='kesef-li-v1',LSY='kesef-sync-v1',LSU='kesef-ui-v1';
let S=blank(),sample=false,hist=[];
let SY={on:false,url:'',key:'',since:0,dirty:[],idirty:[],cfgDirty:false,last:0,err:'',sheet:'',sv:0};
const wide=matchMedia('(min-width:900px)').matches;
const ui={view:'home',cur:nowYm,scope:'month',typeF:'all',catF:'',tagF:'',q:'',sortK:'d',sortD:-1,mode:wide?'grid':'list',me:'',dev:'',read:0,ss:{int:8,idle:0,info:true},bg:{mode:'hero',int:10},push:{on:false,cov:0,prefs:{tx:true,msg:true,budget:true,rec:true,bank:true}}};
function load(){
  let raw=null;try{raw=localStorage.getItem(LS)}catch{}
  if(raw){try{S=norm(JSON.parse(raw));sample=false}catch{S=norm(sampleData());sample=true}}else{S=norm(sampleData());sample=true}
  try{const y=JSON.parse(localStorage.getItem(LSY)||'null');if(y&&typeof y==='object')SY={...SY,...y,dirty:Array.isArray(y.dirty)?y.dirty:[],idirty:Array.isArray(y.idirty)?y.idirty:[]}}catch{}
  try{const u=JSON.parse(localStorage.getItem(LSU)||'null');if(u){if(u.mode==='list'||u.mode==='grid')ui.mode=u.mode;ui.me=String(u.me||'').slice(0,40);ui.dev=String(u.dev||'');ui.read=+u.read||0;if(u.ss)ui.ss={int:clamp(+u.ss.int||8,3,120),idle:clamp(+u.ss.idle||0,0,60),info:u.ss.info!==false};if(u.push&&typeof u.push==='object')ui.push={on:!!u.push.on,cov:+u.push.cov||0,prefs:{tx:u.push.prefs?.tx!==false,msg:u.push.prefs?.msg!==false,budget:u.push.prefs?.budget!==false,rec:u.push.prefs?.rec!==false,bank:u.push.prefs?.bank!==false}};if(u.bg)ui.bg={mode:['hero','app','off'].includes(u.bg.mode)?u.bg.mode:'hero',int:clamp(+u.bg.int||10,3,300)}}}catch{}
  if(!/^[a-z0-9]{8,}$/.test(ui.dev))ui.dev=rid(10);
}
let saveT=null,storageOk=true;
function persist(){clearTimeout(saveT);saveT=setTimeout(persistNow,150)}
function persistNow(){
  try{if(!sample)localStorage.setItem(LS,JSON.stringify(S));localStorage.setItem(LSY,JSON.stringify(SY));localStorage.setItem(LSU,JSON.stringify({mode:ui.mode,me:ui.me,dev:ui.dev,read:ui.read,ss:ui.ss,bg:ui.bg,push:ui.push}));storageOk=true}
  catch{storageOk=false}
  chrome();
}
window.addEventListener('pagehide',persistNow);

const TX=()=>S.tx.filter(t=>!t.del);
const ITEMS=k=>S.items.filter(i=>i.k===k&&!i.del).sort((a,b)=>a.ts-b.ts);
const unread=()=>ITEMS('msg').filter(m=>m.dv!==ui.dev&&m.ts>ui.read).length;
const cat=id=>S.cats.find(c=>c.id===id);
const col=c=>HEX.test(c?.color||'')?c.color:'#64748b';
const exps=()=>S.cats.filter(c=>c.k==='exp'&&!c.int);
const incs=()=>S.cats.filter(c=>c.k==='inc'&&!c.int);
const ints=()=>S.cats.filter(c=>c.int);
const inM=ym=>TX().filter(t=>t.d.slice(0,7)===ym);
/* kind of a transaction comes from its category: exp, sav (savings), inc, int (between own accounts, not counted).
   direction comes from t.t: an 'inc' row in an expense category is a refund that lowers that category,
   an 'inc' row in savings is a withdrawal. */
const kd=t=>{const c=cat(t.c);return c?(c.int?'int':c.sav?'sav':c.k):t.t};
const sgn=t=>t.t==='exp'?1:-1;
const incA=t=>kd(t)==='inc'?-sgn(t)*t.a:0;
const expA=t=>kd(t)==='exp'?sgn(t)*t.a:0;
const savA=t=>kd(t)==='sav'?sgn(t)*t.a:0;
const isRef=t=>t.t==='inc'&&(kd(t)==='exp'||kd(t)==='sav');
const sumBy=(l,f)=>l.reduce((s,t)=>s+f(t),0);
const tot=(ym,k)=>{const l=inM(ym);return k==='inc'?sumBy(l,incA):sumBy(l,t=>expA(t)+savA(t))};
const spendM=ym=>sumBy(inM(ym),expA);
const salary=ym=>sumBy(inM(ym).filter(t=>cat(t.c)?.sal),incA);
const spent=(ym,id)=>{const c=cat(id),inc=c&&!c.int&&c.k==='inc';return sumBy(inM(ym).filter(t=>t.c===id),t=>inc?-sgn(t)*t.a:sgn(t)*t.a)};
const catKind=c=>c.int?'int':c.sav?'sav':c.k;
const KINDL={exp:'הוצאה',sav:'חיסכון והשקעות',inc:'הכנסה',int:'העברה בין חשבונות'};
function typeLabel(t){const k=kd(t),i=t.t==='inc';return k==='int'?(i?'העברה נכנסת':'העברה יוצאת'):k==='sav'?(i?'משיכה מחיסכון':'הפקדה לחיסכון'):k==='inc'?(i?'הכנסה':'החזר הכנסה'):(i?'זיכוי':'הוצאה')}
function ensureInt(){let c=ints()[0];if(!c){c=normCat({id:S.cats.some(x=>x.id==='t1')?rid(8):'t1',k:'exp',name:'העברות בין חשבונות',color:'#94a3b8',int:true});S.cats.push(c);S.su=Date.now();if(SY.on)SY.cfgDirty=true}return c}
const G=()=>Math.max(0,+S.goal||0);
const AP=()=>clamp(+S.alertPct||80,50,100);
const budgetOf=(ym,c)=>salary(ym)*(+c.pct||0)/100;
const savedIn=ym=>sumBy(inM(ym),savA);
const defDate=()=>ui.cur===nowYm?todayStr:ui.cur+'-01';
function lvl(ym,id){const c=cat(id);if(!c||c.k!=='exp'||c.sav||c.int)return 0;const b=budgetOf(ym,c);if(!b)return 0;const r=spent(ym,id)/b;return r>1.0001?2:r>=AP()/100?1:0}
function snapLv(yms){const o={};[...new Set(yms)].forEach(ym=>exps().forEach(c=>o[ym+'|'+c.id]=lvl(ym,c.id)));return o}
function crossMsg(before){for(const k in before){const [ym,id]=k.split('|');const n=lvl(ym,id);if(n>before[k]){const c=cat(id),b=budgetOf(ym,c),sp=spent(ym,id);return n===2?`שים לב: ${c.name} חרגה מהתקציב ב־${fmt(sp-b)}.`:`שים לב: ${c.name} הגיעה ל־${Math.round(sp/b*100)}% מהתקציב.`}}return ''}

/* ---------- mutations ---------- */
function pushHist(){hist.push(JSON.stringify(S));if(hist.length>60)hist.shift()}
function markDirty(id){if(SY.on&&!SY.ro&&!SY.dirty.includes(id))SY.dirty.push(id)}
function markIDirty(id){if(SY.on&&!SY.idirty.includes(id))SY.idirty.push(id)}
function change(fn,{tx=[],items=[],cfg=false,undo=true}={}){
  if(SY.on&&SY.ro){toast('החשבון הזה מחובר לצפייה בלבד. אפשר לראות הכול, אבל לא לשנות');render();return}
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
function removeTx(id){const i=S.tx.findIndex(t=>t.id===id);if(i<0)return;const rm=String(id).match(RECID);if(rm){const r=S.rec.find(x=>x.id===rm[1]);const ym=rm[2]+'-'+rm[3];if(r&&!r.skip.includes(ym)){r.skip.push(ym);S.su=Date.now();if(SY.on)SY.cfgDirty=true}}if(SY.on){S.tx[i].del=1}else S.tx.splice(i,1)}
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
      const tx=ids.map(id=>{const t=S.tx.find(x=>x.id===id);if(!t)return null;sentU[id]=t.u;return {id:t.id,d:t.d,t:t.t,a:t.a,c:t.c,cn:cat(t.c)?.name||'',n:t.n,note:t.note||'',tags:t.tags||[],x:t.x||{},img:t.img||'',u:t.u,del:t.del?1:0}}).filter(Boolean);
      const iids=[...new Set(SY.idirty)],sentI={};
      const items=iids.map(id=>{const t=S.items.find(x=>x.id===id);if(!t)return null;sentI[id]=t.u;return {...t,del:t.del?1:0}}).filter(Boolean);
      const cfgSent=SY.cfgDirty,su=S.su;
      const res=await this.call({action:'sync',dev:ui.dev,me:ui.me,since:full?0:SY.since,full,tx,items,cfg:cfgSent&&!SY.ro?{cats:S.cats,goal:G(),alertPct:AP(),name:S.profile.name,rec:S.rec,rules:S.rules,weekly:S.weekly,ex:S.ex,u:S.su}:null});
      if(!res||!res.ok)throw new Error(res&&res.err||'server');
      SY.dirty=SY.dirty.filter(id=>{const t=S.tx.find(x=>x.id===id);return t&&t.u!==sentU[id]});
      if(cfgSent&&S.su===su)SY.cfgDirty=false;
      SY.sv=+res.v||2;SY.auto=!!res.auto;if(res.ro!==undefined)SY.ro=!!res.ro;document.body.classList.toggle('ro',!!SY.ro);
      if(SY.sv>=3)SY.idirty=SY.idirty.filter(id=>{const t=S.items.find(x=>x.id===id);return t&&t.u!==sentI[id]});
      const changed=applyRemote(res,full)|runRec(true);
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
  if(!c&&name){c={id:rid(8),k:kind,name:name.slice(0,40),color:PAL[S.cats.length%PAL.length],pct:0,sal:false,sav:false,int:false};S.cats.push(c);S.su=Date.now();if(SY.on&&!SY.ro)SY.cfgDirty=true}
  if(!c)c=S.cats.find(x=>x.k===kind&&/שונות|אחרת/.test(x.name))||S.cats.find(x=>x.k===kind)||S.cats[0];
  return c.id;
}
function applyRemote(res,full){
  let changed=false;
  if(res.cfg&&!SY.cfgDirty&&(+res.cfg.u||0)>(S.su||0)){
    const cs=Array.isArray(res.cfg.cats)?res.cfg.cats.map(normCat).filter(Boolean):[];
    if(cs.some(c=>c.k==='exp'&&!c.int)&&cs.some(c=>c.k==='inc'&&!c.int))S.cats=cs;
    if(res.cfg.goal!==undefined)S.goal=Math.max(0,+res.cfg.goal||0);
    if(res.cfg.alertPct)S.alertPct=clamp(+res.cfg.alertPct,50,100);
    if(typeof res.cfg.name==='string')S.profile.name=res.cfg.name.slice(0,40);
    if(Array.isArray(res.cfg.rec))S.rec=res.cfg.rec.map(normRec).filter(Boolean);
    if(res.cfg.rules)S.rules=normRules(res.cfg.rules);
    if(res.cfg.weekly)S.weekly=normWeekly(res.cfg.weekly);
    if(res.cfg.ex)S.ex=normEx(res.cfg.ex);
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
    if(r.tags!==undefined){const tg=normTags(r.tags);if(tg.length)o.tags=tg}else if(loc&&loc.tags)o.tags=loc.tags;
    if(r.x!==undefined){const xx=normX(r.x);if(xx)o.x=xx}else if(loc&&loc.x)o.x=loc.x;
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
function setSync(st){syncState=SY.on?st:'off';chrome();if(ui.view!=='sync')return;const el=$('#syncStat');if(el&&SY.on&&renderedSv===SY.sv)el.outerHTML=syncStatusHtml();else renderSync()}
let renderedSv=-1;
function agoText(ms){if(!ms)return 'עוד לא';const s=Math.round((Date.now()-ms)/1000);if(s<60)return 'הרגע';const m=Math.round(s/60);if(m<60)return `לפני ${m} דק׳`;const h=Math.round(m/60);if(h<24)return `לפני ${h} שע׳`;return new Date(ms).toLocaleDateString('he-IL')}
const enc=o=>'KSF1.'+btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
function dec(code){const s=String(code||'').replace(/\s+/g,'');const m=s.match(/KSF1\.([A-Za-z0-9_-]+)/);if(!m)return null;try{let b=m[1].replace(/-/g,'+').replace(/_/g,'/');while(b.length%4)b+='=';const o=JSON.parse(decodeURIComponent(escape(atob(b))));return o&&o.u&&o.k?o:null}catch{return null}}
const inviteCode=ro=>ro?enc({u:SY.url,k:INV.vkey,r:1}):enc({u:SY.url,k:SY.key});
const INV={vkey:'',mode:'full',qr:false};
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
  const ro=!!(res.ro||o.r);
  await startSync(o.u,o.k,merge&&!ro,res.sheet,res.v,ro);
}
async function startSync(url,key,merge,sheet,v,ro=false){
  if(sample){S=blank();sample=false}
  SY={on:true,url,key,since:0,dirty:[],idirty:[],cfgDirty:false,last:0,err:'',sheet:sheet||'',sv:+v||2,ro:!!ro,auto:false};
  if(merge){S.tx=S.tx.filter(t=>!t.del);S.tx.forEach(t=>{t.u=t.u||Date.now();SY.dirty.push(t.id)});S.items=S.items.filter(t=>!t.del);S.items.forEach(t=>{t.u=t.u||Date.now();SY.idirty.push(t.id)});S.su=Date.now();SY.cfgDirty=true}
  else{S.tx=[];S.items=[];S.su=0}
  if(merge){const used=[...new Set(TX().map(t=>t.img).concat(ITEMS('pic').map(p=>p.img)).filter(Boolean))];
    for(const k of used){try{const x=await IDB.get('i:'+k);if(x&&x.up){x.up=false;await IDB.put('i:'+k,x)}}catch{}}}
  hist=[];persistNow();saveSyncInfo();render();Sync.run(true);
}

/* ---------- toast, dialogs ---------- */
let tt,toastAct=null;
function toast(msg,undoable,act){$('#tmsg').textContent=msg;toastAct=act?act.fn:null;$('#tundo').textContent=act?act.label:'בטל';$('#tundo').hidden=!(undoable||act);$('#toast').classList.add('on');clearTimeout(tt);tt=setTimeout(()=>$('#toast').classList.remove('on'),6000)}
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
const TITLES={home:'סקירה',tx:'תנועות',budget:'תקציב',reports:'דוחות',bank:'בנק וכרטיס',settings:'הגדרות',msgs:'הודעות',album:'תמונות ורקע',import:'ייבוא מאקסל ושיטס',sync:'סנכרון משותף',backup:'גיבוי וייצוא',profile:'פרופיל והתקנה'};
function openDrawer(){$('#drawer').classList.add('open');$('#scrim').hidden=false;$('#menuBtn').setAttribute('aria-expanded','true');$('#moreBtn')?.setAttribute('aria-expanded','true');setTimeout(()=>$('#drawer .menu a.on, #drawer .menu a')?.focus(),50)}
function closeDrawer(){$('#drawer').classList.remove('open');$('#scrim').hidden=true;$('#menuBtn').setAttribute('aria-expanded','false');$('#moreBtn')?.setAttribute('aria-expanded','false')}
function openSpeed(){$('#speed').hidden=false;$('#scrim2').hidden=false;$('#fab').setAttribute('aria-expanded','true')}
function closeSpeed(){$('#speed').hidden=true;$('#scrim2').hidden=true;$('#fab').setAttribute('aria-expanded','false')}
function route(){
  let v=(location.hash||'#home').slice(1);if(v==='profile')v='settings';ui.view=TITLES[v]?v:'home';
  $$('.view').forEach(s=>s.hidden=s.dataset.view!==ui.view);document.body.dataset.view=ui.view;$('#msgF').hidden=ui.view!=='msgs';
  $$('[data-nav]').forEach(a=>{const on=a.dataset.nav===ui.view;a.classList.toggle('on',on);if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
  $('#vTitle').textContent=TITLES[ui.view];
  $('#mnav').hidden=!['home','tx','budget','reports'].includes(ui.view);
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
  const cur=ui.cur,pm=shiftYm(cur,-1),inc=tot(cur,'inc'),exp=tot(cur,'exp'),net=inc-exp,pi=tot(pm,'inc');
  const mn=MN[mIdx(cur)],spend=spendM(cur),pspend=spendM(pm);
  $('#big').textContent=!inc&&!exp?`עוד אין תנועות ב${mn}`:net>=0?`נשארו לך ${fmt(net)} ב${mn}`:`חרגת ב־${fmt(-net)} ב${mn}`;
  let top=null,tv=0;exps().filter(c=>!c.sav).forEach(c=>{const v=spent(cur,c.id);if(v>tv){tv=v;top=c}});
  $('#sub').textContent=inc?`הוצאת ${Math.round(spend/inc*100)}% מההכנסות${top?`, והכי הרבה הלך על ${top.name}`:''}.`:exp?`הוצאת ${fmt(exp)} ועוד לא נרשמה הכנסה החודש.`:'הוסף משכורת או הוצאה ראשונה כדי להתחיל.';
  const ch=(a,b)=>b?`${a>=b?'↑':'↓'} ${Math.abs(Math.round((a-b)/b*100))}% מהחודש הקודם`:'אין נתון לחודש הקודם';
  const f=[['הכנסות',fmt(inc),ch(inc,pi)],['הוצאות',fmt(spend),ch(spend,pspend)]];
  $('#figs').innerHTML=f.map(x=>`<div><span>${esc(x[0])}</span><b>${esc(x[1])}</b><small>${esc(x[2])}</small></div>`).join('');
  $('#noteHome').hidden=!sample;$('#hName').textContent=S.profile.name;
  renderHomeMsg();renderHomeAlbum();renderForecast();renderInbox();renderCardHome();
  renderAlerts();renderGoal();renderCats();drawChart();
  const rec=inM(cur).sort((a,b)=>a.d<b.d?1:a.d>b.d?-1:0).slice(0,4);
  $('#recent').innerHTML=rec.length?`<div class="dayl">${rec.map(t=>txRow(t,true)).join('')}</div>`:'<p class="empty">אין תנועות בחודש הזה.</p>';
  hydrate($('#recent'));
}
let showAllAlerts=false;
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
  if(cur===nowYm){const cf=cardForecast();if(cf&&cf.low)out.unshift(['over',`צפוי חוסר בבנק ב־${ddm(cf.d)}`,`חיוב הכרטיס (${fmt(cf.a)}) ישאיר בערך ${fmt(cf.after)}. כדאי להעביר כסף לפני.`]);
    subs().filter(s=>s.isNew||s.chg>0).slice(0,3).forEach(s=>out.push(['warn',s.isNew?`מנוי חדש: ${s.n.slice(0,30)}`:`${s.n.slice(0,30)} התייקר`,s.isNew?`${fmt(s.a)} ${s.yearly?'בשנה':'בחודש'}. אם זה לא שלך, כדאי לבדוק.`:`מ־${fmt(s.prev)} ל־${fmt(s.a)}.`]));
    const ow=sumBy(owed(),o=>o.a);if(ow>0)out.push(['warn',`מגיעים לך ${fmt(ow)} מחברים`,'פירוט ב"דוחות", בכרטיס "מי חייב לי".'])}
  const list=out.length?out:[['ok','הכול בתוך התקציב','אף קטגוריה לא קרובה לחריגה החודש.']];
  const view=showAllAlerts?list:list.slice(0,2);
  const rest=list.length-view.length;
  $('#alList').innerHTML=view.map(a=>`<li class="${a[0]}"><div><b>${esc(a[1])}</b><small>${esc(a[2])}</small></div></li>`).join('')+(rest?`<li class="more"><button type="button" class="lnk2" id="alMore" aria-expanded="false">עוד ${rest} התראות</button></li>`:'');
}
$('#alList').addEventListener('click',e=>{if(!e.target.closest('#alMore'))return;showAllAlerts=true;renderAlerts()});
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
  const top=rows.slice(0,5),more=rows.length-top.length;
  const maxS=Math.max(1,...rows.map(r=>r.s));
  $('#catHint').textContent=sal?'הקו מסמן את התקציב מתוך המשכורת.':'בלי משכורת מוצגות רק ההוצאות.';
  const rowHtml=r=>{const s=Math.max(0,r.s),den=r.b?Math.max(r.b,s):maxS,over=r.b&&r.s>r.b+.5;const note=r.s<0?'הזיכויים גדולים מההוצאות':r.b?(over?`חריגה של ${fmt(r.s-r.b)}`:`נשארו ${fmt(r.b-r.s)} מתוך ${fmt(r.b)}`):r.c.sav?'חיסכון':'ללא תקציב';
    return `<div class="cr${over?' over':''}"><span class="cn"><i style="background:${col(r.c)}"></i>${esc(r.c.name)}</span><div class="tr" role="img" aria-label="${esc(r.c.name)}, ${esc(fmt(r.s))}"><b style="width:${(s/den*100).toFixed(1)}%;background:${col(r.c)}"></b>${r.b?`<u style="inset-inline-start:calc(${(r.b/den*100).toFixed(1)}% - 1px)"></u>`:''}</div><span class="cv">${fmt(r.s)}<small>${esc(note)}</small></span></div>`};
  $('#cats').innerHTML=top.length?top.map(rowHtml).join(''):'<p class="empty">אין הוצאות בחודש הזה.</p>';
  const cm=$('#catMore');if(cm){cm.hidden=!more;cm.innerHTML=more?`<a href="#budget">ועוד ${more} בתקציב</a>`:''}
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
    g+=`<rect x="${cx-bw-2}" y="${y(m.i)}" width="${bw}" height="${T+ih-y(m.i)}" rx="6" fill="var(--inc)"/><rect x="${cx+2}" y="${y(m.e)}" width="${bw}" height="${T+ih-y(m.e)}" rx="6" fill="var(--ink)"/>`;
    if((m.i||m.e)&&(cw>=60||sel))g+=`<text x="${cx}" y="${Math.min(y(m.i),y(m.e))-8}" text-anchor="middle" style="fill:${n>=0?'var(--inc)':'var(--over)'};font-weight:700">${n>=0?'+':''}${esc(fmtK(n))}</text>`;
    g+=`<text x="${cx}" y="${H-9}" text-anchor="middle" style="${sel?'fill:var(--ink);font-weight:700':''}">${(cw<70?MS:MN)[mIdx(m.k)]}</text><rect data-k="${m.k}" x="${L+cw*i}" y="0" width="${cw}" height="${H}" fill="transparent" style="cursor:pointer"><title>${MN[mIdx(m.k)]}: הכנסות ${esc(fmt(m.i))}, הוצאות ${esc(fmt(m.e))}</title></rect>`});
  svg.innerHTML=g;
}
const chartRO=new ResizeObserver(drawChart);chartRO.observe(svg);

/* ---------- render: transactions ---------- */
function dayLabel(d){const [y,m,dd]=d.split('-').map(Number);const dt=new Date(y,m-1,dd);const t=new Date(T0.getFullYear(),T0.getMonth(),T0.getDate());const diff=Math.round((t-dt)/864e5);
  const base=`${DN[dt.getDay()]}, ${dd} ב${MN[m-1]}${y!==T0.getFullYear()?' '+y:''}`;return diff===0?'היום, '+base:diff===1?'אתמול, '+base:base}
function txBadges(t){const x=t.x||{},k=kd(t),b=[];if(x.rv)b.push('<span class="bdg rv">לבדיקה</span>');if(isRef(t))b.push(`<span class="bdg ref">${k==='sav'?'משיכה':'זיכוי'}</span>`);if(k==='int')b.push('<span class="bdg int">לא נספר</span>');
  if(x.sp?.length){const o=x.sp.filter(p=>!p.ok).reduce((s,p)=>s+p.a,0);b.push(o?`<span class="bdg sp">מגיע לך ${esc(fmt(o))}</span>`:'<span class="bdg ok">החזירו לך</span>')}
  if(x.lk)b.push('<span class="bdg ok">החזר מחבר</span>');if(x.in)b.push(`<span class="bdg">תשלום ${x.in.i}/${x.in.n}</span>`);return b.join('')}
function amtHtml(t){const k=kd(t);if(k==='int')return `<span class="ta int">${t.t==='inc'?'⇠':'⇢'} ${fmt(t.a)}</span>`;if(isRef(t))return `<span class="ta ref">+${fmt(t.a)}</span>`;const inc=incA(t)>0;return `<span class="ta${inc?' inc':''}">${inc?'+':''}${fmt(t.a)}</span>`}
function txRow(t,withDate){const c=cat(t.c);
  const sub=(c?.name||'ללא קטגוריה')+(withDate?', '+t.d.slice(8)+'/'+t.d.slice(5,7):'');
  return `<button class="txr" data-open="${esc(t.id)}"><span class="tav" style="--c:${col(c)}">${esc((c?.name||'?').slice(0,1))}${t.img?`<img data-img="${esc(t.img)}" alt="">`:''}</span><span class="tm"><b>${esc(t.n||c?.name||'ללא תיאור')}</b><small>${esc(sub)}${txBadges(t)}</small>${t.note?`<small class="tnote"><svg class="ic"><use href="#i-note"/></svg>${esc(t.note)}</small>`:''}${t.tags?.length?`<small class="tglist">${t.tags.map(g=>`<span class="tg">#${esc(g)}</span>`).join('')}</small>`:''}</span>${amtHtml(t)}</button>`}
function catOpts(sel){const o=c=>`<option value="${esc(c.id)}"${c.id===sel?' selected':''}>${esc(c.name)}</option>`,it=ints();return `<optgroup label="הוצאות">${exps().map(o).join('')}</optgroup><optgroup label="הכנסות">${incs().map(o).join('')}</optgroup>${it.length?`<optgroup label="העברות בין החשבונות שלך">${it.map(o).join('')}</optgroup>`:''}`}
const TF={exp:t=>(kd(t)==='exp'||kd(t)==='sav')&&t.t==='exp',inc:t=>kd(t)==='inc',ref:isRef,int:t=>kd(t)==='int',rv:t=>!!t.x?.rv,sp:t=>!!(t.x?.sp?.length||t.x?.lk)};
const TFL={all:'הכול',exp:'הוצאות',inc:'הכנסות',ref:'זיכויים',int:'העברות פנימיות',rv:'לבדיקה',sp:'חלוקה עם חברים'};
function currentList(){
  let l=ui.scope==='month'?inM(ui.cur):TX();
  if(ui.typeF!=='all'&&TF[ui.typeF])l=l.filter(TF[ui.typeF]);
  if(ui.catF)l=l.filter(t=>t.c===ui.catF);
  if(ui.tagF)l=l.filter(t=>(t.tags||[]).includes(ui.tagF));
  if(ui.q){const k=ui.q.toLowerCase();l=l.filter(t=>(t.n||'').toLowerCase().includes(k)||(t.note||'').toLowerCase().includes(k)||(t.tags||[]).some(g=>g.toLowerCase().includes(k))||(cat(t.c)?.name||'').toLowerCase().includes(k)||String(t.a).includes(k))}
  const val=t=>ui.sortK==='a'?(incA(t)>0||isRef(t)?1:-1)*(+t.a||0):ui.sortK==='c'?(cat(t.c)?.name||''):ui.sortK==='n'?(t.n||''):t.d;
  return l.sort((a,b)=>{const x=val(a),z=val(b);return ((x<z?-1:x>z?1:0)*ui.sortD)||(a.d<b.d?1:a.d>b.d?-1:0)});
}
function setSeg(el,v){$$('button',el).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===v)))}
function renderTx(){
  $('#noteTx').hidden=!sample;
  $('#catF').innerHTML='<option value="">כל הקטגוריות</option>'+catOpts(ui.catF);
  const at=allTags();if(ui.tagF&&!at.includes(ui.tagF))ui.tagF='';$('#tagFL').hidden=!at.length;$('#tagF').innerHTML='<option value="">כל התגיות</option>'+at.map(g=>`<option value="${esc(g)}"${g===ui.tagF?' selected':''}>#${esc(g)}</option>`).join('');
  setSeg($('#typeF'),ui.typeF);setSeg($('#scope'),ui.scope);setSeg($('#modeSeg'),ui.mode);renderFilt();
  const l=currentList();
  const ti=sumBy(l,incA),te=sumBy(l,expA),tsv=sumBy(l,savA),tin=l.filter(t=>kd(t)==='int').length;
  $('#tsum').textContent=ui.typeF==='ref'?`${l.length} זיכויים ומשיכות · חזרו ${fmt(sumBy(l,t=>t.a))}`:ui.typeF==='int'?`${l.length} העברות בין החשבונות שלך · יצאו ${fmt(sumBy(l.filter(t=>t.t==='exp'),t=>t.a))}, נכנסו ${fmt(sumBy(l.filter(t=>t.t==='inc'),t=>t.a))} · לא נספרות`:`${l.length} תנועות · הכנסות ${fmt(ti)} · הוצאות ${fmt(te)}${tsv?` · חיסכון ${fmt(tsv)}`:''}${tin?` · ${tin} העברות פנימיות שלא נספרות`:''}`;
  const grid=ui.mode==='grid';$('#txGrid').hidden=!grid;$('#txList').hidden=grid;$('#addRow').hidden=!grid;
  if(!grid){
    const by=new Map();l.slice().sort((a,b)=>a.d<b.d?1:a.d>b.d?-1:0).forEach(t=>{if(!by.has(t.d))by.set(t.d,[]);by.get(t.d).push(t)});
    $('#txList').innerHTML=l.length?[...by].map(([d,ts])=>{const net=ts.reduce((s,t)=>s+incA(t)-expA(t)-savA(t),0);return `<div class="day"><div class="dayh"><span>${esc(dayLabel(d))}</span><span>${net>0?'+':''}${fmt(net)}</span></div><div class="dayl">${ts.map(t=>txRow(t)).join('')}</div></div>`}).join(''):`<div class="card empty">${TX().length?'אין תנועות שמתאימות לסינון.':'עוד אין תנועות. לחץ על + כדי להוסיף, או ייבא מאקסל.'}</div>`;
    hydrate($('#txList'));return;
  }
  $$('#tbl th[data-s]').forEach(th=>{const b=$('button',th);b.textContent=b.textContent.replace(/ [↑↓]$/,'');if(th.dataset.s===ui.sortK){th.setAttribute('aria-sort',ui.sortD>0?'ascending':'descending');b.textContent+=ui.sortD>0?' ↑':' ↓'}else th.removeAttribute('aria-sort')});
  $('#tb').innerHTML=l.length?l.map(t=>{const c=cat(t.c);return `<tr data-id="${esc(t.id)}">
<td class="dt"><input type="date" data-f="d" value="${esc(t.d)}" aria-label="תאריך"></td>
<td class="nt"><input data-f="n" value="${esc(t.n)}" maxlength="120" placeholder="תיאור" aria-label="תיאור"></td>
<td class="ct" style="border-inline-start-color:${col(c)}"><select data-f="c" aria-label="קטגוריה">${catOpts(t.c)}</select></td>
<td class="amt ${incA(t)>0?'inc':isRef(t)?'ref':kd(t)==='int'?'int':''}"><input type="number" inputmode="decimal" min="0" step="0.01" data-f="a" value="${+t.a||0}" aria-label="סכום"></td>
<td class="nto"><input data-f="note" value="${esc(t.note||'')}" maxlength="500" placeholder="הערה" aria-label="הערה"></td>
<td class="x px"><button class="mini" data-open="${esc(t.id)}" aria-label="פרטים ותמונה">${t.img?`<img data-img="${esc(t.img)}" alt="">`:'<svg class="ic"><use href="#i-cam"/></svg>'}</button></td>
<td class="x"><button data-del aria-label="מחק שורה"><svg class="ic"><use href="#i-x"/></svg></button></td></tr>`}).join(''):`<tr><td colspan="7" class="empty">${TX().length?'אין תנועות שמתאימות לסינון.':'עוד אין תנועות.'}</td></tr>`;
  hydrate($('#tb'));
}

/* ---------- render: budget ---------- */
function renderBudget(){
  renderRecList();
  const gi=$('#goalIn'),ai=$('#apIn');if(document.activeElement!==gi)gi.value=G();if(document.activeElement!==ai)ai.value=AP();
  const sal=salary(ui.cur);let sum=0;
  $('#setE').innerHTML=exps().map(c=>{sum+=+c.pct||0;return `<tr data-cid="${esc(c.id)}">
<td data-a="k"><input type="color" data-k="color" value="${col(c)}" aria-label="צבע"></td>
<td data-a="n"><input data-k="name" value="${esc(c.name)}" maxlength="40" aria-label="שם קטגוריה"></td>
<td data-a="t" data-l="סוג">${kindSel(c)}</td>
<td data-a="p" data-l="אחוז" class="amt"><input type="number" min="0" max="100" step="1" inputmode="numeric" data-k="pct" value="${+c.pct||0}" aria-label="אחוז מהמשכורת"></td>
<td data-a="b" data-l="תקציב" class="num">${fmt(sal*(+c.pct||0)/100)}</td>
<td data-a="a" data-l="בפועל" class="num">${fmt(spent(ui.cur,c.id))}</td>
<td data-a="x" class="x"><button data-cdel aria-label="מחק קטגוריה"><svg class="ic"><use href="#i-x"/></svg></button></td></tr>`}).join('');
  const ps=$('#pctSum');ps.textContent=`מוקצה ${sum}% מהמשכורת`+(sum<100?`, ${100-sum}% נשארים חופשיים.`:sum>100?', יותר מ־100%. כדאי להוריד באחת הקטגוריות.':'. כל השקל מתוכנן.');ps.className='hint'+(sum>100?' bad':'');
  $('#setI').innerHTML=incs().map(c=>`<tr data-cid="${esc(c.id)}">
<td data-a="k"><input type="color" data-k="color" value="${col(c)}" aria-label="צבע"></td>
<td data-a="n"><input data-k="name" value="${esc(c.name)}" maxlength="40" aria-label="שם קטגוריה"></td>
<td data-a="t" data-l="סוג">${kindSel(c)}</td>
<td data-a="s"><input type="checkbox" data-k="sal"${c.sal?' checked':''} aria-label="נכנסת לחלוקה"><span class="mob">נכנסת לחלוקה</span></td>
<td data-a="x" class="x"><button data-cdel aria-label="מחק קטגוריה"><svg class="ic"><use href="#i-x"/></svg></button></td></tr>`).join('');
  const it=ints();
  $('#setT').innerHTML=it.length?it.map(c=>{const l=inM(ui.cur).filter(t=>t.c===c.id),o=sumBy(l.filter(t=>t.t==='exp'),t=>t.a),i=sumBy(l.filter(t=>t.t==='inc'),t=>t.a);return `<tr data-cid="${esc(c.id)}">
<td data-a="k"><input type="color" data-k="color" value="${col(c)}" aria-label="צבע"></td>
<td data-a="n"><input data-k="name" value="${esc(c.name)}" maxlength="40" aria-label="שם קטגוריה"></td>
<td data-a="t" data-l="סוג">${kindSel(c)}</td>
<td data-a="b" data-l="יצא החודש" class="num">${fmt(o)}</td>
<td data-a="a" data-l="נכנס החודש" class="num">${fmt(i)}</td>
<td data-a="x" class="x"><button data-cdel aria-label="מחק קטגוריה"><svg class="ic"><use href="#i-x"/></svg></button></td></tr>`}).join(''):'<tr><td class="empty" colspan="6">אין עדיין. הוסף כדי שהעברות לחשבון נוסף, לכרטיס נטען או לארנק לא ייספרו כהוצאה.</td></tr>';
  renderRules();
}
const kindSel=c=>`<select class="field ksel" data-k="kind" aria-label="סוג הקטגוריה ${esc(c.name)}">${['exp','sav','inc','int'].map(k=>`<option value="${k}"${catKind(c)===k?' selected':''}>${KINDL[k]}</option>`).join('')}</select>`;
function setKind(c,v){c.int=v==='int';c.sav=v==='sav';if(v==='exp'||v==='sav')c.k='exp';else if(v==='inc')c.k='inc';if(c.int){c.pct=0;c.sal=false;c.sav=false}if(c.k==='inc')c.sav=false;if(c.k==='exp')c.sal=false}

/* ---------- render: sync ---------- */
let GS='';
const GS_SRC=['https://raw.githubusercontent.com/enoshc/kesef/main/apps-script.gs?t=','apps-script.gs?t='];
async function loadGS(){for(const u of GS_SRC){try{const r=await fetch(u+Date.now(),{cache:'no-store'});if(r.ok){const t=await r.text();if(/var VERSION = \d+/.test(t)){GS=t;return t}}}catch{}}return GS}
loadGS();
function syncStatusHtml(){const pend=SY.dirty.length+SY.idirty.length+(SY.cfgDirty?1:0),bad=syncState==='err';
  return `<div class="status${bad?' err':''}" id="syncStat"><svg class="ic"><use href="#i-${bad?'alert':'check'}"/></svg><div><b>${bad?'הסנכרון נכשל':syncState==='busy'?'מסנכרן…':'מחובר לגיליון משותף'}</b><small>${esc(bad?SY.err:`עודכן ${agoText(SY.last)}${pend?`, ${pend} שינויים מחכים`:''}`)}</small></div></div>`}
function renderSync(){
  const b=$('#syncBody'),keep={},ae=document.activeElement,aid=ae&&b.contains(ae)?ae.id:'',selS=aid&&ae.selectionStart!=null?ae.selectionStart:null,selE=aid&&ae.selectionEnd!=null?ae.selectionEnd:null;
  ['wEm','wOn','wFreq','wDay','joinCode','joinMerge','gsUrl','ingTest'].forEach(id=>{const el=$('#'+id);if(el)keep[id]=el.type==='checkbox'?el.checked:el.value});
  renderSyncInner(b);renderedSv=SY.sv;if(ui.view==='settings')renderSetDyn();
  Object.keys(keep).forEach(id=>{const el=$('#'+id);if(!el)return;if(el.type==='checkbox'){if(!el.disabled)el.checked=keep[id]}else el.value=keep[id]});
  if(aid){const el=$('#'+aid);if(el){el.focus({preventScroll:true});try{if(selS!=null)el.setSelectionRange(selS,selE)}catch{}}}
}
function renderSyncInner(b){
  if(SY.on){
    b.innerHTML=`<div class="card">
${syncStatusHtml()}
<p class="hint">כל שינוי שאתה עושה נשלח לגיליון, והאפליקציה בודקת עדכונים מהמכשירים האחרים כל 20 שניות. אפשר גם לערוך ישירות בגיליון, והשינויים יגיעו לאפליקציה.</p>
<div class="btnrow"><button class="btn solid" data-act="sync-now">סנכרן עכשיו</button>${SY.sheet&&/^https:\/\//.test(SY.sheet)?`<a class="btn" href="${esc(SY.sheet)}" target="_blank" rel="noopener"><svg class="ic"><use href="#i-sheet"/></svg>פתח את הגיליון</a>`:''}</div></div>
${updCard()}
${SY.ro?`<div class="card"><h2>צפייה בלבד</h2><p class="hint" style="margin:0">המכשיר הזה מחובר עם קוד לצפייה. רואים את כל התנועות, הדוחות והתקציב, אבל אי אפשר להוסיף או לשנות. כדי לערוך, בקש מבעל החשבון קוד הצטרפות מלא.</p></div>`:`<div class="card"><p class="hint" style="margin:0">התראות, סיכום במייל, חיובים שנכנסים לבד, סירי והוידג׳ט נמצאים ב<a href="#settings">הגדרות</a>.</p></div>
${partnerCard()}`}
<div class="card"><h2>ניתוק</h2><p class="hint">המכשיר יפסיק לסנכרן. הגיליון והמכשירים האחרים ממשיכים כרגיל. אם חיברת את החשבון בשביל מישהו אחר, בחר "נתק ומחק", ולא יישאר אצלך כלום מהנתונים שלהם.</p><div class="btnrow"><button class="btn sm" data-act="disconnect">נתק והשאר את הנתונים</button><button class="btn danger sm" data-act="disconnect-wipe">נתק ומחק מהמכשיר</button></div></div>`;
    return;
  }
  const last=sessionStorage.getItem('kesef-url')||'';
  b.innerHTML=`<div class="card"><h2>ניהול משותף דרך גוגל שיטס</h2>
<p class="hint" style="margin:0">מחברים את האפליקציה לגיליון גוגל שלכם. כל מה שמישהו מוסיף מופיע אצל כולם ובגיליון עצמו, אפשר לערוך גם בגיליון, והקבלות נשמרות בתיקייה בדרייב. הנתונים נשארים בחשבון הגוגל שלכם בלבד.</p></div>
<div class="card"><h2>יש לך קוד הצטרפות?</h2><p class="hint">אם השותף שלך כבר חיבר גיליון, הדבק כאן את הקוד שהוא שלח.</p>
<textarea class="field code" id="joinCode" rows="3" placeholder="KSF1.…" aria-label="קוד הצטרפות">${esc((()=>{try{return sessionStorage.getItem('kesef-join')||''}catch{return ''}})())}</textarea>
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
const RULES=[['תחבורה ודלק',/תחנת (?:ד|סו|פז)/],
 ['בילויים ומסעדות',/קופי|coffee|cafe|פסטה|פאדתאי|גלידר|\bbar\b|ביסטרו|פינתי|תנדי|הצרפתי|מאפה|בייגל|שניצל|סטייק|ראמן|פרנצ'וק|מועדון לינקולן/i],
 ['ציוד ועבודה',/פוטו|photo|alipay/i],
 ['סופר ואוכל',/גדרון|כוורת|ביסטופ|עיר הבה"?דים|שופרסל|רמי לוי|ויקטורי|יוחננוף|אושר עד|מגה|טיב טעם|חצי חינם|יינות ביתן|סופר|מכולת|קרפור|carrefour|פרש מרקט|מאפי|ירקות|קצביה|מש - קר|נאייקס|מכונות אוטומטיות|פיצוחי|המשביע|מינימרקט|ממתקי/i],
 ['תחבורה ודלק',/פז |פז\/|פזYELLOW|yellow|סונול|דור אלון|דלק|רב.?קו|רכבת|אגד|gett|מונית|חניון|חניונים|פנגו|pango|cellopark|סלופארק|כביש 6|נתיבי|מוסך|אופנועים|טסט|רכב|תחבורה|רישוי/i],
 ['חשבונות ותקשורת',/סלקום|פרטנר|פלאפון|הוט |hot |בזק|גולן טלקום|we4g|חברת החשמל|חשמל|מקורות|תאגיד מים|ארנונה|סופרגז|אמישראגז|netflix|spotify|apple\.com|google|מועצה|עירי/i],
 ['בילויים ומסעדות',/ארומה|קפה|מקדונלד|בורגר|פיצה|וולט|wolt|תן ביס|10bis|מסעד|סינמה|קולנוע|גלידה|שווארמה|פלאפל|בר |אז בר|סביח|חומוס|סושי|GO OUT|כרטיסים|tickets|הופעות/i],
 ['בריאות וביטוחים',/מכבי|כללית|מאוחדת|לאומית|סופר.?פארם|בי פארם|פארם|ביטוח|הראל|מגדל|הפניקס|מנורה|רופא|מרפאה|אופטיקה/i],
 ['מגורים ושכירות',/שכירות|שכר דירה|ועד בית|משכנתא/i],
 ['חיסכון והשקעות',/חיסכון|השקע|גמל|קרן השתלמות|פיקדון|פקדון/i],
 ['ציוד ועבודה',/ksp|קי אס פי|באג |איבורי|ivory|מחסני חשמל|צילום|canon|קנון|amazon|אמזון|aliexpress|עלי אקספרס|temu|davinci|adobe|runway|מחשבים|ציוד משרדי/i]];
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
function loadSheet(){const ws=IMP.wb.Sheets[IMP.sheet];IMP.aoa=XLSX.utils.sheet_to_json(ws,{header:1,raw:true,defval:'',blankrows:false});findHeader();guessMap();parseImp();renderImport();}
function ruleCat(n,kind){for(const [name,rx] of (kind==='inc'?IRULES:RULES))if(rx.test(n)){const c=S.cats.find(x=>x.k===kind&&x.name===name);if(c)return c.id}return ''}
/* ---------- smart import: max credit card + Pepper bank account ---------- */
const SRX={pmax:/חיוב כרטיס מקס|מקס איט/,invest:/INTERACTIVE|IBKR|קנית ני"?ע|מכירת ני"?ע|פעולה במטח/i,sal:/משכורת|בל-מילואים|מת"?ש|מת ש חובה|מילואים|שכר עבודה/,
  org:/בע"?מ|בעמ|מפלגה|יקבי|קבוצת|מרכז|אגודה|עמותה|בנק|יובנק|אקסטרס|ערב |מתנות|ביטוח|כללית|רותם|קרן|חברת|ישיבה|מועצה|עירי|הגברים|לעיצוב|קדמה|האגודה|שירותי|שרותי|איי\.די\.איי|קי אס פי/,
  person:/BIT|PAYBOX|פייבוקס/i,biz:/בע"?מ|בעמ|מפלגה|יקבי|אקסטרס/,
  travel:/מט"ח|airlines|אל על|ELAL|booking\.com|hotel|hostel|agoda|trip\.com|12go|airalo|airgsm|holafly|budgetair|travix|airbnb|נתב"ג|duty free|היינמן|evisa|ivisa|klook|getyourguide|2c2p/i,
  insur:/ביטוח|ליברה|הראל|מגדל|הפניקס|מנורה|פספורטכארד|איי\.די\.איי נסיעות/};
const MAXCAT={'מזון וצריכה':'סופר ואוכל','מסעדות, קפה וברים':'בילויים ומסעדות','דלק, חשמל וגז':'תחבורה ודלק','תחבורה ורכבים':'תחבורה ודלק','חשמל ומחשבים':'ציוד ועבודה','פנאי, בידור וספורט':'בילויים ומסעדות','ביטוח':'בריאות וביטוחים','רפואה ובתי מרקחת':'בריאות וביטוחים','עירייה וממשלה':'חשבונות ותקשורת','שירותי תקשורת':'חשבונות ותקשורת','ספרים ודפוס':'ציוד ועבודה','טיסות ותיירות':'חופשות וטיולים','העברת כספים':'העברות לאנשים'};
const NEWCAT={'חופשות וטיולים':['exp','#0b6e99'],'העברות לאנשים':['exp','#d6409f'],'העברות מאנשים':['inc','#12a5b8'],'העברות בין חשבונות':['int','#94a3b8'],'חיסכון והשקעות':['sav','#a16207'],'עבודות צד':['inc','#12a5b8'],'הכנסה אחרת':['inc','#6b7f2a'],'משכורת':['inc','#00a862'],'שונות':['exp','#64748b']};
const PLATFORM=new Set(['google','paypal','apple','amazon','bit','paybox']),GENW=new Set(['העברה','תשלום','בע','בעמ','il','ie','us','lu','gb','nl','cy','th','la','vn','lk','ge','com','www','co','the','ltd','inc','plan','standard']);
const skelW=w=>/[א-ת]/.test(w)?w.replace(/[יו]/g,''):w;
function nkey(s){s=String(s||'').toLowerCase().trim();if(/מט"ח|מט״ח/.test(s))return ['fx'];if(/עמלת|עמלה|החזר עמ\.|עמ\.ח/.test(s))return ['fee'];
  s=s.replace(/^(?:העברה|תשלום)\s+/,'').replace(/^[מל](?=[א-ת]{2})/,'').replace(/[^a-zא-ת ]/g,' ');return s.split(/\s+/).filter(x=>x.length>1&&!GENW.has(x)).map(skelW)}
function sameM(a,b){const wa=nkey(a),wb=nkey(b);if(!wa.length||!wb.length)return false;if(PLATFORM.has(wa[0])||PLATFORM.has(wb[0]))return wa.length>1&&wa[0]===wb[0]&&wa[1]===wb[1];
  if(wa[0]===wb[0]&&wa[0].length>=2)return true;if(wa.length>1&&wb.length>1&&wa[0]===wb[0]&&wa[1]===wb[1])return true;const sb=new Set(wb);return wa.filter(x=>sb.has(x)).length>=2}
const ruleName=n=>{for(const [c,rx] of RULES)if(rx.test(n))return c;return ''};
const sheetAoa=(wb,n)=>XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,raw:true,defval:'',blankrows:false});
function detectFmt(wb){for(const n of wb.SheetNames){for(const r of sheetAoa(wb,n).slice(0,15)){const h=r.map(x=>String(x??'').trim());if(h.includes('שם בית העסק')&&h.some(x=>/^סכום חיוב/.test(x)))return 'max';if(h[0]==='תאריך'&&h.includes('תיאור')&&h.includes('סכום')&&h.includes('יתרה'))return 'pepper'}}return null}
function parseMaxWb(wb){const out=[];wb.SheetNames.forEach(sn=>{const a=sheetAoa(wb,sn),hi=a.findIndex(r=>r.some(x=>String(x).trim()==='שם בית העסק'));if(hi<0)return;
  const h=a[hi].map(x=>String(x??'').trim()),ix=k=>h.findIndex(x=>x===k||x.startsWith(k)),I={d:ix('תאריך עסקה'),n:ix('שם בית העסק'),c:ix('קטגוריה'),card:ix('4 ספרות'),typ:ix('סוג עסקה'),a:ix('סכום חיוב'),cur:ix('מטבע חיוב'),oa:ix('סכום עסקה מקורי'),ocur:ix('מטבע עסקה מקורי'),bd:ix('תאריך חיוב'),note:ix('הערות'),how:ix('אופן ביצוע')};
  const g=(r,k)=>I[k]>=0?String(r[I[k]]??'').trim():'';
  a.slice(hi+1).forEach(r=>{const d=cellDate(r[I.d]),amt=num(r[I.a]);if(!d||!amt)return;out.push({src:'max',sheet:sn,d,n:g(r,'n').replace(/\s{2,}/g,' ').slice(0,120),mcat:g(r,'c'),card:g(r,'card'),typ:g(r,'typ'),a:amt,cur:g(r,'cur')||'₪',oa:I.oa>=0?num(r[I.oa]):0,ocur:g(r,'ocur'),bd:I.bd>=0?cellDate(r[I.bd]):'',note:g(r,'note'),how:g(r,'how')})})});
  return out}
function parsePepperWb(wb){const out=[];let owner='';wb.SheetNames.forEach(sn=>{const a=sheetAoa(wb,sn);a.slice(0,8).forEach(r=>{const i=r.findIndex(x=>/שם לקוח/.test(String(x)));if(i>=0&&r[i+1])owner=String(r[i+1]).trim()});
  const hi=a.findIndex(r=>String(r[0]).trim()==='תאריך'&&r.some(x=>String(x).trim()==='יתרה'));if(hi<0)return;const h=a[hi].map(x=>String(x??'').trim()),ix=k=>h.indexOf(k),I={d:ix('תאריך'),n:ix('תיאור'),a:ix('סכום'),bal:ix('יתרה')};
  a.slice(hi+1).forEach((r,k)=>{const d=cellDate(r[I.d]),amt=num(r[I.a]);if(!d||!amt)return;out.push({src:'pepper',d,n:String(r[I.n]??'').trim().slice(0,120),a:amt,bal:I.bal>=0&&r[I.bal]!==''?num(r[I.bal]):null,k})})});
  return {rows:out,owner}}
function selfTest(names){const toks=names.map(n=>String(n).trim().split(/\s+/).filter(x=>x.length>1)).filter(w=>w.length>=2).map(w=>[w[0],w[w.length-1]]);return s=>!!s&&toks.some(([f,l])=>s.includes(f)&&s.includes(l))}
function smartRun(){
  const SM=IMP.smart,o=SM.opts,M=[],Pp=[];let owner='';
  SM.files.forEach(f=>{if(f.fmt==='max')M.push(...parseMaxWb(f.wb));else{const p=parsePepperWb(f.wb);Pp.push(...p.rows);if(p.owner)owner=p.owner}});
  if(owner&&!SM.ownerSet){SM.ownerSet=1;if(!o.self.includes(owner))o.self.unshift(owner)}
  const isSelf=selfTest(o.self),own=o.own,rows=[],skip=[],hasMax=M.length>0||TX().some(t=>acct(t)==='card');
  const add=(r)=>{rows.push(r);return r};
  const dd=d=>d.split('-').reverse().join('/');
  // max rows
  M.forEach(m=>{
    if(m.cur&&m.cur!=='₪'){skip.push({d:m.d,n:m.n,a:-m.a,src:'max',why:`עסקה ב־${m.cur} מארנק המט״ח. הכסף כבר נספר ברכישת המט״ח בשקלים`});return}
    const t=m.a>0?'exp':'inc',inst=m.note.match(INRX);let kind=t==='inc'?'refund':'buy';
    if(/צובר ושב/.test(m.n))kind=m.a>0?'save':'unsave';else if(/מכירת מט"ח/.test(m.n))kind='refund';else if(t==='exp'&&isSelf(m.note))kind='self';
    const abroad=m.sheet.startsWith('עסקאות חו')&&m.how!=='אינטרנט'&&!/\bIL$/.test(m.n),cc=(m.n.match(/\s([A-Z]{2})\s*$/)||[])[1];
    const x={ac:'card'};if(m.bd)x.bd=m.bd;if(inst)x.in={i:+inst[1],n:+inst[2]};if(m.ocur&&m.ocur!=='₪')x.cur=`${m.oa} ${m.ocur}`;if(abroad){x.ab=1;if(cc&&CC[cc])x.cc=cc}
    const note=[m.note,x.cur||'',m.bd?'חויב '+dd(m.bd):'',m.card?'כרטיס '+m.card:''].filter(Boolean).join(' · ');
    add({d:m.typ==='תשלומים'&&m.bd?m.bd:m.d,t,a:Math.abs(m.a),n:m.n,note,tags:['max'],x,src:'max',kind,mcat:m.mcat,abroad})});
  // pepper rows: skip card bills, drop debits that also appear in the max file
  const pool=M.filter(m=>(!m.cur||m.cur==='₪')&&m.bd),used=new Set();const pmaxRows=[];
  Pp.forEach(p=>{
    if(SRX.pmax.test(p.n)){pmaxRows.push(p);if(o.skipCard)skip.push({d:p.d,n:p.n,a:p.a,src:'pepper',why:hasMax?'חיוב או זיכוי של max. העסקאות עצמן נכללות מהפירוט':'חיוב של כרטיס האשראי. בטל את הסימון למעלה אם אין לך פירוט'});else add({d:p.d,t:p.a<0?'exp':'inc',a:Math.abs(p.a),n:p.n,note:'חיוב כרטיס אשראי, בלי פירוט',tags:['pepper'],x:{ac:'bank'},src:'pepper',kind:p.a<0?'buy':'refund'});return}
    let best=-1,gap=9;pool.forEach((m,j)=>{if(used.has(j)||Math.abs(m.a+p.a)>.005)return;const g=Math.abs(dayDiff(m.bd,p.d));if(g<=3&&g<gap){gap=g;best=j}});
    if(best>=0){used.add(best);skip.push({d:p.d,n:p.n,a:p.a,src:'pepper',why:`כפולה: אותה עסקה מופיעה בפירוט max (${pool[best].n}, ${dd(pool[best].d)})`});return}
    const t=p.a>0?'inc':'exp',n=p.n;let kind;
    if(isSelf(n)||own.has(n))kind='self';else if(SRX.invest.test(n))kind=t==='exp'?'save':'unsave';else if(/הפקדה לחיסכון|העברה לביטוח ישיר/.test(n))kind='save';else if(/משיכה מחיסכון|העברה מאיי\.די\.איי/.test(n))kind='unsave';
    else if(t==='inc'&&SRX.sal.test(n))kind='salary';else if(t==='inc'&&/צ'ק|שיק/.test(n))kind='org';else if(SRX.person.test(n))kind='person';else if(/^העברה (?:מ|ל)/.test(n))kind=SRX.org.test(n)?'org':'person';else kind=t==='exp'?'buy':'refund';
    add({d:p.d,t,a:Math.abs(p.a),n,note:'',tags:['pepper'],x:{ac:'bank'},src:'pepper',kind})});
  // card bills that have no detail in the max file
  if(M.length&&pmaxRows.length&&o.skipCard){const ex=new Map(),pd=new Map();pool.forEach((m,j)=>{if(!used.has(j))ex.set(m.bd,(ex.get(m.bd)||0)+m.a)});pmaxRows.forEach(p=>pd.set(p.d,(pd.get(p.d)||0)+p.a));
    const res=new Map();[...new Set([...ex.keys(),...pd.keys()])].forEach(D=>res.set(D,Math.round(((pd.get(D)||0)+(ex.get(D)||0))*100)/100));
    const ks=[...res.keys()].sort(),first=pool.length?pool.map(m=>m.bd).sort()[0]:'';
    ks.filter(D=>res.get(D)<-.5).forEach(D=>{for(const E of ks)if(res.get(E)>.5&&Math.abs(dayDiff(D,E))<=4&&Math.abs(res.get(D)+res.get(E))<=.5){res.set(D,0);res.set(E,0);break}});
    ks.forEach(D=>{const r=res.get(D);if(r<-.5)add({d:D,t:'exp',a:-r,n:'חיוב max ללא פירוט',note:D<=first?'חיוב max מלפני התקופה שבקובץ הפירוט':'חלק מחיוב max שלא מופיע בפירוט (תשלומים על עסקה ישנה, ריבית או עמלה)',tags:['pepper'],x:{ac:'bank'},src:'pepper',kind:'buy',fixed:'שונות'});
      else if(r>.5&&(pd.get(D)||0)>0&&!(ex.get(D)||0))add({d:D,t:'inc',a:r,n:'זיכוי מ־max ללא פירוט',note:'זיכוי מ־max שלא מופיע בפירוט',tags:['pepper'],x:{ac:'bank'},src:'pepper',kind:'refund',fixed:'שונות'})})}
  // categories
  const ruleOf=n=>{const id=S.rules[mkey(n)],c=id&&cat(id);return c?{id:c.id,name:c.name,kind:catKind(c)}:null};
  const spec=(name,kind)=>({name,kind:kind||NEWCAT[name]?.[0]||'exp'});
  rows.forEach(r=>{const n=r.n,k=r.kind;let c=null;
    if(r.fixed)c=spec(r.fixed,'exp');
    else if(k==='self')c=spec('העברות בין חשבונות','int');
    else if(k==='save'||k==='unsave')c=spec('חיסכון והשקעות','sav');
    else if(k==='salary')c=spec('משכורת','inc');
    else if(r.t==='exp'){c=ruleOf(n);if(c&&c.kind==='inc')c=null;
      if(!c){if(SRX.insur.test(n)||r.mcat==='ביטוח')c=spec('בריאות וביטוחים');else if(SRX.travel.test(n)||r.mcat==='טיסות ותיירות'||r.abroad)c=spec('חופשות וטיולים');
        else if(k==='person'||(r.src==='max'&&r.mcat==='העברת כספים'&&/BIT|PAYBOX|העברה/i.test(n)))c=spec('העברות לאנשים');else c=spec(ruleName(n)||MAXCAT[r.mcat]||'שונות')}}
    else if(k==='person')c=spec('העברות מאנשים','inc');
    else r.match=1;
    r.cat=c});
  // refunds and credits: take the category of the purchase they belong to
  const exist=TX().filter(t=>t.t==='exp'&&(kd(t)==='exp'||kd(t)==='sav'));
  rows.filter(r=>r.match).forEach(f=>{const strict=f.kind==='org',ok=e=>{const g=dayDiff(e.d,f.d);return g>=-3&&g<=150},m=e=>strict?nkey(f.n).length>1&&nkey(f.n).slice(0,2).join(' ')===nkey(e.n).slice(0,2).join(' '):sameM(f.n,e.n);
    const cand=[...rows.filter(e=>e.t==='exp'&&e.cat&&e.cat.kind!=='int'&&e.cat.kind!=='inc'&&ok(e)&&m(e)).map(e=>({d:e.d,a:e.a,n:e.n,cat:e.cat})),...exist.filter(e=>ok(e)&&m(e)).map(e=>({d:e.d,a:e.a,n:e.n,cat:{id:e.c,name:cat(e.c)?.name,kind:kd(e)}}))];
    cand.sort((a,b)=>(Math.abs(a.a-f.a)<.01?0:1)-(Math.abs(b.a-f.a)<.01?0:1)||Math.abs(dayDiff(a.d,f.d))-Math.abs(dayDiff(b.d,f.d)));
    if(cand.length){f.cat=cand[0].cat;f.refOf=cand[0];f.note=[f.note,`זיכוי על ${cand[0].n}, ${dd(cand[0].d)}`].filter(Boolean).join(' · ');return}
    if(f.kind==='org'){f.cat=spec(SRX.biz.test(f.n)?'עבודות צד':'הכנסה אחרת','inc');return}
    const rc=ruleOf(f.n);f.cat=rc&&rc.kind!=='inc'?rc:spec(ruleName(f.n)||MAXCAT[f.mcat]||'שונות')});
  // already in the app (same row, or the live notification of the same charge)
  const seen=new Set(TX().map(t=>`${t.d}|${t.t}|${(+t.a).toFixed(2)}|${(t.n||'').trim()}`)),autos=TX().filter(t=>(t.tags||[]).includes('אוטומטי')),takenA=new Set(),upg=[];
  let dupN=0,autoN=0;
  rows.forEach(r=>{if(!o.dedupe)return;if(seen.has(`${r.d}|${r.t}|${r.a.toFixed(2)}|${r.n.trim()}`)){r.dup='exists';dupN++;return}
    const tol=t=>t.x?.cur?Math.max(1,t.a*.06):Math.max(.01,t.a*.005);
    const a=autos.find(t=>!takenA.has(t.id)&&t.t===r.t&&Math.abs(t.a-r.a)<=tol(t)&&Math.abs(dayDiff(t.d,r.d))<=3&&(acct(t)===''||acct(t)===r.x.ac));
    if(a){takenA.add(a.id);r.dup='auto';autoN++;upg.push({id:a.id,x:r.x})}});
  const cnt={exp:0,inc:0,ref:0,int:0,sav:0};rows.filter(r=>!r.dup).forEach(r=>{const k=r.cat.kind;if(k==='int')cnt.int++;else if(k==='sav')cnt.sav++;else if(k==='inc')cnt.inc++;else if(r.t==='inc')cnt.ref++;else cnt.exp++});
  const pRows=Pp.filter(p=>p.bal!==null).sort((a,b)=>a.d<b.d?1:a.d>b.d?-1:a.k-b.k),bal=pRows.length?{d:pRows[0].d,v:pRows[0].bal}:null;
  const orgs=new Map();rows.filter(r=>r.src==='pepper'&&(r.kind==='org'||r.kind==='self'&&own.has(r.n))).forEach(r=>{const g=orgs.get(r.n)||{n:r.n,a:0,c:0};g.a+=r.t==='inc'?r.a:-r.a;g.c++;orgs.set(r.n,g)});
  SM.res={rows:rows.sort((a,b)=>a.d<b.d?-1:a.d>b.d?1:0),skip,cnt,dupN,autoN,upg,bal,owner,orgs:[...orgs.values()].sort((a,b)=>Math.abs(b.a)-Math.abs(a.a)),nMax:M.length,nPep:Pp.length,pmaxN:pmaxRows.length,hasMax};
}
function renderSmart(b){
  const SM=IMP.smart,R=SM.res,o=SM.opts,good=R.rows.filter(r=>!r.dup),dd=d=>d.split('-').reverse().join('/'),kn=r=>r.cat.kind==='int'?'העברה':r.cat.kind==='sav'?(r.t==='inc'?'משיכה':'חיסכון'):r.cat.kind==='inc'?'הכנסה':r.t==='inc'?'זיכוי':'';
  const exist=new Set(S.cats.map(c=>c.name)),newc=[...new Set(good.map(r=>r.cat.name))].filter(n=>!exist.has(n));
  const fl=ui.impF||'all',F={all:()=>1,ref:r=>r.cat.kind!=='inc'&&r.cat.kind!=='int'&&r.t==='inc',int:r=>r.cat.kind==='int',sav:r=>r.cat.kind==='sav',inc:r=>r.cat.kind==='inc',exp:r=>r.cat.kind==='exp'&&r.t==='exp'};
  const shown=good.filter(F[fl]||F.all);
  b.innerHTML=`<div class="ch"><h2>${SM.files.map(f=>f.fmt==='max'?`פירוט max${f.name?'':''}`:'עו״ש Pepper').join(' + ')}</h2></div>
<p class="hint">זיהיתי את הקבצים לבד: ${R.nMax?`${R.nMax} שורות מ־max (כל הגיליונות)`:''}${R.nMax&&R.nPep?' ו־':''}${R.nPep?`${R.nPep} שורות מ־Pepper`:''}. ${R.nMax&&!R.nPep?'אם תבחר גם את קובץ ה־Pepper יחד, אבדוק שאין כפילויות ביניהם.':''}${R.nPep&&!R.nMax?'אפשר לבחור יחד גם את קובץ הפירוט של max, ואז כל חיוב חודשי יפורק לעסקאות.':''}</p>
<div class="smsum">
<div><b>${R.cnt.exp}</b><span>הוצאות</span></div><div><b>${R.cnt.ref}</b><span>זיכויים</span><small>מקטינים את ההוצאה בקטגוריה</small></div><div><b>${R.cnt.inc}</b><span>הכנסות</span></div><div><b>${R.cnt.sav}</b><span>חיסכון והשקעות</span></div><div><b>${R.cnt.int}</b><span>בין החשבונות שלך</span><small>לא נספרות</small></div>
</div>
${R.skip.length||R.dupN||R.autoN?`<details class="smskip"><summary>${[R.skip.length?`${R.skip.length} שורות דולגו כדי לא לספור פעמיים`:'',R.dupN?`${R.dupN} כבר קיימות באפליקציה`:'',R.autoN?`${R.autoN} כבר נקלטו מההודעות (יקבלו את פרטי החיוב)`:''].filter(Boolean).join(', ')}</summary>
${R.skip.slice(0,60).map(s=>`<div class="trow"><span>${esc(s.n)}<small>${esc(dd(s.d))} · ${esc(s.why)}</small></span><b>${esc(fmt(Math.abs(s.a)))}</b></div>`).join('')}${R.skip.length>60?`<p class="hint">ועוד ${R.skip.length-60}…</p>`:''}</details>`:''}
<label class="chk"><input type="checkbox" data-sopt="dedupe"${o.dedupe?' checked':''}>לדלג על תנועות שכבר באפליקציה, כולל חיובים שנקלטו לבד מההודעות</label>
${R.pmaxN?`<label class="chk"><input type="checkbox" data-sopt="skipCard"${o.skipCard?' checked':''}>לדלג על ${R.pmaxN} החיובים החודשיים של max בבנק${R.hasMax?', כי העסקאות עצמן כבר בפירוט':'. סמן רק אם יש לך את פירוט max'}</label>`:''}
${R.nPep?`<label class="lbl" for="smSelf" style="margin-top:10px">השם שלך כמו שמופיע בהעברות, כדי לזהות העברות בין החשבונות שלך</label><input class="field" id="smSelf" value="${esc(o.self.join(', '))}" placeholder="למשל: ישראל ישראלי">`:''}
${R.orgs.length?`<div class="lbl" style="margin-top:12px">העברות מגופים. אם אחד מהם הוא חשבון שלך (בנק אחר, ארנק), סמן אותו והוא לא ייספר:</div>${R.orgs.slice(0,12).map(g=>`<label class="chk"><input type="checkbox" data-own="${esc(g.n)}"${o.own.has(g.n)?' checked':''}>${esc(g.n)} <span class="hint" style="margin:0">(${g.c} פעמים, ${g.a>0?'נכנסו':'יצאו'} ${esc(fmt(Math.abs(g.a)))})</span></label>`).join('')}`:''}
${R.bal?`<p class="hint" style="margin-top:10px">היתרה בבנק ב־${esc(dd(R.bal.d))} הייתה ${esc(fmt(R.bal.v))}. אשמור אותה כנקודת התחלה לבדיקת היתרה במסך "בנק וכרטיס".</p>`:''}
${newc.length?`<p class="hint">ייווצרו קטגוריות חדשות: ${newc.map(esc).join(', ')}.</p>`:''}
<div class="seg" id="smF" style="margin:12px 0 8px;flex-wrap:wrap">${Object.entries({all:'הכול',exp:'הוצאות',ref:'זיכויים',inc:'הכנסות',sav:'חיסכון',int:'העברות'}).map(([k,l])=>`<button type="button" data-v="${k}" aria-pressed="${fl===k}">${l}</button>`).join('')}</div>
<div class="sheet prev"><div class="scroll"><table><thead><tr><th>תאריך</th><th>תיאור</th><th style="text-align:end">סכום</th><th>קטגוריה</th></tr></thead><tbody>${shown.slice(-40).reverse().map(r=>{const c=S.cats.find(x=>x.name===r.cat.name);return `<tr><td>${esc(dd(r.d))}</td><td class="n">${esc(r.n)}${r.refOf?`<small class="hint" style="display:block;margin:0">על ${esc(r.refOf.n)}</small>`:''}</td><td class="num${r.t==='inc'?' okt':''}">${r.t==='inc'?'+':''}${fmt(r.a)}</td><td><i class="sw" style="background:${c?col(c):NEWCAT[r.cat.name]?.[1]||'#64748b'}"></i> ${esc(r.cat.name)}${kn(r)?` <span class="bdg">${kn(r)}</span>`:''}</td></tr>`}).join('')||'<tr><td colspan="4" class="empty">אין שורות בסינון הזה.</td></tr>'}</tbody></table></div></div>
<p class="hint" style="margin:6px 0 0">מוצגות ${Math.min(40,shown.length)} האחרונות מתוך ${shown.length}.</p>
<div class="btnrow"><button class="btn solid" data-act="imp-go"${good.length||R.upg.length?'':' disabled'}>ייבא ${good.length} תנועות</button><button class="btn" data-act="imp-cancel">ביטול</button></div>`}
function doSmartImport(){
  const SM=IMP.smart,R=SM.res,good=R.rows.filter(r=>!r.dup);if(!good.length&&!R.upg.length)return;const ids=[];
  change(()=>{
    const byName=new Map();const catFor=sp=>{if(sp.id&&cat(sp.id))return sp.id;const k=sp.name+'|'+sp.kind;if(byName.has(k))return byName.get(k);
      const grp=c=>catKind(c)===sp.kind||(sp.kind==='exp'&&catKind(c)==='exp');let c=S.cats.find(x=>x.name===sp.name&&grp(x))||(sp.kind==='int'?ints()[0]:null)||(sp.kind==='sav'?S.cats.find(x=>x.sav):null);
      if(!c){const nc=normCat({id:rid(8),k:sp.kind==='inc'?'inc':'exp',name:sp.name,color:NEWCAT[sp.name]?.[1]||PAL[S.cats.length%PAL.length],int:sp.kind==='int',sav:sp.kind==='sav',sal:sp.name==='משכורת'});S.cats.push(nc);c=nc}
      byName.set(k,c.id);return c.id};
    good.forEach(r=>{const id=rid();ids.push(id);const t={id,d:r.d,t:r.t,a:Math.round(r.a*100)/100,c:catFor(r.cat),n:r.n,img:'',u:0};if(r.note)t.note=r.note.slice(0,500);const tg=normTags(r.tags);if(tg.length)t.tags=tg;const x=normX(r.x);if(x)t.x=x;S.tx.push(t)});
    R.upg.forEach(u=>{const t=S.tx.find(x=>x.id===u.id);if(!t)return;const x=normX({...(t.x||{}),...u.x,rv:t.x?.rv});if(x)t.x=x;ids.push(t.id)});
    if(R.bal&&(!S.ex.bal||R.bal.d>=S.ex.bal.d))S.ex.bal=R.bal;
    S.ex.self=[...new Set(SM.opts.self)].slice(0,6);S.ex.own=[...new Set([...S.ex.own,...SM.opts.own])].slice(0,20);
  },{tx:ids,cfg:true});
  const n=good.length;IMP.smart=null;IMP.aoa=[];$('#impFile').value='';ui.scope='all';location.hash='#tx';
  toast(`יובאו ${n} תנועות${R.upg.length?`, ו־${R.upg.length} חיובים שנקלטו מההודעות קיבלו את פרטי החיוב`:''}${R.bal?'. נקודת ההתחלה של היתרה נשמרה':''}`,true);
}
async function readFiles(list){
  const files=[...list];if(!files.length)return;$('#impErr').textContent='';
  try{await loadXLSX()}catch{$('#impErr').textContent='לא הצלחתי לטעון את רכיב האקסל. בדוק את החיבור לאינטרנט ונסה שוב.';return}
  const read=[];for(const f of files){try{const wb=await readWb(f);read.push({name:f.name,wb,fmt:detectFmt(wb)})}catch{$('#impErr').textContent=`לא הצלחתי לקרוא את ${f.name}. נסה לשמור אותו כ־xlsx או csv.`;return}}
  const sm=read.filter(f=>f.fmt);
  if(sm.length){if(sm.length<read.length)$('#impErr').textContent='חלק מהקבצים לא זוהו כפירוט max או עו״ש Pepper ודולגו. ייבא אותם בנפרד.';
    IMP.smart={files:sm,opts:{dedupe:true,skipCard:true,self:[...S.ex.self],own:new Set(S.ex.own)},res:null};IMP.aoa=[1];smartRun();renderImport();return}
  if(read.length>1){$('#impErr').textContent='אפשר לבחור כמה קבצים יחד רק של max ו־Pepper. קבצים אחרים מייבאים אחד אחד.';return}
  IMP.smart=null;const f=read[0];IMP.name=f.name;IMP.wb=f.wb;const wb=f.wb,rc=n=>{const r=wb.Sheets[n]['!ref'];return r?XLSX.utils.decode_range(r).e.r:0};IMP.sheet=wb.SheetNames.reduce((b,n)=>rc(n)>rc(b)?n:b,wb.SheetNames[0]);loadSheet();
}
async function readWb(f){const buf=await f.arrayBuffer();
  if(/\.(csv|tsv|txt)$/i.test(f.name)||/csv|text/.test(f.type)){let text;try{text=new TextDecoder('utf-8',{fatal:true}).decode(buf)}catch{text=new TextDecoder('windows-1255').decode(buf)}text=text.replace(/^﻿/,'');return XLSX.read(text,{type:'string',raw:true,FS:/\.tsv$/i.test(f.name)?'\t':undefined})}
  return XLSX.read(buf,{type:'array',cellDates:false})}
function parseImp(){
  const m=IMP.map,rows=IMP.aoa.slice(IMP.hdr+1),out=[];let bad=0,dup=0,cardN=0,learnedN=0;
  const has=k=>m[k]!==undefined&&m[k]!=='';
  const hasNeg=has('a')&&rows.some(r=>num(r[m.a])<0);
  const seen=new Set(TX().map(t=>`${t.d}|${(+t.a).toFixed(2)}|${(t.n||'').trim()}`));
  const newCats=new Map();
  rows.forEach(r=>{
    const d=has('d')?cellDate(r[m.d]):'';let a=0,t='exp';
    if(has('out')||has('in')){const o=has('out')?num(r[m.out]):0,i=has('in')?num(r[m.in]):0;if(o>0){a=o;t='exp'}else if(o<0){a=-o;t='inc'}else if(i>0){a=i;t='inc'}else if(i<0){a=-i;t='exp'}}
    else if(has('a')){const v=num(r[m.a]);a=Math.abs(v);if(has('t'))t=/הכנס|זכות|income|credit|^in$|זיכוי|נכנסת|משיכה מחיסכון/i.test(String(r[m.t]))?'inc':'exp';else if(hasNeg)t=v<0?'exp':'inc';else t=IMP.opts.defType}
    const n=has('n')?String(r[m.n]??'').trim().slice(0,120):'';
    if(!d||!(a>0)){if(r.some(x=>String(x??'').trim()))bad++;return}
    if(t==='exp'&&CARDPAY.test(n)){cardN++;if(IMP.opts.skipCard)return}
    a=Math.round(a*100)/100;
    let c='',cnNew='';
    if(has('c')){const nm=String(r[m.c]??'').trim();if(nm){const ex=S.cats.find(x=>x.name===nm&&x.k===t)||S.cats.find(x=>x.name===nm);if(ex)c=ex.id;else if(IMP.opts.newCats)cnNew=nm.slice(0,40)}}
    if(!c&&!cnNew){const lr=S.rules[mkey(n)];if(lr&&cat(lr)?.k===t){c=lr;learnedN++}}
    if(!c&&!cnNew&&IMP.opts.auto)c=ruleCat(n,t);
    if(!c&&!cnNew)c=(S.cats.find(x=>x.k===t&&/שונות|אחרת/.test(x.name))||S.cats.find(x=>x.k===t)).id;
    if(cnNew){const k=cnNew+'|'+t;if(!newCats.has(k))newCats.set(k,{id:rid(8),k:t,name:cnNew,color:PAL[(S.cats.length+newCats.size)%PAL.length],pct:0,sal:false,sav:false});c=newCats.get(k).id}
    const isDup=IMP.opts.dedupe&&seen.has(`${d}|${a.toFixed(2)}|${n}`);if(isDup)dup++;
    const o=has('o')?String(r[m.o]??'').trim().slice(0,500):'';
    out.push({d,a,t,c,n,o,dup:isDup});
  });
  IMP.parsed={rows:out,bad,dup,cardN,learnedN,newCats:[...newCats.values()]};
}
function renderImport(){
  const b=$('#impBody');if(!IMP.aoa.length){b.hidden=true;return}b.hidden=false;if(IMP.smart){renderSmart(b);return}
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
<p style="margin:14px 0 0"><b>${good.length} תנועות לייבוא</b>${P.dup?`, ${P.dup} כפולות ידולגו`:''}${P.bad?`, ${P.bad} שורות בלי תאריך או סכום לא ייקראו`:''}${P.newCats.length?`, ${P.newCats.length} קטגוריות חדשות`:''}${P.learnedN?`, ${P.learnedN} שויכו לפי מה שלמדתי מהתיקונים שלך`:''}.</p>
<div class="sheet prev"><div class="scroll"><table><thead><tr><th>תאריך</th><th>תיאור</th><th style="text-align:end">סכום</th><th>קטגוריה</th></tr></thead><tbody>${P.rows.slice(0,12).map(r=>{const c=allCats.find(x=>x.id===r.c);return `<tr class="${r.dup?'skip':''}"><td>${esc(r.d.split('-').reverse().join('/'))}</td><td class="n">${esc(r.n)}</td><td class="num${r.t==='inc'?' okt':''}">${r.t==='inc'?'+':''}${fmt(r.a)}</td><td><i class="sw" style="background:${col(c)}"></i> ${esc(c?.name||'')}</td></tr>`}).join('')||'<tr><td colspan="4" class="empty">לא נמצאו שורות. בדוק את שורת הכותרות ואת עמודות התאריך והסכום.</td></tr>'}</tbody></table></div></div>
<div class="btnrow"><button class="btn solid" data-act="imp-go"${good.length?'':' disabled'}>ייבא ${good.length} תנועות</button><button class="btn" data-act="imp-cancel">ביטול</button></div>`;
}
function doImport(){
  if(IMP.smart){doSmartImport();return}
  const P=IMP.parsed,good=P.rows.filter(r=>!r.dup);if(!good.length)return;
  const ids=[];const usedNew=new Set(good.map(r=>r.c));
  change(()=>{P.newCats.filter(c=>usedNew.has(c.id)).forEach(c=>S.cats.push(normCat(c)));good.forEach(r=>{const id=rid();ids.push(id);S.tx.push({id,d:r.d,t:r.t,a:r.a,c:r.c,n:r.n,img:'',u:0,...(r.o?{note:r.o}:{})})})},{tx:ids,cfg:true});
  IMP.aoa=[];IMP.parsed=null;$('#impFile').value='';
  ui.cur=nowYm;ui.scope='month';const inNow=good.filter(r=>r.d.slice(0,7)===nowYm).length;
  location.hash='#tx';toast(`יובאו ${good.length} תנועות${inNow!==good.length?`, ${inNow} מהן החודש`:''}`,false,inNow!==good.length?{label:'הצג את כולן',fn:()=>{ui.scope='all';renderTx()}}:null);
}

/* ---------- render all ---------- */
function render(){
  chrome();
  if(ui.view==='home')renderHome();else if(ui.view==='tx')renderTx();else if(ui.view==='budget')renderBudget();else if(ui.view==='sync')renderSync();else if(ui.view==='import')renderImport();else if(ui.view==='msgs')renderMsgs();else if(ui.view==='reports')renderReports();else if(ui.view==='bank')renderBank();else if(ui.view==='album')renderAlbum();else if(ui.view==='settings')renderSettings();
  if(ui.view!=='home')stopHomeAlbum();
  BG.apply();
}

/* ---------- transaction sheet ---------- */
let edit=null,txType='exp',txDir='exp',edSp=[],pend={data:null,removed:false,url:null};
const TXT={exp:'הוצאה חדשה',inc:'הכנסה חדשה',ref:'זיכוי או החזר',tr:'העברה בין החשבונות שלך'};
const TXH={ref:'החזר על קנייה, ביטול עסקה או כסף שחבר החזיר. הסכום מקטין את ההוצאה בקטגוריה שתבחר. בחיסכון זו משיכה.',tr:'כסף שעבר בין החשבונות שלך, למשל לחשבון נוסף או לכרטיס נטען. לא נספר בהכנסות ובהוצאות.'};
const txCats=()=>txType==='inc'?incs():txType==='tr'?ints():exps();
const txT=()=>txType==='tr'?txDir:txType==='exp'?'exp':'inc';
function txMode(t){const c=cat(t.c);return c?.int?'tr':t.t==='inc'&&c&&c.k==='exp'?'ref':t.t}
function setTxType(v){txType=v;setSeg($('#txSeg'),v);if(v==='tr'&&!ints().length)ensureInt();$('#txHint').hidden=!TXH[v];$('#txHint').textContent=TXH[v]||'';$('#txDir').hidden=v!=='tr';setSeg($('#txDir'),txDir);$('#txSpW').hidden=v!=='exp';$('#txRecL').hidden=!!edit||v==='ref';if(!edit)$('#txTitle').textContent=TXT[v]}
function drawSp(){const tot=parseFloat($('#txA').value)||0,o=edSp.filter(p=>!p.ok).reduce((s,p)=>s+p.a,0);
  $('#txSp').innerHTML=edSp.map((p,i)=>`<div class="spi"><span>${esc(p.n)}</span><b>${esc(fmt(p.a))}</b><label class="chk" style="margin:0"><input type="checkbox" data-spok="${i}"${p.ok?' checked':''}>החזיר</label><button type="button" class="icon" data-spdel="${i}" aria-label="הסר את ${esc(p.n)}"><svg class="ic"><use href="#i-x"/></svg></button></div>`).join('');
  $('#txSpS').textContent=edSp.length?(o?`מגיע לך ${fmt(o)}`:'כולם החזירו')+(tot?`, החלק שלך ${fmt(Math.max(0,tot-edSp.reduce((s,p)=>s+p.a,0)))}`:''):'';
  $('#peopleList').innerHTML=S.ex.people.map(n=>`<option value="${esc(n)}">`).join('')}
function txChips(sel){const l=txCats();const s=sel&&l.some(c=>c.id===sel)?sel:l[0]?.id;$('#txC').innerHTML=l.map(c=>`<label><input type="radio" name="txc" value="${esc(c.id)}"${c.id===s?' checked':''}><span><i class="sw" style="background:${col(c)}"></i>${esc(c.name)}</span></label>`).join('')}
function setPic(url){const f=$('#txPicFig');if(url){$('#txPicImg').src=url;f.hidden=false;$('#txPicBtn').hidden=true}else{f.hidden=true;$('#txPicImg').removeAttribute('src');$('#txPicBtn').hidden=false}}
async function openTx({type='exp',id=null}={}){
  edit=id?S.tx.find(t=>t.id===id&&!t.del):null;
  if(pend.url)URL.revokeObjectURL(pend.url);pend={data:null,removed:false,url:null};
  txDir=edit?edit.t:'exp';edSp=(edit?.x?.sp||[]).map(p=>({...p}));setTxType(edit?txMode(edit):type);$('#txSpW').open=!!edSp.length;drawSp();
  $('#txTitle').textContent=edit?(edit.x?.rv?'בדיקת תנועה שנקלטה':'עריכת תנועה'):TXT[txType];
  $('#txA').value=edit?edit.a:'';$('#txN').value=edit?edit.n:'';$('#txO').value=edit?.note||'';edTags=[...(edit?.tags||[])];drawTags();$('#txTagIn').value='';$('#tagList').innerHTML=allTags().map(g=>`<option value="${esc(g)}">`).join('');$('#txRec').checked=false;$('#txRecL').hidden=!!edit||txType==='ref';chipTouched=!!edit;$('#txD').value=edit?edit.d:defDate();$('#txErr').textContent='';
  txChips(edit?.c);$('#txAc').value=edit?acct(edit):(ui.lastAc||'');$('#txDel').hidden=!edit;setPic(null);
  show($('#dTx'));
  if(edit?.img){const u=await imgURL(edit.img);if(u&&!pend.data&&!pend.removed)setPic(u)}
  else if(!edit)setTimeout(()=>{if($('#dTx').open&&!$('#txFile').dataset.picking)$('#txA').focus();delete $('#txFile').dataset.picking},80);
}
$('#txSeg').addEventListener('click',e=>{const v=e.target.closest('button')?.dataset.v;if(!v)return;const keep=$('input[name=txc]:checked')?.value;setTxType(v);txChips(keep)});
$('#txDir').addEventListener('click',e=>{const v=e.target.closest('button')?.dataset.v;if(v){txDir=v;setSeg($('#txDir'),v)}});
$('#txA').addEventListener('input',()=>{if(edSp.length)drawSp()});
function spAdd(){const n=$('#txSpN').value.trim().slice(0,30),a=parseFloat($('#txSpA').value);if(!n){$('#txSpN').focus();return}
  if(!(a>0)){const tot=parseFloat($('#txA').value)||0;if(!tot){$('#txErr').textContent='קודם הכנס את הסכום הכולל.';return}edSp.push({n,a:0});const each=Math.round(tot/(edSp.length+1)*100)/100;edSp.forEach(p=>{if(!p.ok)p.a=each})}
  else edSp.push({n,a:Math.round(a*100)/100});
  $('#txSpN').value='';$('#txSpA').value='';drawSp();$('#txSpN').focus()}
$('#txSpAdd').addEventListener('click',spAdd);
$('#txSpN').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();spAdd()}});
$('#txSpA').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();spAdd()}});
$('#txSpEq').addEventListener('click',()=>{const tot=parseFloat($('#txA').value)||0;if(!tot){$('#txErr').textContent='קודם הכנס את הסכום הכולל.';return}if(!edSp.length){$('#txErr').textContent='הוסף קודם את מי שהשתתף.';$('#txSpN').focus();return}const each=Math.round(tot/(edSp.length+1)*100)/100;edSp.forEach(p=>p.a=each);drawSp()});
$('#txSp').addEventListener('click',e=>{const d=e.target.closest('[data-spdel]');if(d){edSp.splice(+d.dataset.spdel,1);drawSp()}});
$('#txSp').addEventListener('change',e=>{const k=e.target.dataset.spok;if(k!==undefined){edSp[+k].ok=e.target.checked?1:0;drawSp()}});
$('#txPicBtn').addEventListener('click',()=>$('#txFile').click());
$('#txPicChg').addEventListener('click',()=>$('#txFile').click());
$('#txPicDel').addEventListener('click',()=>{if(pend.url)URL.revokeObjectURL(pend.url);pend={data:null,removed:true,url:null};setPic(null)});
$('#txPicImg').addEventListener('click',()=>viewImg($('#txPicImg').src));
$('#txFile').addEventListener('change',async e=>{const f=e.target.files[0];e.target.value='';delete e.target.dataset.picking;if(!f)return;
  try{const d=await compress(f);if(pend.url)URL.revokeObjectURL(pend.url);pend={data:d,removed:false,url:URL.createObjectURL(new Blob([d.buf],{type:d.type}))};setPic(pend.url);if(!$('#txA').value)$('#txA').focus()}
  catch{$('#txErr').textContent='לא הצלחתי לקרוא את התמונה. נסה תמונה אחרת.'}});
$('#txF').addEventListener('submit',async e=>{e.preventDefault();
  addTagFromInput();const a=parseFloat($('#txA').value),d=$('#txD').value,c=$('input[name=txc]:checked')?.value,n=$('#txN').value.trim().slice(0,120),note=$('#txO').value.trim().slice(0,500),tags=normTags(edTags),mkRec=$('#txRec').checked&&!edit&&txType!=='ref',tt=txT();
  if($('#txSpN').value.trim())spAdd();const sp=txType==='exp'?edSp.filter(p=>p.n&&p.a>0):[],ac=$('#txAc').value;if(!edit)ui.lastAc=ac;
  if(!(a>0)){$('#txErr').textContent='צריך סכום גדול מאפס.';$('#txA').focus();return}
  if(!YMD.test(d)){$('#txErr').textContent='צריך תאריך.';return}
  if(!c){$('#txErr').textContent='בחר קטגוריה.';return}
  let img=edit?edit.img:'';
  if(pend.data){img=rid(16);try{await IDB.put('i:'+img,{buf:pend.data.buf,type:pend.data.type,up:false})}catch{img=edit?edit.img:'';toast('לא הצלחתי לשמור את התמונה במכשיר')}}
  else if(pend.removed)img='';
  const am=Math.round(a*100)/100,bl=snapLv([ymOf(d),edit?ymOf(edit.d):ymOf(d)]);
  const newPeople=sp.map(p=>p.n).filter(x=>!S.ex.people.includes(x)),cfgP=newPeople.length>0;
  const setX=t=>{const x={...(t.x||{})};delete x.rv;if(sp.length)x.sp=sp;else delete x.sp;if(ac)x.ac=ac;else delete x.ac;const nx=normX(x);if(nx)t.x=nx;else delete t.x};
  const addP=()=>{if(cfgP)S.ex.people=[...newPeople,...S.ex.people].slice(0,40)};
  let learned='';
  if(edit){const id=edit.id,oldC=edit.c;change(()=>{const t=S.tx.find(x=>x.id===id);Object.assign(t,{t:tt,a:am,c,d,n,img});if(note)t.note=note;else delete t.note;if(tags.length)t.tags=tags;else delete t.tags;setX(t);addP();if(c!==oldC)learned=learn(n,c)},{tx:[id],cfg:c!==edit.c||cfgP})}
  else if(mkRec){const r={id:rid(8),n:n||cat(c)?.name||'',a:am,t:tt,c,day:+d.slice(8),start:ymOf(d),skip:[],on:true};const id=recId(r,ymOf(d));
    change(()=>{S.rec.push(r);const t={id,d,t:tt,a:am,c,n,img,u:0,...(note?{note}:{}),...(tags.length?{tags}:{})};setX(t);S.tx.push(t);addP()},{tx:[id],cfg:true});runRec()}
  else{const id=rid();change(()=>{const t={id,d,t:tt,a:am,c,n,img,u:0,...(note?{note}:{}),...(tags.length?{tags}:{})};setX(t);S.tx.push(t);addP();if(chipTouched&&n)learn(n,c,true)},{tx:[id],cfg:(chipTouched&&!!n)||cfgP})}
  const was=!!edit;hide($('#dTx'));ui.cur=ymOf(d);render();
  const lm=learned?applyAllOffer(learned):null;
  const what={exp:'הוצאה של '+fmt(am)+' נוספה',inc:'הכנסה של '+fmt(am)+' נוספה',ref:'זיכוי של '+fmt(am)+' נוסף והקטין את '+(cat(c)?.name||'הקטגוריה'),tr:'העברה של '+fmt(am)+' נרשמה ולא נספרת'}[txType];
  if(lm)toast(lm.msg,false,lm.act);else toast(`${was?'התנועה עודכנה':what+(mkRec?', וחוזרת כל חודש':'')}. ${crossMsg(bl)}`.trim().replace(/\.\s*$/,'.'),true);
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
  'wipe-tx':async()=>{const ids=TX().map(t=>t.id);if(!ids.length){toast('אין תנועות למחוק');return}
    if(!(await ask(`למחוק ${ids.length} תנועות?`,(SY.on?'הן יימחקו מהמכשיר ומהגיליון המשותף, אצל כל המחוברים. ':'')+'הקטגוריות, התקציבים והקבועות נשארים. אפשר לבטל מיד אחרי.','מחק תנועות',true)))return;
    change(()=>ids.forEach(removeTx),{tx:ids});toast(`נמחקו ${ids.length} תנועות. עכשיו אפשר לייבא מחדש`,true)},
  wipe:async()=>{if(!(await ask('למחוק את כל הנתונים?',SY.on?'כל התנועות יימחקו מהמכשיר ומהגיליון המשותף, אצל כל המחוברים. אפשר לבטל מיד אחרי.':'כל התנועות יימחקו מהמכשיר. אפשר לבטל מיד אחרי.','מחק הכול',true)))return;pushHist();replaceAll({...blank(),profile:S.profile});toast('כל הנתונים נמחקו',true)},
  'sync-now':()=>Sync.run(true),
  'copy-code':()=>copyText(inviteCode(INV.mode==='ro'),'קוד ההצטרפות הועתק','קוד הצטרפות'),
  'share-code':async()=>{const ro=INV.mode==='ro',text=`${ro?'קוד לצפייה בלבד':'קוד הצטרפות'} לחשבון המשותף שלנו ב"הכסף שלי":\n${inviteCode(ro)}\n\nאו פשוט לפתוח את הקישור: ${joinUrl(ro)}\n\nבאייפון: קודם מוסיפים את האפליקציה למסך הבית, פותחים משם ← תפריט ← סנכרון משותף ← הצטרפות עם קוד.`;if(navigator.share){try{await navigator.share({title:'הכסף שלי, קוד הצטרפות',text});return}catch(e){if(e&&e.name==='AbortError')return}}copyText(text,'ההזמנה הועתקה, הדבק אותה בוואטסאפ','הזמנה')},
  disconnect:async()=>{if(!(await ask('לנתק את המכשיר?','המכשיר יפסיק לסנכרן. הנתונים נשארים במכשיר ובגיליון, ואפשר להצטרף שוב עם הקוד.','נתק')))return;PUSH.disable();IDB.del('sync').catch(()=>{});SY={...SY,on:false,dirty:[],idirty:[],cfgDirty:false};S.tx=S.tx.filter(t=>!t.del);S.items=S.items.filter(t=>!t.del);persistNow();setSync('off');render();toast('המכשיר נותק מהגיליון')},
  'disconnect-wipe':async()=>{if(!(await ask('לנתק ולמחוק מהמכשיר?','המכשיר יתנתק, וכל התנועות, ההודעות והתמונות יימחקו ממנו. בגיליון ואצל המחוברים האחרים לא ישתנה כלום.','נתק ומחק',true)))return;
    const imgs=[...new Set(S.tx.map(t=>t.img).concat(S.items.map(i=>i.img)).filter(Boolean))];for(const k of imgs){try{await IDB.del('i:'+k)}catch{}}
    PUSH.disable();IDB.del('sync').catch(()=>{});SY={on:false,url:'',key:'',since:0,dirty:[],idirty:[],cfgDirty:false,last:0,err:'',sheet:'',sv:0};S=blank();sample=false;hist=[];ui.read=0;
    URLS.forEach(u=>URL.revokeObjectURL(u));URLS.clear();persistNow();setSync('off');render();toast('המכשיר נותק והנתונים נמחקו ממנו')},
  'ing-get':async(btn)=>{btn.disabled=true;try{const r=await Sync.call({action:'ing-token'});if(!r.ok)throw new Error(r.err||'err');ING.tok=r.tok;renderSync()}catch(e){toast(errText(e));btn.disabled=false}},
  'ing-rotate':async()=>{if(!(await ask('להחליף את המפתח?','קיצורי הדרך הקיימים יפסיקו לעבוד עד שתדביק בהם את המפתח החדש. שווה לעשות את זה אם המפתח הגיע למישהו אחר.','החלף')))return;try{const r=await Sync.call({action:'ing-token',rotate:1});if(!r.ok)throw new Error(r.err||'err');ING.tok=r.tok;renderSync();toast('נוצר מפתח חדש. עדכן אותו בקיצור הדרך')}catch(e){toast(errText(e))}},
  'ing-copy-url':()=>copyText(SY.url,'הכתובת הועתקה','כתובת'),
  'ing-copy-tok':()=>copyText(ING.tok,'המפתח הועתק','מפתח'),
  'ing-copy-json':()=>copyText(JSON.stringify({action:'ingest',tok:ING.tok,text:'<כאן קלט קיצור הדרך>'},null,1),'התבנית הועתקה','גוף הבקשה'),
  'ing-copy-and':()=>copyText(JSON.stringify({action:'ingest',tok:ING.tok,text:'[sms_message]',src:'SMS'}),'גוף הבקשה למקרודרויד הועתק','גוף הבקשה'),
  'ing-test':async(btn)=>{const text=$('#ingTest').value.trim();if(!text){toast('הדבק קודם הודעה מהבנק או מחברת האשראי');return}btn.disabled=true;
    try{const r=await Sync.call({action:'ing-test',text});if(!r.ok)throw new Error(r.err||'err');ING.res=r;renderSync()}catch(e){toast(errText(e))}finally{btn.disabled=false}},
  'copy-gs':async()=>{await loadGS();if(!GS){toast('הקוד עוד לא נטען, בדוק חיבור לאינטרנט ונסה שוב');return}copyText(GS,'הקוד הועתק. הדבק אותו בעורך של Apps Script','קוד הסקריפט')},
  'show-gs':async()=>{await loadGS();if(GS)showText('קוד הסקריפט','מעתיקים את כל הטקסט ומדביקים בעורך של Apps Script.',GS)},
  connect:async(btn)=>{const url=$('#gsUrl').value.trim(),er=$('#gsErr');er.textContent='';try{sessionStorage.setItem('kesef-url',url)}catch{}
    const pr=urlProblem(url);if(pr){er.textContent=pr;return}
    btn.disabled=true;btn.textContent='מתחבר…';try{await connectNew(url);toast('הגיליון חובר. עכשיו אפשר לשלוח קוד הצטרפות לשותף');location.hash='#sync';renderSync()}catch(e){const m=String(e&&e.message||'');er.textContent=(m==='paired'||m==='busy'||m==='server')?errText(e):CONNECT_HELP;btn.disabled=false;btn.textContent='חבר את הגיליון'}},
  join:async(btn)=>{const er=$('#joinErr');er.textContent='';const code=$('#joinCode').value;if(!dec(code)){er.textContent='הקוד לא נראה תקין. הוא מתחיל ב־KSF1.';return}
    btn.disabled=true;btn.textContent='מצטרף…';try{await connectJoin(code,$('#joinMerge').checked);toast('הצטרפת לחשבון המשותף');renderSync()}catch(e){er.textContent=e.message==='code'?'הקוד לא תקין.':errText(e);btn.disabled=false;btn.textContent='הצטרף'}},
  ss:()=>SS.start(),
  'push-on':async b=>{const er=$('#pErr');er.textContent='';b.disabled=true;b.textContent='מפעיל…';
    try{await PUSH.enable();renderSync();toast('ההתראות הופעלו במכשיר הזה')}
    catch(e){const m=String(e&&e.message||e);er.textContent=m==='standalone'?'באייפון צריך קודם להוסיף את האפליקציה למסך הבית ולפתוח אותה משם.':m==='denied'?'לא אישרת התראות. אפשר לאשר בהגדרות הטלפון ← התראות ← הכסף שלי.':m==='unsupported'?'הדפדפן הזה לא תומך בהתראות.':m==='push'||m==='action'?'הסקריפט בגיליון ישן. עדכן אותו לפי ההוראות למעלה.':'לא הצלחתי להפעיל התראות. נסה שוב.';b.disabled=false;b.textContent='הפעל התראות במכשיר הזה'}},
  'push-off':async()=>{if(!(await ask('לכבות את ההתראות?','המכשיר הזה יפסיק לקבל התראות. אפשר להפעיל שוב בכל רגע.','כבה')))return;await PUSH.disable();renderSync();toast('ההתראות כבויות במכשיר הזה')},
  'push-test':async b=>{b.disabled=true;try{const r=await Sync.call({action:'push-test',dev:ui.dev});toast(r.ok?'נשלחה התראת בדיקה. היא אמורה להגיע תוך כמה שניות':'לא הצלחתי לשלוח. נסה לכבות ולהפעיל מחדש')}catch(e){toast(errText(e))}b.disabled=false},
  bulktag:()=>openBulkTag(ui.tagF),
  'weekly-save':b=>weeklySave(false,b),
  'weekly-test':b=>weeklySave(true,b),
  'imp-go':doImport,
  'imp-cancel':()=>{IMP.aoa=[];IMP.parsed=null;IMP.smart=null;$('#impFile').value='';renderImport()}
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
$('#tundo').addEventListener('click',()=>{$('#toast').classList.remove('on');const f=toastAct;toastAct=null;if(f)f();else undo()});
$('#prev').addEventListener('click',()=>{ui.cur=shiftYm(ui.cur,-1);render()});
$('#next').addEventListener('click',()=>{ui.cur=shiftYm(ui.cur,1);render()});
$('#mlabel').addEventListener('click',()=>{ui.cur=nowYm;render()});
svg.addEventListener('click',e=>{const k=e.target.closest('[data-k]')?.dataset.k;if(k){ui.cur=k;render()}});
window.addEventListener('hashchange',()=>{if(takeJoinHash())return;route()});

$('#q').addEventListener('input',e=>{ui.q=e.target.value.trim();renderTx()});
function renderFilt(){const ch=[],rvN=TX().filter(t=>t.x?.rv).length;
  if(ui.typeF!=='all')ch.push(['type',TFL[ui.typeF]]);if(ui.catF)ch.push(['cat','קטגוריה: '+(cat(ui.catF)?.name||'')]);if(ui.tagF)ch.push(['tag','#'+ui.tagF]);if(ui.scope==='all')ch.push(['scope','כל התקופה']);
  $('#fchips').innerHTML=ch.map(([k,l])=>`<button class="tg fch" data-fclr="${k}" aria-label="הסר: ${esc(l)}">${esc(l)} <span aria-hidden="true">×</span></button>`).join('')+(rvN&&ui.typeF!=='rv'?`<button class="tg fch rvc" data-fset="rv">${rvN} לבדיקה</button>`:'');
  const n=ch.filter(c=>c[0]!=='scope').length;$('#filtN').hidden=!n;$('#filtN').textContent=n;
  const open=!!ui.filtOpen;$('#filtP').hidden=!open;$('#filtBtn').setAttribute('aria-expanded',String(open))}
$('#filtBtn').addEventListener('click',()=>{ui.filtOpen=!ui.filtOpen;renderFilt()});
$('#filtDone').addEventListener('click',()=>{ui.filtOpen=false;renderFilt()});
$('#filtClear').addEventListener('click',()=>{ui.typeF='all';ui.catF='';ui.tagF='';ui.scope='month';renderTx()});
$('#fchips').addEventListener('click',e=>{const b=e.target.closest('[data-fclr]');if(b){const k=b.dataset.fclr;if(k==='type')ui.typeF='all';else if(k==='cat')ui.catF='';else if(k==='tag')ui.tagF='';else ui.scope='month';renderTx();return}
  const s=e.target.closest('[data-fset]');if(s){ui.typeF=s.dataset.fset;ui.scope='all';renderTx()}});
$('#catF').addEventListener('change',e=>{ui.catF=e.target.value;renderTx()});
$('#typeF').addEventListener('click',e=>{const v=e.target.closest('button')?.dataset.v;if(v){ui.typeF=v;renderTx()}});
$('#scope').addEventListener('click',e=>{const v=e.target.closest('button')?.dataset.v;if(v){ui.scope=v;renderTx()}});
$('#modeSeg').addEventListener('click',e=>{const v=e.target.closest('button')?.dataset.v;if(v){ui.mode=v;persist();renderTx()}});
$('#tbl thead').addEventListener('click',e=>{const th=e.target.closest('th[data-s]');if(!th)return;const k=th.dataset.s;if(ui.sortK===k)ui.sortD=-ui.sortD;else{ui.sortK=k;ui.sortD=k==='d'||k==='a'?-1:1}renderTx()});
$('#tb').addEventListener('change',e=>{
  const el=e.target,tr=el.closest('tr[data-id]');if(!tr)return;const t=S.tx.find(x=>x.id===tr.dataset.id);if(!t)return;
  const f=el.dataset.f,old=ymOf(t.d);if(f==='d'&&!YMD.test(el.value)){renderTx();return}
  const bl=snapLv([old,f==='d'?ymOf(el.value):old]);
  let learned='';
  change(()=>{if(f==='a')t.a=Math.round(Math.abs(parseFloat(el.value)||0)*100)/100;else if(f==='d')t.d=el.value;else if(f==='c'){const oc=cat(t.c),nc=cat(el.value);t.c=el.value;if(nc&&!nc.int&&!(oc&&!oc.int&&oc.k===nc.k))t.t=nc.k;learned=learn(t.n,t.c)}else if(f==='n')t.n=el.value.slice(0,120);else if(f==='note'){const v=el.value.trim().slice(0,500);if(v)t.note=v;else delete t.note}},{tx:[t.id],cfg:f==='c'});
  const lm=learned?applyAllOffer(learned):null;if(lm){toast(lm.msg,false,lm.act);return}
  const cm=crossMsg(bl);if(cm)toast(cm,true);
});
$('#tb').addEventListener('click',e=>{if(!e.target.closest('[data-del]'))return;const id=e.target.closest('tr').dataset.id;change(()=>removeTx(id),{tx:[id]});toast('השורה נמחקה',true)});
$('#addRow').addEventListener('click',()=>{const c=exps()[0];if(!c)return;const id=rid();ui.typeF='all';ui.catF='';ui.q='';$('#q').value='';ui.sortK='d';ui.sortD=-1;
  change(()=>S.tx.push({id,d:defDate(),t:'exp',a:0,c:c.id,n:'',img:'',u:0}),{tx:[id]});$(`#tb tr[data-id="${id}"] input[data-f=n]`)?.focus()});
$('#copyTsv').addEventListener('click',()=>{const rows=[['תאריך','תיאור','קטגוריה','סוג','סכום','הערה']].concat(currentList().map(t=>[t.d,t.n||'',cat(t.c)?.name||'',typeLabel(t),t.a,t.note||'']));
  copyText(rows.map(r=>r.map(v=>String(v).replace(/[\t\n]/g,' ')).join('\t')).join('\n'),'הטבלה הועתקה. הדבק אותה באקסל או בשיטס','העתקה לאקסל')});

$('#goalIn').addEventListener('change',e=>{const v=Math.max(0,Math.round(+e.target.value||0));if(v===G())return;change(()=>{S.goal=v},{cfg:true});toast(`היעד החודשי עודכן ל־${fmt(v)}`,true)});
$('#apIn').addEventListener('change',e=>{const v=clamp(Math.round(+e.target.value||80),50,100);if(v===AP()){e.target.value=v;return}change(()=>{S.alertPct=v},{cfg:true})});
function setChange(e){const el=e.target,tr=el.closest('tr[data-cid]');if(!tr)return;const c=cat(tr.dataset.cid);if(!c)return;const k=el.dataset.k;
  if(k==='name'&&!el.value.trim()){el.value=c.name;return}
  if(k==='kind'){const v=el.value,tmp={...c};setKind(tmp,v);const after=S.cats.map(x=>x.id===c.id?tmp:x);
    if(!after.some(x=>x.k==='exp'&&!x.int)||!after.some(x=>x.k==='inc'&&!x.int)){toast('צריך להשאיר לפחות קטגוריית הוצאה אחת וקטגוריית הכנסה אחת');renderBudget();return}
    const n=TX().filter(t=>t.c===c.id).length;change(()=>setKind(c,v),{cfg:true});
    toast(`${c.name}: ${KINDL[v]}.${n?` ${n} התנועות שבה נספרות מעכשיו בהתאם.`:''}${v==='int'?' לא נספרת בהכנסות ובהוצאות.':''}`,true);return}
  change(()=>{if(k==='color'){if(HEX.test(el.value))c.color=el.value}else if(k==='name')c.name=el.value.trim().slice(0,40);else if(k==='pct')c.pct=clamp(Math.round(+el.value||0),0,100);else if(k==='sal')c.sal=el.checked},{cfg:true})}
function setClick(e){if(!e.target.closest('[data-cdel]'))return;const c=cat(e.target.closest('tr').dataset.cid);if(!c)return;
  const moved=TX().filter(t=>t.c===c.id).map(t=>t.id);
  const same=S.cats.filter(x=>x.id!==c.id&&(c.int?x.int:(x.k===c.k&&!x.int)));
  if(c.int&&!same.length){if(moved.length){toast(`יש בה ${moved.length} תנועות. העבר אותן קודם לקטגוריה אחרת או הוסף קטגוריית העברה נוספת`);return}change(()=>{S.cats=S.cats.filter(x=>x.id!==c.id)},{cfg:true});toast('הקטגוריה נמחקה',true);return}
  if(!same.length){toast('צריך לפחות קטגוריה אחת מכל סוג');return}
  const fb=same.find(x=>/שונות|אחרת/.test(x.name)&&!x.sav)||same.find(x=>!x.sav)||same[same.length-1];
  change(()=>{moved.forEach(id=>{S.tx.find(t=>t.id===id).c=fb.id});S.cats=S.cats.filter(x=>x.id!==c.id);if(ui.catF===c.id)ui.catF=''},{tx:moved,cfg:true});
  toast(moved.length?`הקטגוריה נמחקה, ${moved.length} תנועות עברו ל${fb.name}`:'הקטגוריה נמחקה',true)}
['#setE','#setI','#setT'].forEach(s=>{$(s).addEventListener('change',setChange);$(s).addEventListener('click',setClick)});
function addCat(k){const id=rid(8);change(()=>S.cats.push({id,k:k==='inc'?'inc':'exp',name:k==='exp'?'קטגוריה חדשה':k==='inc'?'הכנסה חדשה':'חשבון נוסף',color:k==='int'?'#94a3b8':PAL[S.cats.length%PAL.length],pct:0,sal:false,sav:false,int:k==='int'}),{cfg:true});$(`tr[data-cid="${id}"] input[data-k=name]`)?.select()}
$('#addE').addEventListener('click',()=>addCat('exp'));$('#addI').addEventListener('click',()=>addCat('inc'));$('#addT').addEventListener('click',()=>addCat('int'));

/* import events */
$('#impFile').addEventListener('change',e=>{if(e.target.files.length)readFiles(e.target.files)});
const drop=$('#drop');
['dragenter','dragover'].forEach(t=>drop.addEventListener(t,e=>{e.preventDefault();drop.classList.add('over')}));
['dragleave','drop'].forEach(t=>drop.addEventListener(t,e=>{e.preventDefault();drop.classList.remove('over')}));
drop.addEventListener('drop',e=>{const l=e.dataTransfer?.files;if(l&&l.length)readFiles(l)});
$('#impBody').addEventListener('change',e=>{const el=e.target;
  if(IMP.smart){const o=IMP.smart.opts;if(el.dataset.sopt)o[el.dataset.sopt]=el.checked;else if(el.dataset.own!==undefined){if(el.checked)o.own.add(el.dataset.own);else o.own.delete(el.dataset.own)}else if(el.id==='smSelf')o.self=el.value.split(/[,،]/).map(x=>x.trim()).filter(Boolean).slice(0,6);else return;smartRun();renderImport();return}
  if(el.id==='impSheet'){IMP.sheet=el.value;loadSheet();return}
  if(el.id==='impHdr'){IMP.hdr=clamp((+el.value||1)-1,0,Math.max(0,IMP.aoa.length-1));guessMap()}
  else if(el.dataset.map){const v=el.value;if(v==='')delete IMP.map[el.dataset.map];else{const j=+v;Object.keys(IMP.map).forEach(k=>{if(IMP.map[k]===j)delete IMP.map[k]});IMP.map[el.dataset.map]=j}}
  else if(el.dataset.opt)IMP.opts[el.dataset.opt]=el.checked;
  parseImp();renderImport()});
$('#impBody').addEventListener('click',e=>{const s=e.target.closest('#smF button');if(s){ui.impF=s.dataset.v;renderImport();return}const b=e.target.closest('#impDef button');if(b){IMP.opts.defType=b.dataset.v;parseImp();renderImport()}});

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
  const rows=[['תאריך','סוג','קטגוריה','תיאור','סכום','הערה','תגיות']].concat(TX().slice().sort((a,b)=>a.d<b.d?-1:1).map(t=>[t.d,typeLabel(t),cat(t.c)?.name||'',t.n||'',t.a,t.note||'',(t.tags||[]).join(', ')]));
  dl(`kesef-${todayStr}.csv`,new Blob(['\ufeff'+rows.map(r=>r.map(q).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}))});
$('#xlsxDown').addEventListener('click',async e=>{const b=e.currentTarget;b.disabled=true;
  try{await loadXLSX();
    const txs=TX().slice().sort((a,b)=>a.d<b.d?-1:1);
    const t1=[['תאריך','סוג','קטגוריה','תיאור','סכום','הערה','תגיות']].concat(txs.map(t=>{const [y,m,d]=t.d.split('-').map(Number);return [new Date(Date.UTC(y,m-1,d)),typeLabel(t),cat(t.c)?.name||'',t.n||'',t.t==='inc'?t.a:-t.a,t.note||'',(t.tags||[]).join(', ')]}));
    const ws1=XLSX.utils.aoa_to_sheet(t1,{cellDates:true});ws1['!cols']=[{wch:12},{wch:8},{wch:18},{wch:30},{wch:12},{wch:40}];
    for(let r=1;r<t1.length;r++){const c=ws1[XLSX.utils.encode_cell({r,c:0})];if(c)c.z='dd/mm/yyyy';const a=ws1[XLSX.utils.encode_cell({r,c:4})];if(a)a.z='#,##0.00'}
    const months=[...new Set(txs.map(t=>t.d.slice(0,7)))];
    const t2=[['חודש','הכנסות','הוצאות','לחיסכון','נשאר']].concat(months.map(m=>[MN[mIdx(m)]+' '+m.slice(0,4),tot(m,'inc'),spendM(m),savedIn(m),tot(m,'inc')-tot(m,'exp')]));
    const t3=[['קטגוריה','סוג','% מהמשכורת']].concat(S.cats.map(c=>[c.name,KINDL[catKind(c)],c.k==='exp'&&!c.int?c.pct:'']));
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
  if(!list.length){c.hidden=true;return}c.hidden=false;const un=unread();
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
  const c=$('#homeAlbum'),list=ITEMS('pic');
  if(!list.length||ui.bg.mode!=='off'){stopHomeAlbum();c.hidden=true;return}
  c.hidden=false;
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

/* ---------- recurring + forecast ---------- */
const RECID=/^r([a-z0-9]{8})(\d{4})(\d{2})$/;
const recId=(r,ym)=>'r'+r.id+ym.replace('-','');
const daysIn=ym=>new Date(+ym.slice(0,4),+ym.slice(5),0).getDate();
const isRecTx=t=>RECID.test(t.id);
function genRecurring(){
  const ids=[];
  S.rec.forEach(r=>{if(!r.on)return;let ym=r.start,g=0;
    while(ym<=nowYm&&g++<72){const d=`${ym}-${p2(Math.min(r.day,daysIn(ym)))}`;
      if(d<=todayStr&&!r.skip.includes(ym)){const id=recId(r,ym);if(!S.tx.some(t=>t.id===id)){S.tx.push({id,d,t:r.t,a:r.a,c:r.c,n:r.n,img:'',u:0});ids.push(id)}}
      ym=shiftYm(ym,1)}});
  return ids;
}
function runRec(quiet){if(sample||SY.ro)return false;const ids=genRecurring();if(!ids.length)return false;const t=Date.now();ids.forEach(id=>{const x=S.tx.find(y=>y.id===id);if(x){x.u=t;markDirty(id)}});persist();if(!quiet){render();Sync.schedule()}return true}
function forecast(){
  if(ui.cur!==nowYm)return null;
  const ym=nowYm,dim=daysIn(ym),day=T0.getDate(),inc=tot(ym,'inc'),exp=tot(ym,'exp');
  const up=S.rec.filter(r=>r.on&&r.start<=ym&&!r.skip.includes(ym)&&!S.tx.some(t=>t.id===recId(r,ym)))
    .map(r=>({r,d:Math.min(r.day,dim)})).sort((a,b)=>a.d-b.d);
  const pt=up.map(x=>({t:x.r.t,c:x.r.c,a:x.r.a})),upInc=sumBy(pt,incA),upExp=sumBy(pt,t=>expA(t)+savA(t));
  const varOf=m=>sumBy(inM(m).filter(t=>!isRecTx(t)),expA);
  const now=varOf(ym);let rate=now/day;
  if(day<7){const prev=[1,2,3].map(k=>shiftYm(ym,-k)).filter(m=>inM(m).length);if(prev.length){const tv=prev.reduce((s,m)=>s+varOf(m),0),td=prev.reduce((s,m)=>s+daysIn(m),0);rate=tv/td}}
  const restVar=Math.max(0,rate*(dim-day));
  return {net:inc+upInc-(exp+upExp+restVar),up,upInc,upExp,restVar,left:dim-day};
}
function renderForecast(){
  const f=forecast(),el=$('#fc'),c=$('#homeFc');
  if(!f||(!inM(nowYm).length&&!f.up.length)){el.hidden=true;c.hidden=true;return}
  el.hidden=false;el.innerHTML=`צפי לסוף החודש: ${f.net>=0?`יישארו בערך <b>${esc(fmt(f.net))}</b>`:`חריגה של בערך <b>${esc(fmt(-f.net))}</b>`}`;
  c.hidden=true;
}
function renderRecList(){
  const l=S.rec.slice().sort((a,b)=>(b.on-a.on)||a.day-b.day);
  $('#recList').innerHTML=l.length?l.map(r=>{const c=cat(r.c);return `<button class="recr${r.on?'':' off'}" data-rec="${esc(r.id)}"><span class="ri" style="--c:${col(c)}"><svg class="ic"><use href="#i-repeat"/></svg></span><span><b>${esc(r.n||c?.name||'')}</b><small>${esc(c?.name||'')}, כל ${r.day} בחודש${r.on?'':', מושהית'}</small></span><span class="amt2" style="${r.t==='inc'?'color:var(--inc)':''}">${r.t==='inc'?'+':''}${esc(fmt(r.a))}</span></button>`}).join(''):'<p class="hint" style="margin:0">עוד אין קבועות. אפשר להוסיף כאן, או לסמן "חוזרת כל חודש" כשמוסיפים הוצאה.</p>';
}
let recEdit=null,recType='exp';
function recCats(sel){const l=S.cats.filter(c=>c.k===recType);$('#recC').innerHTML=l.map(c=>`<option value="${esc(c.id)}"${c.id===sel?' selected':''}>${esc(c.name)}</option>`).join('')}
function openRec(id){
  recEdit=id?S.rec.find(r=>r.id===id):null;const r=recEdit;recType=r?r.t:'exp';setSeg($('#recSeg'),recType);
  $('#recT').textContent=r?'עריכת קבועה':'קבועה חדשה';$('#recN').value=r?r.n:'';$('#recA').value=r?r.a:'';$('#recD').value=r?r.day:T0.getDate();$('#recS').value=r?r.start:nowYm;$('#recOn').checked=r?r.on:true;$('#recErr').textContent='';$('#recDel').hidden=!r;
  recCats(r?.c);show($('#dRec'));if(!r)setTimeout(()=>$('#recN').focus(),80);
}
$('#recAdd').addEventListener('click',()=>openRec());
$('#recList').addEventListener('click',e=>{const b=e.target.closest('[data-rec]');if(b)openRec(b.dataset.rec)});
$('#recSeg').addEventListener('click',e=>{const v=e.target.closest('button')?.dataset.v;if(v){recType=v;setSeg($('#recSeg'),v);recCats()}});
$('#recF').addEventListener('submit',e=>{e.preventDefault();
  const n=$('#recN').value.trim().slice(0,60),a=parseFloat($('#recA').value),day=Math.round(+$('#recD').value),start=$('#recS').value,c=$('#recC').value,on=$('#recOn').checked;
  if(!n){$('#recErr').textContent='צריך שם.';return}if(!(a>0)){$('#recErr').textContent='צריך סכום.';return}if(!(day>=1&&day<=31)){$('#recErr').textContent='יום בחודש בין 1 ל־31.';return}if(!/^\d{4}-\d{2}$/.test(start)){$('#recErr').textContent='בחר חודש התחלה.';return}
  const id=recEdit?.id;
  change(()=>{if(id){const r=S.rec.find(x=>x.id===id);Object.assign(r,{n,a:Math.round(a*100)/100,day,start,c,t:recType,on})}else S.rec.push({id:rid(8),n,a:Math.round(a*100)/100,t:recType,c,day,start,skip:[],on})},{cfg:true});
  hide($('#dRec'));runRec();toast(id?'הקבועה עודכנה':`נוספה קבועה: ${n}, ${fmt(a)} כל ${day} בחודש`,true);
});
$('#recDel').addEventListener('click',async()=>{const id=recEdit?.id;if(!id)return;if(!(await ask('למחוק את הקבועה?','היא תפסיק להיכנס מעכשיו. התנועות שכבר נכנסו נשארות.','מחק',true)))return;hide($('#dRec'));change(()=>{S.rec=S.rec.filter(r=>r.id!==id)},{cfg:true});toast('הקבועה נמחקה',true)});

/* ---------- tags ---------- */
let edTags=[];
function allTags(){const s=new Map();TX().forEach(t=>(t.tags||[]).forEach(g=>s.set(g,(s.get(g)||0)+1)));return [...s.keys()].sort((a,b)=>s.get(b)-s.get(a))}
function drawTags(){$('#txTags').innerHTML=edTags.map((g,i)=>`<span class="tg">#${esc(g)}<button type="button" data-tgi="${i}" aria-label="הסר תגית ${esc(g)}">×</button></span>`).join('')}
function addTagFromInput(){const v=$('#txTagIn').value.split(',').map(x=>x.trim()).filter(Boolean);if(!v.length)return;edTags=normTags([...edTags,...v]);$('#txTagIn').value='';drawTags()}
$('#txTagIn').addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===',')&&!e.isComposing){e.preventDefault();addTagFromInput()}});
$('#txTagIn').addEventListener('change',()=>{if(allTags().includes($('#txTagIn').value.trim()))addTagFromInput()});
$('#txTags').addEventListener('click',e=>{const b=e.target.closest('[data-tgi]');if(b){edTags.splice(+b.dataset.tgi,1);drawTags()}});
$('#tagF').addEventListener('change',e=>{ui.tagF=e.target.value;if(ui.tagF)ui.scope='all';renderTx()});
function btRange(){const n=$('#btName').value.trim().slice(0,30),f=$('#btFrom').value,t=$('#btTo').value,ex=$('#btExp').checked;return {n,f,t,ex,list:(YMD.test(f)&&YMD.test(t))?TX().filter(x=>x.d>=f&&x.d<=t&&(!ex||x.t==='exp')):[]}}
function btUpd(){const r=btRange();$('#btCount').textContent=r.list.length?`${r.list.length} תנועות בטווח, ${fmt(r.list.reduce((s,x)=>s+(x.t==='exp'?x.a:0),0))} הוצאות`:''}
['#btFrom','#btTo','#btExp','#btName'].forEach(s=>$(s).addEventListener('input',btUpd));
function openBulkTag(tag){$('#btName').value=tag||'';const l=currentList();const ds=l.map(t=>t.d).sort();$('#btFrom').value=ds[0]||ui.cur+'-01';$('#btTo').value=ds[ds.length-1]||todayStr;$('#btErr').textContent='';$('#tagList').innerHTML=allTags().map(g=>`<option value="${esc(g)}">`).join('');btUpd();show($('#dTag'));setTimeout(()=>$('#btName').focus(),80)}
$('#tagF2').addEventListener('submit',e=>{e.preventDefault();const r=btRange();if(!r.n){$('#btErr').textContent='צריך שם לתגית.';return}if(!r.list.length){$('#btErr').textContent='אין תנועות בטווח הזה.';return}
  const ids=r.list.map(x=>x.id);change(()=>ids.forEach(id=>{const t=S.tx.find(x=>x.id===id);t.tags=normTags([...(t.tags||[]),r.n])}),{tx:ids});hide($('#dTag'));ui.tagF=r.n;ui.scope='all';render();toast(`${ids.length} תנועות תויגו #${r.n}`,true)});
$('#btRemove').addEventListener('click',()=>{const r=btRange();if(!r.n){$('#btErr').textContent='בחר איזו תגית להסיר.';return}const ids=r.list.filter(x=>(x.tags||[]).includes(r.n)).map(x=>x.id);if(!ids.length){$('#btErr').textContent='אין בטווח תנועות עם התגית הזו.';return}
  change(()=>ids.forEach(id=>{const t=S.tx.find(x=>x.id===id);t.tags=t.tags.filter(g=>g!==r.n);if(!t.tags.length)delete t.tags}),{tx:ids});hide($('#dTag'));render();toast(`התגית הוסרה מ־${ids.length} תנועות`,true)});

/* ---------- learning categories ---------- */
const mkey=n=>String(n||'').toLowerCase().replace(/\(.*?\)/g,' ').replace(/[^a-zא-ת ]/g,' ').trim().split(/\s+/).filter(w=>w.length>1).slice(0,2).join(' ');
let chipTouched=false;
function learn(n,c,silent){const k=mkey(n);if(!k||!cat(c))return '';S.rules[k]=c;if(SY.on)SY.cfgDirty=true;return silent?'':k}
function applyAllOffer(k){const c=S.rules[k],cc=cat(c);if(!cc)return null;const g=catKind(cc)==='inc'?['inc']:catKind(cc)==='int'?['int']:['exp','sav'];const others=TX().filter(t=>mkey(t.n)===k&&t.c!==c&&g.includes(kd(t)));
  if(!others.length)return {msg:`למדתי: "${k}" שייך ל${cc.name}. בייבוא הבא זה יקרה לבד.`,act:null};
  return {msg:`למדתי: "${k}" שייך ל${cc.name}. יש עוד ${others.length} תנועות כאלה בקטגוריה אחרת.`,act:{label:'עדכן הכול',fn:()=>{const ids=others.map(t=>t.id);change(()=>ids.forEach(id=>{S.tx.find(t=>t.id===id).c=c}),{tx:ids});toast(`עודכנו ${ids.length} תנועות ל${cc.name}`,true)}}};
}
$('#txC').addEventListener('change',()=>{chipTouched=true});
$('#txN').addEventListener('input',()=>{if(chipTouched)return;const r=S.rules[mkey($('#txN').value)];if(r&&cat(r)){const inp=$(`#txC input[value="${CSS.escape(r)}"]`);if(inp)inp.checked=true}});

/* ---------- weekly email ---------- */
function weeklyCard(){
  const w=S.weekly,old=SY.sv&&SY.sv<7,f=w.freq||'month',md=w.mday||11;
  return `<div class="card"><h2><svg class="ic" style="vertical-align:-4px"><use href="#i-mail"/></svg> סיכום במייל</h2>
<p class="hint">מייל קצר מהגיליון לשניכם. <b>חודשי:</b> ביום שתבחרו בכל חודש ב־8:00, סיכום החודש הקודם, כולל הכנסות, הוצאות, חיסכון מול היעד, קטגוריות מול התקציב וההוצאות הגדולות. <b>שבועי:</b> כל יום ראשון ב־8:00, מה הוצאתם השבוע ומה קרוב לחריגה.</p>
${old?'<p class="hint bad">צריך קודם לעדכן את הסקריפט בגיליון (ההוראות למעלה).</p>':''}
<label class="lbl" for="wFreq">כל כמה זמן</label>
<select class="field" id="wFreq" style="margin-bottom:10px"><option value="month"${f==='month'?' selected':''}>כל חודש</option><option value="week"${f==='week'?' selected':''}>כל שבוע</option><option value="both"${f==='both'?' selected':''}>גם חודשי וגם שבועי</option></select>
<label class="lbl" for="wDay">המייל החודשי נשלח ב־</label>
<select class="field" id="wDay" style="margin-bottom:10px">${Array.from({length:28},(_,i)=>i+1).map(d=>`<option value="${d}"${d===md?' selected':''}>${d} לחודש${d===11?' (יום אחרי חיוב האשראי)':''}</option>`).join('')}</select>
<label class="lbl" for="wEm">כתובות מייל, מופרדות בפסיק (עד 5)</label>
<input class="field" id="wEm" type="email" multiple inputmode="email" placeholder="you@gmail.com, partner@gmail.com" value="${esc(w.emails.join(', '))}">
<label class="chk"><input type="checkbox" id="wOn"${w.on?' checked':''}>לשלוח</label>
<p class="err" id="wErr"></p>
<div class="btnrow"><button class="btn solid sm" data-act="weekly-save"${old?' disabled':''}>שמור</button><button class="btn sm" data-act="weekly-test"${old?' disabled':''}>שלח דוגמה עכשיו</button></div></div>`;
}
async function weeklySave(test,btn){
  const emails=$('#wEm').value.split(/[,\s;]+/).map(x=>x.trim()).filter(Boolean),on=$('#wOn').checked,freq=$('#wFreq').value,mday=+$('#wDay').value||11,er=$('#wErr');er.textContent='';
  const bad=emails.filter(e=>!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));if(bad.length){er.textContent='כתובת לא תקינה: '+bad[0];return}
  if((on||test)&&!emails.length){er.textContent='צריך לפחות כתובת אחת.';return}
  btn.disabled=true;const lbl=btn.textContent;btn.textContent=test?'שולח…':'שומר…';
  try{const r=await Sync.call({action:'weekly',emails,on,test,freq,mday,app:APP_URL});
    if(!r.ok){er.textContent=r.err==='action'?'הסקריפט בגיליון ישן. עדכן אותו לפי ההוראות למעלה.':r.err==='server'?'הסקריפט עוד לא קיבל הרשאה לשלוח מיילים. בעורך Apps Script בחר בפונקציה authorize, לחץ Run ואשר, ואז פרסם גרסה חדשה.':errText(new Error(r.err));}
    else{const fr=r.freq||freq,md=r.mday||mday;change(()=>{S.weekly={emails:r.emails,on:r.on,freq:fr,mday:md}},{cfg:true,undo:false});toast(test?`נשלח מייל לדוגמה ל־${r.emails.join(', ')}`:r.on?(fr==='month'?`הסיכום יישלח ב־${md} לכל חודש ב־8:00`:fr==='week'?'הסיכום יישלח כל יום ראשון ב־8:00':`יישלח סיכום חודשי ב־${md} לחודש וסיכום שבועי בכל יום ראשון`):'הסיכום במייל כבוי');}
  }catch(e){er.textContent=errText(e)}
  btn.disabled=false;btn.textContent=lbl;
}

/* ---------- reports ---------- */
function spendOf(m,cid){return cid?spent(m,cid):spendM(m)}
function renderReports(){
  const cur=ui.cur,prev=[1,2,3].map(k=>shiftYm(cur,-k)).filter(m=>inM(m).length),ly=shiftYm(cur,-12),hasLy=inM(ly).length>0,mn=MN[mIdx(cur)];
  const avg=(f)=>prev.length?prev.reduce((s,m)=>s+f(m),0)/prev.length:0;
  const rows=exps().map(c=>({c,now:spendOf(cur,c.id),av:avg(m=>spendOf(m,c.id)),ly:hasLy?spendOf(ly,c.id):null})).filter(r=>r.now||r.av||r.ly).sort((a,b)=>b.now-a.now);
  const tNow=spendOf(cur),tAv=avg(m=>spendOf(m)),tLy=hasLy?spendOf(ly):null;
  const pc=(a,b)=>b?Math.round((a-b)/b*100):null;
  const ins=[];
  if(prev.length&&tAv){const p=pc(tNow,tAv);ins.push([p>0?'up':'down',p>0?'↑':'↓',`ב${mn} הוצאתם ${fmt(tNow)}, ${Math.abs(p)}% ${p>0?'יותר':'פחות'} מהממוצע של ${prev.length===1?'החודש הקודם':`${prev.length} החודשים הקודמים`} (${fmt(tAv)}).${cur===nowYm?' החודש עוד לא נגמר.':''}`])}
  rows.filter(r=>r.av>=200&&r.now>r.av*1.3&&r.now-r.av>=100).sort((a,b)=>(b.now-b.av)-(a.now-a.av)).slice(0,3).forEach(r=>ins.push(['up','↑',`על ${r.c.name} הוצאתם ${fmt(r.now)}, ${pc(r.now,r.av)}% יותר מהרגיל (${fmt(r.av)} בממוצע).`]));
  rows.filter(r=>r.av>=200&&r.now<r.av*.7&&cur!==nowYm).sort((a,b)=>(b.av-b.now)-(a.av-a.now)).slice(0,2).forEach(r=>ins.push(['down','↓',`על ${r.c.name} הוצאתם ${fmt(r.now)}, ${Math.abs(pc(r.now,r.av))}% פחות מהרגיל.`]));
  if(tLy){const p=pc(tNow,tLy);ins.push([p>0?'up':'down',p>0?'↑':'↓',`לעומת ${mn} שנה שעברה (${fmt(tLy)}): ${Math.abs(p)}% ${p>0?'יותר':'פחות'}.`])}
  const big=inM(cur).filter(t=>expA(t)>0).sort((a,b)=>b.a-a.a)[0];if(big)ins.push(['','₪',`ההוצאה הגדולה החודש: ${big.n||cat(big.c)?.name} ב־${fmt(big.a)}.`]);
  const inc=tot(cur,'inc');if(inc)ins.push(['','%',`חסכתם ${Math.max(0,Math.round((inc-tNow)/inc*100))}% מההכנסות החודש.`]);
  const months=[...Array(12)].map((_,i)=>shiftYm(cur,i-11)),mx=Math.max(1,...months.map(m=>Math.max(tot(m,'inc'),spendOf(m))));
  const tagMap=new Map();TX().forEach(t=>(t.tags||[]).forEach(g=>{const o=tagMap.get(g)||{n:0,s:0,from:t.d,to:t.d};o.n++;o.s+=expA(t);if(t.d<o.from)o.from=t.d;if(t.d>o.to)o.to=t.d;tagMap.set(g,o)}));
  const tags=[...tagMap].sort((a,b)=>b[1].s-a[1].s);
  const y0=shiftYm(cur,-11),mer=new Map();TX().filter(t=>kd(t)==='exp'&&t.d.slice(0,7)>=y0&&t.d.slice(0,7)<=cur).forEach(t=>{const k=mkey(t.n)||'ללא תיאור';const o=mer.get(k)||{n:t.n,s:0,c:0};o.s+=expA(t);if(t.t==='exp')o.c++;mer.set(k,o)});
  const tops=[...mer.values()].filter(o=>o.s>0).sort((a,b)=>b.s-a.s).slice(0,10);
  const dd=d=>d.split('-').reverse().join('/');
  const chg=(a,b)=>{const p=pc(a,b);return p===null||!b?'':`<span class="${p>0?'up':'down'}">${p>0?'+':''}${p}%</span>`};
  $('#repBody').innerHTML=`
<div class="card"><h2>תובנות על ${esc(mn)}</h2>${ins.length?`<ul class="ins">${ins.map(i=>`<li class="${i[0]}"><i>${i[1]}</i><span>${esc(i[2])}</span></li>`).join('')}</ul>`:'<p class="hint" style="margin:0">צריך לפחות חודש קודם עם נתונים כדי להשוות.</p>'}</div>
<div class="card"><h2>12 חודשים</h2><div class="legend"><span><i class="sw" style="background:var(--inc)"></i>הכנסות</span><span><i class="sw" style="background:var(--ink)"></i>הוצאות</span></div>
${months.map(m=>{const i=tot(m,'inc'),e=spendOf(m),n=i-e;return `<div class="mrow2${m===cur?' cur':''}"><span>${MS[mIdx(m)]} ${m.slice(2,4)}</span><span class="bars"><b style="width:${(i/mx*100).toFixed(1)}%;background:var(--inc)"></b><b style="width:${(e/mx*100).toFixed(1)}%;background:var(--ink)"></b></span><span class="net" style="color:${n>=0?'var(--inc)':'var(--over)'}">${i||e?(n>0?'+':'')+esc(fmtK(n)):''}</span></div>`}).join('')}
<p class="hint" style="margin:8px 0 0">בלי העברות לחיסכון והשקעות.</p></div>
<div class="card span2"><h2>השוואה לפי קטגוריה</h2><div class="sheet"><div class="scroll"><table class="rtab"><thead><tr><th>קטגוריה</th><th class="num">${esc(MS[mIdx(cur)])}</th><th class="num">ממוצע ${prev.length||''} ח׳</th><th class="num">שינוי</th>${hasLy?`<th class="num">אשתקד</th>`:''}</tr></thead><tbody>
${rows.map(r=>`<tr><td><i class="sw" style="background:${col(r.c)}"></i> ${esc(r.c.name)}</td><td class="num">${esc(fmt(r.now))}</td><td class="num">${prev.length?esc(fmt(r.av)):''}</td><td class="num">${chg(r.now,r.av)}</td>${hasLy?`<td class="num">${esc(fmt(r.ly))}</td>`:''}</tr>`).join('')}
<tr><td><b>סה״כ בלי חיסכון</b></td><td class="num"><b>${esc(fmt(tNow))}</b></td><td class="num">${prev.length?esc(fmt(tAv)):''}</td><td class="num">${chg(tNow,tAv)}</td>${hasLy?`<td class="num">${esc(fmt(tLy))}</td>`:''}</tr></tbody></table></div></div></div>
<div class="card"><div class="ch"><h2>לפי תגיות</h2><button class="btn sm" data-act="bulktag"><svg class="ic"><use href="#i-tag"/></svg>תיוג לפי תאריכים</button></div>
${tags.length?tags.map(([g,o])=>`<a class="trow" href="#tx" data-tag="${esc(g)}" style="color:inherit;text-decoration:none"><span><b>#${esc(g)}</b><small>${o.n} תנועות, ${esc(dd(o.from))} עד ${esc(dd(o.to))}</small></span><b>${esc(fmt(o.s))}</b></a>`).join(''):'<p class="hint" style="margin:0">עוד אין תגיות. תייגו הוצאות של טיול או פרויקט, ותראו כאן כמה עלה הכול יחד.</p>'}</div>
<div class="card"><h2>איפה הוצאתם הכי הרבה</h2><p class="hint">12 החודשים האחרונים, לפי עסק, אחרי זיכויים.</p>
${tops.map(o=>`<div class="trow"><span>${esc(o.n.slice(0,40))}<small>${o.c} פעמים</small></span><b>${esc(fmt(o.s))}</b></div>`).join('')||'<p class="hint" style="margin:0">אין נתונים.</p>'}</div>
${extraCards()}`;
  hydrate($('#repBody'));
}
$('#repBody').addEventListener('click',e=>{const a=e.target.closest('[data-tag]');if(a){ui.tagF=a.dataset.tag;ui.scope='all'}});

/* ---------- push notifications ---------- */
const b64u=buf=>bufToB64(buf instanceof ArrayBuffer?buf:buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const b64uStr=s=>b64u(new TextEncoder().encode(s));
const fromB64u=s=>{s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return new Uint8Array(b64ToBuf(s))};
async function saveSyncInfo(){if(SY.on)try{await IDB.put('sync',{url:SY.url,key:SY.key,dev:ui.dev})}catch{}}
const PUSH={
  supported(){return 'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window&&!!window.crypto?.subtle},
  ios(){return /iPhone|iPad|iPod/.test(navigator.userAgent)},
  standalone(){return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true},
  async keys(){
    let v=null;try{v=await IDB.get('vapid')}catch{}
    if(v&&v.jwk&&v.pub){try{return {priv:await crypto.subtle.importKey('jwk',v.jwk,{name:'ECDSA',namedCurve:'P-256'},false,['sign']),pub:v.pub}}catch{}}
    const kp=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
    const pub=b64u(await crypto.subtle.exportKey('raw',kp.publicKey)),jwk=await crypto.subtle.exportKey('jwk',kp.privateKey);
    await IDB.put('vapid',{jwk,pub});return {priv:kp.privateKey,pub};
  },
  async tokens(priv,aud,n=90){
    const h=b64uStr(JSON.stringify({typ:'JWT',alg:'ES256'})),base=Math.floor(Date.now()/1000/43200)*43200,sub=/^https:\/\//.test(APP_URL)?APP_URL:'mailto:kesef-app@users.noreply.github.com',out=[];
    for(let j=1;j<=n;j++){const e=base+43200*j,p=b64uStr(JSON.stringify({aud,exp:e,sub}));const sig=await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},priv,new TextEncoder().encode(h+'.'+p));out.push({e,t:h+'.'+p+'.'+b64u(sig)})}
    return out;
  },
  async register(){
    const reg=await navigator.serviceWorker.ready,k=await this.keys();
    let sub=await reg.pushManager.getSubscription();
    if(sub){const cur=sub.options&&sub.options.applicationServerKey;if(!cur||b64u(cur)!==k.pub){try{await sub.unsubscribe()}catch{}sub=null}}
    if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:fromB64u(k.pub)});
    if(!sub||!sub.endpoint)throw new Error('nosub');
    const toks=await this.tokens(k.priv,new URL(sub.endpoint).origin);
    const r=await Sync.call({action:'push-reg',dev:ui.dev,name:ui.me,endpoint:sub.endpoint,pub:k.pub,tokens:toks,prefs:ui.push.prefs});
    if(!r||!r.ok)throw new Error(r&&r.err||'server');
    ui.push.on=true;ui.push.cov=toks[toks.length-1].e;persistNow();await saveSyncInfo();
  },
  async enable(){
    if(this.ios()&&!this.standalone())throw new Error('standalone');
    if(!this.supported())throw new Error('unsupported');
    const perm=await Notification.requestPermission();if(perm!=='granted')throw new Error('denied');
    await this.register();
  },
  async disable(){
    if(!ui.push.on)return;ui.push.on=false;persistNow();
    try{const reg=await navigator.serviceWorker.ready,s=await reg.pushManager.getSubscription();if(s)await s.unsubscribe()}catch{}
    try{if(SY.on)await Sync.call({action:'push-unreg',dev:ui.dev})}catch{}
  },
  async refresh(){if(!ui.push.on||!SY.on||!this.supported()||Notification.permission!=='granted')return;if(ui.push.cov-Date.now()/1000>20*86400)return;try{await this.register()}catch{}}
};
let ING={tok:'',res:null};
function ingResHtml(){const r=ING.res;if(!r)return '';
  if(r.skip)return `<p class="hint bad">ההודעה הזו לא תיקלט: ${esc(r.why||r.skip)}.</p>`;
  const p=r.p;return `<div class="status"><svg class="ic"><use href="#i-check"/></svg><div><b>${p.t==='inc'?'זיכוי':'חיוב'} של ${p.cur==='ILS'?'₪'+esc((+p.a).toLocaleString('he-IL',{maximumFractionDigits:2})):esc(p.a+' '+p.cur)+' (יומר לשקלים לפי שער בנק ישראל)'}</b><small>${esc([p.n||'בלי שם בית עסק',r.cat?'← '+r.cat:'',p.card?'כרטיס/חשבון '+p.card:'',p.d,p.inst].filter(Boolean).join(' · '))}</small></div></div>`}
function autoCard(){
  const old=SY.sv&&SY.sv<9;
  let body;
  if(old)body='<p class="hint bad">צריך קודם לעדכן את הסקריפט בגיליון (ההוראות למעלה).</p>';
  else if(!ING.tok)body='<div class="btnrow"><button class="btn solid sm" data-act="ing-get">הפעל וקבל מפתח לקיצור הדרך</button></div>';
  else body=`<label class="hint" style="display:block;margin:8px 0 4px">כתובת (URL)</label><textarea class="field code" readonly rows="2">${esc(SY.url)}</textarea>
<label class="hint" style="display:block;margin:8px 0 4px">מפתח (tok), מאפשר רק להוסיף תנועות</label><textarea class="field code" readonly rows="1">${esc(ING.tok)}</textarea>
<div class="btnrow"><button class="btn sm" data-act="ing-copy-url">העתק כתובת</button><button class="btn sm" data-act="ing-copy-tok">העתק מפתח</button><button class="btn danger sm" data-act="ing-rotate">החלף מפתח</button></div>
<h3 style="margin:16px 0 6px">אייפון: אוטומציה בקיצורים (פעם אחת, 3 דקות, iOS 17 ומעלה)</h3>
<p class="hint">שמות הכפתורים כתובים באנגלית, בעברית הם מתורגמים באופן דומה.</p>
<ol class="steps">
<li><div><b>אוטומציה חדשה</b><p>אפליקציית Shortcuts ‏(קיצורים) ← <kbd>Automation</kbd> ← <kbd>+</kbd> ← <kbd>Message</kbd> (הודעה).</p></div></li>
<li><div><b>מתי להפעיל</b><p>ב־<kbd>Message Contains</kbd> כותבים את 4 הספרות האחרונות של הכרטיס (למשל 1234), כדי שרק הודעות על הכרטיס שלך יפעילו את זה. בוחרים <kbd>Run Immediately</kbd> ומכבים <kbd>Notify When Run</kbd>. לכל כרטיס ולכל חשבון בנק עושים אוטומציה נפרדת.</p></div></li>
<li><div><b>הפעולה</b><p><kbd>New Blank Automation</kbd> ← מוסיפים <kbd>Get Contents of URL</kbd> ומדביקים בו את הכתובת. פותחים את החץ: <kbd>Method</kbd> = POST, <kbd>Request Body</kbd> = JSON, ומוסיפים 3 שדות מסוג Text:<br><kbd>action</kbd> = ingest<br><kbd>tok</kbd> = המפתח<br><kbd>text</kbd> = המשתנה <kbd>Shortcut Input</kbd>, ולוחצים עליו כדי לבחור <kbd>Content</kbd>.</p></div></li>
<li><div><b>זהו</b><p>בקנייה הבאה תגיע התראה תוך כמה שניות, והתנועה תופיע כאן ובגיליון. כדי לבדוק עכשיו, בקש ממישהו לשלוח לך SMS כמו "עסקה בסך 1 ש&quot;ח ב-בדיקה בכרטיס 1234", ואז מחק את תנועת הבדיקה.</p></div></li>
</ol>
<h3 style="margin:16px 0 6px">אנדרואיד: MacroDroid (חינם)</h3>
<p class="hint">טריגר <kbd>SMS Received</kbd> (תוכן מכיל את 4 הספרות), או <kbd>Notification Received</kbd> מאפליקציית מקס/כאל/ישראכרט. פעולה <kbd>HTTP Request</kbd>: POST לכתובת, Content type ‏application/json, וגוף הבקשה:</p>
<div class="btnrow"><button class="btn sm" data-act="ing-copy-and">העתק גוף בקשה</button></div>
<p class="hint">בטריגר של התראה מחליפים את [sms_message] ב־[notification].</p>
<h3 style="margin:16px 0 6px">בדיקה בלי טלפון</h3>
<p class="hint">הדבק הודעה אמיתית שקיבלת מהבנק או מחברת האשראי, ותראה איך היא תיקלט. שום דבר לא נשמר.</p>
<textarea class="field" id="ingTest" rows="3" placeholder="מקס: בכרטיסך המסתיים ב-1234 אושרה עסקה בסך 45.90 ש&quot;ח בשופרסל"></textarea>
<div class="btnrow"><button class="btn sm" data-act="ing-test">בדוק</button></div>${ingResHtml()}`;
  return `<div class="card" id="autoCard"><h2><svg class="ic" style="vertical-align:-4px"><use href="#i-bell"/></svg> חיובים נכנסים לבד</h2>
<p class="hint">בלי לחבר את החשבון ובלי סיסמאות: כל SMS שמגיע מחברת האשראי או מהבנק נשלח לגיליון שלכם, נקלט עם סכום, בית עסק וקטגוריה, וכולם מקבלים התראה. קודי אימות לא נשמרים. החיוב החודשי של הכרטיס בחשבון הבנק מדולג כדי שלא ייספר פעמיים. כל הודעה נרשמת בלשונית "הודעות בנק" בגיליון, כולל מה שדולג. הקטגוריה נקבעת לפי מה שהאפליקציה למדה מהתיקונים שלך.</p>
<p class="hint">צריך שהשירות יהיה פעיל: בכאל, מקס וישראכרט מפעילים התראות SMS על עסקאות באפליקציה או באתר, ובבנק מפעילים הודעות SMS על פעולות בחשבון (בחלק מהבנקים בתשלום). באייפון חייבים SMS, כי קיצורים לא רואים התראות של אפליקציות אחרות.</p>
${body}</div>`;
}
function pushCard(){
  const old=SY.sv&&SY.sv<8,p=ui.push.prefs,perm=typeof Notification!=='undefined'?Notification.permission:'default',on=ui.push.on&&perm==='granted';
  const iosNo=PUSH.ios()&&!PUSH.standalone();
  const box=(k,l)=>`<label class="chk"><input type="checkbox" data-pp="${k}"${p[k]?' checked':''}>${l}</label>`;
  let action;
  if(old)action='<p class="hint bad">צריך קודם לעדכן את הסקריפט בגיליון (ההוראות למעלה).</p>';
  else if(iosNo)action='<p class="hint">באייפון התראות עובדות רק כשהאפליקציה מותקנת במסך הבית: ב־Safari, כפתור השיתוף ← "הוסף למסך הבית". אחר כך פותחים מהאייקון ומפעילים כאן.</p>';
  else if(!PUSH.supported())action='<p class="hint">הדפדפן הזה לא תומך בהתראות. באייפון צריך iOS 16.4 ומעלה.</p>';
  else if(perm==='denied')action='<p class="hint bad">ההתראות חסומות במכשיר. אפשר לאשר מחדש בהגדרות הטלפון ← התראות ← הכסף שלי.</p>';
  else action=on?'<p class="okt" style="margin:4px 0 0">פעילות במכשיר הזה</p><div class="btnrow"><button class="btn sm" data-act="push-test">שלח התראת בדיקה</button><button class="btn danger sm" data-act="push-off">כבה את כל ההתראות</button></div>':'<div class="btnrow"><button class="btn solid sm" data-act="push-on">הפעל התראות במכשיר הזה</button></div>';
  return `<div class="card" id="pushCard"><h2><svg class="ic" style="vertical-align:-4px"><use href="#i-bell"/></svg> התראות בטלפון</h2>
<p class="hint">התראות גם כשהאפליקציה סגורה. כל אחד בוחר אצלו מה לקבל, ואפשר לשנות או לכבות כאן בכל רגע.</p>
${box('tx','כשהשותף מוסיף הוצאה או הכנסה')}${box('msg','הודעה חדשה')}${box('budget','קטגוריה מתקרבת לתקציב או חורגת ממנו')}${box('rec','הוצאה או הכנסה קבועה נכנסה')}${box('bank','חיוב או זיכוי שנקלט אוטומטית מהבנק או מהאשראי')}
<p class="err" id="pErr"></p>${action}</div>`;
}
document.addEventListener('change',async e=>{const k=e.target.dataset&&e.target.dataset.pp;if(!k)return;ui.push.prefs[k]=e.target.checked;persistNow();
  if(ui.push.on&&SY.on){try{const r=await Sync.call({action:'push-prefs',dev:ui.dev,prefs:ui.push.prefs});toast(r.ok?'ההעדפות נשמרו':'לא הצלחתי לשמור, נסה שוב')}catch(err){toast(errText(err))}}});

/* ---------- sync screen: script updates, Siri, widget, partner ---------- */
const GSV=13;let LD='';
async function loadLD(){for(const u of ['https://raw.githubusercontent.com/enoshc/kesef/main/loader.gs?t=','loader.gs?t=']){try{const r=await fetch(u+Date.now(),{cache:'no-store'});if(r.ok){const t=await r.text();if(/KESEF_AUTO/.test(t)){LD=t;return t}}}catch{}}return LD}
const STEPS=(btn)=>`<ol class="steps"><li><div><b>פותחים את עורך הסקריפטים</b><p>בגיליון: <kbd>Extensions</kbd> ← <kbd>Apps Script</kbd>.</p></div></li>
<li><div><b>מחליפים את הקוד</b><p>מוחקים את כל הקוד הישן, מדביקים את החדש ושומרים.</p>${btn}</div></li>
<li><div><b>מאשרים הרשאות</b><p>למעלה בעורך, בתפריט שליד <kbd>Debug</kbd> בוחרים את הפונקציה <kbd>authorize</kbd> ולוחצים <kbd>Run</kbd>. מאשרים כמו בפעם הראשונה.</p></div></li>
<li><div><b>מפרסמים גרסה חדשה</b><p><kbd>Deploy</kbd> ← <kbd>Manage deployments</kbd> ← סמל העיפרון ← ב־<kbd>Version</kbd> בוחרים <kbd>New version</kbd> ← <kbd>Deploy</kbd>. הכתובת לא משתנה ואין צורך לחבר מחדש.</p></div></li></ol>`;
function updCard(){
  if(SY.ro)return '';
  if(SY.auto)return `<div class="card"><h2>עדכונים אוטומטיים לסקריפט</h2><p class="hint">הסקריפט בגיליון מושך לבד את הגרסה העדכנית מ־GitHub, פעם בשעה (עכשיו גרסה ${SY.sv||''}). אין צורך להעתיק קוד בכל עדכון.</p><div class="btnrow"><button class="btn sm" data-act="gs-reload">משוך עכשיו את הגרסה האחרונה</button></div></div>`;
  if(!(SY.sv&&SY.sv<GSV))return '';
  const what=[SY.sv<3?'תמונות והודעות':'',SY.sv<5?'הערות ותגיות':'',SY.sv<7?'סיכום במייל':'',SY.sv<8?'התראות בטלפון':'',SY.sv<9?'קליטה אוטומטית של חיובים מההודעות':'','זיכויים שמקטינים את ההוצאה, העברות בין החשבונות שלך, תיבת "לבדיקה", הוספה בקול עם סירי, וידג׳ט למסך הבית, שותף לצפייה בלבד ועדכונים אוטומטיים'].filter(Boolean).join(', ');
  const auto=ui.gsMode!=='full';
  return `<div class="card"><h2>עדכון הסקריפט בגיליון</h2><p class="hint">יש גרסה חדשה, עם ${what}. עד שתעדכן, חלק מהדברים נשמרים רק במכשיר. מעדכנים פעם אחת, ממכשיר אחד.</p>
<div class="seg full" id="gsMode" style="margin-bottom:10px"><button type="button" data-v="auto" aria-pressed="${auto}">עדכונים אוטומטיים מעכשיו</button><button type="button" data-v="full" aria-pressed="${!auto}">רק הפעם</button></div>
${auto?`<p class="hint">מדביקים קוד קצר אחד, ומשם הסקריפט מתעדכן לבד מ־GitHub. זו הפעם האחרונה שצריך להעתיק קוד.</p><p class="hint"><b>חשוב לדעת:</b> מי שיכול לשנות את הקוד במאגר (enoshc/kesef) יכול להריץ קוד בחשבון הגוגל שלך עם אותן הרשאות שנתת לסקריפט: הגיליון, תיקיית הקבלות ושליחת מיילים. בחר בזה רק אם אתה סומך על מי שמנהל את המאגר. אפשר לחזור לקוד המלא בכל רגע.</p>${STEPS('<button class="btn solid sm" data-act="copy-loader">העתק את קוד הטעינה</button>')}`
:`<p class="hint">הקוד המלא, כמו עד היום. בעדכון הבא תצטרך להעתיק שוב.</p>${STEPS('<button class="btn solid sm" data-act="copy-gs">העתק את הקוד החדש</button>')}`}
<button class="btn sm" data-act="sync-now">בדוק שוב</button></div>`}
function siriCard(){
  const old=SY.sv&&SY.sv<GSV;
  return `<div class="card"><h2><svg class="ic" style="vertical-align:-4px"><use href="#i-mic"/></svg> הוספה בקול עם סירי</h2>
<p class="hint">אומרים "היי סירי, הוסף הוצאה", ואז למשל "50 שקל קפה" או "הכנסה 3000 צילום חתונה". התנועה נכנסת לגיליון עם קטגוריה לפי מה שהאפליקציה למדה, ומופיעה ב"לבדיקה". "זיכוי 80 זארה" נרשם כזיכוי.</p>
${old?'<p class="hint bad">צריך קודם לעדכן את הסקריפט בגיליון (למעלה).</p>':!ING.tok?'<div class="btnrow"><button class="btn solid sm" data-act="ing-get">הפעל וקבל מפתח</button></div>':`<ol class="steps">
<li><div><b>קיצור חדש</b><p>אפליקציית Shortcuts ‏(קיצורים) ← <kbd>+</kbd>. שם הקיצור הוא מה שאומרים לסירי, למשל <kbd>הוסף הוצאה</kbd>.</p></div></li>
<li><div><b>הכתבה</b><p>מוסיפים <kbd>Dictate Text</kbd> ‏(הכתב טקסט), שפה עברית.</p></div></li>
<li><div><b>שליחה</b><p>מוסיפים <kbd>Get Contents of URL</kbd>, מדביקים את הכתובת, <kbd>Method</kbd> = POST, <kbd>Request Body</kbd> = JSON, ו־3 שדות Text:<br><kbd>action</kbd> = quick<br><kbd>tok</kbd> = המפתח<br><kbd>text</kbd> = <kbd>Dictated Text</kbd></p><div class="btnrow"><button class="btn sm" data-act="ing-copy-url">העתק כתובת</button><button class="btn sm" data-act="ing-copy-tok">העתק מפתח</button></div></div></li>
<li><div><b>תשובה בקול</b><p>מוסיפים <kbd>Get Dictionary Value</kbd> עם המפתח <kbd>say</kbd>, ואחריו <kbd>Speak Text</kbd> ‏(הקרא טקסט). סירי תגיד מה נרשם.</p></div></li></ol>`}</div>`}
let WT={tok:''};
function widgetCode(){const u=SY.url+'?w='+WT.tok;return `// הכסף שלי: וידג'ט למסך הבית (Scriptable)
const URL_ = ${JSON.stringify(u)};
const APP = ${JSON.stringify(APP_URL)};
const fmt = n => (n < 0 ? "−" : "") + "₪" + Math.round(Math.abs(n)).toLocaleString("he-IL");
let d = null;
try { d = await new Request(URL_).loadJSON(); } catch (e) {}
const w = new ListWidget();
w.backgroundColor = new Color("#00a862");
w.url = APP;
w.setPadding(14, 14, 14, 14);
const ink = new Color("#0b0b10");
const line = (t, f) => { const x = w.addText(t); x.font = f; x.textColor = ink; x.rightAlignText(); x.minimumScaleFactor = 0.6; return x; };
if (!d || !d.ok) {
  line("הכסף שלי", Font.boldSystemFont(15));
  line("אין חיבור לגיליון", Font.systemFont(12));
} else {
  line(d.name + " · " + d.month, Font.mediumSystemFont(12));
  w.addSpacer(6);
  line(d.left >= 0 ? "נשארו " + fmt(d.left) : "חריגה של " + fmt(-d.left), Font.boldSystemFont(24));
  w.addSpacer(4);
  line("הוצאות " + fmt(d.spend) + " · הכנסות " + fmt(d.inc), Font.systemFont(11));
  if (config.widgetFamily !== "small") {
    w.addSpacer(6);
    for (const c of (d.cats || []).slice(0, 3)) line(c.name + ": " + fmt(c.s) + (c.b ? " מתוך " + fmt(c.b) : ""), Font.systemFont(11));
  }
  if (d.review) { w.addSpacer(4); line(d.review + " לבדיקה", Font.mediumSystemFont(11)); }
  w.addSpacer();
  line("עודכן " + new Date(d.ts).toLocaleTimeString("he-IL", {hour: "2-digit", minute: "2-digit"}), Font.systemFont(9));
}
w.refreshAfterDate = new Date(Date.now() + 30 * 60 * 1000);
if (config.runsInWidget) Script.setWidget(w); else await w.presentMedium();
Script.complete();`}
function widgetCard(){
  const old=SY.sv&&SY.sv<GSV;
  return `<div class="card"><h2>וידג׳ט למסך הבית</h2><p class="hint">"נשארו לך X" על מסך הבית, מתעדכן לבד כל חצי שעה. באייפון זה עובד עם האפליקציה החינמית Scriptable, כי אפליקציית ווב לא יכולה להוסיף וידג׳ט בעצמה.</p>
${old?'<p class="hint bad">צריך קודם לעדכן את הסקריפט בגיליון (למעלה).</p>':!WT.tok?'<div class="btnrow"><button class="btn solid sm" data-act="wt-get">צור קוד לוידג׳ט</button></div>':`<ol class="steps">
<li><div><b>מתקינים Scriptable</b><p>מה־App Store, חינם.</p></div></li>
<li><div><b>סקריפט חדש</b><p>ב־Scriptable לוחצים <kbd>+</kbd>, מדביקים את הקוד ומשנים את השם ל"הכסף שלי".</p><div class="btnrow"><button class="btn solid sm" data-act="wt-copy">העתק את הקוד</button></div></div></li>
<li><div><b>מוסיפים למסך הבית</b><p>לחיצה ארוכה על מסך הבית ← <kbd>+</kbd> ← Scriptable ← בוחרים גודל ← לחיצה על הוידג׳ט ← <kbd>Script</kbd>: הכסף שלי.</p></div></li></ol>
<p class="hint">הקוד כולל מפתח שמאפשר רק לקרוא את סיכום החודש, בלי פרטי תנועות. אם הוא הגיע למישהו אחר, החלף אותו.</p><div class="btnrow"><button class="btn danger sm" data-act="wt-rotate">החלף מפתח</button></div>`}</div>`}
const joinUrl=ro=>APP_URL+'#join='+inviteCode(ro);
function partnerCard(){
  const ro=INV.mode==='ro',old=SY.sv&&SY.sv<GSV,code=ro?(INV.vkey?inviteCode(true):''):inviteCode(false);
  return `<div class="card"><h2>הוספת שותף</h2><p class="hint">שולחים קוד או קישור למי שמנהל איתך את החשבון. ${ro?'עם קוד לצפייה בלבד רואים הכול, אבל לא יכולים להוסיף או לשנות. מתאים להורים, לרואה חשבון או למי שרק רוצה לעקוב.':'מי שיש לו את הקוד יכול לראות ולשנות את הנתונים, אז שלח אותו רק למי שאתה סומך עליו.'}</p>
<div class="seg full" id="invMode" style="margin-bottom:10px"><button type="button" data-v="full" aria-pressed="${!ro}">יכול לערוך</button><button type="button" data-v="ro" aria-pressed="${ro}">צפייה בלבד</button></div>
${ro&&old?'<p class="hint bad">צפייה בלבד דורשת לעדכן קודם את הסקריפט בגיליון (למעלה).</p>':ro&&!INV.vkey?'<div class="btnrow"><button class="btn solid sm" data-act="vk-get">צור קוד לצפייה</button></div>':`<textarea class="field code" readonly rows="3" id="invTxt">${esc(code)}</textarea>
<div class="btnrow"><button class="btn solid" data-act="share-code">שלח</button><button class="btn" data-act="copy-code">העתק קוד</button><button class="btn" data-act="inv-qr">${INV.qr?'הסתר':'הצג'} קוד QR</button>${ro?'<button class="btn danger sm" data-act="vk-rotate">בטל קודים קודמים</button>':''}</div>
${INV.qr?`<div class="qrbox" id="qrBox" aria-label="קוד QR להצטרפות"></div><p class="hint" style="text-align:center">סורקים במצלמה של הטלפון השני. באייפון: אם האפליקציה כבר במסך הבית, הקוד יועתק ומדביקים אותו בה.</p>`:''}`}</div>`}
async function drawQR(){const box=$('#qrBox');if(!box)return;try{if(!window.qrcode)await new Promise((res,rej)=>{const s=document.createElement('script');s.src='qrcode.js';s.onload=res;s.onerror=rej;document.head.appendChild(s)});
  const q=qrcode(0,'L');q.addData(joinUrl(INV.mode==='ro'));q.make();box.innerHTML=q.createSvgTag({cellSize:6,margin:3,scalable:true})}catch{box.textContent='לא הצלחתי ליצור קוד QR. שלח את הקוד בהודעה.'}}
Object.assign(ACT,{
  'copy-loader':async()=>{await loadLD();if(!LD){toast('הקוד עוד לא נטען, בדוק חיבור לאינטרנט ונסה שוב');return}copyText(LD,'קוד הטעינה הועתק. הדבק אותו בעורך של Apps Script במקום כל הקוד','קוד הטעינה')},
  'gs-reload':async b=>{b.disabled=true;try{const r=await Sync.call({action:'reload'});toast(r.ok?'הסקריפט ימשוך את הגרסה האחרונה בבקשה הבאה':errText(new Error(r.err)));Sync.run()}catch(e){toast(errText(e))}b.disabled=false},
  'wt-get':async b=>{b.disabled=true;try{const r=await Sync.call({action:'widget-token'});if(!r.ok)throw new Error(r.err||'err');WT.tok=r.tok;renderSync()}catch(e){toast(errText(e));b.disabled=false}},
  'wt-rotate':async()=>{if(!(await ask('להחליף את מפתח הוידג׳ט?','הוידג׳ט הנוכחי יפסיק להתעדכן עד שתדביק את הקוד החדש ב־Scriptable.','החלף')))return;try{const r=await Sync.call({action:'widget-token',rotate:1});if(!r.ok)throw new Error(r.err||'err');WT.tok=r.tok;renderSync();toast('נוצר מפתח חדש. העתק שוב את הקוד')}catch(e){toast(errText(e))}},
  'wt-copy':()=>copyText(widgetCode(),'הקוד הועתק. הדבק אותו ב־Scriptable','קוד לוידג׳ט'),
  'vk-get':async b=>{b.disabled=true;try{const r=await Sync.call({action:'view-key'});if(!r.ok)throw new Error(r.err||'err');INV.vkey=r.tok;renderSync()}catch(e){toast(errText(e));b.disabled=false}},
  'vk-rotate':async()=>{if(!(await ask('לבטל את הקודים לצפייה?','כל מי שהצטרף עם קוד לצפייה יתנתק, ויהיה צריך לשלוח לו קוד חדש.','בטל קודים',true)))return;try{const r=await Sync.call({action:'view-key',rotate:1});if(!r.ok)throw new Error(r.err||'err');INV.vkey=r.tok;renderSync();toast('נוצר קוד חדש לצפייה. הקודמים לא עובדים יותר')}catch(e){toast(errText(e))}},
  'inv-qr':()=>{INV.qr=!INV.qr;renderSync();if(INV.qr)drawQR()}
});
$('#syncBody').addEventListener('click',e=>{const g=e.target.closest('#gsMode button');if(g){ui.gsMode=g.dataset.v;renderSync();return}
  const m=e.target.closest('#invMode button');if(m){INV.mode=m.dataset.v;renderSync();if(INV.qr)drawQR()}});
function takeJoinHash(){const m=location.hash.match(/^#join=(KSF1\.[A-Za-z0-9_-]+)/);if(!m)return false;try{sessionStorage.setItem('kesef-join',m[1])}catch{}history.replaceState(null,'',location.pathname+'#sync');return true}

/* ---------- subscriptions, trips, split ---------- */
const SUBRX=/apple\.com|itunes|icloud|google one|google \*|google play|youtube|netflix|spotify|disney|adobe|microsoft|msft|office ?365|xbox|playstation|claude|anthropic|openai|chatgpt|midjourney|runway|canva|dropbox|notion|figma|wix|godaddy|squarespace|amazon prime|prime video|audible|deezer|tidal|duolingo|patreon|envato|shutterstock|capcut|elevenlabs|descript|grammarly|1password|nordvpn|expressvpn|proton|linkedin|medium|substack|github|vercel|zoom|slack|discord|twitch|יס פלוס|yes|סלקום tv|פרטנר tv|nextv|סטינג|nexttv|פרטנר טי וי/i;
function subs(){
  const since=ymd(new Date(T0.getFullYear(),T0.getMonth()-13,1)),no=new Set(S.ex.nosub),g=new Map();
  TX().filter(t=>t.d>=since&&t.t==='exp'&&kd(t)==='exp'&&t.a<2000&&!instOf(t)).forEach(t=>{const k=mkey(t.n);if(!k||no.has(k))return;(g.get(k)||g.set(k,[]).get(k)).push(t)});
  const out=[];
  g.forEach((l,k)=>{l.sort((a,b)=>a.d<b.d?-1:1);const known=SUBRX.test(l[0].n),standing=!known&&l.some(t=>/הוראת קבע|מנוי/.test(t.note||''));
    const cl=[];if(standing)cl.push({a:l[l.length-1].a,l});else l.forEach(t=>{const c=cl.find(c=>Math.abs(t.a-c.a)<=Math.max(1,c.a*.12));if(c){c.l.push(t);c.a=t.a}else cl.push({a:t.a,l:[t]})});
    cl.forEach(c=>{const L=c.l,ms=[...new Set(L.map(t=>t.d.slice(0,7)))],last=L[L.length-1],age=dayDiff(last.d,todayStr);
      const gaps=L.slice(1).map((t,i)=>dayDiff(L[i].d,t.d)),monthly=ms.length>=2&&gaps.length&&gaps.filter(x=>x>=20&&x<=40).length>=gaps.length*.7,yearly=L.length>=2&&gaps.every(x=>x>=330&&x<=400);
      const perMonth=L.length/ms.length;
      if(!(known&&(monthly||yearly||L.length===1&&age<=40)||(standing&&monthly&&ms.length>=2&&perMonth<=1.3)||(!known&&!standing&&monthly&&ms.length>=3&&perMonth<=1.2)))return;
      const active=yearly?age<=400:age<=45;if(!active)return;
      const prev=L.length>1?L[L.length-2].a:null,chg=!standing&&prev&&Math.abs(last.a-prev)>=1&&Math.abs(last.a-prev)/prev>=.03?last.a-prev:0;
      out.push({k,n:last.n,a:last.a,last:last.d,first:L[0].d,cnt:L.length,yearly,monthly:yearly?last.a/12:last.a,isNew:!standing&&dayDiff(L[0].d,todayStr)<=40,chg,prev,c:last.c,known,standing})})});
  return out.sort((a,b)=>b.monthly-a.monthly)}
const CC={TH:'תאילנד',VN:'וייטנאם',LK:'סרי לנקה',GE:'גאורגיה',LA:'לאוס',KH:'קמבודיה',NP:'נפאל',IN:'הודו',JP:'יפן',GB:'אנגליה',FR:'צרפת',IT:'איטליה',ES:'ספרד',DE:'גרמניה',NL:'הולנד',GR:'יוון',CY:'קפריסין',BG:'בולגריה',RO:'רומניה',HU:'הונגריה',CZ:'צ׳כיה',AT:'אוסטריה',PT:'פורטוגל',US:'ארה״ב',TR:'טורקיה',AE:'איחוד האמירויות',EG:'מצרים',JO:'ירדן',MA:'מרוקו',PL:'פולין',HR:'קרואטיה',ME:'מונטנגרו',AL:'אלבניה',RS:'סרביה',SG:'סינגפור',MY:'מלזיה',ID:'אינדונזיה',PH:'הפיליפינים',CN:'סין',KR:'דרום קוריאה',CH:'שווייץ',BE:'בלגיה',DK:'דנמרק',SE:'שוודיה',NO:'נורווגיה',IS:'איסלנד',MX:'מקסיקו',BR:'ברזיל',AR:'ארגנטינה',PE:'פרו',CO:'קולומביה',TZ:'טנזניה',KE:'קניה',ZA:'דרום אפריקה',MV:'המלדיביים',UZ:'אוזבקיסטן',AM:'ארמניה',AZ:'אזרבייג׳ן',CA:'קנדה',AU:'אוסטרליה',NZ:'ניו זילנד',SI:'סלובניה',SK:'סלובקיה',MT:'מלטה',LV:'לטביה',LT:'ליטא',EE:'אסטוניה',FI:'פינלנד',IE:'אירלנד'};
const ONLINE=/aliexpress|amazon|google|apple|paypal|microsoft|adobe|netflix|spotify|claude|anthropic|openai|temu|shein|ebay|etsy|booking|airbnb|agoda|trip\.com|expedia|ryanair|wizz|easyjet|airalo|airgsm|holafly|udemy|coursera|steam|patreon|canva|zoom|dropbox|wix|godaddy|namecheap|facebook|meta|instagram|tiktok|linkedin|github|vercel|runway|midjourney|bolt\.eu|uber|12go|2c2p|klook|getyourguide|viator|hostelworld|skyscanner|kiwi\.com|budgetair|travix|ivisa|evisa/i;
const TRAVELRX=/טיול|חופש|תיירות|טיסות|נסיעות/;
function abroadCC(t){if(t.x?.cc)return t.x.cc;const m=String(t.n||'').match(/\s([A-Z]{2})\s*$/);if(m&&m[1]!=='IL'&&CC[m[1]]&&!ONLINE.test(t.n))return m[1];if(t.x?.ab)return '??';return ''}
function trips(){
  const ab=TX().filter(t=>t.t==='exp'&&kd(t)!=='int'&&abroadCC(t)).sort((a,b)=>a.d<b.d?-1:1),out=[];let cur=null;
  ab.forEach(t=>{if(cur&&dayDiff(cur.to,t.d)<=10){cur.to=t.d;cur.l.push(t)}else{cur={from:t.d,to:t.d,l:[t]};out.push(cur)}});
  return out.filter(r=>r.l.length>=3&&new Set(r.l.map(t=>t.d)).size>=2).map(r=>{
    const cc=new Map();r.l.forEach(t=>{const c=abroadCC(t);if(c&&c!=='??')cc.set(c,(cc.get(c)||0)+1)});
    const pre=ymd(new Date(+r.from.slice(0,4),+r.from.slice(5,7)-1,+r.from.slice(8)-75));
    const inR=TX().filter(t=>kd(t)==='exp'&&((t.d>=r.from&&t.d<=r.to&&(abroadCC(t)||ONLINE.test(t.n)&&/\s[A-Z]{2}\s*$/.test(t.n)||TRAVELRX.test(cat(t.c)?.name||'')||t.x?.cur))||(t.d>=pre&&t.d<r.from&&TRAVELRX.test(cat(t.c)?.name||''))));
    const names=[...cc].sort((a,b)=>b[1]-a[1]).map(x=>CC[x[0]]);const yr=r.from.slice(0,4);
    const tag=('טיול '+(names.slice(0,2).join(' ')||'לחו״ל')+' '+yr).slice(0,30);
    const tagged=inR.length&&inR.every(t=>(t.tags||[]).some(g=>/טיול|trip/i.test(g)));
    return {...r,names,cost:sumBy(inR,expA),n:inR.length,ids:inR.map(t=>t.id),days:dayDiff(r.from,r.to)+1,tag,tagged}}).reverse()}
function owed(){const m=new Map();TX().forEach(t=>(t.x?.sp||[]).forEach((p,i)=>{if(p.ok)return;const o=m.get(p.n)||{n:p.n,a:0,l:[]};o.a+=p.a;o.l.push({t,i,p});m.set(p.n,o)}));return [...m.values()].sort((a,b)=>b.a-a.a)}
function repayCands(p,t){return TX().filter(x=>x.t==='inc'&&!x.x?.lk&&Math.abs(x.a-p.a)<.01&&x.d>=t.d&&dayDiff(t.d,x.d)<=90).slice(0,3)}
function extraCards(){
  const sb=subs(),tot=sumBy(sb,s=>s.monthly),tr=trips(),ow=owed(),dd=d=>d.split('-').reverse().join('/');
  return `<div class="card"><div class="ch"><h2>מנויים</h2><b>${esc(fmt(tot))} בחודש</b></div>
<p class="hint">חיובים שחוזרים כל חודש או כל שנה. ${sb.filter(s=>s.isNew).length?'<b>חדש</b> מסומן כשמנוי הופיע בחודש האחרון. ':''}אפשר להסיר מהרשימה מה שאינו מנוי.</p>
${sb.length?sb.map(s=>`<div class="trow" data-sub="${esc(s.k)}"><span>${esc(s.n.slice(0,36))}${s.isNew?' <span class="bdg rv">חדש</span>':''}${s.chg?` <span class="bdg ${s.chg>0?'up':'ok'}">${s.chg>0?'התייקר':'הוזל'} מ־${esc(fmt(s.prev))}</span>`:''}<small>${s.yearly?'שנתי, ':s.standing?'הוראת קבע, ':''}${s.cnt} חיובים מאז ${esc(dd(s.first))}, אחרון ${esc(dd(s.last))}</small></span><span class="subr"><b>${esc(fmt(s.a))}</b><button class="icon" data-nosub aria-label="זה לא מנוי"><svg class="ic"><use href="#i-x"/></svg></button></span></div>`).join(''):'<p class="hint" style="margin:0">לא זוהו מנויים. הם מופיעים אחרי חיוב או שניים.</p>'}
${S.ex.nosub.length?`<button class="btn sm" data-act="sub-reset" style="margin-top:10px">החזר ${S.ex.nosub.length} שהוסרו</button>`:''}</div>
<div class="card"><h2>טיולים</h2><p class="hint">זוהו לפי עסקאות בחו״ל שקרובות בזמן. העלות כוללת את מה שהוצאתם בחו״ל ואת הטיסות, הלינה והביטוח בחודשיים שלפני.</p>
${tr.length?tr.map((r,i)=>`<div class="trow"><span><b>${esc(r.names.join(', ')||'חו״ל')}</b><small>${esc(dd(r.from))} עד ${esc(dd(r.to))}, ${r.days} ימים, ${r.n} תנועות</small></span><span class="subr"><b>${esc(fmt(r.cost))}</b>${r.tagged?'':`<button class="btn sm" data-trip="${i}">תייג</button>`}</span></div>`).join(''):'<p class="hint" style="margin:0">לא נמצאו טיולים. הם מזוהים לפי עסקאות בחו״ל בפירוט האשראי.</p>'}</div>
<div class="card span2"><div class="ch"><h2>מי חייב לי</h2><b>${esc(fmt(sumBy(ow,o=>o.a)))}</b></div><p class="hint">מהוצאות שחילקת עם חברים. כשמישהו מחזיר, לוחצים "קשר" ליד ההעברה, וההוצאה בקטגוריה קטנה בהתאם.</p>
${ow.length?ow.map(o=>`<div class="owp"><div class="trow"><span><b>${esc(o.n)}</b><small>${o.l.length} הוצאות</small></span><b>${esc(fmt(o.a))}</b></div>${o.l.map(({t,i,p})=>{const c=repayCands(p,t);return `<div class="owi"><button class="lnk2" data-open="${esc(t.id)}">${esc(t.n||cat(t.c)?.name||'')}, ${esc(dd(t.d))}: ${esc(fmt(p.a))}</button>${c.map(x=>`<button class="btn sm green" data-repay="${esc(x.id)}" data-ex="${esc(t.id)}" data-i="${i}">קשר להעברה של ${esc(fmt(x.a))} מ־${esc(dd(x.d))}${x.n?' ('+esc(x.n.slice(0,20))+')':''}</button>`).join('')}<button class="btn sm" data-paid="${esc(t.id)}" data-i="${i}">החזיר במזומן</button></div>`}).join('')}</div>`).join(''):'<p class="hint" style="margin:0">אין חובות פתוחים. כשמוסיפים הוצאה, פותחים "חלוקה עם חברים" ומוסיפים מי חייב כמה.</p>'}</div>`}
document.addEventListener('click',e=>{
  const ns=e.target.closest('[data-nosub]');if(ns){const k=ns.closest('[data-sub]').dataset.sub;change(()=>{S.ex.nosub=[...S.ex.nosub,k].slice(-80)},{cfg:true});toast('הוסר מרשימת המנויים',true);return}
  const tp=e.target.closest('[data-trip]');if(tp){const r=trips()[+tp.dataset.trip];if(!r)return;change(()=>r.ids.forEach(id=>{const t=S.tx.find(x=>x.id===id);t.tags=normTags([...(t.tags||[]),r.tag])}),{tx:r.ids});toast(`${r.ids.length} תנועות תויגו #${r.tag}`,true);return}
  const rp=e.target.closest('[data-repay]');if(rp){linkRepay(rp.dataset.repay,rp.dataset.ex,+rp.dataset.i);return}
  const pd=e.target.closest('[data-paid]');if(pd){const id=pd.dataset.paid,i=+pd.dataset.i;change(()=>{const t=S.tx.find(x=>x.id===id);if(t?.x?.sp?.[i])t.x.sp[i].ok=1},{tx:[id]});toast('סומן שהחזיר',true)}
});
ACT['sub-reset']=()=>{change(()=>{S.ex.nosub=[]},{cfg:true})};

/* ---------- bank balance, card bill, installments ---------- */
const BDRX=/חויב\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/,INRX=/תשלום (\d+) מתוך (\d+)/;
const flow=t=>t.t==='inc'?t.a:-t.a;
const ymd=dt=>`${dt.getFullYear()}-${p2(dt.getMonth()+1)}-${p2(dt.getDate())}`;
const ddm=d=>d.slice(8)+'/'+d.slice(5,7);
function acct(t){const x=t.x||{};if(x.ac)return x.ac;const tg=t.tags||[];if(tg.includes('max')||tg.includes('כרטיס')||BDRX.test(t.note||''))return 'card';if(tg.includes('pepper')||tg.includes('בנק'))return 'bank';return ''}
function billDate(t){const x=t.x||{};if(x.bd)return x.bd;const m=String(t.note||'').match(BDRX);if(m){const v=okDate(m[3],m[2],m[1]);if(v)return v}
  const [y,mo,d]=t.d.split('-').map(Number);return ymd(new Date(y,mo-1+(d>S.ex.cut?1:0),S.ex.bill))}
const billKey=bd=>Math.abs(+bd.slice(8)-S.ex.bill)<=4?bd.slice(0,7):'';
function nextBillYm(){return T0.getDate()>=S.ex.bill?shiftYm(nowYm,1):nowYm}
const billDay=ym=>`${ym}-${p2(S.ex.bill)}`;
function instOf(t){if(t.x?.in)return t.x.in;const r=String(t.note||'').match(INRX);return r?{i:+r[1],n:+r[2]}:null}
function installs(){const m=new Map();TX().forEach(t=>{if(acct(t)!=='card'||t.t!=='exp')return;const q=instOf(t);if(!q||q.n<2)return;const k=mkey(t.n)+'|'+q.n+'|'+Math.round(t.a);const o=m.get(k);if(!o||q.i>o.i)m.set(k,{t,i:q.i,n:q.n})});
  const out=[];m.forEach(({t,i,n})=>{const bd=billDate(t),bk=billKey(bd)||bd.slice(0,7);for(let j=1;j<=n-i;j++)out.push({ym:shiftYm(bk,j),a:t.a,n:t.n||'',k:`${i+j} מתוך ${n}`})});return out}
function cardBill(ym){const l=TX().filter(t=>acct(t)==='card'&&billKey(billDate(t))===ym),fut=installs().filter(x=>x.ym===ym);
  return {ym,d:billDay(ym),a:-sumBy(l,flow)+sumBy(fut,x=>x.a),n:l.length,l,fut}}
function balAt(D){const b=S.ex.bal;if(!b)return null;let v=b.v,n=0,un=0;
  TX().forEach(t=>{const ac=acct(t);if(ac==='bank'){if(t.d>b.d&&t.d<=D){v+=flow(t);n++}}else if(ac==='card'){const bd=billDate(t);if(bd>b.d&&bd<=D){v+=flow(t);n++}}else if(ac===''&&t.d>b.d&&t.d<=D)un++});
  return {v:Math.round(v*100)/100,n,un}}
function upRecInc(from,to){let s=0;S.rec.forEach(r=>{if(!r.on||r.t!=='inc')return;const c=cat(r.c);if(!c||c.int||c.k!=='inc')return;for(const ym of [ymOf(from),shiftYm(ymOf(from),1)]){if(ym<r.start||r.skip.includes(ym))continue;const d=`${ym}-${p2(Math.min(r.day,daysIn(ym)))}`;if(d>from&&d<=to&&!S.tx.some(t=>t.id===recId(r,ym)))s+=r.a}});return s}
function cardForecast(){const ym=nextBillYm(),b=cardBill(ym),hasCard=TX().some(t=>acct(t)==='card');if(!hasCard&&!b.a)return null;
  const now=balAt(todayStr),inc=now?upRecInc(todayStr,b.d):0,after=now?Math.round((now.v+inc-b.a)*100)/100:null;
  return {...b,now,inc,after,low:after!==null&&after<S.ex.minBal}}
function renderCardHome(){const el=$('#homeCard');if(!el)return;const f=ui.cur===nowYm?cardForecast():null;if(!f||!f.low){el.hidden=true;return}el.hidden=false;
  el.innerHTML=`<div class="ch"><h2>החיוב הבא בכרטיס</h2><a href="#bank" class="lnk">פירוט ובדיקת יתרה</a></div>
<p class="fcbig">${esc(fmt(f.a))} <small class="hint">ב־${esc(ddm(f.d))}</small></p>
${f.now?`<p class="hint" style="margin:0">${f.low?'<b class="bad">':''}בבנק אחרי החיוב: בערך ${esc(fmt(f.after))}${f.low?'</b>':''}${f.inc?`, כולל ${esc(fmt(f.inc))} הכנסות קבועות שצפויות עד אז`:''}.</p>`:'<p class="hint" style="margin:0">הזן את היתרה בבנק במסך "בנק וכרטיס" כדי לדעת אם יש מספיק כסף לחיוב.</p>'}`}
function renderBank(){
  const b=$('#bankBody'),f=cardForecast(),now=balAt(todayStr),ex=S.ex,inst=installs().filter(x=>x.ym>=nowYm).sort((a,b)=>a.ym<b.ym?-1:1);
  const cats=new Map();(f?.l||[]).forEach(t=>{const c=cat(t.c),k=c?.name||'ללא קטגוריה';cats.set(k,(cats.get(k)||0)-flow(t))});
  const top=[...cats].sort((a,b)=>b[1]-a[1]).slice(0,6);
  const nAc={card:0,bank:0,'':0};TX().forEach(t=>{const a=acct(t);if(a in nAc)nAc[a]++});
  const byYm=new Map();inst.forEach(x=>{const o=byYm.get(x.ym)||[];o.push(x);byYm.set(x.ym,o)});
  b.innerHTML=`<div class="card"><h2>יתרה בבנק</h2>
${now?`<p class="fcbig">${esc(fmt(now.v))}</p><p class="hint">יתרה מחושבת להיום: נקודת ההתחלה מ־${esc(ddm(ex.bal.d))} (${esc(fmt(ex.bal.v))}), ועוד ${now.n} תנועות בבנק וחיובי כרטיס שירדו מאז.${now.un?` ${now.un} תנועות שהוזנו ידנית בלי לציין מאיזה חשבון לא נכללו.`:''}</p>`:'<p class="hint">כדי לבדוק שלא חסרות או כפולות תנועות, הזן את היתרה שמופיעה עכשיו באפליקציית הבנק. בפעם הראשונה זו נקודת ההתחלה. ייבוא של קובץ עו"ש מ־Pepper קובע אותה לבד.</p>'}
<label class="lbl" for="balIn">היתרה עכשיו באפליקציית הבנק</label>
<div class="ruleadd"><input class="field" id="balIn" type="number" inputmode="decimal" step="0.01" placeholder="למשל 4284.49"><button class="btn solid sm" data-act="bal-check">${now?'בדוק':'שמור כנקודת התחלה'}</button></div>
<div id="balRes">${ui.balRes||''}</div></div>
<div class="card"><h2>החיוב הבא בכרטיס</h2>
${f?`<p class="fcbig${f.low?' bad':''}">${esc(fmt(f.a))} <small class="hint">ב־${esc(ddm(f.d))}</small></p>
${f.now?`<p class="hint">${f.low?`<b class="bad">צפוי חוסר: אחרי החיוב יישארו בערך ${esc(fmt(f.after))}.</b> כדאי להעביר כסף לחשבון לפני ה־${S.ex.bill}.`:`אחרי החיוב יישארו בבנק בערך ${esc(fmt(f.after))}.`}${f.inc?` כולל ${esc(fmt(f.inc))} הכנסות קבועות שצפויות עד אז.`:''} לא כולל הוצאות אחרות מהבנק שעוד יגיעו.</p>`:''}
${top.map(([k,v])=>`<div class="trow"><span>${esc(k)}</span><b>${esc(fmt(v))}</b></div>`).join('')}
${f.fut.length?`<div class="trow"><span>תשלומים מעסקאות קודמות<small>${f.fut.map(x=>esc(x.n+' '+x.k)).join(', ')}</small></span><b>${esc(fmt(sumBy(f.fut,x=>x.a)))}</b></div>`:''}`:'<p class="hint" style="margin:0">אין עדיין תנועות בכרטיס. הן מגיעות מייבוא פירוט max או מחיובים שנקלטים לבד.</p>'}
<p class="hint" style="margin:12px 0 0">יום החיוב וההתראה לפני מינוס: <a href="#settings" data-sopen="s-bank">בהגדרות</a>.</p></div>
<div class="card"><h2>תשלומים עתידיים</h2><p class="hint">עסקאות בתשלומים שעוד לא נגמרו, לפי החודש שבו הן יורדות.</p>
${byYm.size?[...byYm].slice(0,12).map(([ym,l])=>`<div class="trow"><span>${esc(MN[mIdx(ym)]+' '+ym.slice(0,4))}<small>${l.map(x=>esc(x.n+', '+x.k)).join(' · ')}</small></span><b>${esc(fmt(sumBy(l,x=>x.a)))}</b></div>`).join(''):'<p class="hint" style="margin:0">אין תשלומים פתוחים.</p>'}</div>
<div class="card"><h2>מאיזה חשבון</h2><p class="hint">כדי לחשב יתרה, כל תנועה משויכת לכרטיס או לחשבון הבנק. ייבוא וקליטה אוטומטית משייכים לבד. בהוספה ידנית בוחרים "שולם מ־".</p>
<div class="trow"><span>בכרטיס אשראי</span><b>${nAc.card}</b></div><div class="trow"><span>בחשבון הבנק</span><b>${nAc.bank}</b></div><div class="trow"><span>לא צוין</span><b>${nAc['']}</b></div></div>`;
}
function balCheck(real){const b=S.ex.bal,now=balAt(todayStr);if(!now)return null;const diff=Math.round((real-now.v)*100)/100;
  const l=TX().filter(t=>acct(t)&&kd(t)!=='int'&&(acct(t)==='card'?billDate(t):t.d)>b.d).sort((a,c)=>a.d<c.d?-1:1),dups=[];
  for(let i=0;i<l.length&&dups.length<8;i++)for(let j=i+1;j<l.length&&dayDiff(l[i].d,l[j].d)<=3;j++){const p=l[i],q=l[j];if(p.t===q.t&&Math.abs(p.a-q.a)<.01&&(acct(p)!==acct(q)||mkey(p.n)===mkey(q.n)||p.tags?.includes('אוטומטי')!==q.tags?.includes('אוטומטי')))dups.push([p,q])}
  const ad=Math.abs(diff),cand=ad>=1?l.filter(t=>Math.abs(t.a-ad)<.01).slice(-5):[];
  return {now:now.v,diff,dups,cand,un:now.un}}
ACT['bal-check']=()=>{const v=parseFloat($('#balIn').value);if(!isFinite(v)){toast('הזן את היתרה מאפליקציית הבנק');$('#balIn').focus();return}
  if(!S.ex.bal){change(()=>{S.ex.bal={d:todayStr,v}},{cfg:true,undo:false});ui.balRes='';toast(`נקודת ההתחלה נשמרה: ${fmt(v)} היום. מעכשיו כל תנועה בבנק ובכרטיס תעדכן את היתרה`);renderBank();return}
  const r=balCheck(v),row=t=>`<button class="txr" data-open="${esc(t.id)}"><span class="tm"><b>${esc(t.n||'')}</b><small>${esc(ddm(t.d))} · ${acct(t)==='card'?'כרטיס':'בנק'}</small></span>${amtHtml(t)}</button>`;
  ui.balRes=Math.abs(r.diff)<1?`<div class="status"><svg class="ic"><use href="#i-check"/></svg><div><b>מדויק. היתרה מתאימה</b><small>החישוב יצא ${esc(fmt(r.now))}, בדיוק כמו בבנק.</small></div></div><div class="btnrow"><button class="btn sm" data-act="bal-anchor" data-v="${v}">עדכן את נקודת ההתחלה להיום</button></div>`
  :`<div class="status err"><svg class="ic"><use href="#i-alert"/></svg><div><b>${r.diff<0?`בבנק יש ${esc(fmt(-r.diff))} פחות מהחישוב`:`בבנק יש ${esc(fmt(r.diff))} יותר מהחישוב`}</b><small>לפי התנועות יצא ${esc(fmt(r.now))}. ${r.diff<0?'כנראה חסרה הוצאה, או שהכנסה נרשמה פעמיים.':'כנראה חסרה הכנסה, או שהוצאה נרשמה פעמיים.'}${r.un?` יש ${r.un} תנועות ידניות בלי חשבון שלא נכללו.`:''}</small></div></div>
${r.dups.length?`<h3 class="h3">אולי כפולות</h3><div class="dayl">${r.dups.map(([p,q])=>row(p)+row(q)).join('')}</div>`:''}
${r.cand.length?`<h3 class="h3">תנועות של בדיוק ${esc(fmt(Math.abs(r.diff)))}</h3><div class="dayl">${r.cand.map(row).join('')}</div>`:''}
<div class="btnrow"><button class="btn sm" data-act="bal-anchor" data-v="${v}">זה בסדר, קבע את היתרה הזו כנקודת התחלה</button></div>`;
  renderBank();hydrate($('#balRes'))};
ACT['bal-anchor']=b=>{const v=+b.dataset.v;change(()=>{S.ex.bal={d:todayStr,v}},{cfg:true,undo:false});ui.balRes='';toast(`נקודת ההתחלה עודכנה ל־${fmt(v)} היום`);renderBank()};
function renderSetBank(){const ex=S.ex;$('#setBank').innerHTML=`<div class="gset"><label>יום החיוב בחודש<select class="field" id="exBill">${Array.from({length:28},(_,i)=>i+1).map(d=>`<option value="${d}"${d===ex.bill?' selected':''}>${d}</option>`).join('')}</select></label>
<label>עסקאות עד יום<select class="field" id="exCut">${Array.from({length:28},(_,i)=>i+1).map(d=>`<option value="${d}"${d===ex.cut?' selected':''}>${d}</option>`).join('')}</select></label>
<label>להתריע כשהיתרה תרד מתחת ל־<input class="field" id="exMin" type="number" inputmode="numeric" step="100" value="${ex.minBal}"></label></div>
<p class="hint" style="margin:0">עסקה עד היום שבחרת נכנסת לחיוב של אותו חודש, ואחריו לחיוב של החודש הבא. ב־max זה בדרך כלל עד ה־7 לחודש. כשיש תאריך חיוב מהקובץ, הוא קובע.</p>`}
document.addEventListener('change',e=>{const id=e.target.id;if(id==='exBill'||id==='exCut'||id==='exMin'){const v=Math.round(+e.target.value||0);change(()=>{if(id==='exBill')S.ex.bill=clamp(v,1,28);else if(id==='exCut')S.ex.cut=clamp(v,1,28);else S.ex.minBal=v},{cfg:true,undo:false})}});

/* ---------- review inbox (auto-ingested) + rules ---------- */
const rvList=()=>TX().filter(t=>t.x?.rv).sort((a,b)=>a.d<b.d?1:a.d>b.d?-1:0);
function clearRv(t){if(!t.x)return;delete t.x.rv;const nx=normX(t.x);if(nx)t.x=nx;else delete t.x}
function owedFor(t){/* unpaid split shares that this incoming transfer could repay */
  if(t.t!=='inc'||t.x?.lk)return [];const out=[];
  const nm=String(t.n||''),hit=p=>{const f=String(p.n).trim().split(/\s+/)[0];return f.length>1&&nm.includes(f)?0:1};
  TX().forEach(e=>(e.x?.sp||[]).forEach((p,i)=>{if(!p.ok&&Math.abs(p.a-t.a)<0.01&&e.d<=t.d&&dayDiff(e.d,t.d)<=90)out.push({e,i,p})}));
  return out.sort((a,b)=>hit(a.p)-hit(b.p)||(a.e.d<b.e.d?1:a.e.d>b.e.d?-1:0)||a.i-b.i)}
function dayDiff(a,b){return Math.round((Date.UTC(+b.slice(0,4),+b.slice(5,7)-1,+b.slice(8))-Date.UTC(+a.slice(0,4),+a.slice(5,7)-1,+a.slice(8)))/864e5)}
function linkRepay(inId,exId,i){const tin=S.tx.find(x=>x.id===inId),ex=S.tx.find(x=>x.id===exId);if(!tin||!ex)return;
  change(()=>{const p=ex.x.sp[i];p.ok=1;p.lk=tin.id;tin.c=ex.c;tin.t='inc';tin.x={...(tin.x||{}),lk:ex.id};clearRv(tin);if(!tin.note)tin.note=`החזר מ${p.n} על ${ex.n||cat(ex.c)?.name||''}`},{tx:[inId,exId]});
  toast(`קושר: ${tin.a?fmt(tin.a):''} מ${ex.x.sp[i].n} החזיר על ${ex.n||'ההוצאה'}. ההוצאה בקטגוריה קטנה בהתאם`,true)}
function renderInbox(){
  const el=$('#homeInbox');if(!el)return;const l=rvList();if(!l.length){el.hidden=true;return}el.hidden=false;
  const show=l.slice(0,5);
  el.innerHTML=`<div class="ch"><h2>לבדיקה <span class="cnt" style="margin:0">${l.length}</span></h2><button class="btn sm" data-act="rv-all">הכול נכון</button></div>
<p class="hint">חיובים וזיכויים שנקלטו לבד מההודעות. בדוק שהקטגוריה נכונה. תיקון מלמד את האפליקציה, והפעם הבאה תהיה נכונה לבד.</p>
<div class="rvl">${show.map(t=>{const ow=owedFor(t)[0];return `<div class="rvi" data-rv="${esc(t.id)}">
<button class="rvt" data-open="${esc(t.id)}"><b>${esc(t.n||'ללא תיאור')}</b><small>${esc(dayLabel(t.d))}${t.x?.ac==='card'?' · כרטיס':t.x?.ac==='bank'?' · בנק':''}${txBadges(t)}</small></button>${amtHtml(t)}
<select class="field" data-rvc aria-label="קטגוריה ל${esc(t.n||'תנועה')}">${catOpts(t.c)}</select><button class="btn sm solid" data-rvok aria-label="נכון">נכון</button>
${ow?`<button class="btn sm green rvlink" data-rvlink="${esc(ow.e.id)}" data-rvi="${ow.i}">זה ההחזר של ${esc(ow.p.n)} על ${esc(ow.e.n||'הוצאה')}?</button>`:''}</div>`}).join('')}</div>
${l.length>show.length?`<a href="#tx" class="lnk" data-rvmore>עוד ${l.length-show.length} לבדיקה</a>`:''}`;
}
document.addEventListener('change',e=>{const s=e.target.closest('[data-rvc]');if(!s)return;const id=s.closest('[data-rv]').dataset.rv,t=S.tx.find(x=>x.id===id);if(!t)return;
  const oc=cat(t.c),nc=cat(s.value);let k='';change(()=>{t.c=s.value;if(nc&&!nc.int&&!(oc&&!oc.int&&oc.k===nc.k))t.t=nc.k;clearRv(t);k=learn(t.n,t.c)},{tx:[id],cfg:true});
  const lm=k?applyAllOffer(k):null;toast(lm?lm.msg:`${t.n||'התנועה'} ← ${nc?.name||''}`,!lm,lm?.act)});
document.addEventListener('click',e=>{
  const ok=e.target.closest('[data-rvok]');if(ok){const id=ok.closest('[data-rv]').dataset.rv;change(()=>{const t=S.tx.find(x=>x.id===id);if(t)clearRv(t)},{tx:[id]});return}
  const lk=e.target.closest('[data-rvlink]');if(lk){linkRepay(lk.closest('[data-rv]').dataset.rv,lk.dataset.rvlink,+lk.dataset.rvi);return}
  const mo=e.target.closest('[data-rvmore]');if(mo){ui.typeF='rv';ui.scope='all'}
});
ACT['rv-all']=()=>{const ids=rvList().map(t=>t.id);if(!ids.length)return;change(()=>ids.forEach(id=>clearRv(S.tx.find(t=>t.id===id))),{tx:ids});toast(`${ids.length} תנועות אושרו`,true)};

function renderRules(){
  const el=$('#rulesCard');if(!el)return;const q=(ui.ruleQ||'').toLowerCase();
  const cnt=new Map();TX().forEach(t=>{const k=mkey(t.n);if(k)cnt.set(k,(cnt.get(k)||0)+1)});
  const all=Object.entries(S.rules).filter(([k,c])=>cat(c)).sort((a,b)=>(cnt.get(b[0])||0)-(cnt.get(a[0])||0)||a[0].localeCompare(b[0],'he'));
  const list=all.filter(([k,c])=>!q||k.includes(q)||(cat(c)?.name||'').toLowerCase().includes(q)),lim=ui.ruleAll?list.length:30;
  const keepQ=document.activeElement?.id==='ruleQ';
  el.innerHTML=`<p class="hint">${all.length?all.length+' כללים. ':''}האפליקציה לומדת מכל תיקון שלך. כאן רואים, משנים ומוחקים. הכללים חלים על הוספה ידנית, על ייבוא ועל חיובים שנקלטים לבד מההודעות. ההתאמה לפי שתי המילים הראשונות בשם.</p>
<div class="ruleadd"><input class="field" id="ruleN" maxlength="60" placeholder="שם בית העסק, למשל: שופרסל דיל" aria-label="שם בית העסק"><select class="field" id="ruleC" aria-label="קטגוריה">${catOpts(exps().find(c=>/שונות/.test(c.name))?.id)}</select><button class="btn solid sm" data-act="rule-add">הוסף כלל</button></div>
${all.length>8?`<input class="field" type="search" id="ruleQ" placeholder="חיפוש בכללים" value="${esc(ui.ruleQ||'')}" style="margin:10px 0 4px" aria-label="חיפוש בכללים">`:''}
<div class="rules">${list.slice(0,lim).map(([k,c])=>`<div class="rr" data-rk="${esc(k)}"><span><b>${esc(k)}</b><small>${cnt.get(k)||0} תנועות</small></span><select class="field" data-rc aria-label="קטגוריה ל${esc(k)}">${catOpts(c)}</select><button class="icon" data-rdel aria-label="מחק כלל ${esc(k)}"><svg class="ic"><use href="#i-x"/></svg></button></div>`).join('')||'<p class="hint" style="margin:8px 0 0">עוד אין כללים. הם נוצרים כשאתה מתקן קטגוריה, או כאן.</p>'}</div>
${list.length>lim?`<button class="btn sm" data-act="rule-all" style="margin-top:10px">הצג את כל ${list.length}</button>`:''}`;
  if(keepQ){const r=$('#ruleQ');if(r){r.focus();r.setSelectionRange(r.value.length,r.value.length)}}
}
ACT['rule-add']=()=>{const n=$('#ruleN').value.trim(),c=$('#ruleC').value,k=mkey(n);if(!k){toast('כתוב שם של בית עסק');$('#ruleN').focus();return}
  change(()=>{S.rules[k]=c},{cfg:true});const lm=applyAllOffer(k);toast(lm?lm.msg:`נוסף כלל: ${k} ← ${cat(c)?.name}`,false,lm?.act)};
ACT['rule-all']=()=>{ui.ruleAll=true;renderRules()};
$('#rulesCard').addEventListener('input',e=>{if(e.target.id==='ruleQ'){ui.ruleQ=e.target.value;renderRules()}});
$('#rulesCard').addEventListener('change',e=>{const s=e.target.closest('[data-rc]');if(!s)return;const k=s.closest('[data-rk]').dataset.rk;change(()=>{S.rules[k]=s.value},{cfg:true});const lm=applyAllOffer(k);toast(lm?lm.msg:'הכלל עודכן',!lm,lm?.act)});
$('#rulesCard').addEventListener('click',e=>{const d=e.target.closest('[data-rdel]');if(!d)return;const k=d.closest('[data-rk]').dataset.rk;change(()=>{delete S.rules[k]},{cfg:true});toast(`הכלל "${k}" נמחק`,true)});

/* ---------- settings screen ---------- */
function cardBody(html){const d=document.createElement('div');d.innerHTML=html;const c=d.firstElementChild;if(!c)return '';c.querySelector('h2')?.remove();return c.innerHTML}
const NOSYNC='<p class="hint" style="margin:0">עובד אחרי שמחברים גיליון ב<a href="#sync">סנכרון משותף</a>.</p>';
function renderSetDyn(){const keep={},ae=document.activeElement,aid=ae?.id;['wEm','wOn','wFreq','wDay','ingTest'].forEach(id=>{const el=$('#'+id);if(el)keep[id]=el.type==='checkbox'?el.checked:el.value});
  const F={push:pushCard,mail:weeklyCard,auto:autoCard,siri:siriCard,widget:widgetCard};
  $$('[data-sdyn]').forEach(el=>{el.innerHTML=!SY.on?NOSYNC:SY.ro?'<p class="hint" style="margin:0">לא זמין בחשבון לצפייה בלבד.</p>':cardBody(F[el.dataset.sdyn]())});
  Object.keys(keep).forEach(id=>{const el=$('#'+id);if(el){if(el.type==='checkbox')el.checked=keep[id];else el.value=keep[id]}});if(aid)$('#'+aid)?.focus({preventScroll:true})}
function renderSettings(){$('#pName').value=S.profile.name;$('#pMe').value=ui.me;renderBudget();renderSetBank();renderLockCard();renderSetDyn()}
document.addEventListener('click',e=>{const a=e.target.closest('[data-sopen]');if(!a)return;const id=a.dataset.sopen;setTimeout(()=>{const d=$('#'+id);if(d){d.open=true;d.scrollIntoView({block:'start'})}},60)});

/* ---------- app lock: Face ID / Touch ID + code, per device ---------- */
const LOCK={k:'kesef-lock',c:null,locked:false,hid:0,
  load(){try{this.c=JSON.parse(localStorage.getItem(this.k)||'null')}catch{this.c=null}},
  save(){try{if(this.c)localStorage.setItem(this.k,JSON.stringify(this.c));else localStorage.removeItem(this.k)}catch{}},
  on(){return !!this.c?.h},
  async hash(pin,salt){return b64u(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(salt+':'+pin)))},
  async bioOk(){try{return !!(window.PublicKeyCredential&&window.isSecureContext&&await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())}catch{return false}},
  async enroll(){const c=await navigator.credentials.create({publicKey:{rp:{name:'הכסף שלי'},user:{id:crypto.getRandomValues(new Uint8Array(16)),name:'kesef-'+ui.dev,displayName:S.profile.name||'הכסף שלי'},challenge:crypto.getRandomValues(new Uint8Array(32)),pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],authenticatorSelection:{authenticatorAttachment:'platform',userVerification:'required',residentKey:'discouraged'},timeout:60000,attestation:'none'}});if(!c)throw new Error('cancel');return b64u(c.rawId)},
  async bio(){const a=await navigator.credentials.get({publicKey:{challenge:crypto.getRandomValues(new Uint8Array(32)),allowCredentials:[{type:'public-key',id:fromB64u(this.c.cred)}],userVerification:'required',timeout:60000}});return !!a},
  show(){if(!this.on()||this.locked)return;this.locked=true;$('#lock').hidden=false;document.body.classList.add('locked');$('#lockBio').hidden=!this.c.cred;$('#lockErr').textContent='';$('#lockPin').value='';$('#lockT').textContent=(S.profile.name||'הכסף שלי')+' נעול'},
  hide(){this.locked=false;$('#lock').hidden=true;document.body.classList.remove('locked')}
};
LOCK.load();
$('#lockBio').addEventListener('click',async()=>{try{if(await LOCK.bio())LOCK.hide()}catch(e){$('#lockErr').textContent='הזיהוי לא הצליח. אפשר להקליד את הקוד.';$('#lockPin').focus()}});
$('#lockF').addEventListener('submit',async e=>{e.preventDefault();const v=$('#lockPin').value.trim();if(!v)return;if(await LOCK.hash(v,LOCK.c.s)===LOCK.c.h){LOCK.hide();LOCK.c.bad=0;LOCK.save()}else{LOCK.c.bad=(LOCK.c.bad||0)+1;LOCK.save();$('#lockErr').textContent='קוד שגוי';$('#lockPin').value='';$('#lockPin').focus()}});
$('#lockForgot').addEventListener('click',async()=>{if(!(await ask('לאפס את המכשיר?',`הנעילה תבוטל וכל הנתונים יימחקו מהמכשיר הזה.${SY.on?' בגיליון המשותף לא יימחק כלום, ואפשר להצטרף שוב עם קוד הצטרפות.':' בלי גיבוי הם לא יחזרו.'}`,'מחק ואפס',true)))return;try{localStorage.clear();sessionStorage.clear()}catch{}try{indexedDB.deleteDatabase('kesef')}catch{}location.reload()});
document.addEventListener('visibilitychange',()=>{if(!LOCK.on())return;if(document.visibilityState!=='visible'){LOCK.hid=Date.now();if(!(+LOCK.c.d))LOCK.show()}else if(!LOCK.locked&&Date.now()-LOCK.hid>(+LOCK.c.d||0)*60000)LOCK.show()});
async function renderLockCard(){const el=$('#lockCard');if(!el)return;const bio=await LOCK.bioOk(),on=LOCK.on(),d=+(LOCK.c?.d||0);
  const delay=`<label class="lbl" for="lkD" style="display:block;margin-top:10px">לנעול</label><select class="field" id="lkD">${[[0,'מיד כשיוצאים מהאפליקציה'],[1,'אחרי דקה'],[5,'אחרי 5 דקות'],[15,'אחרי רבע שעה']].map(([v,l])=>`<option value="${v}"${v===d?' selected':''}>${l}</option>`).join('')}</select>`;
  el.innerHTML=`<p class="hint">מי שמחזיק את הטלפון לא יראה את הנתונים בלי ${bio?'Face ID, טביעת אצבע או ':''}קוד. ההגדרה רק למכשיר הזה. זו נעילת מסך: הנתונים עצמם שמורים במכשיר ובגיליון כרגיל.</p>
${on?`<p class="okt" style="margin:0">הנעילה פעילה${LOCK.c.cred?', עם '+(PUSH.ios()?'Face ID':'זיהוי ביומטרי'):''}</p>${delay}<div class="btnrow"><button class="btn sm" data-act="lk-now">נעל עכשיו</button><button class="btn danger sm" data-act="lk-off">כבה נעילה</button></div>`
:`<div class="row2"><label>קוד (4 עד 8 ספרות)<input class="field" id="lkP1" type="password" inputmode="numeric" maxlength="8" autocomplete="new-password"></label><label>שוב, לאימות<input class="field" id="lkP2" type="password" inputmode="numeric" maxlength="8" autocomplete="new-password"></label></div>
${bio?'<label class="chk"><input type="checkbox" id="lkBio" checked>לפתוח גם עם Face ID או טביעת אצבע</label>':'<p class="hint" style="margin:8px 0 0">במכשיר או בדפדפן הזה אין זיהוי ביומטרי לאתרים, אז הנעילה תהיה עם קוד.</p>'}${delay}
<p class="err" id="lkErr"></p><div class="btnrow"><button class="btn solid sm" data-act="lk-on">הפעל נעילה</button></div>`}`}
Object.assign(ACT,{
  'lk-on':async b=>{const p1=$('#lkP1').value.trim(),p2=$('#lkP2').value.trim(),er=$('#lkErr');er.textContent='';
    if(!/^\d{4,8}$/.test(p1)){er.textContent='הקוד צריך להיות 4 עד 8 ספרות.';return}if(p1!==p2){er.textContent='הקודים לא זהים.';return}
    b.disabled=true;const s=rid(16),c={s,h:await LOCK.hash(p1,s),d:+$('#lkD').value||0};
    if($('#lkBio')?.checked){try{c.cred=await LOCK.enroll()}catch(e){toast('הזיהוי הביומטרי לא הופעל, הנעילה תעבוד עם קוד')}}
    LOCK.c=c;LOCK.save();renderLockCard();toast('הנעילה הופעלה. בפעם הבאה שתפתח את האפליקציה היא תבקש לזהות אותך')},
  'lk-off':async()=>{if(!(await ask('לכבות את הנעילה?','האפליקציה תיפתח בלי זיהוי במכשיר הזה.','כבה')))return;LOCK.show();const done=()=>{LOCK.c=null;LOCK.save();renderLockCard();toast('הנעילה כבויה')};
    const iv=setInterval(()=>{if(!LOCK.locked){clearInterval(iv);done()}},300)},
  'lk-now':()=>LOCK.show()
});
document.addEventListener('change',e=>{if(e.target.id==='lkD'&&LOCK.c){LOCK.c.d=+e.target.value||0;LOCK.save()}});

/* ---------- read-only partner: stop edits before they start ---------- */
const RO_ACTS=new Set(['exp','inc','salary','photo','undo','fresh','wipe-tx','wipe','imp-go','bulktag','rv-all','rule-add','sub-reset','bal-anchor','weekly-save','weekly-test','ing-get','ing-rotate','wt-get','wt-rotate','vk-get','vk-rotate','copy-gs','copy-loader','gs-reload']);
const RO_SEL='[data-rvok],[data-rvlink],[data-nosub],[data-trip],[data-repay],[data-paid],[data-cdel],[data-del],[data-rdel],[data-spdel],#addRow,#recAdd,#addE,#addI,#addT,#txDel,#recDel,#btRemove,#albAdd,#picSave,#picDel,#bkFile';
function roStop(e){if(!(SY.on&&SY.ro))return false;e.preventDefault();e.stopImmediatePropagation();toast('החשבון הזה מחובר לצפייה בלבד. אפשר לראות הכול, אבל לא לשנות');return true}
document.addEventListener('click',e=>{if(!(SY.on&&SY.ro))return;const a=e.target.closest('[data-act]');if((a&&RO_ACTS.has(a.dataset.act))||e.target.closest(RO_SEL))roStop(e)},true);
document.addEventListener('submit',e=>{if(SY.on&&SY.ro&&!e.target.closest('#lockF'))roStop(e)},true);
document.addEventListener('change',e=>{if(SY.on&&SY.ro&&e.target.closest('#impFile,#albFile,#bkFile,#txFile,#pFile')){e.target.value='';roStop(e)}},true);

/* ---------- boot ---------- */
load();if(LOCK.on())LOCK.show();takeJoinHash();document.body.classList.toggle('ro',!!(SY.on&&SY.ro));runRec(true);route();loadAvatar();resetIdle();if(SY.on){saveSyncInfo();setTimeout(()=>PUSH.refresh(),4000)}
if(SY.on){setSync('ok');Sync.run(true)}
setInterval(()=>{if(SY.on&&document.visibilityState==='visible')Sync.run()},20000);
setInterval(()=>{if(SY.on)chrome()},30000);
let hiddenAt=0;
function backToNow(){ui.cur=nowYm;ui.scope='month';ui.tagF='';ui.q='';ui.catF='';ui.typeF='all';const q=$('#q');if(q)q.value=''}
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState!=='visible'){hiddenAt=Date.now();persistNow();return}
  const newDay=new Date().toDateString()!==T0.toDateString();
  if(hiddenAt&&(newDay||Date.now()-hiddenAt>10*60e3)&&!$$('dialog').some(d=>d.open)){persistNow();location.reload();return}
  if(SY.on)Sync.run();
});
window.addEventListener('pageshow',e=>{if(e.persisted){backToNow();render()}});
window.addEventListener('online',()=>{if(SY.on)Sync.run()});
window.addEventListener('offline',()=>{if(SY.on)setSync('offline')});
try{navigator.storage?.persist?.()}catch{}
if('serviceWorker' in navigator&&location.protocol==='https:'){const hadSW=!!navigator.serviceWorker.controller;let swReload=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(hadSW&&!swReload){swReload=true;location.reload()}});navigator.serviceWorker.register('sw.js').then(r=>{document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')r.update().catch(()=>{})})}).catch(()=>{})}
window.__kesef={get S(){return S},get SY(){return SY},Sync};
})();
