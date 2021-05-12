import {toReadableURLPathValue} from '../utils/string-utils.mjs';

export const rechercheDepartementDescriptor = {
    routerUrl: '/centres-vaccination-covid-dpt:codeDpt-:nomDpt/recherche-:typeRecherche',
    urlGenerator: ({codeDepartement, nomDepartement}) => {
        return ['chronodose', 'standard'].map(typeRecherche => {
            return `/centres-vaccination-covid-dpt${codeDepartement}-${toReadableURLPathValue(nomDepartement)}/recherche-${typeRecherche}`;
        });
    }
};

export const rechercheCommuneDescriptor = {
    routerUrl: '/centres-vaccination-covid-dpt:codeDpt-:nomDpt/commune:codeCommune-:codePostal-:nomCommune/recherche-:typeRecherche/en-triant-par-:codeTriCentre',
    urlGenerator: ({codeDepartement, nomDepartement, codeCommune, codePostal, nomCommune, tri}) => {
        return ['chronodose', 'standard'].map(typeRecherche => {
            return `/centres-vaccination-covid-dpt${codeDepartement}-${toReadableURLPathValue(nomDepartement)}/commune${codeCommune}-${codePostal}-${toReadableURLPathValue(nomCommune)}/recherche-${typeRecherche}/en-triant-par-${tri}`;
        })
    }
};
