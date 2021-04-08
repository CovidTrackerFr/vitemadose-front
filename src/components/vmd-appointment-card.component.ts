import {LitElement, html, customElement, property, css, unsafeCSS} from 'lit-element';
import {classMap} from "lit-html/directives/class-map";
import {Centre, LOGOS_PLATEFORMES} from "../state/State";
import {styleMap} from "lit-html/directives/style-map";
import {Router} from "../routing/Router";
import {Dates} from "../utils/Dates";
import appointmentCardCss from "../styles/components/_appointmentCard.scss";
import globalCss from "../styles/global.scss";

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
    @property({type: Boolean}) rdvPossible!: boolean;

    private get estCliquable() {
        return !!this.centre.url;
    }

    constructor() {
        super();
    }

    render() {
        if(this.rdvPossible) {
            return html`
            <div class="card rounded-3 mb-5 ${classMap({clickable: this.estCliquable})}"
                 @click="${() => Router.navigateToUrlIfPossible(this.centre.url)}">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col">
                            <h5 class="card-title">${Dates.isoToFRDatetime(this.centre.prochain_rdv)}</h5>
                            <p class="card-text">${this.centre.nom}</p>
                        </div>
                        
                        ${this.estCliquable?html`
                        <div class="col-24 col-md-auto text-center mt-4 mt-md-0">
                            <a href="${this.centre.url}" target="_blank" class="btn btn-primary btn-lg">Prendre rendez-vous</a>
                            ${LOGOS_PLATEFORMES[this.centre.plateforme]?html`
                            <div class="row align-items-center justify-content-center mt-3">
                                <div class="col-auto text-black-50">
                                    avec ${this.centre.plateforme}
                                </div>
                                <div class="col-auto">
                                    <img class="rdvPlatformLogo" src="/assets/images/png/${LOGOS_PLATEFORMES[this.centre.plateforme]}" alt="Doctolib">
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
              <div class="card rounded-3 mb-5 bg-disabled">
                <div class="card-body">
                  <div class="row align-items-center">
                    <div class="col">
                      <h5 class="card-title">Aucun rendez-vous</h5>
                      <p class="card-text">${this.centre.nom}</p>
                    </div>

                    <div class="col-24 col-md-auto text-center mt-4 mt-md-0">
                      <a href="${this.centre.url}" target="_blank" class="btn btn-info btn-lg">Vérifier le centre</a>
                    </div>
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
