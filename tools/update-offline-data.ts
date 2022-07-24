/// <reference path="./types.d.ts" />
import fetch from 'node-fetch';
import {mkdir, stat, writeFile} from "fs/promises";

const offlineDir = `${__dirname}/../public/offline`

async function main() {
    await ensureDirectoryCreated(offlineDir);

    const departements = await storeOffline<{code_departement: string}[]>('https://vitemadose.gitlab.io/vitemadose/departements.json', ['departements.json'])

    await Promise.all(departements.map(
        dpt => Promise.all([
            storeOffline(`https://vitemadose.gitlab.io/vitemadose/${dpt.code_departement}.json`, [`${dpt.code_departement}.json`]),
            storeOffline(`https://vitemadose.gitlab.io/vitemadose/${dpt.code_departement}/creneaux-quotidiens.json`, [dpt.code_departement, 'creneaux-quotidiens.json']),
        ])
    ));

    await Promise.all([
        storeOffline('https://vitemadose.gitlab.io/vitemadose/stats_by_date.json', ['stats_by_date.json']),
        storeOffline('https://vitemadose.gitlab.io/vitemadose/stats.json', ['stats.json']),
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
