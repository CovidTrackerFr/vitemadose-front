import {
    CodeDepartement, CodeTriCentre,
    Commune, isLieuActif,
    Lieu,
    LieuxAvecDistanceParDepartement, SearchType,
} from "../state/State";


type PushBaseParams = Record<string, string|number|undefined> & {event: string};

declare global {
    interface Window {
        dataLayer: {
            push: (params: PushBaseParams) => void;
        };
    }
}

export class Analytics {
    public static readonly INSTANCE = new Analytics();

    protected constructor() {
    }

    navigationSurNouvellePage(nomPage: string) {
        window.dataLayer.push({
            'event': 'change_screen',
            'site_name' : 'vite_ma_dose',
            'page_type' : nomPage
        });
    }

    clickSurRdv(lieu: Lieu, triCentre: CodeTriCentre, searchType: SearchType, commune: Commune|undefined) {
        window.dataLayer.push({
            'event': 'rdv_click',
            'rdv_departement' : lieu.departement,
            'rdv_commune' : commune?`${commune.codePostal} - ${commune.nom} (${commune.code})`:undefined,
            'rdv_platform' : lieu.plateforme,
            'rdv_name': lieu.nom,
            'rdv_location_type' : lieu.type,
            'rdv_vaccine' : lieu.vaccine_type,
            'rdv_sort_type' : triCentre,
            'rdv_filter_type' : [`kind:${searchType}`].join("|")
        });
    }

    clickSurVerifRdv(lieu: Lieu, triCentre: CodeTriCentre, searchType: SearchType, commune: Commune|undefined) {
        window.dataLayer.push({
            'event': 'rdv_verify',
            'rdv_departement' : lieu.departement,
            'rdv_commune' : commune?`${commune.codePostal} - ${commune.nom} (${commune.code})`:undefined,
            'rdv_platform' : lieu.plateforme,
            'rdv_name': lieu.nom,
            'rdv_location_type' : lieu.type,
            'rdv_vaccine' : lieu.vaccine_type,
            'rdv_sort_type' : triCentre,
            'rdv_filter_type' : [`kind:${searchType}`].join("|")
        });
    }

    rechercheLieuEffectuee(codeDepartement: CodeDepartement, triCentre: CodeTriCentre, searchType: SearchType, commune: Commune|undefined, resultats: LieuxAvecDistanceParDepartement|undefined) {
        window.dataLayer.push({
            'event': commune?'search_by_commune':'search_by_departement',
            'search_departement': codeDepartement,
            'search_commune' : commune?`${commune.codePostal} - ${commune.nom} (${commune.code})`:undefined,
            'search_nb_appointments' : resultats?resultats.lieuxAffichables.reduce((totalDoses, lieu) => totalDoses+lieu.appointment_count, 0):undefined,
            'search_nb_lieu_vaccination' : resultats?resultats.lieuxAffichables
                .filter(isLieuActif)
                .length:undefined,
            'search_nb_lieu_vaccination_inactive' : resultats?resultats.lieuxAffichables
                .filter(l => !isLieuActif(l))
                .length:undefined,
            'search_sort_type': triCentre,
            'search_filter_type' : [`kind:${searchType}`].join("|")
        });
    }

    critereTriCentresMisAJour(triCentre: CodeTriCentre) {
        window.dataLayer.push({
            'event': 'sort_change',
            'sort_changed_to' : triCentre,
        });
    }

}
