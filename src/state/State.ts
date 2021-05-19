import {DateString, ISODateString, WeekDay} from "../utils/Dates";
import {Strings} from "../utils/Strings";
import { Autocomplete } from './Autocomplete'
import { Memoize } from 'typescript-memoize'

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
      departement: Departement
  }
  export function ByDepartement (departement: Departement, type: SearchType): ByDepartement {
    return { type, par: 'departement', departement }
  }
  export function isByDepartement (searchRequest: SearchRequest): searchRequest is ByDepartement {
    return searchRequest.par === 'departement'
  }

  export type ByCommune = {
    type: SearchType,
    par: 'commune',
    commune: Commune,
    tri: CodeTriCentre
  }
  export function ByCommune (commune: Commune, tri: CodeTriCentre, type: SearchType): ByCommune {
    return { type, par: 'commune', commune, tri }
  }
  export function isByCommune (searchRequest: SearchRequest): searchRequest is ByCommune {
    return searchRequest.par === 'commune'
  }

  export function isChronodoseType(searchRequest: SearchRequest|void) {
    return !!searchRequest && searchRequest.type === 'chronodose';
  }
  export function isStandardType(searchRequest: SearchRequest|void) {
    return !!searchRequest && searchRequest.type === 'standard';
  }
}

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


export type TypePlateforme = "Doctolib"|"Maiia"|"Ordoclic"|"Keldoc"|"Pandalab"|"Mapharma";
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
    highlightEnabled: boolean;
};
export const PLATEFORMES: Record<TypePlateforme, Plateforme> = {
    'Doctolib': { code: 'Doctolib', logo: 'logo_doctolib.png', nom: 'Doctolib', promoted: true,  website: 'https://www.doctolib.fr/',            highlightEnabled: true,  styleCode: '_doctolib'},
    'Maiia':    { code: 'Maiia',    logo: 'logo_maiia.png',    nom: 'Maiia',    promoted: true,  website: 'https://www.maiia.com/',              highlightEnabled: false, styleCode: '_maiia'},
    'Ordoclic': { code: 'Ordoclic', logo: 'logo_ordoclic.png', nom: 'Ordoclic', promoted: true,  website: 'https://covid-pharma.fr/',            highlightEnabled: false, styleCode: '_ordoclic'},
    'Keldoc':   { code: 'Keldoc',   logo: 'logo_keldoc.png',   nom: 'Keldoc',   promoted: true,  website: 'https://www.keldoc.com/',             highlightEnabled: false, styleCode: '_keldoc'},
    'Pandalab': { code: 'Pandalab', logo: 'logo_pandalab.png', nom: 'Pandalab', promoted: false, website: 'https://masante.pandalab.eu/welcome', highlightEnabled: false, styleCode: '_pandalab'},
    'Mapharma': { code: 'Mapharma', logo: 'logo_mapharma.png', nom: 'Mapharma', promoted: true,  website: 'https://mapharma.net/login',          highlightEnabled: false, styleCode: '_mapharma'},
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
export type VaccineType = string;
export type AppointmentPerVaccine = {
    vaccine_type: VaccineType;
    appointments: number;
};
export type AppointmentSchedule = {
    name: string;
    from: DateString; // Should be better to have ISODateString here
    to: DateString; // Should be better to have ISODateString here
    // appointments_per_vaccine: AppointmentPerVaccine[];
    total: number;
};
export type Lieu = {
    appointment_count: number;
    departement: CodeDepartement;
    location: Coordinates,
    nom: string;
    url: string;
    internal_id: string;
    appointment_by_phone_only: boolean;
    appointment_schedules: AppointmentSchedule[]|undefined;
    plateforme: TypePlateforme;
    prochain_rdv: ISODateString|null;
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
export function appointmentSlotsFor(lieu: Lieu, type: SearchType) {
    return type==='chronodose'?lieu.appointment_schedules?.find(asc => asc.name==='chronodose')?.total:lieu.appointment_count;
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

export type SearchType = "standard"|"chronodose";


export type StatHistoriqueLieu = {
    date: ISODateString;

    prochain_rdv: ISODateString|null;
    appointment_count: number|undefined;
    chronodose_appointment_count: number|undefined;
};

export type LieuSansStatsRdv = Omit<Lieu, "appointment_count"|"appointment_schedules"|"prochain_rdv">
export type HistoriqueLieu = {
    lieu: LieuSansStatsRdv,
    stats: StatHistoriqueLieu[];
};

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

    async lieuxPour(codeDepartement: CodeDepartement): Promise<LieuxParDepartement> {
        const resp = await fetch(`${VMD_BASE_URL}/${codeDepartement}.json`, { cache: 'no-cache' })
        const results = await resp.json()
        const lieuxParDepartement = {
            lieuxDisponibles: results.centres_disponibles.map(transformLieu),
            lieuxIndisponibles: results.centres_indisponibles.map(transformLieu),
            codeDepartements: [codeDepartement],
            derniereMiseAJour: results.last_updated
        };
        return lieuxParDepartement;
    }

    @Memoize()
    async departementsDisponibles(): Promise<Departement[]> {
        const resp = await fetch(`${VMD_BASE_URL}/departements.json`)
        const departements: Departement[] = await resp.json()
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
            const resp = await fetch(`${VMD_BASE_URL}/stats_by_date.json`)
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
      const resp = await fetch(`${VMD_BASE_URL}/stats.json`)
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

    private _centresEligiblesChronodose: { expires: ISODateString, centresEligibles: Set<string> } = {
        expires: new Date(0).toISOString(),
        centresEligibles: new Set<string>()
    };
    async centresEligiblesChronodose(): Promise<Set<string>> {
        if(Date.parse(this._centresEligiblesChronodose.expires) < Date.now()) {
            const centresEligibles: Set<string> = new Set((await fetch(`${State.baseHistoryUrl()}/lieux-candidats-chronodose.json`, { cache: 'no-cache' }).then(resp => resp.json())).lieux);
            this._centresEligiblesChronodose = {
                expires: new Date(Date.now() + 1000 * 60 * 2).toISOString(),
                centresEligibles
            };
            return centresEligibles;
        } else {
            return this._centresEligiblesChronodose.centresEligibles;
        }
    }

    async historiqueDuLieu(lieuInternalId: string, mode: SearchType): Promise<HistoriqueLieu> {
        const historiqueLieu: HistoriqueLieu = await fetch(`${State.baseHistoryUrl()}/lieux/${lieuInternalId}.json`, { cache: 'no-cache' }).then(resp => resp.json());
        if(mode === 'standard') {
            return historiqueLieu;
        } else if(mode === 'chronodose') {
            const latestStatTimestamp = Date.parse(historiqueLieu.stats[historiqueLieu.stats.length-1]?.date);
            return {
                ...historiqueLieu,
                stats: historiqueLieu.stats.filter(s => Date.parse(s.date) > latestStatTimestamp - 1000 * 60 * 60 * 36)
            };
        } else {
            throw new Error(`Unsupported mode : ${mode}`);
        }
    }

    private static baseHistoryUrl() {
        const LOCAL = false;
        return LOCAL?'http://localhost:8001':`https://raw.githubusercontent.com/fcamblor/vmd-histo/published/`;
    }
}
