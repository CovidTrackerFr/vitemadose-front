import {css, customElement, html, LitElement, property} from "lit-element";

export type TrancheAge = "plus75";
export type TrancheAgeSelected = { trancheAge: TrancheAge };

@customElement('vmd-tranche-age-selector')
export class VmdTrancheAgeSelectorComponent extends LitElement {

    //language=css
    static styles = css`
    `;

    @property({type: String}) trancheAge: TrancheAge|"" = "";

    constructor() {
        super();
    }

    render() {
        return html`
            <select @change="${this.trancheAgeSelected}">
              <option value="" ?selected="${this.trancheAge === ''}"></option>
              <option value="plus75" ?selected="${this.trancheAge === 'plus75'}">Plus de 75 ans</option>
            </select>
        `;
    }

    trancheAgeSelected(event: Event) {
        this.trancheAge = (event.currentTarget as HTMLSelectElement).value as TrancheAge|"";
        if(this.trancheAge) {
            this.dispatchEvent(new CustomEvent<TrancheAgeSelected>('tranche-age-changed', {
                detail: {
                    trancheAge: this.trancheAge
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
