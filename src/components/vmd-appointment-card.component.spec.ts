import '@testing-library/jest-dom'
import { html } from 'lit-html'
import { fixture } from "@open-wc/testing-helpers";
import { screen } from "testing-library__dom";
import './vmd-appointment-card.component'

import { Lieu } from '../state/State'

describe('<vmd-appointment-card>', () => {
  it('matches snapshot', async () => {
    // Given
    const unLieu: Lieu = {
      appointment_count: 8,
      departement: '50',
      location: { latitude: 45, longitude: -0.5 },
      nom: "Chez Huguette",
      url: 'https://chez.hugette.fr',
      appointment_by_phone_only: false,
      plateforme: 'Doctolib',
      prochain_rdv: '2021-08-12',
      metadata: {
        address: '123 rue Bidon',
        phone_number: undefined,
        business_hours: undefined
      },
      type: 'drugstore',
      vaccine_type: 'ARNm'
    }
    // When
    const actual = await render(unLieu)
    // Then
    expect(actual).toMatchSnapshot()
  })
})


async function render (lieu: Lieu) {
  await fixture(html`<vmd-appointment-card data-testid="topic" .lieu="${lieu}" />`)
  return screen.getByTestId('topic').shadowRoot
}
