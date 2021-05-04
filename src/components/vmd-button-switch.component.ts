import {css, customElement, html, LitElement, property, unsafeCSS} from "lit-element";
import buttonSwitchCss from "./vmd-button-switch.component.scss";
import {repeat} from "lit-html/directives/repeat";
import {classMap} from "lit-html/directives/class-map";
import {CSS_Global} from "../styles/ConstructibleStyleSheets";

export type ValueStrCustomEvent<T extends string> = CustomEvent<{value: T}>;

export type Option = {
    code: string;
    libelle: string;
};

@customElement('vmd-button-switch')
export class VmdButtonSwitchComponent extends LitElement {

    //language=css
    static styles = [
        CSS_Global,
        css`${unsafeCSS(buttonSwitchCss)}`,
        css`
            :host {
                display: block;
            }
        `
    ];

    @property({type: String}) codeSelectionne: string|"" = "";
    @property({type: Array, attribute: false}) options: Option[] = [];

    constructor() {
        super();
    }

    render() {
        return html`
          <div class="btn-group" role="group">
              ${repeat(this.options, option => option.code, option => html`
                <button type="button"
                        aria-pressed="${this.codeSelectionne === option.code}"
                        class="option ${classMap({ 'active': option.code===this.codeSelectionne })}"
                        @click="${() => this.valeurSelectionnee(option.code)}">
                  ${option.libelle}
                </button>
              `)}
          </div>
        `;
    }

    valeurSelectionnee(codeSelectionne: string) {
        if (this.codeSelectionne === codeSelectionne) {
          return
        }
        this.codeSelectionne = codeSelectionne;
        this.dispatchEvent(new CustomEvent<{value: string|undefined}>('changed', {
            detail: {
                value: (this.codeSelectionne === "")?undefined:codeSelectionne
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
