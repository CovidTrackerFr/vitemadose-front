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
                                <!--
                                Classes intéressantes à mettre sur les col-24 ci-dessous :
                                - Aucune => la cellule prend toute la largeur
                                - col-md-auto => la cellule prend la largeur du contenu
                                - col-md => toutes les cellules en col-md sont réparties équitablement
                                dans l'espace restant
                                -->
                              
                                <div class="col-24">
                                    <div class="row align-items-center">
                                        <i class="bi bi-geo-alt-fill col-auto"></i>
                                        <p class="card-text col">
                                          ${this.centre.nom}
                                          <br/>
                                          ${this.centre.metadata.address}
                                        </p>
                                    </div>
                                </div>
                                ${this.centre.metadata.phone_number?html`
                                  <div class="col-24 col-md-auto">
                                    <div class="row align-items-center">
                                      <i class="bi bi-telephone-fill col-auto"></i>
                                      <p class="card-text col">
                                        ${this.centre.metadata.phone_number}
                                      </p>
                                    </div>
                                  </div>
                                `:html``}
                                <div class="col-24 col-md-auto">
                                    <div class="row align-items-center">
                                        <i class="bi bi-bag-plus col-auto"></i>
                                        <p class="card-text col">
                                            ${TYPES_CENTRES[this.centre.type]}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        ${this.estCliquable?html`
                        <div class="col-24 col-md-auto text-center mt-4 mt-md-0">
                            <a href="${this.centre.url}" target="_blank" class="btn btn-primary btn-lg">
                              ${this.centre.appointment_count} dose${Strings.plural(this.centre.appointment_count)} disponible${Strings.plural(this.centre.appointment_count)}
                            </a>
                            ${plateforme?html`
                            <div class="row align-items-center justify-content-center mt-3">
                                <div class="col-auto text-black-50">
                                    avec ${plateforme.nom}
                                </div>
                                <div class="col-auto">
                                    <img class="rdvPlatformLogo" src="${Router.basePath}assets/images/png/${plateforme.logo}" alt="Créneau de vaccination ${plateforme.nom}">
                                </div>
                            </div>
                            `:html``}
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
