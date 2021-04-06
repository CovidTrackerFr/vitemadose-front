import {LitElement, html, customElement, property, css} from 'lit-element';
import {TrancheAge, TrancheAgeSelected} from "./vmd-tranche-age-selector.component";
import {Departement, DepartementSelected} from "./vmd-departement-selector.component";

@customElement('vmd-app')
export class VmdAppComponent extends LitElement {

    //language=css
    static styles = css`
    `;

    @property({type: String}) trancheAge: TrancheAge|undefined = undefined;
    @property({type: Object}) departement: Departement|undefined = undefined;

    constructor() {
        super();
    }

    render() {
        return html`
            Vite ma dose !<br/>
            
            Selected tranche age : ${this.trancheAge} | Selected departement : ${this.departement?.nom_departement}
            <br/>
            
            <vmd-tranche-age-selector @tranche-age-changed="${(event: CustomEvent<TrancheAgeSelected>) => this.trancheAge = event.detail.trancheAge}"></vmd-tranche-age-selector>
            <vmd-departement-selector @departement-changed="${(event: CustomEvent<DepartementSelected>) => this.departement = event.detail.departement}"></vmd-departement-selector>
            
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
