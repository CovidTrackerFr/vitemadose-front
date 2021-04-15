import {css, customElement, html, LitElement, property, unsafeCSS} from 'lit-element';
import {classMap} from "lit-html/directives/class-map";
import {LieuPlateforme, Plateforme, PLATEFORMES, TYPES_LIEUX} from "../state/State";
import {Router} from "../routing/Router";
import {Dates} from "../utils/Dates";
import annonceCardCss from "../styles/components/_annonceCard.scss";
import globalCss from "../styles/global.scss";
import {Strings} from "../utils/Strings";

@customElement('vmd-annonce-card')
export class VmdAnnonceCardComponent extends LitElement {

    //language=css
    static styles = [
        css`${unsafeCSS(globalCss)}`,
        css`${unsafeCSS(annonceCardCss)}`,
        css`
        `
    ];

    @property({type: Object, attribute: false}) lieu!: LieuPlateforme;
    @property({type: Number, attribute: false}) distance!: number;
    /* dunno why, but boolean string is not properly converted to boolean when using attributes */
    @property({type: Boolean, attribute: false }) rdvPossible!: boolean;

    private get estCliquable() {
        return !!this.lieu.url;
    }

    constructor() {
        super();
    }

    render() {
        const plateforme: Plateforme|undefined = PLATEFORMES[this.lieu.plateforme];
        let distance: any = this.distance
        if (distance >= 10) {
          distance = distance.toFixed(0)
        } else if (distance) {
          distance = distance.toFixed(1)
        }
        return html`
        <div class="card card-annonce rounded-3 mb-5">
            <div class="card-body">
                <div class="row align-items-center ">
                    <div class="col">
                        <h6 class="card-title">${Dates.isoToFRDate(this.lieu.prochain_rdv)}<small class="distance">${distance ? `- ${distance} km` : ''}</small></h6>
                        <div class="row">
                          <vmd-appointment-metadata class="mb-2" widthType="full-width" icon="vmdicon-geo-alt-fill">
                            <div slot="content">
                              <span class="fw-bold text-dark">${this.lieu.nom}</span>
                              <br/>
                              <em>${this.lieu.metadata.address}</em>
                            </div>
                          </vmd-appointment-metadata>
                          <vmd-appointment-metadata class="mb-2" widthType="fit-to-content" icon="vmdicon-syringe" .displayed="${!!this.lieu.vaccine_type}">
                            <span slot="content">${this.lieu.vaccine_type}</span>
                          </vmd-appointment-metadata>
                        </div>
                    </div>

                    <div class="col-24 col-md-auto text-center mt-4 mt-md-0">
                        <a target="_blank" class="">
                          Réserver au <strong>${Strings.toNormalizedPhoneNumber(this.lieu.metadata.phone_number)}</strong>
                        </a>
                        <div class="row align-items-center justify-content-center mt-3 text-black-50">
                            <div class="col-auto">
                              ${this.lieu.appointment_count.toLocaleString()} dose${Strings.plural(this.lieu.appointment_count)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
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
