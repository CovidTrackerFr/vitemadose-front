// Firebase App (the core Firebase SDK) is always required and must be listed first
import firebase from 'firebase/app'

// Add the Firebase products that you want to use
import 'firebase/remote-config'

export class RemoteConfig {    
    // @ts-ignore unused variable used as a static constructor
    private static _constructor = (() => {
        const USE_PRODUCTION_REMOTE_CONFIG = true;
        
        const firebaseDevConfig = {
            apiKey: "AIzaSyC5lncyBHo4HAmMecIvokok1A5PWWRrutw",
            projectId: "vite-ma-dose-dev",
          storageBucket: "vite-ma-dose-dev.appspot.com",
          appId: "1:812389299998:web:ff949f4962d751b45dfb0f"
        }
        
        const firebaseProdConfig = {
          apiKey: "AIzaSyBl4_aecaPMtvy458zFbmDKu3rHfOZyaQU",
          projectId: "vite-ma-dose",
          storageBucket: "vite-ma-dose.appspot.com",
          appId: "1:304644690082:web:e12d50228bc4493b25c7fb"
        }
        
        firebase.initializeApp(USE_PRODUCTION_REMOTE_CONFIG ? firebaseProdConfig : firebaseDevConfig)
        
        firebase.remoteConfig().settings.minimumFetchIntervalMillis = 60 * 60 * 1000; // one hour
    })();
    
    static async sync() {
        await firebase.remoteConfig().fetchAndActivate();
    }

    // Warning : one needs to wait for init() before accessing any remote config value using the
    // following methods

    static get disclaimerEnabled(): boolean {
        return firebase.remoteConfig().getBoolean('data_disclaimer_enabled');
    }
    
    static get disclaimerMessage(): string {
        return firebase.remoteConfig().getString('data_disclaimer_message');
    }

    static get disclaimerSeverity(): DisclaimerSeverity {
        return firebase.remoteConfig().getString('data_disclaimer_severity').toLowerCase() as DisclaimerSeverity;
    }
}

export type DisclaimerSeverity = 'warning' | 'error';
