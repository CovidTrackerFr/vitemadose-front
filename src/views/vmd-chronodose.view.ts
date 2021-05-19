import {css, customElement, html, LitElement} from 'lit-element';
import {CSS_Global} from "../styles/ConstructibleStyleSheets";

@customElement('vmd-chronodose')
export class VmdChronodoseView extends LitElement {

    //language=css
    static styles = [
        CSS_Global,
        css`
            :host {
                display: block;
            }
            #mapid { height: 180px; }
        `
    ];

    render() {
        return html`
            <slot name="chronodose"></slot>

            <div class="homeCard-actions">
                <div class="row justify-content-center justify-content-lg-start mt-5">
                    <a href="https://vitemadose.covidtracker.fr/" target="_blank" rel="noreferrer" class="col-auto btn btn-primary btn-lg">
                        Accéder à Vite Ma Dose&nbsp;<i class="bi vmdicon-arrow-up-right"></i>
                    </a>
                </div>
            </div>
        `;
    }
}
