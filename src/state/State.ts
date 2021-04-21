import {ISODateString, WeekDay} from "../utils/Dates";
import {Strings} from "../utils/Strings";

export type CodeTrancheAge = 'plus75ans';
export type TrancheAge = {
    codeTrancheAge: CodeTrancheAge;
    libelle: string;
};
export const TRANCHES_AGE: Map<CodeTrancheAge, TrancheAge> = new Map([
    ['plus75ans', { codeTrancheAge: 'plus75ans', libelle: "Plus de 75 ans" }]
]);

export type CodeTriCentre = 'date' | 'distance';
export type TriCentre = {
    codeTriCentre: CodeTriCentre;
    libelle: string;
};
export const TRIS_CENTRE: Map<CodeTriCentre, TriCentre> = new Map([
    ['distance', { codeTriCentre: 'distance', libelle: "Au plus proche" }],
    ['date', { codeTriCentre: 'date', libelle: "Disponible au plus vite" }],
]);

const USE_RAW_GITHUB = false
const VMD_BASE_URL = USE_RAW_GITHUB
  ? "https://raw.githubusercontent.com/CovidTrackerFr/vitemadose/data-auto/data/output"
  : "https://vitemadose.gitlab.io/vitemadose"


export type Plateforme = {
    // Should be the same than PLATEFORMES' key
    code: string;
    logo: string;
    nom: string;
    // Should we do promotion of this plateform ? for example on home screen ?
    // (typically, it may be not a good idea to promote the platform while JSON is not producing data for it yet)
    promoted: boolean;
    website: string;
    // Used for specific styling on logos, see for example _searchAppointment.scss
    styleCode: string;
};
export const PLATEFORMES: Record<string, Plateforme> = {
    'Doctolib': { code: 'Doctolib', logo: 'logo_doctolib.png', nom: 'Doctolib', promoted: true,  website: 'https://www.doctolib.fr/',            styleCode: '_doctolib'},
    'Maiia':    { code: 'Maiia',    logo: 'logo_maiia.png',    nom: 'Maiia',    promoted: true,  website: 'https://www.maiia.com/',              styleCode: '_maiia'},
    'Ordoclic': { code: 'Ordoclic', logo: 'logo_ordoclic.png', nom: 'Ordoclic', promoted: true,  website: 'https://covid-pharma.fr/',            styleCode: '_ordoclic'},
    'Keldoc':   { code: 'Keldoc',   logo: 'logo_keldoc.png',   nom: 'Keldoc',   promoted: true,  website: 'https://www.keldoc.com/',             styleCode: '_keldoc'},
    'Pandalab': { code: 'Pandalab', logo: 'logo_pandalab.png', nom: 'Pandalab', promoted: false, website: 'https://masante.pandalab.eu/welcome', styleCode: '_pandalab'},
    'Mapharma': { code: 'Mapharma', logo: 'logo_mapharma.png', nom: 'Mapharma', promoted: true,  website: 'https://mapharma.net/login',          styleCode: '_mapharma'},
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
export type BusinessHours = Record<WeekDay,string>;
export type Lieu = {
    appointment_count: number;
    departement: CodeDepartement;
    location: Coordinates,
    nom: string;
    url: string;
    appointment_by_phone_only: boolean;
    plateforme: string;
    prochain_rdv: ISODateString|null;
    metadata: {
        address: string;
        phone_number: string|undefined;
        business_hours: BusinessHours|undefined
    },
    type: TypeLieu;
    vaccine_type: string
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

export type LieuxParDepartement = {
    lieuxDisponibles: Lieu[];
    lieuxIndisponibles: Lieu[];
    codeDepartements: CodeDepartement[];
    derniereMiseAJour: ISODateString;
};
export type LieuxParDepartements = Map<CodeDepartement, LieuxParDepartement>;

export type LieuAffichableAvecDistance = Lieu & { disponible: boolean, distance: number|undefined };
export type LieuxAvecDistanceParDepartement = {
    lieuxAffichables: LieuAffichableAvecDistance[];
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

function convertDepartementForSort(codeDepartement: CodeDepartement) {
    switch(codeDepartement) {
        case '2A': return '20A';
        case '2B': return '20B';
        default: return codeDepartement;
    }
}

export type StatLieu = {disponibles: number, total: number, creneaux: number};
export type StatLieuGlobale = StatLieu & { proportion: number };
export type StatsLieuParDepartement = Record<string, StatLieu>
export type StatsLieu = {
    parDepartements: StatsLieuParDepartement;
    global: StatLieuGlobale;
}

export type CommunesParAutocomplete = Map<string, Commune[]>;
export type Commune = {
    code: string;
    codePostal: string;
    nom: string;
    codeDepartement: string;
    latitude: number|undefined;
    longitude: number|undefined;
};

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

export class State {
    public static current = new State();

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
        latitude: undefined,
        longitude: undefined,
        nom: ""
    };

    private constructor() {
    }

    private _lieuxParDepartement: LieuxParDepartements = new Map<CodeDepartement, LieuxParDepartement>();
    async lieuxPour(codeDepartement: CodeDepartement, avoidCache: boolean = false): Promise<LieuxParDepartement> {
        if(this._lieuxParDepartement.has(codeDepartement) && !avoidCache) {
            return Promise.resolve(this._lieuxParDepartement.get(codeDepartement)!);
        } else {
            const resp = await fetch(`${VMD_BASE_URL}/${codeDepartement}.json`)
            const results = await resp.json()
            const lieuxParDepartement = {
                lieuxDisponibles: results.centres_disponibles.map(transformLieu),
                lieuxIndisponibles: results.centres_indisponibles.map(transformLieu),
                codeDepartements: [codeDepartement],
                derniereMiseAJour: results.last_updated
            };
            this._lieuxParDepartement.set(codeDepartement, lieuxParDepartement);
            return lieuxParDepartement;
        }
    }

    private _departementsDiponibles: Departement[]|undefined = undefined;
    async departementsDisponibles(): Promise<Departement[]> {
        if(this._departementsDiponibles !== undefined) {
            return Promise.resolve(this._departementsDiponibles);
        } else {
            const resp = await fetch(`${VMD_BASE_URL}/departements.json`)
            const departements: Departement[] = await resp.json()

            this._departementsDiponibles = departements;
            this._departementsDiponibles.sort((d1, d2) => convertDepartementForSort(d1.code_departement).localeCompare(convertDepartementForSort(d2.code_departement)));
            return departements;
        }
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
            const resp = await fetch(`${VMD_BASE_URL}/stats_by_date.json`)
            const statsByDate: StatsByDate = await resp.json()

            this._statsByDate = statsByDate;
            //this._statsByDate.sort((d1, d2) => convertDepartementForSort(d1.code_departement).localeCompare(convertDepartementForSort(d2.code_departement)));
            return statsByDate;
        }
    }

    private _communeAutocompleteTriggers: string[]|undefined = undefined;
    async communeAutocompleteTriggers(basePath: string): Promise<string[]> {
        if(this._communeAutocompleteTriggers !== undefined) {
            return Promise.resolve(this._communeAutocompleteTriggers)
        } else {
            const autocompletes = await fetch(`${basePath}autocompletes.json`).then(resp => resp.json());

            this._communeAutocompleteTriggers = autocompletes;
            return autocompletes;
        }
    }

    private _communesParAutocomplete: CommunesParAutocomplete = new Map<string, Commune[]>();
    async communesPourAutocomplete(basePath: string, autocomplete: string): Promise<Commune[]> {
        if(this._communesParAutocomplete.has(autocomplete)) {
            return this._communesParAutocomplete.get(autocomplete)!;
        } else {
            const communes = await fetch(`${basePath}autocomplete-cache/vmd_${autocomplete}.json`)
                .then(resp => resp.json())
                .then(communesResult => communesResult.communes.map((c: any) => {
                    const commune: Commune = {
                        code: c.c,
                        codePostal: c.z,
                        nom: c.n,
                        codeDepartement: c.d,
                        longitude: c.g?Number(c.g.split(",")[0]):undefined,
                        latitude: c.g?Number(c.g.split(",")[1]):undefined,
                    };
                    return commune;
                }));

            this._communesParAutocomplete.set(autocomplete, communes);
            return communes;
        }
    }

    async chercheCommuneParCode(basePath: string, codePostal: string, codeCommune: string): Promise<Commune> {
        let triggers = await this.communeAutocompleteTriggers(basePath);
        let trigger = triggers.find(trigger => codePostal.startsWith(trigger));
        if (trigger) {
            let communes = await this.communesPourAutocomplete(basePath, trigger);
            return communes.find(commune => commune.code === codeCommune) || State.COMMUNE_VIDE;
        } else {
            return Promise.resolve(State.COMMUNE_VIDE);
        }
    }

    private _statsLieu: StatsLieu|undefined = undefined;
    async statsLieux(): Promise<StatsLieu> {
        if(this._statsLieu !== undefined) {
            return Promise.resolve(this._statsLieu);
        } else {
            const resp = await fetch(`${VMD_BASE_URL}/stats.json`)
            const statsParDepartements: Record<CodeDepartement|'tout_departement', StatLieu> = await resp.json()

            const statsLieu = {
                parDepartements: Object.entries(statsParDepartements)
                    .filter(([dpt, stats]: [CodeDepartement|"tout_departement", StatLieu]) => dpt !== 'tout_departement')
                    .reduce((statsParDept, [dpt, stats]: [CodeDepartement, StatLieu]) => {
                        statsParDepartements[dpt] = stats;
                        return statsParDepartements;
                    }, {} as StatsLieuParDepartement),
                global: {
                    ...statsParDepartements['tout_departement'],
                    proportion: Math.round(statsParDepartements['tout_departement'].disponibles * 10000 / statsParDepartements['tout_departement'].total)/100
                }
            };
            this._statsLieu = statsLieu;
            return statsLieu;
        }
    }
}
