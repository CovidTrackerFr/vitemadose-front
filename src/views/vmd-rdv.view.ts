import {LitElement, html, customElement, property, css} from 'lit-element';
import {TrancheAge, TrancheAgeSelected} from "../components/vmd-tranche-age-selector.component";
import {Departement, DepartementSelected} from "../components/vmd-departement-selector.component";
import {Router} from "../routing/Router";
import {repeat} from "lit-html/directives/repeat";

export type ISODateString = string;
export type Centre = {
    departement: string;
    nom: string;
    url: string;
    plateforme: string;
    prochain_rdv: ISODateString|null;
};

@customElement('vmd-rdv')
export class VmdRdvView extends LitElement {

    //language=css
    static styles = css`
    `;

    @property({type: String, attribute: true}) trancheAge: TrancheAge|undefined = undefined;
    @property({type: String, attribute: true}) codeDepartement: string|undefined = undefined;

    @property({type: Object, attribute: false}) departement: Departement|undefined = undefined;
    @property({type: Array, attribute: false}) centresAvecDispos: Centre[] = [];
    @property({type: Array, attribute: false}) centresSansDispos: Centre[] = [];

    constructor() {
        super();
    }

    render() {
        return html`
          Selected tranche age : ${this.trancheAge} | Selected departement : ${this.departement?.nom_departement}
          <br/>

          <vmd-tranche-age-selector trancheAge="${this.trancheAge}" @tranche-age-changed="${(event: CustomEvent<TrancheAgeSelected>) => this.trancheAge = event.detail.trancheAge}"></vmd-tranche-age-selector>
          <vmd-departement-selector codeDepartement="${this.codeDepartement}" @departement-changed="${(event: CustomEvent<DepartementSelected>) => this.departement = event.detail.departement}"></vmd-departement-selector>

          <hr/>
          
          <div class="card">
            ${this.centresAvecDispos.length} Centres(s) ayant des disponibilités
            ${repeat(this.centresAvecDispos, (c => `${c.departement}||${c.nom}||${c.plateforme}`), (centre) => {
                return html`
                  <div>
                     Prochain rdv: ${centre.prochain_rdv}<br/>
                     ${centre.nom}
                    <a href="${centre.url}" target="_blank">Prendre rendez-vous</a>
                  </div>
                `
            })}
          </div>

          <hr/>
          
          <div class="card">
            Autres centres sans créneaux de vaccination détecté
            ${repeat(this.centresSansDispos, (c => `${c.departement}||${c.nom}||${c.plateforme}`), (centre) => {
              return html`
                  <div>
                     Prochain rdv: Aucun<br/>
                     ${centre.nom}
                  </div>
                `
            })}
          </div>
        `;
    }

    connectedCallback() {
        super.connectedCallback();
        fetch(`https://raw.githubusercontent.com/CovidTrackerFr/vitemadose/data-auto/data/output/75.json?dept=${this.codeDepartement}&trancheAge=${this.trancheAge}`)
            .then(resp => resp.json())
            .then(results => {
                this.centresAvecDispos = results.centres_disponibles;
                this.centresSansDispos = results.centres_indisponibles;
            });
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        // console.log("disconnected callback")
    }
}
