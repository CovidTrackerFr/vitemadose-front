importScripts(
    'https://cdn.jsdelivr.net/npm/idb@6.0.0/build/iife/index-min.js',
    'https://www.gstatic.com/firebasejs/8.4.3/firebase-app.js',
    'https://www.gstatic.com/firebasejs/8.4.3/firebase-messaging.js'
)

const USE_RAW_GITHUB = false
const VMD_BASE_URL = USE_RAW_GITHUB
    ? "https://raw.githubusercontent.com/CovidTrackerFr/vitemadose/data-auto/data/output"
    : "https://vitemadose.gitlab.io/vitemadose"

let firebaseMessagingToken = undefined;
let firebaseInitialized = false;

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
            DB.initialize()
        ]).then(function() {
            console.log('DB and sync events created !');
            return self.clients.claim();
        })
    );
});

// Dummy fetch handler to make PWA installable (without this, we won't have the installation CTA on the website)
self.addEventListener('fetch', function(event) {
    //console.log("in dummy fetch handler");
});

self.addEventListener("message", function(event) {
    if (event.data && event.data.type === 'INIT_PORT') {
        // getVersionPort = event.ports[0];
    }

    if (event.data && event.data.type === 'SUBSCRIPTIONS_ADDED') {
        event.waitUntil(subscribeTo(event.data.subscriptionTopics));
    }
    if (event.data && event.data.type === 'SUBSCRIPTIONS_REMOVED') {
        event.waitUntil(unsubscribeFrom(event.data.subscriptionTopics));
    }
});

function subscribeTo(subscriptionTopics) {
    return resolveFirebaseCloudMessagingToken().then(function(fbToken) {
        const fbBaseUrl = env()==='dev'?'https://europe-west1-vite-ma-dose-dev.cloudfunctions.net':'https://europe-west1-vite-ma-dose.cloudfunctions.net';
        return Promise.all(subscriptionTopics.map(function(topic) {
            return fetch(fbBaseUrl+'/subscribeToTopic?token='+fbToken+'&topic='+topic);
        }));
    });
}

function unsubscribeFrom(subscriptionTopics) {
    return resolveFirebaseCloudMessagingToken().then(function(fbToken) {
        const fbBaseUrl = env()==='dev'?'https://europe-west1-vite-ma-dose-dev.cloudfunctions.net':'https://europe-west1-vite-ma-dose.cloudfunctions.net';
        return Promise.all(subscriptionTopics.map(function(topic) {
            return fetch(fbBaseUrl+'/unsubscribeFromTopic?token='+fbToken+'&topic='+topic);
        }));
    });
}

function resolveFirebaseCloudMessagingToken() {
    if(!firebaseInitialized || !firebaseMessagingToken) {
        return fetch(clientRootUrl()+"firebase-config-"+env()+".json")
            .then(function(resp){return resp.json(); })
            .then(function(fbConfig) {
                if(!firebaseInitialized) {
                    firebase.initializeApp(fbConfig.app);
                    firebaseInitialized = true;
                }

                const messaging = firebase.messaging();
                messaging.onBackgroundMessage(function(payload) {
                    debugger;
                    const notificationTitle = payload.data.title;
                    console.log("Notif received !", notificationTitle);
                    unsubscribeFrom([ payload.data.topic ]);
                });

                return messaging.getToken({
                    serviceWorkerRegistration: self.registration,
                    vapidKey: fbConfig.messaging.publicVapidKey
                }).then(function(token) {
                    console.info("Messaging token : ", token);
                    firebaseMessagingToken = token;
                    return token;
                }, console.error);
            })
    } else {
        return Promise.resolve(firebaseMessagingToken);
    }
}


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

    static initialize() {
        var _this = DB._INSTANCE;
        idb.openDB('vite-ma-dose', 2).then(function(db) {
            _this.dbResolver(db);
        });
        return _this.dbPromise;
    }
}

