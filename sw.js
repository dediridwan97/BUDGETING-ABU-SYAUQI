self.addEventListener("install", () => self.skipWaiting());
   self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
   self.addEventListener("fetch", (event) => {
     if (event.request.url.includes("script.google.com") || event.request.url.includes("googleusercontent.com")) return;
     event.respondWith(fetch(event.request));
   });
