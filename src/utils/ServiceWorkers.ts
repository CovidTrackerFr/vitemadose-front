import {Router} from "../routing/Router";

export class ServiceWorkers {

    public static readonly INSTANCE = new ServiceWorkers();

    private constructor() {
    }

    async startup() {
        // Registering background synchronization
        if (!navigator.serviceWorker){
            console.info("Service Worker not supported")
            return false;
        }

        // Waiting for 'load' event to start service worker registration
        // see https://developers.google.com/web/fundamentals/primers/service-workers/registration#improving_the_boilerplate
        await new Promise((resolve) => window.addEventListener('load', resolve));

        const serviceWorkerRegistration = await navigator.serviceWorker.register(`${Router.basePath}sw.js`);

        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log("controllerchange called !");
        });

        // Cases :
        // - navigator.serviceWorker.controller is undefined : this occurs the first time the sw is installed
        //   in that case, we should look for updatefound + statechange=activated events to resolve controller
        // - navigator.serviceWorker.controller is defined, we should play with is, but don't forget to register a
        //   controller change event in case a new version of the sw is deployed

        await new Promise<{controller: ServiceWorker, updated: boolean}>((resolve) => {
            if(navigator.serviceWorker.controller) {
                resolve({controller: navigator.serviceWorker.controller, updated: false});
            }

            serviceWorkerRegistration.addEventListener('updatefound', () => {
                const newWorker = serviceWorkerRegistration.installing!;
                newWorker.addEventListener('statechange', () => {
                    if(newWorker.state === 'activated') {
                        resolve({ controller: navigator.serviceWorker.controller!, updated: true});
                    }
                })
            });
        })

        return true;
    }
}
