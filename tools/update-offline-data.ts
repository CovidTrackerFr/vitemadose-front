/// <reference path="./types.d.ts" />
import fetch from 'node-fetch';
import {mkdir, stat, writeFile} from "fs/promises";
import {GITLAB_DATA_URLS} from '../src/utils/LocalConfig'

const offlineDir = `${__dirname}/../public/offline`

async function main() {
    await ensureDirectoryCreated(offlineDir);

    const departements = await storeOffline<{code_departement: string}[]>(GITLAB_DATA_URLS.listDepartements(), ['departements.json'])

    await Promise.all(departements.map(
        dpt => Promise.all([
            storeOffline(GITLAB_DATA_URLS.infosDepartement(dpt.code_departement), [`${dpt.code_departement}.json`]),
            storeOffline(GITLAB_DATA_URLS.creneauxQuotidiensDepartement(dpt.code_departement), [dpt.code_departement, 'creneaux-quotidiens.json']),
        ])
    ));

    await Promise.all([
        storeOffline(GITLAB_DATA_URLS.statsByDate(), ['stats_by_date.json']),
        storeOffline(GITLAB_DATA_URLS.stats(), ['stats.json']),
    ])
}

async function storeOffline<T>(url: string, pathChunks: string[]) {
    const content: T = await fetch(url).then(resp => resp.json())
    await pathChunks.reduce(async (previousPathPromise, pathChunk, idx) => {
        const previousPath = await previousPathPromise
        if(idx !== pathChunks.length-1) {
            await ensureDirectoryCreated(`${offlineDir}${previousPath}${pathChunk}/`)
            return `${previousPath}${pathChunk}/`
        } else {
            return `${previousPath}${pathChunk}`
        }
    }, Promise.resolve("/"))

    await writeFile(`${offlineDir}/${pathChunks.join("/")}`, JSON.stringify(content), 'utf8');

    return content;
}

async function ensureDirectoryCreated(path: string): Promise<void> {
    try {
        await stat(`${path}/`)
    }catch(e) {
        await mkdir(`${path}/`, {recursive: true})
    }
}

main().then(() => {
    console.log("offline data updated !")
})
