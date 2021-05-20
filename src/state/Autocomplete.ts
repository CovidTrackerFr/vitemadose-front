import { Memoize } from 'typescript-memoize'
import { Departement, Commune } from './State'
import {Strings} from "../utils/Strings";

type NormalizedSearch = string & { __normalized_search: void }
export interface CommuneAutocomplete {
  n: string // nom
  z: string // code postal
  c: string // code insee
  d: string // code departement
  g: string // "longitude,latitude"
}
export interface OutreMerAutocomplete {
  n: string // nom
  z: string // code postal
  c: string // code insee
}

export class Autocomplete {
  private webBaseUrl: string

  constructor (webBaseUrl: string, private getDepartementsDisponibles: () => Promise<Departement[]>) {
    this.webBaseUrl = webBaseUrl.endsWith('/') ? webBaseUrl : `${webBaseUrl}/`
  }

  async findCommune (codePostal: string, codeInsee: string): Promise<Commune | void> {
    const communes = await this.getMatchingCommunes(this.normalize(codePostal))
    return communes.find((commune) => commune.codePostal === codePostal && commune.code === codeInsee)
  }

  async suggest (prefix: string): Promise<Array<Departement | Commune>> {
    if (prefix.length < 2) {
      return []
    }
    const term = this.normalize(prefix)
    const departements = await this.getMatchingDepartements(term)
    const communes = await this.getMatchingCommunes(term)
    return [ ...departements, ...communes ]
  }

  private async getMatchingDepartements(term: NormalizedSearch): Promise<Departement[]> {
    const departements = await this.getDepartements()
    return departements.filter((departement) => {
      return departement.code_departement.startsWith(term)
          || this.normalize(departement.nom_departement).includes(term)
    })
  }

  private async getMatchingCommunes(term: NormalizedSearch): Promise<Array<Commune>> {
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

  private mapAutocompleteToCommune(option: CommuneAutocomplete | OutreMerAutocomplete): Commune | void {
    if ('g' in option && 'd' in option) {
      const [ longitude, latitude ] =  option.g.split(',').map(Number)
      return {
        nom: option.n,
        code: option.c,
        codePostal: option.z,
        codeDepartement: option.d,
        latitude, longitude
      } as Commune
    } else {
      /* FIXME retourner une CommuneOutreMer
       * Pour l'instant nous ignorons les communautés d'outre-mer
       * car ça fait planter l'application, mais ça n'est pas gentil pour eux.
       */
      return undefined
    }
  }

  private async getLongestPrefixMatch(term: NormalizedSearch): Promise<NormalizedSearch | undefined> {
    const prefixes = await this.getAutocompletePrefixes()
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
    const response = await window.fetch(`${this.webBaseUrl}autocomplete-cache/vmd_${name}.json`)
    const { communes } = await response.json() as { communes: CommuneAutocomplete[] }
    return communes
      .map(this.mapAutocompleteToCommune)
      .filter((commune) => commune !== undefined) as Commune[]
  }


  private normalize (term: string): NormalizedSearch {
    return Strings.toFullTextSearchableString(term) as NormalizedSearch;
  }
}
