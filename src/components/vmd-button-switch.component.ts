import {css, customElement, html, LitElement, property, unsafeCSS} from "lit-element";
import globalCss from "../styles/global.scss";
import buttonSwitchCss from "../styles/components/_buttonSwitch.scss";
import {repeat} from "lit-html/directives/repeat";
import {classMap} from "lit-html/directives/class-map";

export type ValueStrCustomEvent<T extends string> = CustomEvent<{value: T}>;

export type Option = {
    code: string;
    libelle: string;
};

@customElement('vmd-button-switch')
export class VmdButtonSwitchComponent extends LitElement {

    //language=css
    static styles = [
        css`${unsafeCSS(globalCss)}`,
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
                        class="option ${classMap({ 'active': option.code===this.codeSelectionne })}" 
                        @click="${() => this.valeurSelectionnee(option.code)}">
                  ${option.libelle}
                </button>
              `)}
          </div>
        `;
    }

    valeurSelectionnee(codeSelectionne: string) {
        this.codeSelectionne = codeSelectionne;
        this.dispatchEvent(new CustomEvent<{value: string|undefined}>('changed'!, {
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
