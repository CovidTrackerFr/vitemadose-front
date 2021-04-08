import {LitElement, html, customElement, property, css, unsafeCSS} from 'lit-element'
import {repeat} from "lit-html/directives/repeat";
import globalCss from "../styles/global.scss";
import {CodeDepartement, Departement} from "../state/State";

export type DepartementSelected = { departement: Departement|undefined };

@customElement('vmd-departement-selector')
export class VmdDepartementSelectorComponent extends LitElement {

    //language=css
    static styles = [
        css`${unsafeCSS(globalCss)}`,
        css`
            :host {
                display: block;
            }
        `
    ];

    @property({type: String}) codeDepartementSelectionne: CodeDepartement|undefined = undefined;
    @property({type: Array, attribute: false}) departementsDisponibles: Departement[] = [];

    render() {
        return html`
            <select class="form-select form-select-lg" @change="${this.departementSelectionne}">
              <option value="" ?selected="${!this.codeDepartementSelectionne}"></option>
              ${repeat(this.departementsDisponibles, (dept) => dept.code_departement, (dept) => {
                return html`
                  <option value="${dept.code_departement}"
                          ?selected="${this.codeDepartementSelectionne === dept.code_departement}">
                    ${dept.code_departement} - ${dept.nom_departement}
                  </option>`
            })}
            </select>
        `;
    }

    departementSelectionne(event: Event) {
        this.codeDepartementSelectionne = (event.currentTarget as HTMLSelectElement).value;
        this.dispatchEvent(new CustomEvent<DepartementSelected>('departement-changed', {
            detail: {
                departement: this.departementsDisponibles.find(dept => dept.code_departement === this.codeDepartementSelectionne)
            }
        }));
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
