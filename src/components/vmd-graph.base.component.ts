import {LitElement, html, property, css, query, PropertyValues, unsafeCSS} from 'lit-element';
import graphResponsiveCss from "./vmd-graph.base.component.scss";
import {CSS_Global} from "../styles/ConstructibleStyleSheets";

export abstract class VmdGraphBaseComponent<T> extends LitElement {

    //language=css
    static styles = [
        CSS_Global,
        css`${unsafeCSS(graphResponsiveCss)}`,
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
            <div class="chart-container-responsive">
                <canvas id="graph" width="${this.width}" height="${this.height}"></canvas>
            </div>
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
