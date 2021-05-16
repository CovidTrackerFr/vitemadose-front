import { Autocomplete, OutreMerAutocomplete, CommuneAutocomplete } from "./Autocomplete"
import { mocked } from 'ts-jest/utils'
import { Commune, Departement } from './State'

type CommuneOutreMer = {
  code: string,
  codePostal: string,
  nom: string
}

const départementCalvados: Departement = {
  code_departement: '14',
  nom_departement: 'Calvados',
  code_region: 28,
  nom_region: 'Normandie'
}

const départementAisne: Departement = {
  code_departement: "02",
  nom_departement: "Aisne",
  code_region: 32,
  nom_region: "Hauts-de-France"
}

const départementCôteDOr: Departement = {
  code_departement: "21",
  code_region: 27,
  nom_departement: "Côte-d'Or",
  nom_region: "Bourgogne-Franche-Comté"
}

const départementGuyane: Departement = {
  code_departement: "973",
  code_region: 3,
  nom_departement: "Guyane",
  nom_region: "Guyane"
}

const MiquelonLangladeAc: OutreMerAutocomplete = {
  c: "97501",
  n: "Miquelon-Langlade",
  z: "97500"
}
const MiquelonLanglade: CommuneOutreMer = {
  code: "97501",
  codePostal: "97500",
  nom: "Miquelon-Langlade",
}

const communeAcAblon: CommuneAutocomplete = {
  c: "14001",
  d: "14",
  g: "0.285,49.3917",
  n: "Ablon",
  z: "14600",
}
const communeAblon: Commune = {
  code: "14001",
  codeDepartement: "14",
  latitude: 49.3917,
  longitude: 0.285,
  nom: "Ablon",
  codePostal: "14600",
}
const communeAcCanapville: CommuneAutocomplete = {
  "c": "14131",
  "z": "14800",
  "n": "Canapville",
  "d": "14",
  "g": "0.1328,49.3163"
}
const communeCanapville: Commune = {
  code: "14131",
  codePostal: "14800",
  nom: "Canapville",
  codeDepartement: "14",
  longitude: 0.1328,
  latitude: 49.3163
}

const communeAcDeauville: CommuneAutocomplete = {
  "c": "14220",
  "z": "14800",
  "n": "Deauville",
  "d": "14",
  "g": "0.0772,49.3531"
}
const communeDeauville: Commune = {
  code: "14220",
  codePostal: "14800",
  nom: "Deauville",
  codeDepartement: "14",
  longitude: 0.0772,
  latitude: 49.3531
}

const communeAcDeaumont: CommuneAutocomplete = {
  "c": "56220",
  "z": "56800",
  "n": "Deaumont",
  "d": "56",
  "g": "0.0772,49.3531"
}
const communeDeaumont: Commune = {
  code: "56220",
  codePostal: "56800",
  nom: "Deaumont",
  codeDepartement: "56",
  longitude: 0.0772,
  latitude: 49.3531
}

describe("State.Autocomplete", () => {
  const webBaseUrl = "https://MY.WEB.PATH/"

  const FILES = {
    [`${webBaseUrl}autocompletes.json`]: ['1', '9','14', 'd', 'de', 'dea'],
    [`${webBaseUrl}autocomplete-cache/vmd_14.json`]: {
      query: '14',
      communes: [communeAcAblon, communeAcCanapville, communeAcDeauville]
    },
    [`${webBaseUrl}autocomplete-cache/vmd_dea.json`]: {
      query: 'dea',
      communes: [communeAcDeaumont, communeAcDeauville]
    },
    [`${webBaseUrl}autocomplete-cache/vmd_9.json`]: {
      query: '9',
      communes: [MiquelonLangladeAc]
    }
  }

  let fetchCalls: Record<string, number> = {}
  beforeEach(() => {
    const [fetchMock, counts] = StaticFetchMock(FILES)
    window.fetch = fetchMock
    fetchCalls = counts
  })

  let autocomplete: Autocomplete
  let getDepartementsDisponibles = jest.fn(() => Promise.resolve([] as Departement[]))
  beforeEach(() => {
    getDepartementsDisponibles = jest.fn(() => Promise.resolve([
        départementAisne,
        départementCalvados,
        départementCôteDOr,
        départementGuyane
    ]))
    autocomplete = new Autocomplete(webBaseUrl, getDepartementsDisponibles)
  })

  it('instanciates', () => {
    expect(autocomplete).toBeInstanceOf(Autocomplete)
  })

  describe('suggest(prefix)', () => {
    describe('with empty string', () => {
      const prefix = ''
      it('resolves empty', async () => {
        // When
        const actual = await autocomplete.suggest(prefix)
        // Then
        expect(actual).toEqual([])
      })
      it("hasn't fetched any data", async () => {
        // When
        await autocomplete.suggest(prefix)
        // Then
        expect(mocked(window.fetch)).not.toHaveBeenCalled()
      })
    })
    describe('with prefix of length 1', () => {
      const prefix = 'a'
      it('resolves empty', async () => {
        // When
        const actual = await autocomplete.suggest(prefix)
        // Then
        expect(actual).toEqual([])
      })
      it("hasn't fetched any data", async () => {
        // When
        await autocomplete.suggest(prefix)
        // Then
        expect(mocked(window.fetch)).not.toHaveBeenCalled()
      })
    })

    describe('with a numeric prefix which has a matching departement', () => {
      const prefix = '14'
      it('fetches all departements', async () => {
        // When
        await autocomplete.suggest(prefix)
        // Then
        expect(mocked(getDepartementsDisponibles)).toHaveBeenCalledTimes(1)
      })
      it('fetches departements only once', async () => {
        // When
        await autocomplete.suggest(prefix)
        await autocomplete.suggest(prefix)
        await autocomplete.suggest(prefix)
        // Then
        expect(mocked(getDepartementsDisponibles)).toHaveBeenCalledTimes(1)
      })
      it('resolves a list with the matching departement', async () => {
        // Given
        const expected = [départementCalvados]
        // When
        const actual = await autocomplete.suggest(prefix)
        // Then
        expect(actual).toIncludeAllMembers(expected)
      })
      it('resolves a list excluding unmatched departement', async () => {
        // Given
        const expected = [départementAisne, départementCôteDOr]
        // When
        const actual = await autocomplete.suggest(prefix)
        // Then
        expect(actual).not.toIncludeAnyMembers(expected)
      })
    })

    describe('with a name prefix which has a matching departement', () => {
      const prefix = 'Ca'
      it('fetches all departements', async () => {
        // Given
        // When
        await autocomplete.suggest(prefix)
        // Then
        expect(mocked(getDepartementsDisponibles)).toHaveBeenCalledTimes(1)
      })
      it('fetches departements only once', async () => {
        // When
        await autocomplete.suggest(prefix)
        await autocomplete.suggest(prefix)
        await autocomplete.suggest(prefix)
        // Then
        expect(mocked(getDepartementsDisponibles)).toHaveBeenCalledTimes(1)
      })
      it('resolves a list with the matching departement', async () => {
        // Given
        const expected = [départementCalvados]
        // When
        const actual = await autocomplete.suggest(prefix)
        // Then
        expect(actual).toIncludeAllMembers(expected)
      })
      it('resolves a list excluding unmatched departement', async () => {
        // Given
        const expected = [départementAisne, départementCôteDOr]
        // When
        const actual = await autocomplete.suggest(prefix)
        // Then
        expect(actual).not.toIncludeAnyMembers(expected)
      })
      describe('containing special characters', () => {
        const prefix = 'co'
        it('resolves a list with the matching departement', async () => {
          // Given
          const expected = [départementCôteDOr]
          // When
          const actual = await autocomplete.suggest(prefix)
          // Then
          expect(actual).toIncludeAllMembers(expected)
        })
        it('resolves a list excluding unmatched departement', async () => {
          // Given
          const expected = [départementAisne, départementCalvados]
          // When
          const actual = await autocomplete.suggest(prefix)
          // Then
          expect(actual).not.toIncludeAnyMembers(expected)
        })
      })
    })

    describe('with a numeric prefix matching a commune', () => {
      const prefix = '1480'
      it('fetches autocomplete triggers', async () => {
        // When
        await autocomplete.suggest(prefix)
        // Then
        expect(fetchCalls[`${webBaseUrl}autocompletes.json`]).toEqual(1)
      })
      it('fetches autocomplete triggers only once', async () => {
        // When
        await autocomplete.suggest(prefix)
        await autocomplete.suggest(prefix)
        await autocomplete.suggest(prefix)
        // Then
        expect(fetchCalls[`${webBaseUrl}autocompletes.json`]).toEqual(1)
      })
      it('fetches the longest possible prefix matches', async () => {
        // When
        await autocomplete.suggest(prefix)
        // Then
        expect(fetchCalls[`${webBaseUrl}autocomplete-cache/vmd_14.json`]).toEqual(1)
        expect(fetchCalls[`${webBaseUrl}autocomplete-cache/vmd_1480.json`]).toBeUndefined()
        expect(fetchCalls[`${webBaseUrl}autocomplete-cache/vmd_148.json`]).toBeUndefined
        expect(fetchCalls[`${webBaseUrl}autocomplete-cache/vmd_1.json`]).toBeUndefined()
      })
      it('fetches the longest possible prefix matches only once', async () => {
        // When
        await autocomplete.suggest(prefix)
        await autocomplete.suggest(prefix)
        await autocomplete.suggest(prefix)
        // Then
        expect(fetchCalls[`${webBaseUrl}autocomplete-cache/vmd_14.json`]).toEqual(1)
      })

      it('resolves a list with the matching commune', async () => {
        // Given
        const expected = [communeDeauville, communeCanapville]
        // When
        const actual = await autocomplete.suggest(prefix)
        // Then
        expect(actual).toIncludeAllMembers(expected)
      })
      it('resolves a list excluding unmatched departement', async () => {
        // Given
        const expected = [communeAblon]
        // When
        const actual = await autocomplete.suggest(prefix)
        // Then
        expect(actual).not.toIncludeAnyMembers(expected)
      })
    })

    describe('with a text prefix matching a commune', () => {
      const prefix = 'deauv'
      it('fetches autocomplete triggers', async () => {
        // When
        await autocomplete.suggest(prefix)
        // Then
        expect(fetchCalls[`${webBaseUrl}autocompletes.json`]).toEqual(1)
      })
      it('fetches autocomplete triggers only once', async () => {
        // When
        await autocomplete.suggest(prefix)
        await autocomplete.suggest(prefix)
        await autocomplete.suggest(prefix)
        // Then
        expect(fetchCalls[`${webBaseUrl}autocompletes.json`]).toEqual(1)
      })
      it('fetches the longest possible prefix matches', async () => {
        // When
        await autocomplete.suggest(prefix)
        // Then
        expect(fetchCalls[`${webBaseUrl}autocomplete-cache/vmd_dea.json`]).toEqual(1)
        expect(fetchCalls[`${webBaseUrl}autocomplete-cache/vmd_deauv.json`]).toBeUndefined()
        expect(fetchCalls[`${webBaseUrl}autocomplete-cache/vmd_deau.json`]).toBeUndefined
        expect(fetchCalls[`${webBaseUrl}autocomplete-cache/vmd_de.json`]).toBeUndefined()
      })
      it('fetches the longest possible prefix matches only once', async () => {
        // When
        await autocomplete.suggest(prefix)
        await autocomplete.suggest(prefix)
        await autocomplete.suggest(prefix)
        // Then
        expect(fetchCalls[`${webBaseUrl}autocomplete-cache/vmd_dea.json`]).toEqual(1)
      })

      it('resolves a list with the matching commune', async () => {
        // Given
        const expected = [communeDeauville]
        // When
        const actual = await autocomplete.suggest(prefix)
        // Then
        expect(actual).toIncludeAllMembers(expected)
      })
      it('resolves a list excluding unmatched departement', async () => {
        // Given
        const expected = [communeDeaumont]
        // When
        const actual = await autocomplete.suggest(prefix)
        // Then
        expect(actual).not.toIncludeAnyMembers(expected)
      })
    })

    describe('with a prefix matching both commune and departement', () => {
      const prefix = '14'
      it('resolves with departement before commune', async () => {
        // When
        const actual = await autocomplete.suggest(prefix)
        // Then
        expect(actual).toEqual([départementCalvados, communeAblon, communeCanapville, communeDeauville])
      })
    })
    describe('with a prefix containing overseas collectivities', () => {
      const prefix = '97'
      it('ignores overseas collectivites in results', async () => {
        // When
        const actual = await autocomplete.suggest(prefix)
        // Then
        expect(actual).toEqual([départementGuyane])
      })
      it.skip('resolves with overseas collectivities without gps coordinates', async () => {
        // When
        const actual = await autocomplete.suggest(prefix)
        // Then
        expect(actual).toEqual([départementGuyane, MiquelonLanglade])
      })
    })
  })

  describe('findCommune(codePostal, codeInsee)', () => {
    describe('when there is no available resource', () => {
      const codePostal = '50000'
      const codeInsee = '50500'
      it('resolves undefined', async () => {
        // When
        const actual = await autocomplete.findCommune(codePostal, codeInsee)
        // Then
        expect(actual).toBeUndefined()
      })
    })
    describe('when there is no exact match', () => {
      const codePostal = '14800'
      const codeInsee = '14000'
      it('resolves undefined', async () => {
        // When
        const actual = await autocomplete.findCommune(codePostal, codeInsee)
        // Then
        expect(actual).toBeUndefined()
      })
    })
    describe('when there is an exact match', () => {
      const codePostal = '14800'
      const codeInsee = '14220'
      it('resolves commune', async () => {
        // When
        const actual = await autocomplete.findCommune(codePostal, codeInsee)
        // Then
        expect(actual).toEqual(communeDeauville)
        expect(fetchCalls[`${webBaseUrl}autocompletes.json`]).toEqual(1)
        expect(fetchCalls[`${webBaseUrl}autocomplete-cache/vmd_14.json`]).toEqual(1)
      })
    })

    describe('for an overseas collectivity', () => {
      it('ignores it for now', async () => {
        // When
        const actual = await autocomplete.findCommune(MiquelonLanglade.codePostal, MiquelonLanglade.code)
        // Then
        expect(actual).toBeUndefined()
      })
    })
  })

})


function StaticFetchMock (staticFiles: Record<string, any>): [typeof window.fetch, Record<string, number>] {
  const counts = Object.keys(staticFiles).reduce((counts, key) => ({...counts, [key]: 0}), {}) as Record<string, number>
  const fetchMock = jest.fn(async (url: string) => {
    if (staticFiles.hasOwnProperty(url)) {
      ++counts[url]
      return {
        ok: true,
        status: 200,
        json: () => Promise.resolve(staticFiles[url])
      }
    } else {
      return {
        ok: false,
        status: 404,
        json: () => { throw TypeError(`pas de stub pour ${url}`) }
      }
    }
  }) as unknown as typeof window.fetch

  return [fetchMock, counts]
}
