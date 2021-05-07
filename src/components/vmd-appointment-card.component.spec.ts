import '@testing-library/jest-dom'
import { html } from 'lit-html'
import { fixture } from "@open-wc/testing-helpers";
import { screen } from "testing-library__dom";
import './vmd-appointment-card.component'

import { Lieu, LieuAffichableAvecDistance } from '../state/State'

describe('<vmd-appointment-card>', () => {
  const unLieuDeBase: Lieu = {
    appointment_count: 0,
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
    vaccine_type: 'AstraZeneca'
  }
  itMatches('a basic lieu', {
    ...unLieuDeBase
  })
  itMatches('a lieu with short distance', {
    ...unLieuDeBase,
    distance: 5.3456
  })
  itMatches('a lieu with long distance', {
    ...unLieuDeBase,
    distance: 57.23456
  })
  itMatches('a lieu phone only', {
    ...unLieuDeBase,
    appointment_by_phone_only: true,
    metadata: {
      ...unLieuDeBase.metadata,
      phone_number: "0123456789"
    }
  })
  itMatches('a lieu without date', {
    ...unLieuDeBase,
    appointment_count: 1,
    prochain_rdv: null,
  })
  itMatches('a lieu with unknown plateforme', {
    ...unLieuDeBase,
    plateforme: "CoucouClic",
  })

  function itMatches(description: string, lieu: Lieu | LieuAffichableAvecDistance) {
    describe(description, () => {
      it('matches snapshot', async () => {
        // When
        await fixture(html`<vmd-appointment-card data-testid="topic" .lieu="${lieu}" />`)
        const actual = screen.getByTestId('topic').shadowRoot
        // Then
        expect(actual).toMatchSnapshot()
      })
    })
  }
})
