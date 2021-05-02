import {
    CodeDepartement, CodeTriCentre,
    Commune,
    Lieu,
    LieuxAvecDistanceParDepartement, typeActionPour,
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

    clickSurRdv(lieu: Lieu) {
        window.dataLayer.push({
            'event': 'rdv_click',
            'rdv_departement' : lieu.departement,
            'rdv_platorm' : lieu.plateforme,
            'rdv_platform' : lieu.plateforme,
            'rdv_name': lieu.nom,
            'rdv_location_type' : lieu.type,
            'rdv_vaccine' : lieu.vaccine_type,
            'rdv_filter_type' : undefined
        });
    }

    clickSurVerifRdv(lieu: Lieu) {
        window.dataLayer.push({
            'event': 'rdv_verify',
            'rdv_departement' : lieu.departement,
            'rdv_platorm' : lieu.plateforme,
            'rdv_platform' : lieu.plateforme,
            'rdv_name': lieu.nom,
            'rdv_location_type' : lieu.type,
            'rdv_vaccine' : lieu.vaccine_type,
            'rdv_filter_type' : undefined
        });
    }

    rechercheLieuEffectuee(codeDepartement: CodeDepartement, commune: Commune|undefined, resultats: LieuxAvecDistanceParDepartement|undefined) {
        window.dataLayer.push({
            'event': commune?'search_by_commune':'search_by_departement',
            'search_departement': codeDepartement,
            'search_commune' : commune?`${commune.codePostal} - ${commune.nom} (${commune.code})`:undefined,
            // kept for legacy reasons
            'search_nb_doses' : resultats?resultats.lieuxAffichables.reduce((totalDoses, lieu) => totalDoses+lieu.appointment_count, 0):undefined,
            'search_nb_appointments' : resultats?resultats.lieuxAffichables.reduce((totalDoses, lieu) => totalDoses+lieu.appointment_count, 0):undefined,
            'search_nb_lieu_vaccination' : resultats?resultats.lieuxAffichables
                .filter(l => typeActionPour(l) === 'actif-via-plateforme' || typeActionPour(l) === 'actif-via-tel')
                .length:undefined,
            'search_nb_lieu_vaccination_inactive' : resultats?resultats.lieuxAffichables
                .filter(l => typeActionPour(l) === 'inactif')
                .length:undefined,
            'search_filter_type': (this as any).critèreDeTri || 'date'
        });
    }

    critereTriCentresMisAJour(triCentre: CodeTriCentre) {
        window.dataLayer.push({
            'event': 'sort_change',
            'sort_changed_to' : triCentre,
        });
    }
	
	critereTypeVaccinMisAJour(typeVaccin: CodeTypeVaccin) {
        window.dataLayer.push({
            'event': 'type_change',
            'type_changed_to' : typeVaccin,
        });
    }

}
