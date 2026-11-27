const C='kesef-v14';
const A=['./','./index.html','./app.css?v=12','./app.js?v=13','./apps-script.gs','./manifest.webmanifest','./icon-192-2.png','./icon-512-2.png','./apple-touch-icon-2.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(A)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(/script\.google(usercontent)?\.com$/.test(u.hostname))return;
  e.respondWith(caches.match(r).then(m=>{
    const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque')){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp))}return res}).catch(()=>m);
    return m||net;
  }));
});
