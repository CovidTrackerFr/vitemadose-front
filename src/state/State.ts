import {ISODateString, WeekDay} from "../utils/Dates";
import {Strings} from "../utils/Strings";

type Features = {
    trancheAgeFilter: boolean;
};
export const FEATURES: Features = {
    trancheAgeFilter: false
};

export type CodeTrancheAge = string;
export type TrancheAge = {
    codeTrancheAge: CodeTrancheAge;
    libelle: string;
};
export const TRANCHES_AGE: Map<CodeTrancheAge, TrancheAge> = new Map([
    ['plus75', { codeTrancheAge: 'plus75', libelle: "Plus de 75 ans" }]
]);

const VMD_BASE_URL = "https://vitemadose.gitlab.io/vitemadose"


export type Plateforme = {
    logo: string;
    nom: string;
    code: string;
    styleCode: string;
};
export const PLATEFORMES: Record<string, Plateforme> = {
    'Doctolib': { code: 'Doctolib', logo: 'logo_doctolib.png', nom: 'Doctolib', styleCode: '_doctolib'},
    'Maiia': {    code: 'Maiia',    logo: 'logo_maiia.png',    nom: 'Maiia',    styleCode: '_maiia'},
    'Ordoclic': { code: 'Ordoclic', logo: 'logo_ordoclic.png', nom: 'Ordoclic', styleCode: '_ordoclic'},
    'Keldoc': {   code: 'Keldoc',   logo: 'logo_keldoc.png',   nom: 'Keldoc',   styleCode: '_keldoc'},
    // Beware: if you add a new plateform, don't forget to update 'hardcoded' (indexable) content
    // in index.html page, referencing the list of supported plateforms
};

export type CodeDepartement = string;
export type Departement = {
    code_departement: CodeDepartement;
    nom_departement: string;
    code_region: 84;
    nom_region: string;
};

export type TypeCentre = 'vaccination-center'|'drugstore'|'general-practitioner';
export const TYPES_CENTRES: {[k in TypeCentre]: string} = {
    "vaccination-center": 'Centre de vaccination',
    "drugstore": 'Pharmacie',
    "general-practitioner": 'Médecin généraliste',
};
export type BusinessHours = Record<WeekDay,string>;
export type Centre = {
    appointment_count: number;
    departement: CodeDepartement;
    location: {
        latitude: number;
        longitude: number;
    },
    nom: string;
    url: string;
    plateforme: string;
    prochain_rdv: ISODateString|null;
    metadata: {
        address: string;
        phone_number: string|undefined;
        business_hours: BusinessHours|undefined
    },
    type: TypeCentre
};
function transformCentre(centre: Centre): Centre {
    return {
        ...centre,
        metadata: {
            ...centre.metadata,
            phone_number: centre.metadata.phone_number?Strings.toNormalizedPhoneNumber(centre.metadata.phone_number):undefined
        }
    };
}

export type CentresParDepartement = {
    centresDisponibles: Centre[];
    centresIndisponibles: Centre[];
    codeDepartement: CodeDepartement;
    derniereMiseAJour: ISODateString;
};
export type CentresParDepartements = Map<CodeDepartement, CentresParDepartement>;

function convertDepartementForSort(codeDepartement: CodeDepartement) {
    switch(codeDepartement) {
        case '2A': return '20A';
        case '2B': return '20B';
        default: return codeDepartement;
    }
}

export type StatCentre = {disponibles: number, total: number};
export type StatCentreGlobale = StatCentre & { proportion: number };
export type StatsCentreParDepartement = Record<string, StatCentre>
export type StatsCentre = {
    parDepartements: StatsCentreParDepartement;
    global: StatCentreGlobale;
}

export class State {
    public static current = new State();

    private _departementsDiponibles: Departement[]|undefined = undefined;
    private _centresParDepartement: CentresParDepartements = new Map<CodeDepartement, CentresParDepartement>();
    private _statsCentre: StatsCentre|undefined = undefined;

    private constructor() {
    }

    centresPour(codeDepartement: CodeDepartement, codeTrancheAge: CodeTrancheAge): Promise<CentresParDepartement> {
        if(this._centresParDepartement.has(codeDepartement)) {
            return Promise.resolve(this._centresParDepartement.get(codeDepartement)!);
        } else {
            return fetch(`${VMD_BASE_URL}/${codeDepartement}.json`)
                .then(resp => resp.json())
                .then(results => ({
                    centresDisponibles: results.centres_disponibles.map(transformCentre),
                    centresIndisponibles: results.centres_indisponibles.map(transformCentre),
                    codeDepartement,
                    derniereMiseAJour: results.last_updated
                }));
        }
    }

    departementsDisponibles(): Promise<Departement[]> {
        if(this._departementsDiponibles !== undefined) {
            return Promise.resolve(this._departementsDiponibles);
        } else {
            return fetch(`${VMD_BASE_URL}/departements.json`)
                .then(resp => resp.json())
                .then((departements: Departement[]) => {
                    this._departementsDiponibles = departements;
                    this._departementsDiponibles.sort((d1, d2) => convertDepartementForSort(d1.code_departement).localeCompare(convertDepartementForSort(d2.code_departement)));
                    return departements;
                });
        }
    }

    statsCentres(): Promise<StatsCentre> {
        if(this._statsCentre !== undefined) {
            return Promise.resolve(this._statsCentre);
        } else {
            return fetch(`${VMD_BASE_URL}/stats.json`)
                .then(resp => resp.json())
                .then((statsParDepartements: Record<CodeDepartement|'tout_departement', StatCentre>) => {
                    const statsCentre = {
                        parDepartements: Object.entries(statsParDepartements)
                            .filter(([dpt, stats]: [CodeDepartement|"tout_departement", StatCentre]) => dpt !== 'tout_departement')
                            .reduce((statsParDept, [dpt, stats]: [CodeDepartement, StatCentre]) => {
                                statsParDepartements[dpt] = stats;
                                return statsParDepartements;
                            }, {} as StatsCentreParDepartement),
                        global: {
                            ...statsParDepartements['tout_departement'],
                            proportion: Math.round(statsParDepartements['tout_departement'].disponibles * 10000 / statsParDepartements['tout_departement'].total)/100
                        }
                    };
                    this._statsCentre = statsCentre;
                    return statsCentre;
                });
        }
    }
}
