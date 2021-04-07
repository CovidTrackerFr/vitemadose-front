import {css, customElement, html, LitElement, property, unsafeCSS} from "lit-element";
import globalCss from "../styles/global.scss";
import {CodeTrancheAge, TrancheAge} from "../state/State";

export type TrancheAgeSelectionne = { trancheAge: TrancheAge|undefined };

@customElement('vmd-tranche-age-selector')
export class VmdTrancheAgeSelectorComponent extends LitElement {

    //language=css
    static styles = [
        css`${unsafeCSS(globalCss)}`,
        css`
            :host {
                display: block;
            }
        `
    ];

    @property({type: String}) codeTrancheAgeSelectionne: CodeTrancheAge|"" = "";
    @property({type: Map, attribute: false}) tranchesAge: Map<CodeTrancheAge, TrancheAge> = new Map<CodeTrancheAge, TrancheAge>();

    constructor() {
        super();
    }

    render() {
        return html`
            <select class="form-select form-select-lg" @change="${this.trancheAgeSelectionne}">
              <option value="" ?selected="${this.codeTrancheAgeSelectionne === ''}"></option>
              ${Array.from(this.tranchesAge.values()).map(trancheAge => {
                  return html`
                      <option value="${trancheAge.codeTrancheAge}" ?selected="${this.codeTrancheAgeSelectionne === trancheAge.codeTrancheAge}">${trancheAge.libelle}</option>
                  `;
              })}
            </select>
        `;
    }

    trancheAgeSelectionne(event: Event) {
        this.codeTrancheAgeSelectionne = (event.currentTarget as HTMLSelectElement).value as CodeTrancheAge|"";
        this.dispatchEvent(new CustomEvent<TrancheAgeSelectionne>('tranche-age-changed', {
            detail: {
                trancheAge: (this.codeTrancheAgeSelectionne === "")?undefined:this.tranchesAge.get(this.codeTrancheAgeSelectionne)
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
