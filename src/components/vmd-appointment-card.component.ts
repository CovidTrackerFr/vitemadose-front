import {css, customElement, html, LitElement, property, unsafeCSS} from 'lit-element';
import {classMap} from "lit-html/directives/class-map";
import {Lieu, Plateforme, PLATEFORMES, TYPES_LIEUX} from "../state/State";
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

    @property({type: Object, attribute: false}) lieu!: Lieu;
    @property({type: Number, attribute: false}) distance!: number;
    /* dunno why, but boolean string is not properly converted to boolean when using attributes */
    @property({type: Boolean, attribute: false }) rdvPossible!: boolean;

    private get estCliquable() {
        return !!this.lieu.url;
    }

    constructor() {
        super();
    }

    prendreRdv() {
        if(this.lieu.url) {
            (window as any).dataLayer.push({
                'event': 'rdv_click',
                'rdv_departement' : this.lieu.departement,
                'rdv_platorm' : this.lieu.plateforme,
                'rdv_platform' : this.lieu.plateforme,
                'rdv_name': this.lieu.nom,
                'rdv_location_type' : this.lieu.type,
                'rdv_vaccine' : this.lieu.vaccine_type,
                'rdv_filter_type' : undefined
            });
        }
        Router.navigateToUrlIfPossible(this.lieu.url);
    }

    verifierRdv() {
        if(this.lieu.url) {
            (window as any).dataLayer.push({
                'event': 'rdv_verify',
                'rdv_departement' : this.lieu.departement,
                'rdv_platorm' : this.lieu.plateforme,
                'rdv_platform' : this.lieu.plateforme,
                'rdv_name': this.lieu.nom,
                'rdv_location_type' : this.lieu.type,
                'rdv_vaccine' : this.lieu.vaccine_type,
                'rdv_filter_type' : undefined
            });
        }
        Router.navigateToUrlIfPossible(this.lieu.url);
    }

    render() {
        if(this.rdvPossible) {
            const plateforme: Plateforme|undefined = PLATEFORMES[this.lieu.plateforme];
            let distance: any = this.distance
            if (distance >= 10) {
              distance = distance.toFixed(0)
            } else if (distance) {
              distance = distance.toFixed(1)
            }
            return html`
            <div class="card rounded-3 mb-5 ${classMap({clickable: this.estCliquable})}"
                 @click="${() => this.prendreRdv()}">
                <div class="card-body">
                    <div class="row align-items-center ">
                        <div class="col">
                            <h5 class="card-title">${Dates.isoToFRDatetime(this.lieu.prochain_rdv)}<small class="distance">${distance ? `- ${distance} km` : ''}</small></h5>
                            <div class="row">
                              <vmd-appointment-metadata class="mb-2" widthType="full-width" icon="vmdicon-geo-alt-fill">
                                <div slot="content">
                                  <span class="fw-bold text-dark">${this.lieu.nom}</span>
                                  <br/>
                                  <em>${this.lieu.metadata.address}</em>
                                </div>
                              </vmd-appointment-metadata>
                              <vmd-appointment-metadata class="mb-2" widthType="fit-to-content" icon="vmdicon-telephone-fill" .displayed="${!!this.lieu.metadata.phone_number}">
                                <span slot="content">
                                    <a href="tel:${this.lieu.metadata.phone_number}"
                                       @click="${(e: Event) => e.stopImmediatePropagation()}">
                                        ${Strings.toNormalizedPhoneNumber(this.lieu.metadata.phone_number)}
                                    </a>
                                </span>
                              </vmd-appointment-metadata>
                              <vmd-appointment-metadata class="mb-2" widthType="fit-to-content" icon="vmdicon-commerical-building">
                                <span slot="content">${TYPES_LIEUX[this.lieu.type]}</span>
                              </vmd-appointment-metadata>
                              <vmd-appointment-metadata class="mb-2" widthType="fit-to-content" icon="vmdicon-syringe" .displayed="${!!this.lieu.vaccine_type}">
                                <span slot="content">${this.lieu.vaccine_type}</span>
                              </vmd-appointment-metadata>
                            </div>
                        </div>

                        ${this.estCliquable?html`
                        <div class="col-24 col-md-auto text-center mt-4 mt-md-0">
                            <a href="#" class="btn btn-primary btn-lg">
                              Prendre rendez-vous
                            </a>
                            <div class="row align-items-center justify-content-center mt-3 text-black-50">
                                <div class="col-auto">
                                  ${this.lieu.appointment_count.toLocaleString()} dose${Strings.plural(this.lieu.appointment_count)}
                                </div>
                                ${this.lieu.plateforme?html`
                                |
                                <div class="col-auto">
                                    ${plateforme?html`
                                    <img class="rdvPlatformLogo ${plateforme.styleCode}" src="${Router.basePath}assets/images/png/${plateforme.logo}" alt="Créneau de vaccination ${plateforme.nom}">
                                    `:html`
                                    ${this.lieu.plateforme}
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
              <div class="card rounded-3 mb-5 p-4 bg-disabled" @click="${() => this.verifierRdv()}">
                <div class="card-body">
                  <div class="row align-items-center">
                    <div class="col">
                      <h5 class="card-title">Aucun rendez-vous</h5>
                      <vmd-appointment-metadata widthType="full-width" icon="vmdicon-geo-alt-fill">
                        <div slot="content">
                          <span class="fw-bold text-dark">${this.lieu.nom}</span>
                          <br/>
                          <em>${this.lieu.metadata.address}</em>
                        </div>
                      </vmd-appointment-metadata>
                    </div>

                    ${this.estCliquable?html`
                    <div class="col-24 col-md-auto text-center mt-4 mt-md-0">
                      <a href="#" class="btn btn-info btn-lg">Vérifier le centre de vaccination</a>
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
