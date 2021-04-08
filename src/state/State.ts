import {ISODateString} from "../utils/Dates";

export type CodeTrancheAge = string;
export type TrancheAge = {
    codeTrancheAge: CodeTrancheAge;
    libelle: string;
};
export const TRANCHES_AGE: Map<CodeTrancheAge, TrancheAge> = new Map([
    ['plus75', { codeTrancheAge: 'plus75', libelle: "Plus de 75 ans" }]
]);


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
};

export type CodeDepartement = string;
export type Departement = {
    code_departement: CodeDepartement;
    nom_departement: string;
    code_region: 84;
    nom_region: string;
};

export type Centre = {
    departement: CodeDepartement;
    nom: string;
    url: string;
    plateforme: string;
    prochain_rdv: ISODateString|null;
};

export type CentresParDepartement = {
    centresDisponibles: Centre[];
    centresIndisponibles: Centre[];
    codeDepartement: CodeDepartement;
    derniereMiseAJour: ISODateString;
};
export type CentresParDepartements = Map<CodeDepartement, CentresParDepartement>;

export class State {
    public static current = new State();

    private _departementsDiponibles: Departement[]|undefined = undefined;
    private _centresParDepartement: CentresParDepartements = new Map<CodeDepartement, CentresParDepartement>();

    private constructor() {
    }

    centresPour(codeDepartement: CodeDepartement, codeTrancheAge: CodeTrancheAge): Promise<CentresParDepartement> {
        if(this._centresParDepartement.has(codeDepartement)) {
            return Promise.resolve(this._centresParDepartement.get(codeDepartement)!);
        } else {
            return fetch(`https://raw.githubusercontent.com/CovidTrackerFr/vitemadose/data-auto/data/output/${codeDepartement}.json?trancheAge=${codeTrancheAge}`)
                .then(resp => resp.json())
                .then(results => ({
                    centresDisponibles: results.centres_disponibles as Centre[],
                    centresIndisponibles: results.centres_indisponibles as Centre[],
                    codeDepartement,
                    derniereMiseAJour: results.last_updated
                }));
        }
    }

    departementsDisponibles(): Promise<Departement[]> {
        if(this._departementsDiponibles !== undefined) {
            return Promise.resolve(this._departementsDiponibles);
        } else {
            return fetch("https://raw.githubusercontent.com/CovidTrackerFr/vitemadose/data-auto/data/output/departements.json")
                .then(resp => resp.json())
                .then((departements: Departement[]) => {
                    departements.sort((d1, d2) => d1.code_departement.localeCompare(d2.code_departement));
                    return departements;
                });
        }
    }
}
