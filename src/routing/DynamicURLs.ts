import type {CodeTriCentre} from "../state/State";
import {Strings} from "../utils/Strings";
import {DoseType} from "../state/State";

export const rechercheDepartementDescriptor = {
    routerUrl: '/centres-vaccination-:doseType-dpt:codeDpt-:nomDpt/recherche-:typeRecherche',
    urlGenerator: ({codeDepartement, nomDepartement, doseType}: {codeDepartement: string, nomDepartement: string, doseType: DoseType}) => {
        return ['standard', /* '18_55' */, 'dose_rappel', 'dose_1_enfants', 'dose_1_ou_2'].map(typeRecherche => {
            return `/centres-vaccination-${doseType}-dpt${codeDepartement}-${Strings.toReadableURLPathValue(nomDepartement)}/recherche-${typeRecherche}`;
        });
    }
};

export const rechercheCommuneDescriptor = {
    routerUrl: '/centres-vaccination-:doseType-dpt:codeDpt-:nomDpt/commune:codeCommune-:codePostal-:nomCommune/recherche-:typeRecherche/en-triant-par-:codeTriCentre',
    urlGenerator: ({codeDepartement, nomDepartement, codeCommune, codePostal, nomCommune, tri, doseType}: {codeDepartement: string, nomDepartement: string, codeCommune: string, codePostal: string, nomCommune: string, tri: CodeTriCentre, doseType: DoseType}) => {
        return ['standard', /* '18_55' */, 'dose_rappel', 'dose_1_enfants', 'dose_1_ou_2'].map(typeRecherche => {
            return `/centres-vaccination-${doseType}-dpt${codeDepartement}-${Strings.toReadableURLPathValue(nomDepartement)}/commune${codeCommune}-${codePostal}-${Strings.toReadableURLPathValue(nomCommune)}/recherche-${typeRecherche}/en-triant-par-${tri}`;
        })
    }
};
