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
              <li class="list-group-item ${classMap({
                selected: this.dateSelectionnee === cq.date, 
                selectable: this.isSelectable(cq),
                empty: this.dateSelectionnee !== cq.date && appointmentCount === 0
              })}" @click="${() => this.jourSelectionne(cq)}">
                <div class="date-card">
                  <div class="weekday">${Strings.upperFirst(format(parse(cq.date, 'yyyy-MM-dd', new Date("1970-01-01T00:00:00Z")), 'EEEE', {locale: fr})).replace(".","")}</div>
                  <div class="day">${Strings.upperFirst(format(parse(cq.date, 'yyyy-MM-dd', new Date("1970-01-01T00:00:00Z")), 'dd', {locale: fr}))}</div>
                </div>
                <div class="cpt-rdv">${appointmentCount>0?html`${appointmentCount} créneau${Strings.plural(appointmentCount, "x")}`:html`0 créneaux`}</div>
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
        if(!this.isSelectable(creneauxQuotidien)) {
            return;
        }

        this.dispatchEvent(new CustomEvent<RendezVousDuJour>('jour-selectionne', {
            detail: creneauxQuotidien
        }));

    }

    private isSelectable(creneauxQuotidien: RendezVousDuJour) {
        const appointmentCount = countCreneauxFor(creneauxQuotidien);
        return this.dateSelectionnee !== creneauxQuotidien.date && appointmentCount > 0;
    }
}
