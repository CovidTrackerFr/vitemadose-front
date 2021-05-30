import {LitElement, html, customElement, property, css } from 'lit-element';
import {classMap} from "lit-html/directives/class-map";
import {CSS_Global} from "../styles/ConstructibleStyleSheets";

export type MetadataWidthType = 'full-width'|'fit-to-content'|'3col-equally-distributed'
const METADATA_WIDTH_CLASSES: {[type in MetadataWidthType]: string} = {
    'full-width': '',
    'fit-to-content': 'col-md-auto',
    '3col-equally-distributed': 'col-md'
};


@customElement('vmd-appointment-metadata')
export class VmdAppointmentMetadataComponent extends LitElement {

    //language=css
    static styles = [
        CSS_Global,
        css`
        `
    ];

    @property({type: Boolean, attribute: false}) displayed: boolean = true;
    @property({type: String}) widthType: MetadataWidthType|undefined = undefined;
    @property({type: String}) icon: string|undefined = undefined;
    @property({type: Boolean, attribute: false}) centerIconVertically: boolean = true;

    constructor() {
        super();
    }

    render() {
        if(!this.widthType) {
            console.error("No widthType defined on vmd-appointment-metadata component !")
            return html``
        }

        return html`
            <div class="row ${classMap({'align-items-center':!!this.centerIconVertically})}">
                <i class="bi ${this.icon} col-auto"></i>
                <p class="col card-text">
                  <slot name="content"></slot>
                </p>
            </div>
        `;
    }

    connectedCallback() {
        super.connectedCallback();

        this.classList.add("col-24");
        if(this.widthType && METADATA_WIDTH_CLASSES[this.widthType]) {
            this.classList.add(METADATA_WIDTH_CLASSES[this.widthType])
        }

        if(!this.displayed) {
            this.style.display = 'none';
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        // console.log("disconnected callback")
    }
}
