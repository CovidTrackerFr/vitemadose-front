
type RawCommune = {
    code: string;
    nom: string;
    codeDepartement: string;
    centre: {
        type: "Point";
        coordinates: [number, number];
    };
    codesPostaux: string[];
};

type Commune = RawCommune & {
    codePostal: string;
    fullTextSearchableNom: string;
};

type Departement = {
    code_departement: string;
    nom_departement: string;
    code_region: number;
    nom_region: string;
};
