import {LitElement, html, customElement, property, css } from 'lit-element';
import {Router, SlottedTemplateResultFactory} from "./routing/Router";
import smoothscroll from 'smoothscroll-polyfill';
import {CSS_Global} from "./styles/ConstructibleStyleSheets";
import {ServiceWorkers} from "./utils/ServiceWorkers";

@customElement('vmd-app')
export class VmdAppComponent extends LitElement {

    //language=css
    static styles = [
        CSS_Global,
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

        smoothscroll.polyfill();

        Router.installRoutes((viewTemplateResult) => {
            this.viewTemplateResult = viewTemplateResult;
        })

        ServiceWorkers.INSTANCE.startup();
    }

    render() {
        return html`
            <div class="container">
                <div class="row align-items-center justify-content-between">
                    <a href="${Router.basePath}" class="col-auto">
                        <img src="${Router.basePath}assets/images/svg/vmd-logo-portrait.svg" class="d-block d-sm-none appLogo _phone" alt="Trouvez votre créneau de vaccination avec Vite Ma Dose">
                        <img src="${Router.basePath}assets/images/svg/vmd-logo-landscape.svg" class="d-none d-sm-block appLogo" alt="Trouvez votre créneau de vaccination avec Vite Ma Dose">
                    </a>
                    <div class="col">
                        <div class="row justify-content-end gx-5">
                            <div class="col-auto">
                                <a href="${Router.basePath}apropos">À propos</a>
                            </div>
                            <div class="col-auto border-start">
                                <a href="https://covidtracker.fr/" target="_blank" rel="noreferrer">CovidTracker&nbsp;<i class="bi vmdicon-arrow-up-right"></i></a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            ${this.viewTemplateResult?this.viewTemplateResult(html`
              <slot name="main-title" slot="main-title"></slot>
              <slot name="about" slot="about"></slot>
              <slot name="about-lieux" slot="about-lieux"></slot>
              <slot name="chronodose" slot="chronodose"></slot>
            `):html``}

            <footer class="row justify-content-between">
                <div class="col-auto">
                    Vite Ma Dose&nbsp;! par CovidTracker -
                    <a href="https://github.com/CovidTrackerFr/vitemadose-front/blob/main/LICENSE">(CC BY-NC-SA 4.0)</a>
                </div>
                <div class="col-auto">
                    <div class="row">
                        <div class="col-auto">
                            <a href="https://covidtracker.fr/mentions-legales" target="_blank" rel="noreferrer">Mentions légales</a>
                        </div>
                        <div class="col-auto">
                            <a href="https://covidtracker.fr/contact" target="_blank" rel="noreferrer">Contactez-nous</a>
                        </div>
                        <div class="col-auto">
                            <a href="https://twitter.com/vitemadose_off" target="_blank" rel="noreferrer">Twitter</a>
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
