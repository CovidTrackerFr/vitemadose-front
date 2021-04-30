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
                    <h3 class="h2"> Nombre de créneaux disponibles</h3>
                      <vmd-stats-by-date-creneaux-graph width="400" height="150" .data="${this.statsByDates}"></vmd-stats-by-date-creneaux-graph>
                    </div>
                </div>

                <div class="homeCard">
                    <div class="p-5 text-dark bg-light homeCard-container mt-5">
                        <h3 class="h2"> Nombre de centres ayant des disponibilités</h3>
                      <vmd-stats-by-date-centres-graph width="400" height="150" .data="${this.statsByDates}"></vmd-stats-by-date-creneaux-graph>
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
