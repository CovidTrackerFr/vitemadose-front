import {IDBPDatabase, openDB} from "idb";
import {Commune, Departement, LieuAvecDistance} from "../state/State";


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
        this.db = await openDB('vite-ma-dose', 1, {
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
}
