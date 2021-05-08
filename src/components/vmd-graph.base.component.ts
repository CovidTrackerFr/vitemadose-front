import {LitElement, html, property, css, query, PropertyValues} from 'lit-element';

export abstract class VmdGraphBaseComponent<T> extends LitElement {

    //language=css
    static styles = [
        css`
        `
    ];

    @property({ type: Number }) width: number|undefined;
    @property({ type: Number }) height: number|undefined;

    @property({type: Object, attribute: false}) data: T|undefined;

    @query("#graph") canvas: HTMLCanvasElement|undefined;

    constructor() {
        super();
    }

    render() {
        return html`
          <canvas id="graph" width="${this.width}" height="${this.height}"></canvas>
        `;
    }

    protected updated(_changedProperties: PropertyValues) {
        super.updated(_changedProperties);

        if(this.canvas && this.data) {
            this.rebuildGraph(this.canvas, this.data);
        }
    }

    connectedCallback() {
        super.connectedCallback();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    abstract rebuildGraph(canvas: HTMLCanvasElement, data: T): Promise<Chart>;
}
