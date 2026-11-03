/* Only public assets are cached. Registration, receipts, API responses and navigation HTML are never stored. */
const CACHE='educreator-public-v1';
const root=new URL('./',self.registration.scope);
const urlFor=path=>new URL(path,root).href;
const OFFLINE=urlFor('offline.html');
const PUBLIC=['offline.html','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/maskable-512.png','icons/apple-touch-icon.png'].map(urlFor);
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(PUBLIC)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('educreator-public-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==root.origin||!url.pathname.startsWith(root.pathname))return;
 if(request.mode==='navigate'){
  event.respondWith(fetch(request).catch(()=>caches.match(OFFLINE).then(response=>response||Response.error())));return;
 }
 if(url.search)return;
 const path=url.pathname.slice(root.pathname.length);
 const asset=PUBLIC.includes(url.href)||/^(assets\/|_next\/static\/).+\.(?:js|css|woff2?|png|svg|webp)$/.test(path);
 if(!asset||request.headers.has('range'))return;
 event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{
  if(response.ok&&!response.redirected&&response.type==='basic'){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,copy)))}return response;
 })));
});
