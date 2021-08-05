// Firebase App (the core Firebase SDK) is always required and must be listed first
import firebase from 'firebase/app'

// Add the Firebase products that you want to use
import 'firebase/remote-config'

type DataUrlGenerator = {
    listDepartements: () => string,
    statsByDate: () => string,
    stats: () => string,
    infosDepartement: (codeDepartement: string) => string,
    creneauxQuotidiensDepartement: (codeDepartement: string) => string,
};

export class RemoteConfig {
    public static readonly INSTANCE = new RemoteConfig();

    private readonly configuration: firebase.remoteConfig.RemoteConfig;
    private _urlGenerator: DataUrlGenerator|undefined = undefined;
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
    
    sync() {
        this.configurationSyncedPromise = this.configuration.fetchAndActivate().then(() => {
            // If false, rawgithub will be used
            // but keep in mind that firebase remote config will be taken first
            const USE_GITLAB_AS_FALLBACK = true;

            let urlBase = this.configuration.getString("url_base");
            if(urlBase) {
                const statsPath = this.configuration.getString("path_stats") || `/vitemadose/stats.json`;
                const statsByDatePath = '/' + (this.configuration.getString("path_stats_by_date") || `vitemadose/stats_by_date.json`);
                const departementsListPath = this.configuration.getString("path_list_departments") || `/vitemadose/departements.json`;
                const infosDepartementPath = this.configuration.getString("path_data_department") || `/vitemadose/{code}.json`;
                this._urlGenerator = {
                    listDepartements: () => `${urlBase}${departementsListPath}`,
                    statsByDate: () => `${urlBase}${statsByDatePath}`,
                    stats: () => `${urlBase}${statsPath}`,
                    infosDepartement: (codeDepartement) => `${urlBase}${infosDepartementPath.replace('{code}', codeDepartement)}`,
                    creneauxQuotidiensDepartement: (codeDepartement) => `${urlBase}/vitemadose/${codeDepartement}/creneaux-quotidiens.json`
                };
            } else if(USE_GITLAB_AS_FALLBACK) {
                this._urlGenerator = {
                    listDepartements: () => 'https://vitemadose.gitlab.io/vitemadose/departements.json',
                    statsByDate: () => `https://vitemadose.gitlab.io/vitemadose/stats_by_date.json`,
                    stats: () => `https://vitemadose.gitlab.io/vitemadose/stats.json`,
                    infosDepartement: (codeDepartement) => `https://vitemadose.gitlab.io/vitemadose/${codeDepartement}.json`,
                    creneauxQuotidiensDepartement: (codeDepartement) => `https://vitemadose.gitlab.io/vitemadose/${codeDepartement}/creneaux-quotidiens.json`
                };
            } else {
                this._urlGenerator = {
                    listDepartements: () => `https://raw.githubusercontent.com/CovidTrackerFr/vitemadose/data-auto/data/output/departements.json`,
                    statsByDate: () => `https://raw.githubusercontent.com/CovidTrackerFr/vitemadose/data-auto/data/output/stats_by_date.json`,
                    stats: () => `https://raw.githubusercontent.com/CovidTrackerFr/vitemadose/data-auto/data/output/stats.json`,
                    infosDepartement: (codeDepartement) => `https://raw.githubusercontent.com/CovidTrackerFr/vitemadose/data-auto/data/output/${codeDepartement}.json`,
                    creneauxQuotidiensDepartement: (codeDepartement) => `https://raw.githubusercontent.com/CovidTrackerFr/vitemadose/data-auto/data/output/${codeDepartement}/creneaux-quotidiens.json`
                };
            }

            return undefined as void;
        });
        return this.configurationSyncedPromise;
    }

    async urlGenerator() {
        await this.configurationSyncedPromise;
        return this._urlGenerator! as DataUrlGenerator;
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
