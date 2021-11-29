import {Strings} from "../utils/Strings";
import { Autocomplete } from './Autocomplete'
import { Memoize } from 'typescript-memoize'
import {ArrayBuilder} from "../utils/Arrays";
import {RemoteConfig} from "../utils/RemoteConfig";

export type CodeTrancheAge = 'plus75ans';
export type TrancheAge = {
    codeTrancheAge: CodeTrancheAge;
    libelle: string;
};
export const TRANCHES_AGE: Map<CodeTrancheAge, TrancheAge> = new Map([
    ['plus75ans', { codeTrancheAge: 'plus75ans', libelle: "Plus de 75 ans" }]
]);


export type SearchRequest = SearchRequest.ByCommune | SearchRequest.ByDepartement
export namespace SearchRequest {
  export type ByDepartement = {
      type: SearchType,
      par: 'departement',
      departement: Departement,
      tri: 'date',
      date: string|undefined
  }
  export function ByDepartement (departement: Departement, type: SearchType, date: string|undefined): ByDepartement {
    return { type, par: 'departement', departement, tri: 'date', date }
  }
  export function isByDepartement (searchRequest: SearchRequest): searchRequest is ByDepartement {
    return searchRequest.par === 'departement'
  }

  export type ByCommune = {
    type: SearchType,
    par: 'commune',
    commune: Commune,
    tri: 'distance',
    date: string|undefined
  }
  export function ByCommune (commune: Commune, type: SearchType, date: string|undefined): ByCommune {
    return { type, par: 'commune', commune, tri: 'distance', date }
  }
  export function isByCommune (searchRequest: SearchRequest): searchRequest is ByCommune {
    return searchRequest.par === 'commune'
  }
}

export type CodeTriCentre = 'date' | 'distance';

export type TypePlateforme = "Doctolib"|"Maiia"|"Ordoclic"|"Keldoc"|"Pandalab"|"Mapharma"|"AvecMonDoc"|"Clikodoc"|"mesoigner"|"Bimedoc"|"Valwin";
export type Plateforme = {
    // Should be the same than PLATEFORMES' key
    code: TypePlateforme;
    logo: string;
    nom: string;
    // Should we do promotion of this plateform ? for example on home screen ?
    // (typically, it may be not a good idea to promote the platform while JSON is not producing data for it yet)
    promoted: boolean;
    website: string;
    // Used for specific styling on logos, see for example _searchAppointment.scss
    styleCode: string;
};
export const PLATEFORMES: Record<TypePlateforme, Plateforme> = {
    'Doctolib': { code: 'Doctolib', logo: 'logo_doctolib.png', nom: 'Doctolib', promoted: true,  website: 'https://www.doctolib.fr/',  styleCode: '_doctolib'},
    'Maiia':    { code: 'Maiia',    logo: 'logo_maiia.png',    nom: 'Maiia',    promoted: true,  website: 'https://www.maiia.com/', styleCode: '_maiia'},
    'Ordoclic': { code: 'Ordoclic', logo: 'logo_ordoclic.png', nom: 'Ordoclic', promoted: true,  website: 'https://covid-pharma.fr/', styleCode: '_ordoclic'},
    'Keldoc':   { code: 'Keldoc',   logo: 'logo_keldoc.png',   nom: 'Keldoc',   promoted: true,  website: 'https://www.keldoc.com/', styleCode: '_keldoc'},
    'Pandalab': { code: 'Pandalab', logo: 'logo_pandalab.png', nom: 'Pandalab', promoted: false, website: 'https://masante.pandalab.eu/welcome', styleCode: '_pandalab'},
    'Mapharma': { code: 'Mapharma', logo: 'logo_mapharma.png', nom: 'Mapharma', promoted: true,  website: 'https://mapharma.net/login', styleCode: '_mapharma'},
    'AvecMonDoc': { code: 'AvecMonDoc', logo: 'logo_avecmondoc.png', nom: 'AvecMonDoc', promoted: true,  website: 'https://www.avecmondoc.com/', styleCode: '_avecmondoc'},
    'Clikodoc': { code: 'Clikodoc', logo: 'logo_clikodoc.png', nom: 'Clikodoc', promoted: false,  website: 'https://www.clikodoc.com/', styleCode: '_clikodoc'},
    'mesoigner': { code: 'mesoigner', logo: 'logo_mesoigner.svg', nom: 'MeSoigner', promoted: true, website: 'https://www.mesoigner.fr/', styleCode: '_mesoigner'},
    'Bimedoc': { code: 'Bimedoc', logo: 'logo_bimedoc.svg', nom: 'Bimedoc', promoted: true, website: 'https://www.bimedoc.com/', styleCode: '_bimedoc' },
    'Valwin': { code: 'Valwin', logo: 'logo_valwin.png', nom: 'Valwin', promoted: true, website: 'https://www.valwin.fr/', styleCode: '_valwin' },
    // Beware: if you add a new plateform, don't forget to update 'hardcoded' (indexable) content
    // in index.html page, referencing the list of supported plateforms
};

export type CodeDepartement = string;
export type Departement = {
    code_departement: CodeDepartement;
    nom_departement: string;
    code_region: number;
    nom_region: string;
};

// Permet de convertir un nom de departement en un chemin d'url correct (remplacement des caractères
// non valides comme les accents ou les espaces)
export const libelleUrlPathDuDepartement = (departement: Departement) => {
    return Strings.toReadableURLPathValue(departement.nom_departement);
}

export type TypeLieu = 'vaccination-center'|'drugstore'|'general-practitioner';
export const TYPES_LIEUX: {[k in TypeLieu]: string} = {
    "vaccination-center": 'Centre de vaccination',
    "drugstore": 'Pharmacie',
    "general-practitioner": 'Médecin généraliste',
};
export type ISODateString = string
export type WeekDay = "lundi"|"mardi"|"mercredi"|"jeudi"|"vendredi"|"samedi"|"dimanche"
export type BusinessHours = Record<WeekDay,string>;
export type VaccineType = "AstraZeneca"|"Janssen"|"Pfizer-BioNTech"|"Moderna"|"ARNm";
export type AppointmentPerVaccine = {
    vaccine_type: VaccineType;
    appointments: number;
};
export type AppointmentSchedule = {
    name: string;
    from: string; // Should be better to have ISODateString here
    to: string; // Should be better to have ISODateString here
    // appointments_per_vaccine: AppointmentPerVaccine[];
    total: number;
};
export type Lieu = {
    appointment_count: number;
    departement: CodeDepartement;
    location: Location,
    nom: string;
    url: string;
    appointment_by_phone_only: boolean;
    appointment_schedules: AppointmentSchedule[]|undefined;
    plateforme: TypePlateforme;
    prochain_rdv: ISODateString|null;
    internal_id: string;
    metadata: {
        address: string;
        phone_number: string|undefined;
        business_hours: BusinessHours|undefined
    },
    type: TypeLieu;
    vaccine_type: VaccineType
};
function transformLieu(rawLieu: any): Lieu {
    return {
        ...rawLieu,
        appointment_count: rawLieu.appointment_count || 0,
        metadata: {
            ...rawLieu.metadata,
            address: (typeof rawLieu.metadata.address === 'string')?
                rawLieu.metadata.address
                :[
                    rawLieu.metadata.address.adr_num,
                    rawLieu.metadata.address.adr_voie,
                    rawLieu.metadata.address.com_cp,
                    rawLieu.metadata.address.com_nom
                ].filter(val => !!val).join(" "),
        },
        vaccine_type: rawLieu.vaccine_type?((rawLieu.vaccine_type.length===undefined?[rawLieu.vaccine_type]:rawLieu.vaccine_type)).join(", "):undefined
    };
}

export type Coordinates = { latitude: number, longitude: number }
export type Location = Coordinates & {city: string, cp: string}
export type TagCreneau = /*"preco18_55"|*/"all"|"first_or_second_dose"|"third_dose"|"unknown_dose";
export type StatsCreneauxQuotidienParTag = {
    tag: TagCreneau;
    creneaux: number;
    creneauxParHeure: [number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number];
};
export type StatsCreneauxQuotidienParTag_JSON = {
    tag: TagCreneau;
    creneaux: number;
    creneaux_par_heure: [number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number];
};
export type StatsCreneauxParLieu = {
    lieu: string;
    statsCreneauxParTag: StatsCreneauxQuotidienParTag[];
};
export type CreneauxParLieu_JSON = {
    lieu: string;
    creneaux_par_tag: StatsCreneauxQuotidienParTag_JSON[];
};
export type CreneauxParLieu = {
    lieu: string;
    creneaux: number;
}
export type RendezVousDuJour = {
    date: string; // "2021-05-23"
    total: number;
    creneauxParLieu: CreneauxParLieu[];
}
export type StatsCreneauxLieuxParJour = {
    date: string; // "2021-05-23"
    codesDepartement: CodeDepartement[];
    total: number;
    statsCreneauxParLieu: StatsCreneauxParLieu[];
}
export function countCreneauxFromCreneauxParTag(statsCreneauxQuotidiensParTag: StatsCreneauxQuotidienParTag[], tag: TagCreneau): number {
    return statsCreneauxQuotidiensParTag.find(cpt => cpt.tag===tag)?.creneaux || 0;
}
export function countCreneauxFromStatsCreneauxLieux(statsCreneauxLieuxParJour: StatsCreneauxLieuxParJour, tag: TagCreneau) {
    return statsCreneauxLieuxParJour.statsCreneauxParLieu.reduce((total, lieu) => total + countCreneauxFromCreneauxParTag(lieu.statsCreneauxParTag, tag), 0);
}
export type StatsCreneauxLieuxParJour_JSON = {
    date: string; // "2021-05-23"
    total: number;
    creneaux_par_lieu: CreneauxParLieu_JSON[];
}
export type InfosDepartementAdditionnelles_JSON = {
    creneaux_quotidiens: StatsCreneauxLieuxParJour_JSON[];
};

export type LieuxParDepartement = {
    lieuxDisponibles: Lieu[];
    lieuxIndisponibles: Lieu[];
    codeDepartements: CodeDepartement[];
    statsCreneauxLieuxQuotidiens: StatsCreneauxLieuxParJour[];
    derniereMiseAJour: ISODateString;
};

export type LieuxParDepartement_JSON = {
    centres_disponibles: Lieu[];
    centres_indisponibles: Lieu[];
    last_updated: string;
};

export type LieuAffichableAvecDistance = Lieu & { disponible: boolean, distance: number|undefined };
export type LieuxAvecDistanceParDepartement = {
    lieuxMatchantCriteres: LieuAffichableAvecDistance[];
    lieuxDisponibles: LieuAffichableAvecDistance[];
    codeDepartements: CodeDepartement[];
    derniereMiseAJour: ISODateString;
};
export function typeActionPour(lieuAffichable: LieuAffichableAvecDistance): 'actif-via-plateforme'|'inactif-via-plateforme'|'actif-via-tel'|'inactif' {
    const phoneOnly = lieuAffichable.appointment_by_phone_only && lieuAffichable.metadata.phone_number;
    if(phoneOnly) { // Phone only may have url, but we should ignore it !
        return 'actif-via-tel';
    } else if(lieuAffichable && lieuAffichable.appointment_count !== 0){
        return 'actif-via-plateforme';
    } else if(lieuAffichable && lieuAffichable.appointment_count === 0){
        return 'inactif-via-plateforme';
    } else {
        return 'inactif';
    }
}
export function isLieuActif(lieuAffichable: LieuAffichableAvecDistance) {
    return ['actif-via-tel', 'actif-via-plateforme'].includes(typeActionPour(lieuAffichable));
}

function convertDepartementForSort(codeDepartement: CodeDepartement) {
    switch(codeDepartement) {
        case '2A': return '20A';
        case '2B': return '20B';
        default: return codeDepartement;
    }
}

const DEPARTEMENT_OM: Departement = {
    code_departement: 'om',
    nom_departement: "Collectivités d'Outremer",
    code_region: -1,
    nom_region: "Outremer"
};


export type StatLieu = {disponibles: number, total: number, creneaux: number};
export type StatLieuGlobale = StatLieu & { proportion: number };
export type StatsLieuParDepartement = Record<string, StatLieu>
export type StatsLieu = {
    parDepartements: StatsLieuParDepartement;
    global: StatLieuGlobale;
}

export type CommunesParAutocomplete = Map<string, Commune[]>;
export interface Commune {
    code: string;
    codePostal: string;
    nom: string;
    codeDepartement: string;
    latitude: number;
    longitude: number;
}

export type StatsByDate = {
    dates: ISODateString[],
    total_centres_disponibles: number[],
    total_centres: number[],
    total_appointments: number[]
}

// Permet de convertir un nom de departement en un chemin d'url correct (remplacement des caractères
// non valides comme les accents ou les espaces)
export const libelleUrlPathDeCommune = (commune: Commune) => {
    return Strings.toReadableURLPathValue(commune.nom);
}

/*
type VaccineCategory = {code: SearchType, libelle: string};
export const VACCINE_CATEGORIES: VaccineCategory[] = [
    { code: "18_55", libelle: "Préconisé pour les 18-55 ans" },
    // { code: "16_18", libelle: "Préconisé pour les 16-18 ans" },
    { code: "standard", libelle: "Tous" },
];
 */

export type SearchType = "standard"| /*"18_55"|*/ "dose_rappel"|"dose_1_ou_2"|"dose_indeterminee";
export const TYPE_RECHERCHE_PAR_DEFAUT: SearchType = "dose_rappel";

export type SearchTypeConfig = {
    tagCreneau: TagCreneau;
    cardAppointmentsExtractor: (lieu: Lieu, daySelectorDisponible: boolean, creneauxParLieux: CreneauxParLieu[]) => number;
    lieuConsidereCommeDisponible: (lieu: LieuAffichableAvecDistance, creneauxParLieu: CreneauxParLieu|undefined) => boolean;
    pathParam: string;
    standardTabSelected: boolean;
    excludeAppointmentByPhoneOnly: boolean;
    jourSelectionnable: boolean;
    theme: 'standard'|'highlighted';
    analytics: {
        searchResultsByDepartement: string;
        searchResultsByCity: string;
    }
};
const SEARCH_TYPE_CONFIGS: {[type in SearchType]: SearchTypeConfig & {type: type}} = {
    'standard': {
        type: 'standard',
        tagCreneau: "all",
        cardAppointmentsExtractor: (lieu, daySelectorDisponible, creneauxParLieux) => daySelectorDisponible
            ?creneauxParLieux.find(cpl => cpl.lieu === lieu.internal_id)?.creneaux || 0
            :lieu.appointment_count,
        lieuConsidereCommeDisponible: (lieu, creneauxParLieu) => lieu.appointment_by_phone_only || (creneauxParLieu?.creneaux || 0) > 0,
        pathParam: 'standard',
        standardTabSelected: true,
        excludeAppointmentByPhoneOnly: false,
        jourSelectionnable: true,
        theme: 'standard',
        analytics: {
            searchResultsByDepartement: 'search_results_by_department',
            searchResultsByCity: 'search_results_by_city'
        }
    },
    /*
    '18_55': {
        type: '18_55',
        tagCreneau: "preco18_55",
        cardAppointmentsExtractor: (lieu, daySelectorDisponible, creneauxParLieux) => {
            if(daySelectorDisponible) {
                return creneauxParLieux.find(cpl => cpl.lieu === lieu.internal_id)?.creneaux || 0
            }
            throw new Error("We're not supposed to call cardAppointmentsExtractor() on 18_55 without day selector !")
        },
        lieuConsidereCommeDisponible: (lieu, creneauxParLieu) => lieu.appointment_by_phone_only || (creneauxParLieu?.creneaux || 0) > 0,
        pathParam: '18_55',
        standardTabSelected: true,
        excludeAppointmentByPhoneOnly: false,
        jourSelectionnable: true,
        theme: 'standard',
        analytics: {
            searchResultsByDepartement: 'search_results_by_department_18_55',
            searchResultsByCity: 'search_results_by_city_18_55'
        }
    },
     */
    'dose_rappel': {
        type: 'dose_rappel',
        tagCreneau: 'third_dose',
        cardAppointmentsExtractor: (lieu, daySelectorDisponible, creneauxParLieux) => daySelectorDisponible
            ?creneauxParLieux.find(cpl => cpl.lieu === lieu.internal_id)?.creneaux || 0
            :lieu.appointment_count,
        lieuConsidereCommeDisponible: (lieu, creneauxParLieu) => lieu.appointment_by_phone_only || (creneauxParLieu?.creneaux || 0) > 0,
        pathParam: 'dose_rappel',
        standardTabSelected: true,
        excludeAppointmentByPhoneOnly: false,
        jourSelectionnable: true,
        theme: 'standard',
        analytics: {
            searchResultsByDepartement: 'search_results_by_department_third_shot',
            searchResultsByCity: 'search_results_by_city_third_shot'
        }
    },
    'dose_1_ou_2': {
        type: 'dose_1_ou_2',
        tagCreneau: 'first_or_second_dose',
        cardAppointmentsExtractor: (lieu, daySelectorDisponible, creneauxParLieux) => daySelectorDisponible
            ?creneauxParLieux.find(cpl => cpl.lieu === lieu.internal_id)?.creneaux || 0
            :lieu.appointment_count,
        lieuConsidereCommeDisponible: (lieu, creneauxParLieu) => lieu.appointment_by_phone_only || (creneauxParLieu?.creneaux || 0) > 0,
        pathParam: 'dose_1_ou_2',
        standardTabSelected: true,
        excludeAppointmentByPhoneOnly: false,
        jourSelectionnable: true,
        theme: 'standard',
        analytics: {
            searchResultsByDepartement: 'search_results_by_department_first_or_second_shot',
            searchResultsByCity: 'search_results_by_city_first_or_second_shot'
        }
    },
    'dose_indeterminee': {
        type: 'dose_indeterminee',
        tagCreneau: 'unknown_dose',
        cardAppointmentsExtractor: (lieu, daySelectorDisponible, creneauxParLieux) => daySelectorDisponible
            ?creneauxParLieux.find(cpl => cpl.lieu === lieu.internal_id)?.creneaux || 0
            :lieu.appointment_count,
        lieuConsidereCommeDisponible: (lieu, creneauxParLieu) => lieu.appointment_by_phone_only || (creneauxParLieu?.creneaux || 0) > 0,
        pathParam: 'dose_indeterminee',
        standardTabSelected: true,
        excludeAppointmentByPhoneOnly: false,
        jourSelectionnable: true,
        theme: 'standard',
        analytics: {
            searchResultsByDepartement: 'search_results_by_department_unknown_shot',
            searchResultsByCity: 'search_results_by_city_unknown_shot'
        }
    },
};
export function searchTypeConfigFromPathParam(pathParams: Record<string,string>): SearchTypeConfig & {type: SearchType} {
    const config = Object.values(SEARCH_TYPE_CONFIGS).find(config => pathParams && config.pathParam === pathParams['typeRecherche']);
    if(config) {
        return config;
    }
    throw new Error(`No config found for path param: ${pathParams['typeRecherche']}`);
}
export function searchTypeConfigFromSearch(searchRequest: SearchRequest|void, fallback: SearchType) {
    return searchTypeConfigFor(searchRequest ? searchRequest.type : fallback);
}
export function searchTypeConfigFor(searchType: SearchType): SearchTypeConfig & {type: SearchType} {
    return SEARCH_TYPE_CONFIGS[searchType];
}

export class State {

    @Memoize()
    public static get current (): State {
      return new State()
    }

    private static DEPARTEMENT_VIDE: Departement = {
        code_departement: "",
        code_region: 0,
        nom_departement: "",
        nom_region: ""
    };

    private static COMMUNE_VIDE: Commune = {
        code: "",
        codeDepartement: "",
        codePostal: "",
        latitude: 0,
        longitude: 0,
        nom: ""
    };

    readonly autocomplete: Autocomplete

    private constructor() {
      const webBaseUrl = import.meta.env.BASE_URL
      this.autocomplete = new Autocomplete(webBaseUrl, () => this.departementsDisponibles())
    }

    async lieuxPour(codesDepartements: CodeDepartement[]): Promise<LieuxParDepartement> {
        const urlGenerator = await RemoteConfig.INSTANCE.urlGenerator();
        const [principalLieuxDepartement, ...lieuxDepartementsAditionnels] = await Promise.all(
            codesDepartements.map(codeDept => Promise.all([
                fetch(urlGenerator.infosDepartement(codeDept), { cache: 'no-cache' })
                    .then(resp => resp.json())
                    .then((statsDept: LieuxParDepartement_JSON) => ({...statsDept, codeDepartement: codeDept} as LieuxParDepartement_JSON & {codeDepartement: string})),
                fetch(urlGenerator.creneauxQuotidiensDepartement(codeDept), { cache: 'no-cache' })
                    .then(resp => resp.json())
                    .then((creneauxQuotidiens: InfosDepartementAdditionnelles_JSON|undefined) => creneauxQuotidiens),
            ]).then(([lieuxParDepartement, infosDeptAdditionnelles] : [LieuxParDepartement_JSON & {codeDepartement: string}, InfosDepartementAdditionnelles_JSON|undefined]) => ({
                ...lieuxParDepartement,
                creneaux_quotidiens: infosDeptAdditionnelles?.creneaux_quotidiens || []
            }))
        ));

        const lieuxParDepartement: LieuxParDepartement = [principalLieuxDepartement].concat(lieuxDepartementsAditionnels).reduce((mergedLieuxParDepartement, lieuxParDepartement) => {
            const creneauxQuotidiens = mergedLieuxParDepartement.statsCreneauxLieuxQuotidiens;
            (lieuxParDepartement.creneaux_quotidiens || []).forEach((creneauxQuotidien) => {
                if(!creneauxQuotidiens.find(cq => cq.date === creneauxQuotidien.date)) {
                    creneauxQuotidiens.push({
                        codesDepartement: [],
                        date: creneauxQuotidien.date,
                        total: 0,
                        statsCreneauxParLieu: []
                    })
                }
                const creneauxQuotidienMatchingDate = creneauxQuotidiens.find(cq => cq.date === creneauxQuotidien.date)!;

                creneauxQuotidienMatchingDate.codesDepartement.push(lieuxParDepartement.codeDepartement);
                creneauxQuotidienMatchingDate.total += creneauxQuotidien.total;
                Array.prototype.push.apply(creneauxQuotidienMatchingDate.statsCreneauxParLieu, creneauxQuotidien.creneaux_par_lieu.map<StatsCreneauxParLieu>(cpl => ({
                    lieu: cpl.lieu,
                    statsCreneauxParTag: cpl.creneaux_par_tag.map(cpt => ({
                        tag: cpt.tag,
                        creneaux: cpt.creneaux,
                        creneauxParHeure: cpt.creneaux_par_heure
                    }))
                })));
            });

            const lieuxParDepartementMerge: LieuxParDepartement = {
                codeDepartements: mergedLieuxParDepartement.codeDepartements.concat(lieuxParDepartement.codeDepartement),
                derniereMiseAJour: mergedLieuxParDepartement.derniereMiseAJour,
                lieuxDisponibles: mergedLieuxParDepartement.lieuxDisponibles.concat(lieuxParDepartement.centres_disponibles.map(transformLieu)),
                lieuxIndisponibles: mergedLieuxParDepartement.lieuxIndisponibles.concat(lieuxParDepartement.centres_indisponibles.map(transformLieu)),
                statsCreneauxLieuxQuotidiens: creneauxQuotidiens
            };
            return lieuxParDepartementMerge;
        }, {
            codeDepartements: [],
            derniereMiseAJour: principalLieuxDepartement.last_updated,
            lieuxDisponibles: [],
            lieuxIndisponibles: [],
            statsCreneauxLieuxQuotidiens: []
        } as LieuxParDepartement);

        lieuxParDepartement.statsCreneauxLieuxQuotidiens = ArrayBuilder.from(lieuxParDepartement.statsCreneauxLieuxQuotidiens)
            .sortBy(cq => cq.date)
            .build();

        return lieuxParDepartement;
    }

    @Memoize()
    async departementsDisponibles(): Promise<Departement[]> {
        const urlGenerator = await RemoteConfig.INSTANCE.urlGenerator();
        const resp = await fetch(urlGenerator.listDepartements());
        const departements: Departement[] = await resp.json();

        if (!departements.find(d => d.code_departement === DEPARTEMENT_OM.code_departement)) {
            // The OM departement is missing in back-end departements.json.
            departements.push(DEPARTEMENT_OM);
        }

        return departements.sort((d1, d2) => convertDepartementForSort(d1.code_departement).localeCompare(convertDepartementForSort(d2.code_departement)))
    }

    async chercheDepartementParCode(code: string): Promise<Departement> {
        let deps = await this.departementsDisponibles();
        return deps.find(dep => dep.code_departement === code) || State.DEPARTEMENT_VIDE;
    }

    private _statsByDate: StatsByDate|undefined = undefined;
    async statsByDate(): Promise<StatsByDate> {
        if(this._statsByDate !== undefined) {
            return Promise.resolve(this._statsByDate);
        } else {
            const urlGenerator = await RemoteConfig.INSTANCE.urlGenerator();
            const resp = await fetch(urlGenerator.statsByDate())
            const statsByDate: StatsByDate = await resp.json()

            this._statsByDate = statsByDate;
            return statsByDate;
        }
    }

    async chercheCommuneParCode(codePostal: string, codeCommune: string): Promise<Commune> {
        const commune = await this.autocomplete.findCommune(codePostal, codeCommune)
        return commune || State.COMMUNE_VIDE
    }

    @Memoize()
    async statsLieux(): Promise<StatsLieu> {
      const urlGenerator = await RemoteConfig.INSTANCE.urlGenerator();
      const resp = await fetch(urlGenerator.stats())
      const statsParDepartements: Record<CodeDepartement|'tout_departement', StatLieu> = await resp.json()
      const { tout_departement: global, ...parDepartements } = statsParDepartements
      return {
          parDepartements,
          global: {
              ...global,
              proportion: Math.round(global.disponibles * 10000 / global.total)/100
          }
      };
    }

}
