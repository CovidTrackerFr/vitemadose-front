import {css, customElement, html, LitElement, property, unsafeCSS} from "lit-element";
import globalCss from "../styles/global.scss";
import {repeat} from "lit-html/directives/repeat";

export type ValueStrCustomEvent<T extends string> = CustomEvent<{value: T}>;

export type Option = {
    code: string;
    libelle: string;
    title: string;
};

@customElement('vmd-selector')
export class VmdSelectorComponent extends LitElement {

    //language=css
    static styles = [
        css`${unsafeCSS(globalCss)}`,
        css`
            :host {
                display: block;
            }
        `
    ];

    @property({type: String}) additionnalDefaultLabel: string|undefined = undefined;

    @property({type: String}) codeSelectionne: string|"" = "";
    @property({type: Array, attribute: false}) options: Option[] = [];

    constructor() {
        super();
    }

    render() {
        return html`
            <select class="form-select form-select-lg" @change="${this.valeurSelectionnee}">
              ${this.additionnalDefaultLabel?html`
              <option value="" ?selected="${this.codeSelectionne === ''}" disabled>${this.additionnalDefaultLabel}</option>
              `:html``}
              ${repeat(this.options, option => option.code, option => html`
                      <option value="${option.code}" ?selected="${this.codeSelectionne === option.code}">${option.libelle}</option>
                  `)}
            </select>
        `;
    }

    valeurSelectionnee(event: Event) {
        this.codeSelectionne = (event.currentTarget as HTMLSelectElement).value as string|"";
        this.dispatchEvent(new CustomEvent<{value: string|undefined}>('changed'!, {
            detail: {
                value: (this.codeSelectionne === "")?undefined:this.options.find(o => o.code === this.codeSelectionne)!.code
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
