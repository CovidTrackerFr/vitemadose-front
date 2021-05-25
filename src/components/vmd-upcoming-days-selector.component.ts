import {LitElement, html, customElement, property, css, unsafeCSS} from 'lit-element';
import upcomingDaysSelectorCss from "./vmd-upcoming-days-selector.component.scss";
import {countCreneauxFor, RendezVousDuJour} from "../state/State";
import {CSS_Global} from "../styles/ConstructibleStyleSheets";
import {repeat} from "lit-html/directives/repeat";
import {classMap} from "lit-html/directives/class-map";
import {Strings} from "../utils/Strings";
import {format, parse} from "date-fns";
import {fr} from "date-fns/locale";

@customElement('vmd-upcoming-days-selector')
export class VmdUpcomingDaysSelectorComponent extends LitElement {

    //language=css
    static styles = [
        CSS_Global,
        css`${unsafeCSS(upcomingDaysSelectorCss)}`,
        css`
        `
    ];

    @property() creneauxQuotidiens: RendezVousDuJour[] = [];
    @property() dateSelectionnee: string|undefined = undefined;

    constructor() {
        super();
    }

    render() {
        return html`
          <ul class="days list-group list-group-horizontal">
            ${repeat(this.creneauxQuotidiens, cq => cq.date, cq => {
                const appointmentCount = countCreneauxFor(cq);
                return html`
              <li class="list-group-item ${classMap({selected: this.dateSelectionnee === cq.date})}" @click="${() => this.jourSelectionne(cq)}">
                <div class="day">${Strings.upperFirst(format(parse(cq.date, 'yyyy-MM-dd', new Date("1970-01-01T00:00:00Z")), 'E dd/MM', {locale: fr})).replace(".","")}</div>
                ${appointmentCount?html`<span class="cpt-rdv">${appointmentCount} créneau${Strings.plural(appointmentCount, "x")}</span>`:html``}
              </li>
                `;
            })}
          </ul>
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

    private jourSelectionne(creneauxQuotidien: RendezVousDuJour) {
        this.dispatchEvent(new CustomEvent<RendezVousDuJour>('jour-selectionne', {
            detail: creneauxQuotidien
        }));

    }
}
