import {LitElement, html, customElement, property, css} from 'lit-element'
import {repeat} from "lit-html/directives/repeat";

export type Departement = {
    code_departement: string;
    nom_departement: string;
    code_region: 84;
    nom_region: string;
};
export type DepartementSelected = { departement: Departement };

@customElement('vmd-departement-selector')
export class VmdDepartementSelectorComponent extends LitElement {

    //language=css
    static styles = css`
    `;

    @property({type: Object}) departement: Departement|undefined = undefined;
    @property({type: Array}) departementsDisponibles: Departement[] = [];

    constructor() {
        super();

        // TODO: change URL
        fetch("https://raw.githubusercontent.com/CovidTrackerFr/vitemadose/data-auto/data/output/departements.json")
            .then(resp => resp.json())
            .then(departements => this.departementsDisponibles = departements);
    }

    render() {
        return html`
            <select @change="${this.departementSelected}">
              <option value="" ?selected="${!this.departement}"></option>
              ${repeat(this.departementsDisponibles, (dept) => dept.code_departement, (dept) => {
                return html`
                  <option value="${dept.code_departement}"
                          ?selected="${this.departement && this.departement.code_departement === dept.code_departement}">
                    ${dept.nom_departement}
                  </option>`
            })}
            </select>
        `;
    }

    departementSelected(event: Event) {
        const selectedCodeDepartement = (event.currentTarget as HTMLSelectElement).value;
        if(selectedCodeDepartement) {
            this.departement = this.departementsDisponibles.find(dept => dept.code_departement === selectedCodeDepartement)!;
            this.dispatchEvent(new CustomEvent<DepartementSelected>('departement-changed', {
                detail: {
                    departement: this.departement
                }
            }));
        }
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
