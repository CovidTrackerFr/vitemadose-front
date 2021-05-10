import '../components/graphs/vmd-stats-by-date-creneaux-graph.component'
import '../components/graphs/vmd-stats-by-date-centres-graph.component'

import {css, customElement, html, LitElement, property } from 'lit-element';

import {
    State,
    StatsByDate,
    StatsLieu,
} from "../state/State";
import {CSS_Global, CSS_Home} from "../styles/ConstructibleStyleSheets";

@customElement('vmd-statistiques')
export class VmdLieuxStatistiques extends LitElement {
    static styles = [
        CSS_Global,
        CSS_Home,
        css`
            :host {
                display: block;
            }
        `
    ];

    @property({type: Array, attribute: false}) statsLieu: StatsLieu|undefined = undefined;
    @property({type: Array, attribute: false}) statsByDates: StatsByDate|undefined = undefined;

    render() {
        return html`
                <br>
                <div class="container">
                  <div class="row">
                    <div class="col-md">
                      <h2 class="h1"> Statistiques</h2>
                    </div>
                  </div>
                </div>

                <div class="container-xxl">
                  <div class="row gx-5">
                    <div class="col-sm-24 col-md mb-5 mb-md-0 homeCard">

                      <div class="p-5 text-dark bg-light homeCard-container mt-5">
                        <h3 class="h2"> Créneaux disponibles</h3>
                        <p>Nombre de créneaux de vaccination disponibles à la réservation pour les prochaines heures ou prochains jours. <i><small>Ce chiffre ne correspond pas au nombre de doses.</small></i></p>
                        <vmd-stats-by-date-creneaux-graph class="img-fluid"  width="400" height="150" .data="${this.statsByDates}"></vmd-stats-by-date-creneaux-graph>
                      </div>
                    </div>

                    <div class="col-sm-24 col-md mb-5 mb-md-0 homeCard">
                      <div class="p-5 text-dark bg-light homeCard-container mt-5">
                        <h3 class="h2"> Lieux disponibles</h3>
                        <p>Nombre de lieux de vaccination ayant au moins un créneau de vaccination qui peut être réservé.</p>
                        <vmd-stats-by-date-centres-graph class="img-fluid" width="400" height="150" .data="${this.statsByDates}"></vmd-stats-by-date-creneaux-graph>
                      </div>
                    </div>
                  </div>
                  <div class="row gx-5">
                    <div class="col-sm-24 col-md mb-5 mb-md-0 homeCard">
                      <div class="p-5 text-dark bg-light homeCard-container mt-5">
                        <h3 class="h2"> Créneaux disponibles par habitant</h3>
                        <p>Nombre de créneaux disponibles à la réservation pour les prochains jours rapporté à 1000 habitants de chaque département.</p>
                        <img class="img-fluid" src='https://vitemadose.gitlab.io/vitemadose/map_creneaux_pop.svg' />
                      </div>
                    </div>

                    <div class="col-sm-24 col-md mb-5 mb-md-0 homeCard">
                      <div class="p-5 text-dark bg-light homeCard-container mt-5">
                        <h3 class="h2"> Créneaux disponibles</h3>
                        <p>Nombre de créneaux disponibles à la réservation pour les prochains jours.</p>
                        <img class="img-fluid" src='https://vitemadose.gitlab.io/vitemadose/map_creneaux.svg' />
                      </div>
                    </div>
                  </div>
                </div>
        `;
    }

    async connectedCallback() {
        super.connectedCallback();

        const [ statsLieu, statsByDates ] = await Promise.all([
            State.current.statsLieux(),
            State.current.statsByDate(),
        ])
        this.statsLieu = statsLieu;
        this.statsByDates = statsByDates;

        this.requestUpdate();
    }


    disconnectedCallback() {
        super.disconnectedCallback();
        // console.log("disconnected callback")
    }
}
