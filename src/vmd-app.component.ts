import {LitElement, html, customElement, property, css, unsafeCSS} from 'lit-element';
import {Router} from "./routing/Router";
import globalCss from './styles/global.scss'
import {TemplateResult} from "lit-html";

@customElement('vmd-app')
export class VmdAppComponent extends LitElement {

    //language=css
    static styles = [
        css`${unsafeCSS(globalCss)}`,
        css`
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
            Vite ma dose Logo<br/>
            Links<br/>
            
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
