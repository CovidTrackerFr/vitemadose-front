import {Router} from "../routing/Router";
import {DB} from "../storage/DB";


export class ServiceWorkers {

    public static readonly INSTANCE = new ServiceWorkers();

    private messageChannel = new MessageChannel();

    private constructor() {
    }

    async startup() {
        // Registering background synchronization
        if (!navigator.serviceWorker){
            console.info("Service Worker not supported")
            return false;
        }

        // Waiting for 'load' event
        // see https://developers.google.com/web/fundamentals/primers/service-workers/registration#improving_the_boilerplate
        await new Promise((resolve, reject) => window.addEventListener('load', resolve));

        const serviceWorkerRegistration = await navigator.serviceWorker.register(`${Router.basePath}sw.js`);

        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log("controllerchange called !");
        });

        // Cases :
        // - navigator.serviceWorker.controller is undefined : this occurs the first time the sw is installed
        //   in that case, we should look for updatefound + statechange=activated events to resolve controller
        // - navigator.serviceWorker.controller is defined, we should play with is, but don't forget to register a
        //   controller change event in case a new version of the sw is deployed

        const swInitializer = await new Promise<{controller: ServiceWorker, updated: boolean}>((resolve, reject) => {
            if(navigator.serviceWorker.controller) {
                resolve({controller: navigator.serviceWorker.controller, updated: false});
            }

            serviceWorkerRegistration.addEventListener('updatefound', () => {
                const newWorker = serviceWorkerRegistration.installing!;
                newWorker.addEventListener('statechange', (event) => {
                    if(newWorker.state === 'activated') {
                        resolve({ controller: navigator.serviceWorker.controller!, updated: true});
                    }
                })
            });
        })

        swInitializer.controller.postMessage({
            type: 'INIT_PORT'
        }, [this.messageChannel.port2])
        this.messageChannel.port1.onmessage = function (event) {
            console.log(event.data.payload);
        }

        return true;
    }
}
