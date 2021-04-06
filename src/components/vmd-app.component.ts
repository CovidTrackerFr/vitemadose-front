import {LitElement, html, customElement, property, css} from 'lit-element';
import {Router, ViewName} from "../routing/Router";

@customElement('vmd-app')
export class VmdAppComponent extends LitElement {

    //language=css
    static styles = css`
    `;

    @property({type: String}) viewName: ViewName|undefined = undefined;
    @property({type: Object}) pageContext: PageJS.Context|undefined = undefined;

    constructor() {
        super();

        Router.installRoutes((viewName, context) => {
            this.viewName = viewName;
            this.pageContext = context;
        })
    }

    render() {
        return html`
            Vite ma dose Logo<br/>
            Links<br/>
            
            ${this._renderView()}
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

    private _renderView() {
        switch(this.viewName) {
            case 'home': return html`<vmd-home></vmd-home>`;
            case 'rendez-vous': return html`<vmd-rdv codeDepartement="${this.pageContext!.params['departement']}" trancheAge="${this.pageContext!.params['trancheAge']}"></vmd-rdv>`;
        }
        throw new Error(`Unresolved view for ${this.viewName}`);
    }
}
