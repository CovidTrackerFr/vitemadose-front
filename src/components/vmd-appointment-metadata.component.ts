import {LitElement, html, customElement, property } from 'lit-element';
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
    ];

    @property({type: String}) widthType!: MetadataWidthType;
    @property({type: String}) icon!: string;
    @property({type: String}) label!: string;

    render() {
        if(!this.widthType) {
            console.error("No widthType defined on vmd-appointment-metadata component !")
            return html``
        }

        return html`
            <div class="row">
                <i class="bi ${this.icon} col-auto" role="img" aria-label="${this.label}"></i>
                <p class="card-text col text-black-50">
                  <slot></slot>
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
    }
}
