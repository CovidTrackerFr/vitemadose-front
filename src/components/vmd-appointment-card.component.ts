import {
    css,
    customElement,
    html,
    LitElement,
    property,
    unsafeCSS
} from 'lit-element';
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
import appointmentCardCss from "./vmd-appointment-card.component.scss";
import {Strings} from "../utils/Strings";
import {TemplateResult} from "lit-html";
import {CSS_Global} from "../styles/ConstructibleStyleSheets";
import { format as formatDate, parseISO } from "date-fns"
import { fr } from 'date-fns/locale'

type LieuCliqueContext = {lieu: Lieu};
export type LieuCliqueCustomEvent = CustomEvent<LieuCliqueContext>;

@customElement('vmd-appointment-card')
export class VmdAppointmentCardComponent extends LitElement {

    //language=css
    static styles = [
        CSS_Global,
        css`${unsafeCSS(appointmentCardCss)}`,
        css`
        `
    ];

    @property({type: Object, attribute: false}) lieu!: LieuAffichableAvecDistance;
    @property({type: String}) theme!: string;

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

            // FIXME créer un type `SearchResultItem` ou un truc du genre, pour avoir une meilleure vue des cas possibles
            // Qu'un if-pit de 72 lignes de long et 190 colonnes de large xD
            let cardConfig: {
                cardLink:(content: TemplateResult) => TemplateResult,
                disabledBG: boolean,
                actions: TemplateResult|undefined, libelleDateAbsente: string
            };
            let typeLieu = typeActionPour(this.lieu);
            if(typeLieu === 'actif-via-plateforme' || typeLieu === 'inactif-via-plateforme') {
                let specificCardConfig: { disabledBG: boolean, libelleDateAbsente: string, libelleBouton: string, typeBouton: 'btn-info'|'btn-primary', onclick: ()=>void };
                if(typeLieu === 'inactif-via-plateforme') {
                    specificCardConfig = {
                        disabledBG: true,
                        libelleDateAbsente: 'Aucun rendez-vous',
                        libelleBouton: 'Vérifier le centre de vaccination',
                        typeBouton: 'btn-info',
                        onclick: () => this.verifierRdv()
                    };
                } else {
                    specificCardConfig = {
                        disabledBG: false,
                        libelleDateAbsente: 'Date inconnue',
                        libelleBouton: 'Prendre rendez-vous',
                        typeBouton: 'btn-primary',
                        onclick: () => this.prendreRdv()
                    };
                }

                cardConfig = {
                    disabledBG: specificCardConfig.disabledBG,
                    libelleDateAbsente: specificCardConfig.libelleDateAbsente,
                    cardLink: (content) =>
                        html`<div>${content}</div>`,
                    actions: html`
                      <button type="button" @click="${() => { specificCardConfig.onclick(); } }"
                         class="btn btn-lg ${classMap({ 'btn-primary': specificCardConfig.typeBouton==='btn-primary', 'btn-info': specificCardConfig.typeBouton==='btn-info' })}">
                        ${specificCardConfig.libelleBouton}
                      </button>
                      <div class="row align-items-center justify-content-center mt-3 text-gray-700">
                        <div class="col-auto text-description">
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
                    disabledBG: false,
                    libelleDateAbsente: 'Réservation tél uniquement',
                    cardLink: (content) => html`
                          <div>
                            ${content}
                          </div>`,
                    actions: html`
                          <a href="tel:${this.lieu.metadata.phone_number}" class="btn btn-tel btn-lg">
                            Appeler le ${Strings.toNormalizedPhoneNumber(this.lieu.metadata.phone_number)}
                          </a>
                        `
                };
            } else if(typeLieu === 'inactif') {
                cardConfig = {
                    disabledBG: true,
                    libelleDateAbsente: 'Aucun rendez-vous',
                    cardLink: (content) => content,
                    actions: undefined
                };
            } else {
                throw new Error(`Unsupported typeLieu : ${typeLieu}`)
            }

            return cardConfig.cardLink(html`
            <div class="card rounded-3 mb-5  ${classMap({
              'bg-disabled': cardConfig.disabledBG,
              'search-standard': this.theme==='standard',
              'search-highlighted': this.theme==='highlighted'
                })}">
                <div class="card-body p-4">
                    <div class="row align-items-center ">
                        <div class="col">
                            <div class="card-title h5">
                              ${this.cardTitle(cardConfig)}
                              <small class="distance">${distance ? `- ${distance} km` : ''}</small>
                            </div>
                            <div class="row">
                              <vmd-appointment-metadata class="mb-2" widthType="full-width" icon="vmdicon-geo-alt-fill">
                                <div slot="content">
                                  <span class="fw-bold">${this.lieu.nom}</span>
                                  <br/>
                                  <span class="text-description">${this.lieu.metadata.address}</span>
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
                              <vmd-appointment-metadata class="mb-2" widthType="fit-to-content" icon="vmdicon-building">
                                <span class="text-description" slot="content">${TYPES_LIEUX[this.lieu.type]}</span>
                              </vmd-appointment-metadata>
                              <vmd-appointment-metadata class="mb-2" widthType="fit-to-content" icon="vmdicon-syringe" .displayed="${!!this.lieu.vaccine_type}">
                                <span class="text-description" slot="content">${this.lieu.vaccine_type}</span>
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

    private cardTitle(cardConfig: any): string {
      if (this.lieu.prochain_rdv) {
        return this.toTitleCase(formatDate(parseISO(this.lieu.prochain_rdv), "EEEE d MMMM 'à' HH:mm", { locale: fr }))
      } else {
        return cardConfig.libelleDateAbsente
      }
    }
    private toTitleCase(date: string): string {
      return date.replace(/(^|\s)([a-z])(\w)/g, (_, leader, letter, loser) => [leader, letter.toUpperCase(), loser].join(''))
    }
}
