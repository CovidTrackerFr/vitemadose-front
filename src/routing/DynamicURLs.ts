import type {CodeTriCentre} from "../state/State";
import {Strings} from "../utils/Strings";

export const rechercheDepartementDescriptor = {
    routerUrl: '/centres-vaccination-covid-dpt:codeDpt-:nomDpt/recherche-:typeRecherche',
    urlGenerator: ({codeDepartement, nomDepartement}: {codeDepartement: string, nomDepartement: string}) => {
        return ['standard'].map(typeRecherche => {
            return `/centres-vaccination-covid-dpt${codeDepartement}-${Strings.toReadableURLPathValue(nomDepartement)}/recherche-${typeRecherche}`;
        });
    }
};

export const rechercheCommuneDescriptor = {
    routerUrl: '/centres-vaccination-covid-dpt:codeDpt-:nomDpt/commune:codeCommune-:codePostal-:nomCommune/recherche-:typeRecherche/en-triant-par-:codeTriCentre',
    urlGenerator: ({codeDepartement, nomDepartement, codeCommune, codePostal, nomCommune, tri}: {codeDepartement: string, nomDepartement: string, codeCommune: string, codePostal: string, nomCommune: string, tri: CodeTriCentre}) => {
        return ['standard'].map(typeRecherche => {
            return `/centres-vaccination-covid-dpt${codeDepartement}-${Strings.toReadableURLPathValue(nomDepartement)}/commune${codeCommune}-${codePostal}-${Strings.toReadableURLPathValue(nomCommune)}/recherche-${typeRecherche}/en-triant-par-${tri}`;
        })
    }
};
