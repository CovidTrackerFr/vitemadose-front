import {LitElement, html, customElement, property, css, unsafeCSS} from 'lit-element';
import {Router, SlottedTemplateResultFactory} from "./routing/Router";
import globalCss from './styles/global.scss'
import {TemplateResult} from "lit-html";
import {ServiceWorkers} from "./utils/ServiceWorkers";
import {DB} from "./storage/DB";

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

        DB.INSTANCE.initialize().then(() => {
            ServiceWorkers.INSTANCE.startup();
        })
    }

    render() {
        return html`
            <div class="row align-items-center justify-content-between">
                <div class="col-auto" style="cursor: pointer" @click="${() => Router.navigateToHome()}">
                    <img src="${Router.basePath}assets/images/svg/vmd-logo-portrait.svg" class="d-block d-sm-none appLogo _phone" alt="Trouvez votre créneau de vaccination avec Vite Ma Dose">
                    <img src="${Router.basePath}assets/images/svg/vmd-logo-landscape.svg" class="d-none d-sm-block appLogo" alt="Trouvez votre créneau de vaccination avec Vite Ma Dose">
                </div>
                <div class="col">
                    <div class="row justify-content-end gx-5">
                        <div class="col-auto">
                            <a href="${Router.basePath}apropos">À propos</a>
                        </div>
                        <div class="col-auto border-start">
                            <a href="https://covidtracker.fr/" target="_blank">CovidTracker&nbsp;<i class="bi vmdicon-arrow-up-right"></i></a>
                        </div>
                    </div>
                </div>
            </div>
            
            ${this.viewTemplateResult?this.viewTemplateResult(html`
              <slot name="main-title" slot="main-title"></slot>
              <slot name="about" slot="about"></slot>
              <slot name="about-lieux" slot="about-lieux"></slot>
            `):html``}
            
            <footer class="row justify-content-between">
                <div class="col-auto">
                    <span @click="${() => this.tryDebug()}">Vite Ma Dose&nbsp;! par CovidTracker</span> -
                    <a href="https://github.com/CovidTrackerFr/vitemadose-front/blob/main/LICENSE">(CC BY-NC-SA 4.0)</a>
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

    private debugCounter = 0;
    tryDebug() {
        this.debugCounter++;
        if(this.debugCounter%5 === 0) {
            console.log("Debug mode switch detection triggered !");
            DB.INSTANCE.switchDebugMode();
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
