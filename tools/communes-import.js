var fetch = require('node-fetch');
var fs = require('fs');
var leven = require('leven');

const INDEXED_CHARS = `abcdefghijklmnopqrstuvwxyz01234567890_`.split('');
// const INDEXED_CHARS = `abc'`.split(''); // For testing purposes

// FYI, 800 => file size is ~50Ko
const MAX_NUMBER_OF_COMMUNES_PER_FILE = 800;
const MAX_AUTOCOMPLETE_TRIGGER_LENGTH = 7;

function keyOf(commune) {
    return `${commune.code}__${commune.nom}`;
}

function toFullTextSearchableString(value) {
    // /!\ important note : this is important to have the same implementation of toFullTextSearchableString()
    // function here, than the one used defined in Strings.toFullTextSearchableString()
    // ALSO, note that INDEXED_CHARS would have every possible translated values defined below
    return value.toLowerCase()
        .replace(/[-\s']/gi, "_")
        .replace(/[èéëêêéè]/gi, "e")
        .replace(/[áàâäãåâà]/gi, "a")
        .replace(/[çç]/gi, "c")
        .replace(/[íìîï]/gi, "i")
        .replace(/[ñ]/gi, "n")
        .replace(/[óòôöõô]/gi, "o")
        .replace(/[úùûüûù]/gi, "u")
        .replace(/[œ]/gi, "oe");
}

function search(communes, query) {
    return communes.filter(c =>
        c.codePostal.indexOf(query) === 0 || c.fullTextSearchableNom.indexOf(query) !== -1
    );
}

function generateFilesForQuery(query, communes, unreferencedCommuneKeys) {
    try {
        const matchingCommunes = search(communes, query);
        if(matchingCommunes.length === 0) {
            return [];
        } else if(matchingCommunes.length < MAX_NUMBER_OF_COMMUNES_PER_FILE || query.length === MAX_AUTOCOMPLETE_TRIGGER_LENGTH) {
            matchingCommunes.forEach(matchingCommune => unreferencedCommuneKeys.delete(keyOf(matchingCommune)));
            matchingCommunes.sort((c1, c2) => {
                return Math.min(leven(c1.fullTextSearchableNom, query), leven(c1.codePostal, query))
                     - Math.min(leven(c2.fullTextSearchableNom, query), leven(c2.codePostal, query))
            });

            // Converting commune info in a most compacted way : keeping only useful fields, 1-char keys, latng compaction
            const compactedCommunes = matchingCommunes.map(c => ({
                c: c.code,
                z: c.codePostal,
                n: c.nom,
                d: c.codeDepartement,
                g: (c && c.centre && c.centre.coordinates)?c.centre.coordinates.join(","):undefined
            }))
            fs.writeFileSync(`../public/autocomplete-cache/${query}.json`, JSON.stringify({query, communes: compactedCommunes}), 'utf8');
            console.info(`Autocomplete cache for query [${query}] completed !`)
            return [query];
        } else {
            return INDEXED_CHARS.reduce((queries, q) => {
                Array.prototype.push.apply(queries, generateFilesForQuery(query+q, communes, unreferencedCommuneKeys));
                return queries;
            }, [])
        }
    } catch(e) {
        console.error(e);
    }
}

Promise.all([
    fetch(`https://geo.api.gouv.fr/communes?boost=population&fields=code,nom,codeDepartement,centre,codesPostaux`).then(resp => resp.json()),
]).then(([rawCommunes]) => {
    const communes = rawCommunes.map(rawCommune => rawCommune.codesPostaux.map(cp => ({
            ...rawCommune,
            codePostal: cp,
            fullTextSearchableNom: toFullTextSearchableString(rawCommune.nom)
        }))).flat();

    const communeByKey = communes.reduce((map, commune) => {
        map.set(keyOf(commune), commune);
        return map;
    }, new Map());

    const unreferencedCommuneKeys = new Set(communeByKey.keys());

    const generatedIndexes = INDEXED_CHARS.reduce((queries, q) => {
        Array.prototype.push.apply(queries, generateFilesForQuery(q, communes, unreferencedCommuneKeys));
        return queries;
    }, []);

    fs.writeFileSync("../public/autocompletes.json", JSON.stringify(generatedIndexes), 'utf8');
});
