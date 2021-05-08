
function clientRootUrl() {
    return self.location.href.replace("sw.js","");
}

function env() {
    return (self.location.hostname === "vitemadose.covidtracker.fr")?'prod':'dev';
}


self.addEventListener('install', function(event) {
    console.log('Service Worker activating...');
    // event.waitUntil(self.skipWaiting()); // Activate worker immediately
});

self.addEventListener('activate', function(event) {
    console.log('Service Worker activating...');
    event.waitUntil(
        Promise.all([
            Promise.resolve()
        ]).then(function() {
            console.log('SW activation finished !');
            return self.clients.claim();
        })
    );
});

// Dummy fetch handler to make PWA installable (without this, we won't have the installation CTA on the website)
self.addEventListener('fetch', function(event) {
    //console.log("in dummy fetch handler");
});
