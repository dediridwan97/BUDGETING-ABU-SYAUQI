const CACHE_NAME = "abu-syauqi-pwa-v3";
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon.jpg"
];

// 1. Install: simpan App Shell inti agar langsung siap
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// 2. Activate: hapus cache versi lama & ambil alih kontrol instan
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// 3. Fetch:
//    - Bypass total untuk API Supabase (data selalu live)
//    - Stale-While-Revalidate untuk HTML & aset lokal (buka 0 detik + update otomatis di belakang layar)
//    - Cache-First untuk CDN (Tailwind, Chart.js, FontAwesome, Fonts, esm.sh)
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Jangan pernah cache request database Supabase
  if (url.hostname.includes("supabase.co")) {
    return;
  }

  // Untuk halaman utama & file lokal: Stale-While-Revalidate (Instan 0 ms)
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(req).then((cachedResponse) => {
          const networkFetch = fetch(req)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(req, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => cachedResponse);

          return cachedResponse || networkFetch;
        })
      )
    );
    return;
  }

  // Untuk aset CDN (Font, Icon, Chart.js, Tailwind, esm.sh): Cache-First
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(req).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(req).then((networkResponse) => {
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === "opaque")) {
            cache.put(req, networkResponse.clone());
          }
          return networkResponse;
        });
      })
    )
  );
});
