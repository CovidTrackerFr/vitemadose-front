importScripts(
    'https://cdn.jsdelivr.net/npm/idb@6.0.0/build/iife/index-min.js'
)

let getVersionPort = undefined;
let pushNotificationsGranted=false;

// self.addEventListener('install', function(event) {
//     console.log('Service Worker activating...');
//     event.waitUntil(self.skipWaiting()); // Activate worker immediately
// });

self.addEventListener('activate', function(event) {
    console.log('Service Worker activating...');
    event.waitUntil(
        DB.INSTANCE.initialize().then(function() {
            console.log('DB created !');
            return self.clients.claim();
        })
    );
});

self.addEventListener('sync', function(event) {
    console.log("sync event", event);
});
self.addEventListener("message", function(event) {
    if (event.data && event.data.type === 'INIT_PORT') {
        getVersionPort = event.ports[0];
    }

    if (event.data && event.data.type === 'UPDATE_PUSH_NOTIF_GRANT') {
        pushNotificationsGranted = event.data.granted;
        console.info("Update push notification granted to ["+pushNotificationsGranted+"]");
    }
});

class DB {
    static _INSTANCE = new DB();
    static instance() {
        return DB._INSTANCE.db();
    }

    dbResolver;
    dbPromise;

    constructor() {
        var _this = this;
        this.dbPromise = new Promise(function(resolve) {
            _this.dbResolver = resolve;
        });
    }

    db() {
        return this.dbPromise;
    }

    initialize() {
        var _this = this;
        idb.openDB('vite-ma-dose', 1, {
            upgrade(db, oldVersion, newVersion, transaction) {
                switch(oldVersion) {
                    case 0:
                        db.createObjectStore('subscriptions', { keyPath: 'ts' })
                        break;
                }
            },
            blocked() {
                console.error("openDB blocked")
            },
            blocking() {
                console.warn("Blocking openDB")
            },
            terminated() {
                console.info("Terminated openDB")
            },
        }).then(function(db) {
            _this.dbResolver(db);
        });
        return this.dbPromise;
    }
}
