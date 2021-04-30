import {css, customElement, html, LitElement, property, unsafeCSS} from 'lit-element';

import globalCss from "../styles/global.scss";
import homeViewCss from "../styles/views/_home.scss";
import searchDoseCss from "../styles/components/_searchDose.scss";
import searchAppointment from "../styles/components/_searchAppointment.scss";

import {
    State,
    StatsByDate,
    StatsLieu,
} from "../state/State";

@customElement('vmd-statistiques')
export class VmdLieuxStatistiques extends LitElement {
    static styles = [
        css`${unsafeCSS(globalCss)}`,
        css`${unsafeCSS(homeViewCss)}`,
        css`${unsafeCSS(searchDoseCss)}`,
        css`${unsafeCSS(searchAppointment)}`,
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
                <h2 class="h1"> Statistiques</h2>

                <div class="homeCard">
                
                    <div class="p-5 text-dark bg-light homeCard-container mt-5">
                        <h3 class="h2"> Créneaux disponibles</h3>
                        <p>Nombre de créneaux de vaccination disponibles à la réservation pour les prochaines heures ou procains jours. <i><small>Ce chiffre ne correspond pas au nombre de doses.</small></i></p>
                        <vmd-stats-by-date-creneaux-graph width="400" height="150" .data="${this.statsByDates}"></vmd-stats-by-date-creneaux-graph>
                    </div>
                </div>

                <div class="homeCard">
                    <div class="p-5 text-dark bg-light homeCard-container mt-5">
                        <h3 class="h2"> Lieux disponibles</h3>
                        <p>Nombre de lieux de vaccination ayant au moins un créneau de vaccination qui peut être réservé.</p>
                        <vmd-stats-by-date-centres-graph width="400" height="150" .data="${this.statsByDates}"></vmd-stats-by-date-creneaux-graph>
                    </div>
                </div> 

                <div class="homeCard">
                    <div class="p-5 text-dark bg-light homeCard-container mt-5">
                        <h3 class="h2"> Créneaux disponibles par habitant</h3>
                        <p>Nombre de créneaux disponibles à la réservation pour les prochains jours rapporté à 100 000 habitants de chaque département.</p>
                        <img src='https://vitemadose.gitlab.io/vitemadose/map_creneaux_pop.svg'></img>
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
