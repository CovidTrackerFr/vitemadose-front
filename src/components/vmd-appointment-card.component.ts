import {css, customElement, html, LitElement, property, unsafeCSS} from 'lit-element';
import {classMap} from "lit-html/directives/class-map";
import {Centre, Plateforme, PLATEFORMES, TYPES_CENTRES} from "../state/State";
import {Router} from "../routing/Router";
import {Dates} from "../utils/Dates";
import appointmentCardCss from "../styles/components/_appointmentCard.scss";
import globalCss from "../styles/global.scss";
import {Strings} from "../utils/Strings";

@customElement('vmd-appointment-card')
export class VmdAppointmentCardComponent extends LitElement {

    //language=css
    static styles = [
        css`${unsafeCSS(globalCss)}`,
        css`${unsafeCSS(appointmentCardCss)}`,
        css`
        `
    ];

    @property({type: Object, attribute: false}) centre!: Centre;
    /* dunno why, but boolean string is not properly converted to boolean when using attributes */
    @property({type: Boolean, attribute: false }) rdvPossible!: boolean;

    private get estCliquable() {
        return !!this.centre.url;
    }

    constructor() {
        super();
    }

    render() {
        if(this.rdvPossible) {
            const plateforme: Plateforme|undefined = PLATEFORMES[this.centre.plateforme];
            return html`
            <div class="card rounded-3 mb-5 p-4 ${classMap({clickable: this.estCliquable})}"
                 @click="${() => Router.navigateToUrlIfPossible(this.centre.url)}">
                <div class="card-body">
                    <div class="row align-items-center ">
                        <div class="col">
                            <h5 class="card-title">${Dates.isoToFRDatetime(this.centre.prochain_rdv)}</h5>
                            <div class="row">
                              <vmd-appointment-metadata widthType="full-width" icon="bi-geo-alt-fill">
                                <div slot="content">
                                  <span class="fw-bold text-dark">${this.centre.nom}</span>
                                  <br/>
                                  <em>${this.centre.metadata.address}</em>
                                </div>
                              </vmd-appointment-metadata>
                              <vmd-appointment-metadata widthType="fit-to-content" icon="bi-telephone-fill" .displayed="${!!this.centre.metadata.phone_number}">
                                <span slot="content">${this.centre.metadata.phone_number}</span>
                              </vmd-appointment-metadata>
                              <vmd-appointment-metadata widthType="fit-to-content" icon="bi-bag-plus">
                                <span slot="content">${TYPES_CENTRES[this.centre.type]}</span>
                              </vmd-appointment-metadata>
                            </div>
                        </div>
                        
                        ${this.estCliquable?html`
                        <div class="col-24 col-md-auto text-center mt-4 mt-md-0">
                            <a target="_blank" class="btn btn-primary btn-lg">
                              Prendre rendez-vous
                            </a>
                            <div class="row align-items-center justify-content-center mt-3 text-black-50">
                                <div class="col-auto">
                                  ${this.centre.appointment_count} dose${Strings.plural(this.centre.appointment_count)}
                                </div>
                                ${this.centre.plateforme?html`
                                |
                                <div class="col-auto">
                                    ${plateforme?html`
                                    <img class="rdvPlatformLogo ${plateforme.styleCode}" src="${Router.basePath}assets/images/png/${plateforme.logo}" alt="Créneau de vaccination ${plateforme.nom}">
                                    `:html`
                                    ${this.centre.plateforme}
                                    `}
                                </div>
                                `:html``}
                            </div>
                        </div>
                        `:html``}
                    </div>
                </div>
            </div>
            `;
        } else {
            return html`
              <div class="card rounded-3 mb-5 p-4 bg-disabled">
                <div class="card-body">
                  <div class="row align-items-center">
                    <div class="col">
                      <h5 class="card-title">Aucun rendez-vous</h5>
                      <p class="card-text">${this.centre.nom}</p>
                    </div>

                    ${this.estCliquable?html`
                    <div class="col-24 col-md-auto text-center mt-4 mt-md-0">
                      <a href="${this.centre.url}" target="_blank" class="btn btn-info btn-lg">Vérifier le centre de vaccination</a>
                    </div>
                    `:html``}
                  </div>
                </div>
              </div>
            `;
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
