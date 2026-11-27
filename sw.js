const C='kesef-v28';
const A=['./','./index.html','./app.css?v=14','./app.js?v=25','./manifest.webmanifest','./icon-192-2.png','./icon-512-2.png','./apple-touch-icon-2.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(A)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(/script\.google(usercontent)?\.com$/.test(u.hostname)||u.hostname!==location.hostname||/\.gs$/.test(u.pathname))return;
  e.respondWith(caches.match(r).then(m=>{
    const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque')){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp))}return res}).catch(()=>m);
    return m||net;
  }));
});

function idbGet(k){return new Promise(res=>{try{const r=indexedDB.open('kesef',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>{try{const q=r.result.transaction('kv','readonly').objectStore('kv').get(k);q.onsuccess=()=>res(q.result);q.onerror=()=>res(null)}catch(e){res(null)}};r.onerror=()=>res(null)}catch(e){res(null)}})}
self.addEventListener('push',e=>{e.waitUntil((async()=>{
  let items=[];
  try{const s=await idbGet('sync');if(s&&s.url){const r=await fetch(s.url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'notifs',key:s.key,dev:s.dev})});const j=await r.json();if(j&&j.ok&&Array.isArray(j.items))items=j.items}}catch(err){}
  if(!items.length)items=[{title:'הכסף שלי',body:'יש עדכון חדש באפליקציה'}];
  const show=items.length>4?items.slice(-3).concat([{title:'הכסף שלי',body:'ועוד '+(items.length-3)+' עדכונים'}]):items;
  for(const n of show){await self.registration.showNotification(String(n.title||'הכסף שלי'),{body:String(n.body||''),icon:'icon-192-2.png',badge:'icon-192-2.png',dir:'rtl',lang:'he',data:{type:n.type||''}})}
})())});
self.addEventListener('notificationclick',e=>{e.notification.close();const t=e.notification.data&&e.notification.data.type;
  const url=new URL(t==='msg'?'./#msgs':t==='budget'?'./#home':'./#tx',self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{for(const c of cs){if('focus' in c){if(c.navigate)c.navigate(url).catch(()=>{});return c.focus()}}return self.clients.openWindow(url)}))});
