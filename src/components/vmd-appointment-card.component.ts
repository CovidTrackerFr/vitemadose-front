import {css, customElement, html, LitElement, property, unsafeCSS} from 'lit-element';
import {classMap} from "lit-html/directives/class-map";
import {
    Lieu,
    LieuAffichableAvecDistance,
    Plateforme,
    PLATEFORMES,
    typeActionPour,
    TYPES_LIEUX
} from "../state/State";
import {Router} from "../routing/Router";
import {Dates} from "../utils/Dates";
import appointmentCardCss from "./vmd-appointment-card.component.scss";
import globalCss from "../styles/global.scss";
import {Strings} from "../utils/Strings";
import {CapabilityEligibility} from "../utils/Capabilities";
import {TemplateResult} from "lit-html";

type LieuCliqueContext = {lieu: LieuAffichableAvecDistance};
export type LieuCliqueCustomEvent = CustomEvent<LieuCliqueContext>;

export type ActionAbonnement = "unsubscribe"|"subscribe";
export type AbonnementCliqueContext = LieuCliqueContext & {action: ActionAbonnement};
export type AbonnementCliqueCustomEvent = CustomEvent<LieuCliqueContext & AbonnementCliqueContext>;

@customElement('vmd-appointment-card')
export class VmdAppointmentCardComponent extends LitElement {

    //language=css
    static styles = [
        css`${unsafeCSS(globalCss)}`,
        css`${unsafeCSS(appointmentCardCss)}`,
        css`
        `
    ];

    @property({type: Object, attribute: false}) lieu!: LieuAffichableAvecDistance;
    @property({type: String, attribute: false}) locationWatchEligibility: CapabilityEligibility = "not-eligible";
    @property({type: Boolean, attribute: false}) watching!: boolean;

    constructor() {
        super();
    }

    prendreRdv() {
        this.dispatchEvent(new CustomEvent<LieuCliqueContext>('prise-rdv-cliquee', {
            detail: { lieu: this.lieu }
        }));
    }

    verifierRdv() {
        this.dispatchEvent(new CustomEvent<LieuCliqueContext>('verification-rdv-cliquee', {
            detail: { lieu: this.lieu }
        }));
    }

    render() {
            const plateforme: Plateforme|undefined = PLATEFORMES[this.lieu.plateforme];
            let distance: string|undefined;
            if (this.lieu.distance && this.lieu.distance >= 10) {
              distance = this.lieu.distance.toFixed(0)
            } else if (this.lieu.distance) {
              distance = this.lieu.distance.toFixed(1)
            }

            let cardConfig: {cardLink:(content: TemplateResult) => TemplateResult, estCliquable: boolean, disabledBG: boolean, actions: TemplateResult|undefined, libelleDateAbsente: string };
            let typeLieu = typeActionPour(this.lieu);
            if(typeLieu === 'actif-via-plateforme' || typeLieu === 'inactif-via-plateforme') {
                let specificCardConfig: { disabledBG: boolean, libelleDateAbsente: string, libelleBouton: string, typeBouton: 'btn-info'|'btn-primary', onclick: ()=>void, additionalActions: TemplateResult|undefined };
                if(typeLieu === 'inactif-via-plateforme') {
                    specificCardConfig = {
                        disabledBG: true,
                        libelleDateAbsente: 'Aucun rendez-vous',
                        libelleBouton: 'Vérifier le centre de vaccination',
                        typeBouton: 'btn-info',
                        onclick: () => this.verifierRdv(),
                        additionalActions: html`
                    <div class="col-24 col-md-auto text-center mt-4">
                      ${(['eligible', 'eligible-but-denied'].indexOf(this.locationWatchEligibility)!==-1)?html`
                        <a class="btn btn-warning btn-lg ${classMap({disabled: this.locationWatchEligibility==='eligible-but-denied'})}" 
                           href="#" @click="${(e: Event) => { this.changeSubscription(); e.preventDefault(); e.stopPropagation(); }}">
                          ${this.watching?html`
                          <i class="bi vmdicon-eye-slash-solid" style="margin-right: 3px"></i>
                          Ne plus surveiller ce centre
                          `:html`
                          <i class="bi vmdicon-eye-solid" style="margin-right: 3px"></i>
                          Surveiller ce centre
                          `}
                        </a>
                      `:html``}
                    </div>
                        `
                    };
                } else {
                    specificCardConfig = {
                        disabledBG: false,
                        libelleDateAbsente: 'Date inconnue',
                        libelleBouton: 'Prendre rendez-vous',
                        typeBouton: 'btn-primary',
                        onclick: () => this.prendreRdv(),
                        additionalActions: undefined
                    };
                }
                cardConfig = {
                    estCliquable: true,
                    disabledBG: specificCardConfig.disabledBG,
                    libelleDateAbsente: specificCardConfig.libelleDateAbsente,
                    cardLink: (content) =>
                        html`<a href="#" @click="${(e: Event) => { specificCardConfig.onclick(); e.preventDefault(); } }">${content}</a>`,
                    actions: html`
                      <a href="#" @click="${(e: Event) => e.preventDefault()}" 
                         class="btn btn-lg ${classMap({ 'btn-primary': specificCardConfig.typeBouton==='btn-primary', 'btn-info': specificCardConfig.typeBouton==='btn-info' })}">
                        ${specificCardConfig.libelleBouton}
                      </a>
                      ${specificCardConfig.additionalActions || html``}
                      <div class="row align-items-center justify-content-center mt-3 text-black-50">
                        <div class="col-auto">
                          ${this.lieu.appointment_count.toLocaleString()} créneau${Strings.plural(this.lieu.appointment_count, "x")}
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
                    `
                };
            } else if(typeLieu === 'actif-via-tel') {
                cardConfig = {
                    estCliquable: true,
                    disabledBG: false,
                    libelleDateAbsente: 'Réservation tél uniquement',
                    cardLink: (content) => html`
                          <a href="tel:${this.lieu.metadata.phone_number}">
                            ${content}
                          </a>`,
                    actions: html`
                          <a href="tel:${this.lieu.metadata.phone_number}" class="btn btn-tel btn-lg">
                            Appeler le ${Strings.toNormalizedPhoneNumber(this.lieu.metadata.phone_number)}
                          </a>
                        `
                };
            } else if(typeLieu === 'inactif') {
                cardConfig = {
                    estCliquable: false,
                    disabledBG: true,
                    libelleDateAbsente: 'Aucun rendez-vous',
                    cardLink: (content) => content,
                    actions: undefined
                };
            } else {
                throw new Error(`Unsupported typeLieu : ${typeLieu}`)
            }

            return cardConfig.cardLink(html`
            <div class="card rounded-3 mb-5 p-4 ${classMap({clickable: cardConfig.estCliquable, 'bg-disabled': cardConfig.disabledBG })}"
                 title="${cardConfig.estCliquable ? this.lieu.url : ''}">
                <div class="card-body">
                    <div class="row align-items-center ">
                        <div class="col">
                            <h5 class="card-title">
                              ${this.lieu.prochain_rdv?Dates.isoToFRDatetime(this.lieu.prochain_rdv):cardConfig.libelleDateAbsente}
                              <small class="distance">${distance ? `- ${distance} km` : ''}</small>
                            </h5>
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
                                       @click="${(e: Event) => { e.stopImmediatePropagation(); }}">
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

                        ${cardConfig.actions?html`
                        <div class="col-24 col-md-auto text-center mt-4 mt-md-0">
                          ${cardConfig.actions}
                        </div>
                        `:html``}
                    </div>
                </div>
            </div>
            `);
    }

    changeSubscription() {
        this.dispatchEvent(new CustomEvent<AbonnementCliqueContext>('abonnement-clique', {
            detail: {
                lieu: this.lieu,
                action: this.watching?'unsubscribe':'subscribe'
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
