/* RB Boutique — Service Worker (PWA). Hace posible la instalacion directa
   en Android/Chrome: el navegador solo ofrece instalar si hay un service
   worker con fetch. En iPhone no aplica (Apple no permite instalar directo).
   - Navegacion (index.html): primero red, para que los cambios se vean al
     instante; si no hay red, usa la copia guardada.
   - Archivos propios (logo, portadas): primero cache, luego red.
   - Nunca toca Firebase ni peticiones POST. */
const CACHE = 'rb-boutique-v1';
const CORE = ['index.html', 'logo-rb.png', 'portada.jpg', 'portada-laptop.jpg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(event.request, copy));
      return res;
    }).catch(() => caches.match(event.request)));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((res) => {
    if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(event.request, copy)); }
    return res;
  }).catch(() => cached)));
});
