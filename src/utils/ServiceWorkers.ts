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

type PushNotificationGrantResult = 'granted'|'denied'|'not_available';
export class PushNotifications {

    public static readonly INSTANCE = new PushNotifications();

    private constructor() {
    }

    public async ensureGranted(): Promise<{granted:true}|{granted:false,type:'not_granted',status:string}|{granted:false,type:'error',error:any}> {
        return new Promise(async (resolve) => {
            try {
                const result = await PushNotifications.askPermission();

                await this.pushNotificationGrantToServiceWorker();

                if(result === 'granted'){
                    resolve({ granted: true });
                } else {
                    resolve({ granted: false, type: 'not_granted', status: result });
                }
            } catch(e) {
                resolve({ granted: false, type: 'error', error: e });
            }
        })
    }

    async pushNotificationGrantToServiceWorker() {
        await navigator.serviceWorker.controller!.postMessage({
            type: 'UPDATE_PUSH_NOTIF_GRANT',
            granted: Notification.permission === 'granted'
        });
    }

    private static async askPermission(): Promise<PushNotificationGrantResult> {
        if(!Notification) {
            console.info("Notification not supported !")
            return 'not_available';
        }

        const permissionResult = await new Promise((resolve, reject) => {
            const permissionResult = Notification.requestPermission((result) => resolve(result));
            if (permissionResult) {
                permissionResult.then(resolve, reject);
            }
        });

        if (permissionResult !== 'granted') {
            console.error(`We weren't granted permission.`)
            return 'denied';
        }
        return 'granted';
    }
}
