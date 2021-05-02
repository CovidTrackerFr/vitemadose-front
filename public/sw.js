importScripts(
    'https://cdn.jsdelivr.net/npm/idb@6.0.0/build/iife/index-min.js',
    'https://www.gstatic.com/firebasejs/8.4.3/firebase-app.js',
    'https://www.gstatic.com/firebasejs/8.4.3/firebase-messaging.js'
)

const USE_RAW_GITHUB = false
const VMD_BASE_URL = USE_RAW_GITHUB
    ? "https://raw.githubusercontent.com/CovidTrackerFr/vitemadose/data-auto/data/output"
    : "https://vitemadose.gitlab.io/vitemadose"

let getVersionPort = undefined;
let clientRootUrl = undefined;
let env = undefined;
let firebaseMessagingToken = undefined;
let firebaseInitialized = false;

self.addEventListener('install', function(event) {
    console.log('Service Worker activating...');
    clientRootUrl = event.target.location.href.replace("sw.js","");
    env = (event.target.location.hostname === "vitemadose.covidtracker.fr")?'prod':'dev';
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
        getVersionPort = event.ports[0];
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
        const fbBaseUrl = env==='dev'?'https://europe-west1-vite-ma-dose-dev.cloudfunctions.net':'https://europe-west1-vite-ma-dose.cloudfunctions.net';
        return Promise.all(subscriptionTopics.map(function(topic) {
            return fetch(fbBaseUrl+'/subscribeToTopic?token='+fbToken+'&topic='+topic);
        }));
    });
}

function unsubscribeFrom(subscriptionTopics) {
    return resolveFirebaseCloudMessagingToken().then(function(fbToken) {
        const fbBaseUrl = env==='dev'?'https://europe-west1-vite-ma-dose-dev.cloudfunctions.net':'https://europe-west1-vite-ma-dose.cloudfunctions.net';
        return Promise.all(subscriptionTopics.map(function(topic) {
            return fetch(fbBaseUrl+'/unsubscribeFromTopic?token='+fbToken+'&topic='+topic);
        }));
    });
}

function resolveFirebaseCloudMessagingToken() {
    if(!firebaseInitialized) {
        return fetch(clientRootUrl+"firebase-config-"+env+".json")
            .then(function(resp){return resp.json(); })
            .then(function(fbConfig) {
                firebase.initializeApp(fbConfig.app);
                firebaseInitialized = true;

                const messaging = firebase.messaging();
                messaging.onBackgroundMessage(function(payload) {
                    // This is important to keep this debugger here, because putting a breakpoint into this callback will never stop otherwise
                    // as this is kind of an off-event-loop callback which is (strangely) not inspected by chrome at the moment I'm writing this comment
                    debugger;
                    const notificationTitle = payload.data.title;
                    console.log("Notif received !", notificationTitle);
                    unsubscribeFrom([ payload.data.topic ]);
                });

                return messaging.getToken({
                    serviceWorkerRegistration: self.registration,
                    vapidKey: fbConfig.messaging.publicVapidKey
                }).then(function(token) {
                    firebaseMessagingToken = token;
                    console.info("Messaging token : ", token);
                    return token;
                }, console.error);
            })
    } else {
        return Promise.resolve(firebaseMessagingToken);
    }
}

function rechercherAbonnementsAvecRdvDispos(subscriptions) {
    const subscriptionsByCodesDepartement = subscriptions.reduce(function(codeDepartements, subscription) {
        codeDepartements.set(subscription.departement.code_departement, codeDepartements.get(subscription.departement.code_departement) || []);
        codeDepartements.get(subscription.departement.code_departement).push(subscription);
        return codeDepartements;
    }, new Map())

    return Promise.all(Array.from(subscriptionsByCodesDepartement.keys()).map(function(codeDepartement) {
        return fetch(VMD_BASE_URL + "/" + codeDepartement + ".json")
            .then(function(resp) { return resp.json(); })
            .then(function(centres) { return { centres: centres, codeDepartement: codeDepartement }; })
    })).then(function(results) {
        return DB.instance().then(function(db) {
            return db.transaction(['debug']).objectStore("debug").count()
        }).then(function(count) { return { results: results, debugEnabled: count !== 0 }; });
    }).then(function(_) {
        const results = _.results;
        const debugEnabled = _.debugEnabled;
        return results.reduce(function(abosAvecRdvDispos, centresParDepartement) {
            return subscriptionsByCodesDepartement.get(centresParDepartement.codeDepartement).reduce(function(abosAvecRdvDispos, subscription) {
                const centre = centresParDepartement.centres.centres_disponibles.find(function(l) {
                    // To be improved ??? With a levenshtein distance or something like this ? (in case lieu has been renamed a bit)
                    return subscription.lieu.nom === l.nom;
                });
                if(centre && centre.appointment_count) {
                    abosAvecRdvDispos.push({
                        subscription: subscription,
                        appointment_count: centre.appointment_count
                    });
                } else if(debugEnabled) {
                    abosAvecRdvDispos.push({
                        subscription: subscription,
                        appointment_count: Math.round(Math.random()*100)
                    });
                }
                return abosAvecRdvDispos;
            }, abosAvecRdvDispos);
        }, []);
    });
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

