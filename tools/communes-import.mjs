import fetch from 'node-fetch';
import fs from 'fs';
import leven from 'leven';

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

function toCompactedCommune(c) {
    return {
        c: c.code,
        z: c.codePostal,
        n: c.nom,
        d: c.codeDepartement,
        g: (c && c.centre && c.centre.coordinates)?c.centre.coordinates.join(","):undefined
    };
}

function communeComparatorFor(query) {
    return (c1, c2) =>
           Math.min(leven(c1.fullTextSearchableNom, query), leven(c1.codePostal, query))
         - Math.min(leven(c2.fullTextSearchableNom, query), leven(c2.codePostal, query));
}

function generateFilesForQuery(query, communes, unreferencedCommuneKeys) {
    try {
        const matchingCommunes = search(communes, query);
        const matchingCommunesByKey = new Map(matchingCommunes.map(c => [keyOf(c), c]));

        if(matchingCommunes.length === 0) {
            return [];
        } else if(matchingCommunes.length < MAX_NUMBER_OF_COMMUNES_PER_FILE || query.length === MAX_AUTOCOMPLETE_TRIGGER_LENGTH) {
            matchingCommunesByKey.forEach((commune, matchingCommuneKey) => unreferencedCommuneKeys.delete(matchingCommuneKey));

            matchingCommunes.sort(communeComparatorFor(query));

            // Converting commune info in a most compacted way : keeping only useful fields, 1-char keys, latng compaction
            const compactedCommunes = matchingCommunes.map(toCompactedCommune)

            fs.writeFileSync(`../public/autocomplete-cache/vmd_${query}.json`, JSON.stringify({query, communes: compactedCommunes }), 'utf8');
            console.info(`Autocomplete cache for query [${query}] completed !`)

            return [{ query, matchingCommunesByKey }];
        } else {
            const subQueries = INDEXED_CHARS.reduce((subQueries, q) => {
                Array.prototype.push.apply(subQueries, generateFilesForQuery(query+q, matchingCommunes, unreferencedCommuneKeys));
                return subQueries;
            }, [])

            let filteredMatchingCommunesByKey = new Map(matchingCommunesByKey);
            subQueries.forEach(r => {
                r.matchingCommunesByKey.forEach((commune, key) => filteredMatchingCommunesByKey.delete(key));
            });

            // Here, the idea is to add communes with name shorter than the autocomplete keys
            // For example, we have the communes named "Y" and "Sai" while minimum autocomplete for these
            // kind of communes are respectively longer than 1 and 3
            // That's why we're adding here specific keys for these communes
            // Note that we don't have a lot of communes in that case, only 10 commune names, representing 13 different
            // communes
            filteredMatchingCommunesByKey = new Map([...filteredMatchingCommunesByKey].filter(([k, v]) => v.fullTextSearchableNom.length === query.length))
            if(filteredMatchingCommunesByKey.size) {
                const communesMatchantExactement = [...filteredMatchingCommunesByKey.values()];
                [...filteredMatchingCommunesByKey.keys()].forEach(k => unreferencedCommuneKeys.delete(k));

                communesMatchantExactement.sort(communeComparatorFor(query));

                // Converting commune info in a most compacted way : keeping only useful fields, 1-char keys, latng compaction
                const compactedCommunesNonGereesParLesSousNoeuds = communesMatchantExactement.map(toCompactedCommune)
                fs.writeFileSync(`../public/autocomplete-cache/vmd_${query}.json`, JSON.stringify({query, communes: compactedCommunesNonGereesParLesSousNoeuds /*, subsequentAutoCompletes: true */ }), 'utf8');
                console.info(`Intermediate autocomplete cache for query [${query}] completed with ${compactedCommunesNonGereesParLesSousNoeuds.length} communes !`)

                subQueries.splice(0, 0, {query, matchingCommunesByKey: filteredMatchingCommunesByKey });
            }

            return subQueries;
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
        Array.prototype.push.apply(queries, generateFilesForQuery(q, communes, unreferencedCommuneKeys).map(r => r.query));
        return queries;
    }, []);

    fs.writeFileSync("../public/autocompletes.json", JSON.stringify(generatedIndexes), 'utf8');
});
