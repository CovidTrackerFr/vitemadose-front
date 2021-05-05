import { Memoize } from 'typescript-memoize'
import { Departement, Commune } from './State'

type NormalizedSearch = string & { __normalized_search: void }
export interface CommuneAutocomplete {
  z: string // code postal
  c: string // code insee
  d: string // code departement
  g: string // "longitude,latitude"
  n: string // nom
}

export class Autocomplete {
  private webBaseUrl: string
  constructor (webBaseUrl: string, private getDepartementsDisponibles: () => Promise<Departement[]>) {
    this.webBaseUrl = webBaseUrl.endsWith('/') ? webBaseUrl : `${webBaseUrl}/`
  }

  async findCommune (codePostal: string, codeInsee: string): Promise<Commune|void> {
    const communes = await this.getMatchingCommunes(this.normalize(codePostal))
    return communes.find((commune) => commune.code === codeInsee)
  }

  async suggest (prefix: string): Promise<Array<Departement|Commune>> {
    if (prefix.length < 2) {
      return []
    }
    const term = this.normalize(prefix)
    return [
      ...(await this.getMatchingDepartements(term)),
      ...(await this.getMatchingCommunes(term)),
    ]
  }

  private async getMatchingDepartements(term: NormalizedSearch): Promise<Departement[]> {
    const departements = await this.getDepartements()
    return departements.filter((departement) => {
      return departement.code_departement.startsWith(term)
          || this.normalize(departement.nom_departement).includes(term)
    })
  }

  private async getMatchingCommunes(term: NormalizedSearch): Promise<Commune[]> {
    const prefixMatch = await this.getLongestPrefixMatch(term)
    if (!prefixMatch) {
      return []
    }
    const communesWithPrefix = await this.getAutocompleteOptions(prefixMatch)
    return communesWithPrefix.filter((commune) => {
      return commune.codePostal.includes(term)
          || this.normalize(commune.nom).includes(term)
    })
  }

  private mapAutocommpleteToCommune(option: CommuneAutocomplete): Commune {
    const [ longitude, latitude ] =  option.g.split(',').map(Number)
    return {
      nom: option.n,
      code: option.c,
      codePostal: option.z,
      codeDepartement: option.d,
      latitude, longitude
    }
  }

  private async getLongestPrefixMatch(term: NormalizedSearch): Promise<NormalizedSearch | undefined> {
    const prefixes = await this.getAutocompletePrefixes()
    let longestMatch = term
    for (let size = term.length; size > 0; --size) {
      const subPrefix = term.substring(0, size)
      if (prefixes.has(subPrefix)) {
        return subPrefix as NormalizedSearch
      }
    }
    return undefined
  }

  @Memoize()
  private async getDepartements (): Promise<Departement[]> {
    return this.getDepartementsDisponibles()
  }

  @Memoize()
  private async getAutocompletePrefixes(): Promise<Set<string>> {
    const response = await window.fetch(`${this.webBaseUrl}autocompletes.json`)
    const prefixes = (await response.json()) as string[]
    return new Set<string>(prefixes)
  }

  @Memoize()
  private async getAutocompleteOptions(name: NormalizedSearch): Promise<Commune[]> {
    const response = await window.fetch(`${this.webBaseUrl}autocomplete-cache/${name}.json`)
    const { communes } = await response.json() as { communes: CommuneAutocomplete[] }
    return communes.map(this.mapAutocommpleteToCommune)
  }


  private normalize (term: string): NormalizedSearch {
    // /!\ important note : this is important to have the same implementation of toFullTextSearchableString()
    // function here, than the one used in communes-import.js tooling
    // FIXME use actual same code instead of warning, its in ../../tools/communes-import.js
    return term.toLowerCase()
      .replace(/[-\s']/gi, "_")
      .replace(/[èéëêêéè]/gi, "e")
      .replace(/[áàâäãåâà]/gi, "a")
      .replace(/[çç]/gi, "c")
      .replace(/[íìîï]/gi, "i")
      .replace(/[ñ]/gi, "n")
      .replace(/[óòôöõô]/gi, "o")
      .replace(/[úùûüûù]/gi, "u")
      .replace(/[œ]/gi, "oe") as NormalizedSearch
  }
}
