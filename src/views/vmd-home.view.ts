import {LitElement, html, customElement, property, css, unsafeCSS} from 'lit-element';
import {TrancheAge, TrancheAgeSelected} from "../components/vmd-tranche-age-selector.component";
import {Departement, DepartementSelected} from "../components/vmd-departement-selector.component";
import {Router} from "../routing/Router";
import globalCss from "../styles/global.scss";

@customElement('vmd-home')
export class VmdHomeView extends LitElement {

    //language=css
    static styles = [
        css`${unsafeCSS(globalCss)}`,
        css`
        `
    ];

    @property({type: String}) trancheAge: TrancheAge|undefined = undefined;
    @property({type: Object}) departement: Departement|undefined = undefined;

    constructor() {
        super();
    }

    render() {
        return html`
          Selected tranche age : ${this.trancheAge} | Selected departement : ${this.departement?.nom_departement}
          <br/>

          <vmd-tranche-age-selector @tranche-age-changed="${(event: CustomEvent<TrancheAgeSelected>) => this.trancheAge = event.detail.trancheAge}"></vmd-tranche-age-selector>
          <vmd-departement-selector @departement-changed="${(event: CustomEvent<DepartementSelected>) => this.departement = event.detail.departement}"></vmd-departement-selector>
          <button class="btn btn-primary" ?disabled="${!this.trancheAge || !this.departement}"
                  @click="${() => Router.navigateToRendezVous(this.departement!.code_departement, this.trancheAge!)}">
            Rechercher
          </button>

          <div class="card">
            Vaccin tracker
            <br/>
            blablabla
          </div>

          <div class="card">
            Carte des centres
          </div>
        `;
    }

    connectedCallback() {
        super.connectedCallback();
        // console.log("connected callback")
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        // console.log("disconnected callback")
    }
}
