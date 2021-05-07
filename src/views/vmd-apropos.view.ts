import {LitElement, html, customElement, css} from 'lit-element';

@customElement('vmd-apropos')
export class VmdAproposComponent extends LitElement {

    //language=css
    static styles = [
        css`
        `
    ];

    constructor() {
        super();
    }

    render() {
        return html`
            <slot name="about"></slot>
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
