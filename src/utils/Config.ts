import firebase from "firebase";

export class Config {
    private static configuration: firebase.remoteConfig.RemoteConfig;

    // Default config
    private static USE_RAW_GITHUB = false;
    private static BASE_URL = Config.USE_RAW_GITHUB ? 'https://raw.githubusercontent.com/CovidTrackerFr/vitemadose/data-auto/data/output' : 'https://vitemadose.gitlab.io';
    private static STATS_PATH = '/vitemadose/stats.json';
    private static STATS_BY_DATE_PATH = '/vitemadose/stats_by_date.json';
    private static DEPARTMENTS_PATH = '/vitemadose/departements.json';
    private static CENTERS_LIST_DISTANCE_KM = 100;
    private static DEPARTMENT_PATH = '/vitemadose/{code}.json';
    private static DISCLAIMER_ENABLED = false;
    private static DISCLAIMER_MESSAGE = '';
    private static DISCLAIMER_SEVERITY = '';

    static async init() {
        firebase.initializeApp({
            apiKey: "AIzaSyAAXf1yyyfKGg89fI8R7hAXYfiPQfLWtIQ",
            authDomain: "vmd-test-13214.firebaseapp.com",
            projectId: "vmd-test-13214",
            storageBucket: "vmd-test-13214.appspot.com",
            messagingSenderId: "240606191548",
            appId: "1:240606191548:web:e0c8b92d4e31b3798f55b9"
        });

        Config.configuration = firebase.remoteConfig();
        Config.configuration.settings.minimumFetchIntervalMillis = 3600;
        Config.configuration.fetchAndActivate();
    }

    static get baseUrl() {
        return Config.configuration.getString("url_base") || Config.BASE_URL;
    }

    static get statsPath() {
        return Config.configuration.getString("path_stats") || Config.STATS_PATH;
    }

    static get statsByDatePath() {
        return Config.configuration.getString("path_stats_by_date") || Config.STATS_BY_DATE_PATH;
    }

    static get departmentsPath() {
        return Config.configuration.getString("path_list_departments") || Config.DEPARTMENTS_PATH;
    }

    static get departmentPath() {
        return Config.configuration.getString("path_data_department") || Config.DEPARTMENT_PATH;
    }

    static get centersListDistanceKm() {
        return Config.configuration.getString("vaccination_centres_list_radius_in_km") || Config.CENTERS_LIST_DISTANCE_KM;
    }

    static get disclaimerEnabled() {
        return Config.configuration.getString("data_disclaimer_enabled") || Config.DISCLAIMER_ENABLED;
    }

    static get disclaimerMessage() {
        return Config.configuration.getString("data_disclaimer_message") || Config.DISCLAIMER_MESSAGE;
    }

    static get disclaimerSeverity() {
        return Config.configuration.getString("data_disclaimer_severity") || Config.DISCLAIMER_SEVERITY;
    }
}