import {LitElement, html, customElement, property, css, unsafeCSS} from 'lit-element';
import {Router} from "./routing/Router";
import globalCss from './styles/global.scss'
import {TemplateResult} from "lit-html";
import logoUrl from 'assets/images/svg/vmd-logo-landscape.svg'

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

    @property({type: Object, attribute: false}) viewTemplateResult: TemplateResult|undefined = undefined;

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
                    <img src="/assets/images/svg/vmd-logo-portrait.svg" class="d-block d-sm-none appLogo _phone" alt="Vite ma dose">
                    <img src="/assets/images/svg/vmd-logo-landscape.svg" class="d-none d-sm-block appLogo" alt="Vite ma dose">
                </div>
                <div class="col">
                    <div class="row justify-content-end">
                        <div class="col-auto">
                            <a href="">A propos</a>
                        </div>
                        <div class="col-auto border-start">
                            <a href="https://covidtracker.fr/" target="_blank">CovidTracker&nbsp;<i class="bi bi-arrow-up-right"></i></a>
                        </div>
                    </div>
                </div>
            </div>
            
            ${this.viewTemplateResult}
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
