const CACHE_NAME = "docai-v2"; // Version incrémentée du cache
const OFFLINE_URL = "/offline.html"; // Page de fallback

// Liste des ressources à mettre en cache lors de l'installation.
// Inclut le shell de l'application et les ressources statiques de base.
const PRECACHE_ASSETS = [
  "/",
  "/auth",
  "/chat",
  OFFLINE_URL,
  "/manifest.json",
  "/images/logo.png",
  "/images/favicon.ico", // Ajout du favicon
  "/images/medicaments.png",
  "/images/precision.png",
  "/images/resultatmed.png",
  "/images/conseil.png",
  // Les fichiers CSS et JS de Next.js sont mieux gérés par une stratégie de cache dynamique
  // car leurs noms contiennent des hashes.
  // On pourrait ajouter ici les fichiers CSS globaux si leurs noms sont prévisibles.
  // Exemple (si le nom est stable, sinon à retirer) : "/styles/globals.css"
];

// URLs des polices Google et leurs ressources.
const FONT_ASSETS = [
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
  // Les fichiers .woff2 sont chargés par la CSS ci-dessus, ils seront mis en cache dynamiquement.
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        console.log("Service Worker: Cache ouvert lors de l'installation.");
        return cache.addAll([...PRECACHE_ASSETS, ...FONT_ASSETS]);
      }),
      // Si vous avez des polices locales :
      // caches.open('font-cache').then(cache => cache.addAll(['/fonts/myfont.woff2']))
    ]).then(() => {
      console.log("Service Worker: Toutes les ressources pré-cachées.");
      self.skipWaiting(); // Forcer le nouveau SW à s'activer immédiatement
    }).catch(error => {
      console.error("Service Worker: Erreur lors du pré-cache:", error);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== 'font-cache') { // Ne pas supprimer le cache des polices si séparé
            console.log("Service Worker: Suppression de l'ancien cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log("Service Worker: Activé et anciens caches nettoyés.");
      return self.clients.claim(); // Permet au SW activé de contrôler les clients immédiatement
    })
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Gérer les requêtes de navigation (HTML)
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          // Essayer d'abord le réseau
          const networkResponse = await fetch(request);
          // Mettre en cache la réponse réseau pour les futures requêtes hors ligne
          if (networkResponse && networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          // Le réseau a échoué, essayer de servir depuis le cache
          console.log("Service Worker: Le réseau a échoué pour la navigation, essai du cache.", request.url);
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Si la requête n'est pas dans le cache, servir la page offline.html
          const offlinePage = await caches.match(OFFLINE_URL);
          return offlinePage;
        }
      })()
    );
    return;
  }

  // Stratégie Cache first, puis réseau pour les autres requêtes (CSS, JS, Images, Polices)
  // Sauf pour les requêtes API (généralement /api/...)
  if (request.url.includes("/api/")) {
    // Pour les API, généralement on ne met pas en cache les requêtes GET (sauf si spécifique)
    // et jamais les POST/PUT/DELETE.
    // Ici, on laisse passer vers le réseau. En cas d'échec, l'application devra gérer l'erreur.
    event.respondWith(fetch(request).catch(() => {
        // Optionnel : retourner une réponse JSON d'erreur standardisée
        // return new Response(JSON.stringify({ error: "Network error" }), {
        //   headers: { "Content-Type": "application/json" },
        //   status: 503 // Service Unavailable
        // });
        // Ou simplement laisser l'erreur se propager
    }));
    return;
  }

  // Gestion des polices Google et autres ressources statiques
  if (request.url.startsWith("https://fonts.gstatic.com") || request.url.startsWith("https://fonts.googleapis.com")) {
    // Pour les polices, Cache first puis Network, avec mise en cache dynamique
     event.respondWith(
      caches.open('font-cache').then(async (cache) => { // Cache dédié pour les polices
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.ok) {
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      })
    );
    return;
  }

  // Pour les autres assets (CSS, JS, Images)
  event.respondWith(
    caches.match(request).then(async (cachedResponse) => { // Rendre la fonction async
      if (cachedResponse) {
        return cachedResponse;
      }
      // Si non trouvé dans le cache, aller au réseau et mettre en cache la réponse
      try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.ok) {
          const responseToCache = networkResponse.clone(); // Cloner pour le cache
          const cache = await caches.open(CACHE_NAME);   // Attendre l'ouverture du cache
          await cache.put(request, responseToCache);        // Attendre la mise en cache
        }
        // Retourner la réponse originale. Son corps n'a pas été lu par notre code ici.
        // Si networkResponse est undefined ou non-ok, il sera retourné tel quel.
        return networkResponse;
      } catch (error) {
        console.log("Service Worker: Erreur de fetch pour asset, essai de fallback si image:", request.url, error);
        // Optionnel: Pour les images, on pourrait retourner une image placeholder
        if (request.destination === 'image') {
           // const placeholder = await caches.match('/images/placeholder.png');
           // if (placeholder) return placeholder;
        }
        // Pour les autres, si OFFLINE_URL est pertinent et que la requête est de type 'document'
        // (déjà géré par le mode 'navigate' mais au cas où)
        // if (request.destination === 'document') {
        //   return caches.match(OFFLINE_URL);
        // }
        // Sinon, laisser l'erreur se propager
        throw error;
      });
    })
  );
});

// Optionnel: Gestion des messages du client (ex: pour forcer la mise à jour)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
