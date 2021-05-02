import {Subscription} from "../storage/DB";

export class Messaging {
    public static readonly INSTANCE = new Messaging();

    private constructor() {
    }

    async ensureStarted(): Promise<void> {
        return new Promise(async (resolve) => {
            // const env = State.currentEnv();
            // const fbConfig = await fetch(`${Router.basePath}firebase-config-${env}`).then(resp => resp.json())
            // firebase.initializeApp(fbConfig.app);

            resolve();
        })
    }

    async subscribeTo(subscriptions: Subscription[]) {
        await navigator.serviceWorker.controller!.postMessage({
            type: 'SUBSCRIPTIONS_ADDED',
            subscriptionTopics: subscriptions.map(s => `department_${s.departement.code_departement}_center_${s.lieu.gid}`)
        });
    }

    async unsubscribeFrom(subscriptions: Subscription[]) {
        await navigator.serviceWorker.controller!.postMessage({
            type: 'SUBSCRIPTIONS_REMOVED',
            subscriptionTopics: subscriptions.map(s => `department_${s.departement.code_departement}_center_${s.lieu.gid}`)
        });
    }
}
