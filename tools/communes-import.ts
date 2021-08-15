/// <reference path="./types.d.ts" />
import fetch from 'node-fetch';
import leven from 'leven';
import {rechercheDepartementDescriptor, rechercheCommuneDescriptor} from '../src/routing/DynamicURLs';
import {readFileSync, writeFileSync} from "fs";
import {Strings} from "../src/utils/Strings";

const INDEXED_CHARS = `abcdefghijklmnopqrstuvwxyz01234567890_`.split('');
// const INDEXED_CHARS = `abc'`.split(''); // For testing purposes

// FYI, 800 => file size is ~50Ko
const MAX_NUMBER_OF_COMMUNES_PER_FILE = 800;
const MAX_AUTOCOMPLETE_TRIGGER_LENGTH = 7;

function keyOf(commune: Commune): string {
    return `${commune.code}__${commune.nom}`;
}

function search(communes: Commune[], query: string): Commune[] {
    return communes.filter(c =>
        c.codePostal.startsWith(query) || c.fullTextNormalizedNom.indexOf(query) !== -1
    );
}

function toCompactedCommune(commune: Commune) {
    return {
        c: commune.code,
        z: commune.codePostal,
        n: commune.nom,
        d: commune.codeDepartement,
        g: (commune && commune.centre && commune.centre.coordinates)?commune.centre.coordinates.join(","):undefined
    };
}

function communeComparatorFor(query: string) {
    return (c1: Commune, c2: Commune) =>
           Math.min(leven(c1.fullTextNormalizedNom, query), leven(c1.codePostal, query))
         - Math.min(leven(c2.fullTextNormalizedNom, query), leven(c2.codePostal, query));
}

type MatchingCommunesSearchResult = {
    query: string;
    matchingCommunesByKey: Map<string, Commune>;
};
function generateFilesForQuery(query: string, communes: Commune[], unreferencedCommuneKeys: Set<string>): MatchingCommunesSearchResult[] {
    try {
        const matchingCommunes = search(communes, query);
        const matchingCommunesByKey = new Map<string, Commune>(matchingCommunes.map(c => [keyOf(c), c]));

        if(matchingCommunes.length === 0) {
            return [];
        } else if(matchingCommunes.length < MAX_NUMBER_OF_COMMUNES_PER_FILE || query.length === MAX_AUTOCOMPLETE_TRIGGER_LENGTH) {
            matchingCommunesByKey.forEach((commune, matchingCommuneKey) => unreferencedCommuneKeys.delete(matchingCommuneKey));

            matchingCommunes.sort(communeComparatorFor(query));

            // Converting commune info in a most compacted way : keeping only useful fields, 1-char keys, latng compaction
            const compactedCommunes = matchingCommunes.map(toCompactedCommune)

            writeFileSync(`../public/autocomplete-cache/vmd_${query}.json`, JSON.stringify({query, communes: compactedCommunes }), 'utf8');
            console.info(`Autocomplete cache for query [${query}] completed !`)

            return [{ query, matchingCommunesByKey }];
        } else {
            const subQueries = INDEXED_CHARS.reduce((subQueries, q) => {
                Array.prototype.push.apply(subQueries, generateFilesForQuery(query+q, matchingCommunes, unreferencedCommuneKeys));
                return subQueries;
            }, [] as MatchingCommunesSearchResult[])

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
            filteredMatchingCommunesByKey = new Map([...filteredMatchingCommunesByKey].filter(([_, commune]) => commune.fullTextNormalizedNom.length === query.length))
            if(filteredMatchingCommunesByKey.size) {
                const communesMatchantExactement = [...filteredMatchingCommunesByKey.values()];
                [...filteredMatchingCommunesByKey.keys()].forEach(k => unreferencedCommuneKeys.delete(k));

                communesMatchantExactement.sort(communeComparatorFor(query));

                // Converting commune info in a most compacted way : keeping only useful fields, 1-char keys, latng compaction
                const compactedCommunesNonGereesParLesSousNoeuds = communesMatchantExactement.map(toCompactedCommune)
                writeFileSync(`../public/autocomplete-cache/vmd_${query}.json`, JSON.stringify({query, communes: compactedCommunesNonGereesParLesSousNoeuds /*, subsequentAutoCompletes: true */ }), 'utf8');
                console.info(`Intermediate autocomplete cache for query [${query}] completed with ${compactedCommunesNonGereesParLesSousNoeuds.length} communes !`)

                subQueries.splice(0, 0, {query, matchingCommunesByKey: filteredMatchingCommunesByKey });
            }

            return subQueries;
        }
    } catch(e) {
        console.error(e);
        return [];
    }
}

function sitemapDynamicEntry(path: string): string {
    return `
    <url><loc>https://vitemadose.covidtracker.fr${path}</loc><changefreq>always</changefreq><priority>0.1</priority></url>
    `.trim();
}
function sitemapIndexDynamicEntry(codeDepartement: string): string {
    return `
    <sitemap><loc>https://vitemadose.covidtracker.fr/sitemaps/sitemap-${codeDepartement}.xml</loc></sitemap>
    `.trim();
}

const COLLECTIVITES_OUTREMER = new Map<string, Partial<Commune>>([
    ["97501", { codeDepartement: "om", centre: { type: "Point", coordinates: [-56.3814, 47.0975] } }],
    ["97502", { codeDepartement: "om", centre: { type: "Point", coordinates: [-56.1833, 46.7667] } }],
    ["97701", { codeDepartement: "om", centre: { type: "Point", coordinates: [-62.8314, 17.9034] } }],
    ["97801", { codeDepartement: "om", centre: { type: "Point", coordinates: [-63.0785, 18.0409] } }],
]);

function completerCommunesOutremer(commune: Commune): Commune {
    if(COLLECTIVITES_OUTREMER.has(commune.code)) {
        return {...commune, ...COLLECTIVITES_OUTREMER.get(commune.code)};
    } else {
        return commune;
    }
}

const PARIS_COORDS_OVERRIDES = new Map<string, [number,number]>([
    { c:"75056", z:"75001", g: [2.336157203926649, 48.86283948229915] },
    { c:"75056", z:"75002", g: [2.3432755443949866, 48.86889037261654] },
    { c:"75056", z:"75003", g: [2.3607568335500297, 48.86286492639361] },
    { c:"75056", z:"75004", g: [2.357594022703559, 48.85439581632856] },
    { c:"75056", z:"75005", g: [2.351415238575416, 48.84355063561869] },
    { c:"75056", z:"75006", g: [2.334203785384528, 48.84898025632432] },
    { c:"75056", z:"75007", g: [2.31272844148442, 48.85710142473717] },
    { c:"75056", z:"75008", g: [2.3133060597411697, 48.87297052862936] },
    { c:"75056", z:"75009", g: [2.33864166874507, 48.87729243796416] },
    { c:"75056", z:"75010", g: [2.360651913467299, 48.87654029132932] },
    { c:"75056", z:"75011", g: [2.378928291242735, 48.86001335053879] },
    { c:"75056", z:"75012", g: [2.395032220296042, 48.84042230655008] },
    { c:"75056", z:"75013", g: [2.3620907702278324, 48.82904787007054] },
    { c:"75056", z:"75014", g: [2.327993119650175, 48.83025514870483] },
    { c:"75056", z:"75015", g: [2.29297365224418, 48.84058573684937] },
    { c:"75056", z:"75016", g: [2.266717150629358, 48.85367625689213] },
    { c:"75056", z:"75017", g: [2.3071264684475423, 48.88793519362565] },
    { c:"75056", z:"75018", g: [2.349642564782915, 48.89232572560189] },
    { c:"75056", z:"75019", g: [2.3868229216398484, 48.887176262044115] },
    { c:"75056", z:"75020", g: [2.4032033913955675, 48.862725685060646] },
].map<[string, [number, number]]>(communeDef => ([`${communeDef.c}__${communeDef.z}`, communeDef.g as [number, number]])));

function surchargerCoordonnees(commune: Commune): Commune {
    if(PARIS_COORDS_OVERRIDES.has(`${commune.code}__${commune.codePostal}`)) {
        const coords = PARIS_COORDS_OVERRIDES.get(`${commune.code}__${commune.codePostal}`)!;
        return {...commune, centre: { ...commune.centre, coordinates: coords } };
    } else {
        return commune;
    }
}

Promise.all([
    fetch(`https://geo.api.gouv.fr/communes?boost=population&fields=code,nom,codeDepartement,centre,codesPostaux`).then(resp => resp.json()),
    fetch(`https://vitemadose.gitlab.io/vitemadose/departements.json`).then(resp => resp.json()),
]).then(([rawCommunes, departements]: [RawCommune[], Departement[]]) => {
    const communes: Commune[] = rawCommunes.map(rawCommune => rawCommune.codesPostaux.map(cp => ({
                ...rawCommune,
                codePostal: cp,
                // /!\ important note : in this file, these strings are compared to "queries", 
                // which are exclusively composed of the INDEXED_CHARS characters. 
                // Strings.toFullTextNormalized() converts accents to these chars to make
                // this comparison possible.
                // The same method/implementation is used in Autocomplete.ts to create search prefixes 
                // which are used to fetch the appropriate pre-computed Commune list computed here.
                fullTextNormalizedNom: Strings.toFullTextNormalized(rawCommune.nom)
            }))
        ).flat()
        .map(commune => completerCommunesOutremer(commune))
        .map(commune => surchargerCoordonnees(commune));

    const communeByKey = communes.reduce((map, commune) => {
        map.set(keyOf(commune), commune);
        return map;
    }, new Map<string, Commune>());

    const unreferencedCommuneKeys = new Set(communeByKey.keys());
    const generatedIndexes = INDEXED_CHARS.reduce((queries, q) => {
        Array.prototype.push.apply(queries, generateFilesForQuery(q, communes, unreferencedCommuneKeys).map(r => r.query));
        return queries;
    }, []);

    writeFileSync("../public/autocompletes.json", JSON.stringify(generatedIndexes), 'utf8');

    departements.forEach(department => {
        // language=xml
        let content = `
<?xml version="1.0" encoding="UTF-8"?>
<urlset
    xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

    ${rechercheDepartementDescriptor.urlGenerator({
            codeDepartement: department.code_departement,
            nomDepartement: department.nom_departement
    }).map(url => sitemapDynamicEntry(url)).join('\n    ')}
    ${communes.filter(c => c.codeDepartement === department.code_departement).map(c => {
            return `
    ${rechercheCommuneDescriptor.urlGenerator({
                codeDepartement: c.codeDepartement,
                nomDepartement: department.nom_departement,
                codeCommune: c.code,
                codePostal: c.codePostal,
                nomCommune: c.nom,
                tri: 'distance'
            }).map(url => sitemapDynamicEntry(url)).join('\n    ')}`;
        })}
</urlset>`.trim();

        writeFileSync(`../public/sitemaps/sitemap-${department.code_departement}.xml`, content, 'utf8');
    });

    const siteMapIndexDynamicContent = ([] as string[]).concat(departements.map((department: Departement) => {
        return sitemapIndexDynamicEntry(department.code_departement);
    })).join("\n  ");
    const sitemapTemplate = readFileSync('./sitemap_template.xml', 'utf8')
    const sitemapContent = sitemapTemplate.replace("<!-- DYNAMIC CONTENT -->", siteMapIndexDynamicContent);
    writeFileSync("../public/sitemap.xml", sitemapContent, 'utf8');
});
