import {DoseType} from "../state/State";

export type DataUrlGenerator = {
    listDepartements: () => string,
    statsByDate: () => string,
    stats: () => string,
    infosDepartement: (codeDepartement: string, doseType: DoseType) => string,
    creneauxQuotidiensDepartement: (codeDepartement: string, doseType: DoseType) => string,
};

export const GITLAB_DATA_URLS: DataUrlGenerator = {
    listDepartements: () => 'https://vitemadose.gitlab.io/vitemadose/departements.json',
    statsByDate: () => `https://vitemadose.gitlab.io/vitemadose/stats_by_date.json`,
    stats: () => `https://vitemadose.gitlab.io/vitemadose/stats.json`,
    infosDepartement: (codeDepartement) => `https://vitemadose.gitlab.io/vitemadose/${codeDepartement}.json`,
    creneauxQuotidiensDepartement: (codeDepartement, doseType) => {
        if (doseType == 'covid') {
            return `https://vitemadose.gitlab.io/vitemadose/${codeDepartement}/creneaux-quotidiens.json`;
        }

        return `https://vitemadose.gitlab.io/vitemadose/monkeypox/${codeDepartement}/creneaux-quotidiens.json`;
    }
}

export const GITHUB_DATA_URLS: DataUrlGenerator = {
    listDepartements: () => `https://raw.githubusercontent.com/CovidTrackerFr/vitemadose/data-auto/data/output/departements.json`,
    statsByDate: () => `https://raw.githubusercontent.com/CovidTrackerFr/vitemadose/data-auto/data/output/stats_by_date.json`,
    stats: () => `https://raw.githubusercontent.com/CovidTrackerFr/vitemadose/data-auto/data/output/stats.json`,
    infosDepartement: (codeDepartement) => `https://raw.githubusercontent.com/CovidTrackerFr/vitemadose/data-auto/data/output/${codeDepartement}.json`,
    creneauxQuotidiensDepartement: (codeDepartement,doseType) => {
        if (doseType == 'covid') {
            return `https://raw.githubusercontent.com/CovidTrackerFr/vitemadose/data-auto/data/output/${codeDepartement}/creneaux-quotidiens.json`
        }

        return `https://raw.githubusercontent.com/CovidTrackerFr/vitemadose/data-auto/data/output/monkeypox/${codeDepartement}/creneaux-quotidiens.json`
    }
}
