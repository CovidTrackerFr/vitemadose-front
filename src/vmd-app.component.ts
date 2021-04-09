import {LitElement, html, customElement, property, css, unsafeCSS} from 'lit-element';
import {Router, SlottedTemplateResultFactory} from "./routing/Router";
import globalCss from './styles/global.scss'
import {TemplateResult} from "lit-html";

@customElement('vmd-app')
export class VmdAppComponent extends LitElement {

    //language=css
    static styles = [
        css`${unsafeCSS(globalCss)}`,
        css`
            .appLogo {}
            .appLogo._phone {
                max-width: 25vw;
            }
        `
    ];

    @property({type: Object, attribute: false}) viewTemplateResult: SlottedTemplateResultFactory|undefined = undefined;

    constructor() {
        super();

        Router.installRoutes((viewTemplateResult, path) => {
            this.viewTemplateResult = viewTemplateResult;
        })
    }

    render() {
        return html`
            <div class="row align-items-center justify-content-between">
                <div class="col-auto" style="cursor: pointer" @click="${() => Router.navigateToHome()}">
                    <img src="${Router.basePath}assets/images/svg/vmd-logo-portrait.svg" class="d-block d-sm-none appLogo _phone" alt="Vite Ma Dose">
                    <img src="${Router.basePath}assets/images/svg/vmd-logo-landscape.svg" class="d-none d-sm-block appLogo" alt="Vite Ma Dose">
                </div>
                <div class="col">
                    <div class="row justify-content-end">
                      <!--
                        <div class="col-auto">
                            <a href="">A propos</a>
                        </div>
                      -->
                        <div class="col-auto border-start">
                            <a href="https://covidtracker.fr/" target="_blank">CovidTracker&nbsp;<i class="bi bi-arrow-up-right"></i></a>
                        </div>
                    </div>
                </div>
            </div>
            
            ${this.viewTemplateResult?this.viewTemplateResult(html`
              <slot name="about" slot="about"></slot>
              <slot name="about-centres" slot="about-centres"></slot>
            `):html``}
            
            <footer class="row justify-content-between">
                <div class="col-auto">
                    © Vite Ma Dose par CovidTracker • Contributeurs • Design Adrien Rochet
                </div>
                <div class="col-auto">
                    <div class="row">
                        <div class="col-auto">
                            <a href="https://covidtracker.fr/mentions-legales" target="_blank">Mentions légales</a>
                        </div>
                        <div class="col-auto">
                            <a href="https://covidtracker.fr/contact" target="_blank">Contactez-nous</a>
                        </div>
                        <div class="col-auto">
                            <a href="https://twitter.com/vitemadose_off" target="_blank">Twitter</a>
                        </div>
                    </div>
                </div>
            </footer>
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
