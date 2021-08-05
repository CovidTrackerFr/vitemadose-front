// Firebase App (the core Firebase SDK) is always required and must be listed first
import firebase from 'firebase/app'

// Add the Firebase products that you want to use
import 'firebase/remote-config'

export class RemoteConfig {
    public static readonly INSTANCE = new RemoteConfig();

    private readonly configuration: firebase.remoteConfig.RemoteConfig;
    private configurationSyncedPromise: Promise<void>|undefined = undefined;

    private constructor() {
        const USE_PRODUCTION_REMOTE_CONFIG = RemoteConfig.currentEnv() === 'prod';
        
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
        
        const app = firebase.initializeApp(USE_PRODUCTION_REMOTE_CONFIG ? firebaseProdConfig : firebaseDevConfig)
        this.configuration = firebase.remoteConfig(app);

        this.configuration.settings.minimumFetchIntervalMillis = 60 * 60 * 1000; // one hour
    }

    public static currentEnv(): 'prod'|'testing'|'dev'|'unknown' {
        if(document.location.host === 'vitemadose.covidtracker.fr') {
            return 'prod';
        } else if(document.location.host === 'dev.vitemado.se') {
            return 'testing';
        } else if(['localhost', '127.0.0.1'].includes(document.location.host)) {
            return 'dev';
        } else {
            return 'unknown';
        }
    }
    
    sync(): Promise<void> {
        this.configurationSyncedPromise = this.configuration.fetchAndActivate().then(() => undefined as void);
        return this.configurationSyncedPromise;
    }

    async disclaimerEnabled() {
        await this.configurationSyncedPromise;
        return this.configuration.getBoolean('data_disclaimer_enabled');
    }
    
    async disclaimerMessage() {
        await this.configurationSyncedPromise;
        return this.configuration.getString('data_disclaimer_message');
    }

    async disclaimerSeverity() {
        await this.configurationSyncedPromise;
        return this.configuration.getString('data_disclaimer_severity').toLowerCase() as DisclaimerSeverity;
    }
}

export type DisclaimerSeverity = 'warning' | 'error';
