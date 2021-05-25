import {
    LitElement,
    html,
    customElement,
    property,
    css,
    unsafeCSS,
    internalProperty, query
} from 'lit-element';
import inputRangeWithTooltipCss from "./vmd-input-range-with-tooltip.component.scss";
import {styleMap} from "lit-html/directives/style-map";

export type Options = {code: string|number, libelle: string};

@customElement('vmd-input-range-with-tooltip')
export class VmdInputRangeWithTooltipComponent extends LitElement {

    //language=css
    static styles = [
        css`${unsafeCSS(inputRangeWithTooltipCss)}`,
        css`
        `
    ];

    @property({attribute: false}) options: Options[] = [];

    @internalProperty() indexOptionSelectionnee: number = 0;
    @internalProperty() get libelleAffiche() {
        return this.options[this.indexOptionSelectionnee]?.libelle || "";
    }
    @internalProperty() get max() {
        return this.options.length-1;
    }
    @internalProperty() get bubbleLeft() {
        const percentageValue = Math.round(this.indexOptionSelectionnee*10000/this.max)/100;
        const leftShiftRatio = 0.5 - percentageValue/100;
        return `calc(${percentageValue}% + (${leftShiftRatio*8*this.libelleAffiche.length}px))`;
    }

    @query(".bubble") $bubble!: HTMLOutputElement;

    constructor() {
        super();
    }

    render() {
        return html`
          <div class="range-wrap">
            <input type="range" class="range" value="${this.indexOptionSelectionnee}" min="0" max="${this.max}" @input="${(e: any) => this.indexUpdated(e.currentTarget.value)}" />
            <output class="bubble" style="${styleMap({left: this.bubbleLeft})}">${this.libelleAffiche}</output>
          </div>
        `;
    }

    indexUpdated(indexStr: string) {
        this.indexOptionSelectionnee = Number(indexStr);
        this.dispatchEvent(new CustomEvent<{value: string|number}>('option-selected', {
            detail: {
                value: this.options[this.indexOptionSelectionnee]!.code
            }
        }));
    }

    connectedCallback() {
        super.connectedCallback();

        if(this.getAttribute("codeSelectionne")) {
            this.indexOptionSelectionnee = this.options
                .map((o, index) => ({...o, index}))
                .find(o => ""+o.code === this.getAttribute("codeSelectionne"))
                ?.index || 0;
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        // console.log("disconnected callback")
    }
}
