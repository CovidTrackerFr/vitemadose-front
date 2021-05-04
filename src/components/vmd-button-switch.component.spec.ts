import '@testing-library/jest-dom'
import { html } from 'lit-html'
import { screen } from "testing-library__dom";
import userEvent from "@testing-library/user-event"
import { fixture } from "@open-wc/testing-helpers";
import './vmd-button-switch.component'

describe("<vmd-button-switch>", () => {
  const options = [
    { code: 'y', libelle: 'oui' },
    { code: 'n', libelle: 'non' }
  ]
  let onChanged = jest.fn()
  beforeEach(async () => {
    onChanged = jest.fn()
    await fixture(html`
      <vmd-button-switch
        .codeSelectionne="${'y'}"
        .options="${options}"
        @changed="${onChanged}"
      />`)
  })

  it('displays a group of options', () =>{
    expect(screen.getByRole('group')).toBeDefined()
  })

  it('displays the current selected option as pressed', () => {
    expect(screen.getByRole('button', { pressed: true })).toHaveTextContent('oui')
  })
  it('displays the other option as unpressed', () => {
    expect(screen.getByRole('button', { pressed: false })).toHaveTextContent('non')
  })
  describe('when clicking the inactive option', () => {
    it("triggers the 'changed' event", async () => {
      await userEvent.click(screen.getByText('non'))
      expect(onChanged).toHaveBeenCalledTimes(1)
      expect(onChanged.mock.calls[0][0].detail).toEqual({ value: 'n' })
    })
    it("updates the pressed buttons", async () => {
      await userEvent.click(screen.getByText('non'))
      expect(screen.getByRole('button', { pressed: true })).toHaveTextContent('non')
      expect(screen.getByRole('button', { pressed: false })).toHaveTextContent('oui')
    })
  })
  describe('when clicking the active option', () => {
    it("doesn't trigger an event", async () => {
      await userEvent.click(screen.getByText('oui'))
      expect(onChanged).toHaveBeenCalledTimes(0)
    })
  })
})
