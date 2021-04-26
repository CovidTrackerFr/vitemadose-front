import {PushNotifications} from "./ServiceWorkers";

export type CapabilityEligibility = "not-eligible"|"eligible-but-denied"|"eligible";

export class Capabilities {
    public static readonly INSTANCE = new Capabilities();

    private constructor() {
    }

    currentDeviceIsEligibleToLocationWatch(): CapabilityEligibility {
        let pushNotificationStatus = PushNotifications.INSTANCE.currentStatus();
        if(!navigator.serviceWorker
            || pushNotificationStatus === 'missing-capability'
            || pushNotificationStatus === 'unexpected-unknown'
        ) {
            return "not-eligible";
        }

        if(pushNotificationStatus === 'denied') {
            return "eligible-but-denied";
        }

        if(pushNotificationStatus === 'granted' || pushNotificationStatus === 'available-but-unknown') {
            return 'eligible';
        }

        throw new Error("Unexpected case in currentDeviceIsEligibleToLocationWatch()");
    }
}
