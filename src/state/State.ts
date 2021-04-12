import {ISODateString, WeekDay} from "../utils/Dates";
import {Strings} from "../utils/Strings";

type Features = {
    trancheAgeFilter: boolean;
};
export const FEATURES: Features = {
    trancheAgeFilter: false
};

export type CodeTrancheAge = 'plus75ans';
export type TrancheAge = {
    codeTrancheAge: CodeTrancheAge;
    libelle: string;
};
export const TRANCHES_AGE: Map<CodeTrancheAge, TrancheAge> = new Map([
    ['plus75ans', { codeTrancheAge: 'plus75ans', libelle: "Plus de 75 ans" }]
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
    // Used for specific styling on logos, see for example _searchAppointment.scss
    styleCode: string;
};
export const PLATEFORMES: Record<string, Plateforme> = {
    'Doctolib': { code: 'Doctolib', logo: 'logo_doctolib.png', nom: 'Doctolib', promoted: true,  styleCode: '_doctolib'},
    'Maiia':    { code: 'Maiia',    logo: 'logo_maiia.png',    nom: 'Maiia',    promoted: true,  styleCode: '_maiia'},
    'Ordoclic': { code: 'Ordoclic', logo: 'logo_ordoclic.png', nom: 'Ordoclic', promoted: true,  styleCode: '_ordoclic'},
    'Keldoc':   { code: 'Keldoc',   logo: 'logo_keldoc.png',   nom: 'Keldoc',   promoted: true,  styleCode: '_keldoc'},
    'Pandalab': { code: 'Pandalab', logo: 'logo_pandalab.png', nom: 'Pandalab', promoted: false, styleCode: '_pandalab'},
    'Mapharma': { code: 'Mapharma', logo: 'logo_mapharma.png', nom: 'Mapharma', promoted: true,  styleCode: '_mapharma'},
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
            phone_number: rawLieu.metadata.phone_number?Strings.toNormalizedPhoneNumber(rawLieu.metadata.phone_number):undefined
        },
        vaccine_type: rawLieu.vaccine_type?((rawLieu.vaccine_type.length===undefined?[rawLieu.vaccine_type]:rawLieu.vaccine_type)).join(", "):undefined
    };
}
export type Coordinates = { latitude: number, longitude: number }

export type LieuxParDepartement = {
    lieuxDisponibles: Lieu[];
    lieuxIndisponibles: Lieu[];
    codeDepartement: CodeDepartement;
    derniereMiseAJour: ISODateString;
};
export type LieuxParDepartements = Map<CodeDepartement, LieuxParDepartement>;

function convertDepartementForSort(codeDepartement: CodeDepartement) {
    switch(codeDepartement) {
        case '2A': return '20A';
        case '2B': return '20B';
        default: return codeDepartement;
    }
}

export type StatLieu = {disponibles: number, total: number};
export type StatLieuGlobale = StatLieu & { proportion: number };
export type StatsLieuParDepartement = Record<string, StatLieu>
export type StatsLieu = {
    parDepartements: StatsLieuParDepartement;
    global: StatLieuGlobale;
}

export class State {
    public static current = new State();

    private _departementsDiponibles: Departement[]|undefined = undefined;
    private _lieuxParDepartement: LieuxParDepartements = new Map<CodeDepartement, LieuxParDepartement>();
    private _statsLieu: StatsLieu|undefined = undefined;

    private constructor() {
    }

    async lieuxPour(codeDepartement: CodeDepartement, codeTrancheAge: CodeTrancheAge): Promise<LieuxParDepartement> {
        if(this._lieuxParDepartement.has(codeDepartement)) {
            return Promise.resolve(this._lieuxParDepartement.get(codeDepartement)!);
        } else {
            const resp = await fetch(`${VMD_BASE_URL}/${codeDepartement}.json`)
            const results = await resp.json()
            return {
                lieuxDisponibles: results.centres_disponibles.map(transformLieu),
                lieuxIndisponibles: results.centres_indisponibles.map(transformLieu),
                codeDepartement,
                derniereMiseAJour: results.last_updated
            };
        }
    }

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

    private geolocalisationBloquée = false
    private geolocalisationIndisponible = false
    private userLocation: Coordinates | 'bloqué' | 'indisponible' | undefined
    async localisationNavigateur (): Promise<Coordinates | 'bloqué' | 'indisponible'> {
      if(this.userLocation !== 'indisponible' && this.userLocation !== undefined) {
          return this.userLocation;
      }

      const promise = new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 4000,
        })
      })
      try {
        const { coords } = await (promise as Promise<{ coords: Coordinates }>)
        this.userLocation = coords
      } catch (error) {
        if (error instanceof GeolocationPositionError && error.code === 1) {
          this.userLocation = 'bloqué'
        } else {
          this.userLocation = 'indisponible'
        }
      }
      return this.userLocation

    }
}
