import {
    LitElement,
    html,
    customElement,
    property,
    css,
    unsafeCSS,
    PropertyValues
} from 'lit-element';
import {TrancheAge, TrancheAgeSelected} from "../components/vmd-tranche-age-selector.component";
import {Departement, DepartementSelected} from "../components/vmd-departement-selector.component";
import {repeat} from "lit-html/directives/repeat";
import globalCss from "../styles/global.scss";
import {Router} from "../routing/Router";

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
    static styles = [
        css`${unsafeCSS(globalCss)}`,
        css`
        `
    ];

    @property({type: String, attribute: true}) trancheAge: TrancheAge|undefined = undefined;
    @property({type: String, attribute: true}) codeDepartement: string|undefined = undefined;

    @property({type: Object, attribute: false}) departement: Departement|undefined = undefined;
    @property({type: Array, attribute: false}) centresAvecDispos: Centre[] = [];
    @property({type: Array, attribute: false}) centresSansDispos: Centre[] = [];

    constructor() {
        super();
    }

    findCentres() {
        if(this.trancheAge && this.codeDepartement) {
            fetch(`https://raw.githubusercontent.com/CovidTrackerFr/vitemadose/data-auto/data/output/${this.codeDepartement}.json?trancheAge=${this.trancheAge}`)
                .then(resp => resp.json())
                .then(results => {
                    this.centresAvecDispos = results.centres_disponibles;
                    this.centresSansDispos = results.centres_indisponibles;
                });
        } else {
            this.centresAvecDispos = [];
            this.centresSansDispos = [];
        }
    }


    protected update(changedProperties: PropertyValues) {
        super.update(changedProperties);

        if(changedProperties.has('trancheAge') || changedProperties.has('codeDepartement')) {
            this.findCentres()
        }
    }

    render() {
        return html`
          Selected tranche age : ${this.trancheAge} | Selected departement : ${this.departement?.nom_departement}
          <br/>

          <vmd-tranche-age-selector trancheAge="${this.trancheAge}" @tranche-age-changed="${this.trancheAgeUpdated}"></vmd-tranche-age-selector>
          <vmd-departement-selector codeDepartement="${this.codeDepartement}" @departement-changed="${this.departementUpdated}"></vmd-departement-selector>

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
        this.findCentres();
    }

    trancheAgeUpdated(event: CustomEvent<TrancheAgeSelected>) {
        this.trancheAge = event.detail.trancheAge;
        this.refreshPageWhenValidParams();
    }

    departementUpdated(event: CustomEvent<DepartementSelected>) {
        this.departement = event.detail.departement;
        this.codeDepartement = this.departement?.code_departement;
        this.refreshPageWhenValidParams();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        // console.log("disconnected callback")
    }

    private refreshPageWhenValidParams() {
        if(this.codeDepartement && this.trancheAge) {
            Router.navigateToRendezVous(this.codeDepartement, this.trancheAge);
        }
    }
}
