import '@testing-library/jest-dom'
import { html } from 'lit-html'
import { waitFor, screen, fireEvent } from "testing-library__dom";
import userEvent from "@testing-library/user-event"
import { fixture } from "@open-wc/testing-helpers";
import './vmd-commune-or-departement-selector.component'

import { Commune, Departement } from '../state/State'
import { delay } from '../utils/Schedulers'

const départementCalvados: Departement = {
  code_departement: '14',
  nom_departement: 'Calvados',
  code_region: 28,
  nom_region: 'Normandie'
}

const communeDeauville: Commune = {
  code: "14220",
  codePostal: "14800",
  nom: "Deauville",
  codeDepartement: "14",
  longitude: 0.0772,
  latitude: 49.3531
}

describe('<vmd-commune-or-departement-selector />', () => {
  let onCommuneSelected = jest.fn()
  let onDepartementSelected = jest.fn()
  let suggest = jest.fn(() => Promise.resolve([] as any[]))
  const placeholder = "Commune, Code postal, Département..."
  beforeEach(() => {
    onCommuneSelected.mockClear()
    onDepartementSelected.mockClear()
    suggest.mockClear()
    window.scroll = jest.fn()
    suggest.mockImplementation(async () => ([
      départementCalvados,
      communeDeauville
    ]))
  })
  describe('when a value is given', () => {
    describe('and is a département', () => {
      beforeEach(async () => {
        await fixture(html`
          <vmd-commune-or-departement-selector
            @on-commune-selected="${onCommuneSelected}"
            @on-departement-selected="${onDepartementSelected}"
            .suggest="${suggest}"
            .value="${départementCalvados}"
          />
        `)
      })

      it('displays the name into the input', async () => {
        // Then
        const input = screen.getByPlaceholderText(placeholder)
        expect(input).toHaveValue('14 - Calvados')
      })
    })
    describe('and is a commune', () => {
      beforeEach(async () => {
        await fixture(html`
          <vmd-commune-or-departement-selector
            @on-commune-selected="${onCommuneSelected}"
            @on-departement-selected="${onDepartementSelected}"
            .suggest="${suggest}"
            .value="${communeDeauville}"
          />
        `)
      })

      it('displays the name into the input', async () => {
        // Then
        const input = screen.getByPlaceholderText(placeholder)
        expect(input).toHaveValue('14800 - Deauville')
      })
    })
    describe('and the focuses the input', () => {
      it('selects all the content', async () => {
        // Given
        await fixture(html`
          <vmd-commune-or-departement-selector
            @on-commune-selected="${onCommuneSelected}"
            @on-departement-selected="${onDepartementSelected}"
            .suggest="${suggest}"
            .value="${communeDeauville}"
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
        <vmd-commune-or-departement-selector
          @on-commune-selected="${onCommuneSelected}"
          @on-departement-selected="${onDepartementSelected}"
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
      expect(suggestions).toHaveLength(2)
      expect(suggestions[0]).toHaveTextContent('14 - Calvados')
      expect(suggestions[1]).toHaveTextContent('14800 - Deauville')
    })

    describe('when pressing {enter}', () => {
      it('selects the first suggestion', async () => {
        // Given
        const input = screen.getByPlaceholderText(placeholder)
        // When
        await userEvent.type(input, 'Cal{enter}', { delay: 20 })
        // Then
        expect(onDepartementSelected).toHaveBeenCalledTimes(1)
      })
      describe('after pressing arrow down once', () => {
        it('selects the second suggestion', async () => {
          // Given
          const input = screen.getByPlaceholderText(placeholder)
          // When
          await userEvent.type(input, 'Cal{arrowdown}{enter}', { delay: 20 })
          // Then
          expect(onCommuneSelected).toHaveBeenCalledTimes(1)
        })
      })
    })

    describe('when a suggestion is clicked', () => {
      describe('and is a département', () => {
        beforeEach(async () => {
          // Given
          const input = screen.getByPlaceholderText(placeholder)
          // When
          await userEvent.type(input, 'Cal')
          const [ suggestionCalvados ] = await screen.findAllByRole('option')
          await userEvent.click(suggestionCalvados)
        })
        it("emits 'on-departement-selected'", async () => {
          // Then
          expect(onCommuneSelected).toHaveBeenCalledTimes(0)
          expect(onDepartementSelected).toHaveBeenCalledTimes(1)
          expect(onDepartementSelected.mock.calls[0][0].detail).toEqual({
            departement: départementCalvados
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
          await userEvent.type(input, 'Cal')
          const [ _, suggestionDeauville ] = await screen.findAllByRole('option')
          await userEvent.click(suggestionDeauville)
        })
        it("emits 'on-commune-selected'", async () => {
          // Then
          expect(onCommuneSelected).toHaveBeenCalledTimes(1)
          expect(onDepartementSelected).toHaveBeenCalledTimes(0)
          expect(onCommuneSelected.mock.calls[0][0].detail).toEqual({
            commune: communeDeauville
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
