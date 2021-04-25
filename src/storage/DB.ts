import {IDBPDatabase, openDB} from "idb";
import {Commune, Departement, Lieu, LieuAvecDistance, sameLieu} from "../state/State";


export type Subscription = {
    ts: number;
    departement: Departement;
    commune?: Commune;
    lieu: LieuAvecDistance;
    notificationUrl : string;
};

export class DB {

    public static readonly INSTANCE = new DB();

    private db: IDBPDatabase|undefined = undefined;

    private constructor() {
    }

    public async initialize(): Promise<void> {
        this.db = await openDB('vite-ma-dose', 2, {
            upgrade(db, oldVersion, newVersion, transaction) {
                if(oldVersion < 1) {
                    db.createObjectStore('subscriptions', { keyPath: 'ts' })
                }
                if(oldVersion < 2) {
                    db.createObjectStore('debug', {keyPath: 'name'})
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
        });
    }

    async subscribeToCenterAppointments(subscription: Subscription) {
        if(!this.db) {
            throw new Error("DB not initialized !");
        }

        const id = await this.db.transaction(["subscriptions"], "readwrite").objectStore("subscriptions").add(subscription);
        console.info(`Created subscription with id ${id}`);
    }

    async fetchAllSubscriptions(): Promise<Subscription[]> {
        if(!this.db) {
            throw new Error("DB not initialized !");
        }

        return await this.db.transaction(["subscriptions"]).objectStore("subscriptions").getAll();
    }

    async unsubscribeToCenterAppointments(lieu: Lieu) {
        if(!this.db) {
            throw new Error("DB not initialized !");
        }

        const subscriptions = await this.fetchAllSubscriptions();
        const subscriptionToDelete = await subscriptions.find(s => sameLieu(s.lieu, lieu))
        if(subscriptionToDelete) {
            await this.db.transaction(["subscriptions"], "readwrite").objectStore("subscriptions").delete(subscriptionToDelete.ts);
        }
    }

    async switchDebugMode() {
        if(!this.db) {
            throw new Error("DB not initialized !");
        }

        const debugs = await this.db.transaction(["debug"]).objectStore("debug").getAll()
        const debugStoreExists = (debugs.length!==0);

        if(debugStoreExists) {
            await this.db.transaction(["debug"], "readwrite").objectStore("debug").delete(debugs[0].name);
            alert("Switched to debugMode=disabled")
        } else {
            await this.db.transaction(["debug"], "readwrite").objectStore("debug").add({name: 'enabled'});
            alert("Switched to debugMode=enabled")
        }
    }
}
