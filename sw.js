/* GBTorque PRO service worker: network-first for pages, cache-first for assets.
- Bump CACHE_VERSION on every deploy. */
const CACHE_VERSION = 'gbtorque-pro-v1.0.0';
const PRECACHE = [
    './',
    'index.html',
    'manifest.json',
    'shared/common.css',
    'shared/license.js',
    'icon-192.png',
    'icon-512.png',
    // GBTorque assets
    'GbtSrc/icon.png',
    'GbtSrc/favicon.png',
    'GbtSrc/header-logo.png',
    'GbtSrc/company-logo.png',
    'GbtSrc/four-bar-linkage.png',
    'GbtSrc/units_pro.json'
];

self.addEventListener('install', function (e) {
    e.waitUntil(caches.open(CACHE_VERSION).then(function (c) {
        // Missing optional files must not break the install.
        return Promise.all(PRECACHE.map(function (u) { return c.add(u).catch(function () {}); }));
    }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
    e.waitUntil(caches.keys().then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== CACHE_VERSION; })
            .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
    const req = e.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);
    if (url.origin !== location.origin) return;

    const isPage = req.mode === 'navigate' || /\.(html|js|css|json)$/.test(url.pathname) || url.pathname.endsWith('/');
    if (isPage) {
        e.respondWith(fetch(req).then(function (r) {
            if (r.ok) { const copy = r.clone(); caches.open(CACHE_VERSION).then(function (c) { c.put(req, copy); }); }
            return r;
        }).catch(function () {
            return caches.match(req, { ignoreSearch: true }).then(function (m) { return m || caches.match('index.html'); });
        }));
        return;
    }

    e.respondWith(caches.match(req).then(function (m) {
        var net = fetch(req).then(function (r) {
            if (r.ok) { const copy = r.clone(); caches.open(CACHE_VERSION).then(function (c) { c.put(req, copy); }); }
            return r;
        });
        if (m) { net.catch(function () {}); return m; }
        return net;
    }));
});
