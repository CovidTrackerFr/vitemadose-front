import '@testing-library/jest-dom'
import { html } from 'lit-html'
import { screen } from "testing-library__dom";
import userEvent from "@testing-library/user-event"
import { fixture } from "@open-wc/testing-helpers";
import './vmd-lieu-selector.component'

import { Commune, Departement, Region } from '../state/State'
import { delay } from '../utils/Schedulers'

const départementNord: Departement = {
  code_departement: '59',
  nom_departement: 'Nord',
  code_region: '32',
  nom_region: 'Hauts-de-France'
}

const communeInor: Commune = {
  code: "55250",
  codePostal: "55700",
  nom: "Inor",
  codeDepartement: "55",
  longitude: 5.1623,
  latitude: 49.5533
}

const régionNormandie: Region = {
  code_region: '28',
  nom_region: 'Normandie',
}

describe('<vmd-lieu-selector />', () => {
  let onCommuneSelected = jest.fn()
  let onDepartementSelected = jest.fn()
  let onRegionSelected = jest.fn()
  let suggest = jest.fn(() => Promise.resolve([] as any[]))
  const placeholder = "Commune, Code postal, Département, Région..."
  beforeEach(() => {
    onCommuneSelected.mockClear()
    onDepartementSelected.mockClear()
    onRegionSelected.mockClear()
    suggest.mockClear()
    window.scroll = jest.fn()
    suggest.mockImplementation(async () => ([
      départementNord,
      régionNormandie,
      communeInor,
    ]))
  })
  describe('when a value is given', () => {
    describe('and is a région', () => {
      beforeEach(async () => {
        await fixture(html`
          <vmd-lieu-selector
            @on-commune-selected="${onCommuneSelected}"
            @on-departement-selected="${onDepartementSelected}"
            @on-region-selected="${onRegionSelected}"
            .suggest="${suggest}"
            .value="${régionNormandie}"
          />
        `)
      })

      it('displays the name into the input', async () => {
        // Then
        const input = screen.getByPlaceholderText(placeholder)
        expect(input).toHaveValue('Normandie')
      })
    })
    describe('and is a département', () => {
      beforeEach(async () => {
        await fixture(html`
          <vmd-lieu-selector
            @on-commune-selected="${onCommuneSelected}"
            @on-departement-selected="${onDepartementSelected}"
            @on-region-selected="${onRegionSelected}"
            .suggest="${suggest}"
            .value="${départementNord}"
          />
        `)
      })

      it('displays the name into the input', async () => {
        // Then
        const input = screen.getByPlaceholderText(placeholder)
        expect(input).toHaveValue('59 - Nord')
      })
    })
    describe('and is a commune', () => {
      beforeEach(async () => {
        await fixture(html`
          <vmd-lieu-selector
            @on-commune-selected="${onCommuneSelected}"
            @on-departement-selected="${onDepartementSelected}"
            @on-region-selected="${onRegionSelected}"
            .suggest="${suggest}"
            .value="${communeInor}"
          />
        `)
      })

      it('displays the name into the input', async () => {
        // Then
        const input = screen.getByPlaceholderText(placeholder)
        expect(input).toHaveValue('55700 - Inor')
      })
    })
    describe('and the focuses the input', () => {
      it('selects all the content', async () => {
        // Given
        await fixture(html`
          <vmd-lieu-selector
            @on-commune-selected="${onCommuneSelected}"
            @on-departement-selected="${onDepartementSelected}"
            @on-region-selected="${onRegionSelected}"
            .suggest="${suggest}"
            .value="${communeInor}"
          />
        `)
        const input = screen.getByPlaceholderText(placeholder) as HTMLInputElement
        // When
        await userEvent.click(input)
        await cooldown()
        // Then
        const selectedText = input.value.substring(input.selectionStart!, input.selectionEnd!)
        expect(selectedText).toEqual(input.value)
      })
    })
  })
  describe('when no value is given and something typed', () => {
    const value = undefined
    beforeEach(async () => {
      await fixture(html`
        <vmd-lieu-selector
          @on-commune-selected="${onCommuneSelected}"
          @on-departement-selected="${onDepartementSelected}"
          @on-region-selected="${onRegionSelected}"
          .suggest="${suggest}"
          .value="${value}"
        />
      `)
    })
    it('shows suggestions from suggest() attribute', async () => {
      // Given
      const input = screen.getByPlaceholderText(placeholder)
      // When
      await userEvent.type(input, 'Cal')
      // Then
      expect(suggest).toHaveBeenCalledWith('Cal')
      expect(await screen.findByRole('listbox')).toBeDefined()
      const suggestions = await screen.findAllByRole('option')
      expect(suggestions).toHaveLength(3)
      expect(suggestions[0]).toHaveTextContent('59 - Nord')
      expect(suggestions[1]).toHaveTextContent('Normandie')
      expect(suggestions[2]).toHaveTextContent('55700 - Inor')
    })

    describe('when pressing {enter}', () => {
      it('selects the first suggestion', async () => {
        // Given
        const input = screen.getByPlaceholderText(placeholder)
        // When
        await userEvent.type(input, 'Nor{enter}', { delay: 20 })
        // Then
        expect(onDepartementSelected).toHaveBeenCalledTimes(1)
      })
      describe('after pressing arrow down once', () => {
        it('selects the second suggestion', async () => {
          // Given
          const input = screen.getByPlaceholderText(placeholder)
          // When
          await userEvent.type(input, 'Nor{arrowdown}{enter}', { delay: 20 })
          // Then
          expect(onRegionSelected).toHaveBeenCalledTimes(1)
        })
      })
      describe('after pressing arrow down twice', () => {
        it('selects the second suggestion', async () => {
          // Given
          const input = screen.getByPlaceholderText(placeholder)
          // When
          await userEvent.type(input, 'Nor{arrowdown}{arrowdown}{enter}', { delay: 20 })
          // Then
          expect(onCommuneSelected).toHaveBeenCalledTimes(1)
        })
      })
    })

    describe('when a suggestion is clicked', () => {
      describe('and is a région', () => {
        beforeEach(async () => {
          // Given
          const input = screen.getByPlaceholderText(placeholder)
          // When
          await userEvent.type(input, 'Nor')
          const [ _, suggestionNormandie ] = await screen.findAllByRole('option')
          await userEvent.click(suggestionNormandie)
        })
        it("emits 'on-departement-selected'", async () => {
          // Then
          expect(onCommuneSelected).toHaveBeenCalledTimes(0)
          expect(onDepartementSelected).toHaveBeenCalledTimes(0)
          expect(onRegionSelected).toHaveBeenCalledTimes(1)
          expect(onRegionSelected.mock.calls[0][0].detail).toEqual({
            region: régionNormandie
          })
        })
        it("hides the suggestions", async () => {
          // Then
          expect(screen.queryByRole('listbox')).toEqual(null)
          expect(await screen.queryAllByRole('option')).toHaveLength(0)
        })
      })
      describe('and is a département', () => {
        beforeEach(async () => {
          // Given
          const input = screen.getByPlaceholderText(placeholder)
          // When
          await userEvent.type(input, 'Nor')
          const [ suggestionNord ] = await screen.findAllByRole('option')
          await userEvent.click(suggestionNord)
        })
        it("emits 'on-departement-selected'", async () => {
          // Then
          expect(onCommuneSelected).toHaveBeenCalledTimes(0)
          expect(onDepartementSelected).toHaveBeenCalledTimes(1)
          expect(onRegionSelected).toHaveBeenCalledTimes(0)
          expect(onDepartementSelected.mock.calls[0][0].detail).toEqual({
            departement: départementNord
          })
        })
        it("hides the suggestions", async () => {
          // Then
          expect(screen.queryByRole('listbox')).toEqual(null)
          expect(await screen.queryAllByRole('option')).toHaveLength(0)
        })
      })
      describe('and is a commune', () => {
        beforeEach(async () => {
          // Given
          const input = screen.getByPlaceholderText(placeholder)
          // When
          await userEvent.type(input, 'Nor')
          const [ _x, _y, suggestionInor ] = await screen.findAllByRole('option')
          await userEvent.click(suggestionInor)
        })
        it("emits 'on-commune-selected'", async () => {
          // Then
          expect(onCommuneSelected).toHaveBeenCalledTimes(1)
          expect(onDepartementSelected).toHaveBeenCalledTimes(0)
          expect(onRegionSelected).toHaveBeenCalledTimes(0)
          expect(onCommuneSelected.mock.calls[0][0].detail).toEqual({
            commune: communeInor
          })
        })
        it("hides the suggestions", async () => {
          // Then
          expect(screen.queryByRole('listbox')).toEqual(null)
          expect(await screen.queryAllByRole('option')).toHaveLength(0)
        })
      })
    })
  })
})

const cooldown = () => delay(100)
