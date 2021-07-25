import {LitElement, html, customElement, property, css, unsafeCSS, CSSResult} from 'lit-element';
import upcomingDaysSelectorCss from "./vmd-upcoming-days-selector.component.scss";
import {CreneauxParLieu, RendezVousDuJour} from "../state/State";
import {CSS_Global} from "../styles/ConstructibleStyleSheets";
import {repeat} from "lit-html/directives/repeat";
import {classMap} from "lit-html/directives/class-map";
import {Strings} from "../utils/Strings";
import {format, parse} from "date-fns";
import {fr} from "date-fns/locale";
import {styleMap} from "lit-html/directives/style-map";

type UpcomingDay = {
    date: string;
    total: number;
    creneauxParLieu: CreneauxParLieu[];
    selected: boolean;
    selectable: boolean;
    empty: boolean;
} &
({ hidden: true; hiddenGroup: number; firstHiddenFromGroup: boolean; }
 | { hidden: false; hiddenGroup: undefined; });

@customElement('vmd-upcoming-days-selector')
export class VmdUpcomingDaysSelectorComponent extends LitElement {

    //language=css
    static styles: CSSResult[] = [
        CSS_Global,
        unsafeCSS(upcomingDaysSelectorCss),
        css`
        `
    ];

    @property() set creneauxQuotidiens(creneauxQuotidiens: RendezVousDuJour[]) {
        const upcomingDaysResults = creneauxQuotidiens.reduce(({upcomingDays, currentGroup, groups}, infosJour, idx) => {
            // For a given time window with more than 3+ consecutive days with 0 available appointments, we may
            // consider the 2nd (and every following) day as "hideable" as not very useful to be displayed
            // (and hide them)
            const isGroupFirstHiddenDays = infosJour.total===0 && idx > 1 && idx < creneauxQuotidiens.length-1
                && creneauxQuotidiens[idx-1].total === 0
                && (creneauxQuotidiens[idx-2].total !== 0 || idx-2===0)
                && creneauxQuotidiens[idx+1].total === 0;

            if(isGroupFirstHiddenDays) {
                currentGroup = groups.length;
                groups.push(currentGroup);
            }

            const isGroupLastHiddenDay = infosJour.total===0 && idx > 2 &&
                (idx === creneauxQuotidiens.length-1 || (
                    creneauxQuotidiens[idx+1].total !== 0
                    && creneauxQuotidiens[idx-1].total === 0
                    && creneauxQuotidiens[idx-2].total === 0
                ));

            const upcomingDayBase = {
                date: infosJour.date,
                total: infosJour.total,
                creneauxParLieu: infosJour.creneauxParLieu,
                selected: this.dateSelectionnee === infosJour.date,
                selectable: this.isSelectable(infosJour),
                empty: infosJour.total===0
            };

            if(currentGroup !== undefined) {
                upcomingDays.push({
                    ...upcomingDayBase,
                    hidden: true,
                    hiddenGroup: currentGroup,
                    firstHiddenFromGroup: isGroupFirstHiddenDays
                });
            } else {
                upcomingDays.push({
                    ...upcomingDayBase,
                    hidden: false,
                    hiddenGroup: undefined
                });
            }

            if(isGroupLastHiddenDay) {
                currentGroup = undefined;
            }

            return {upcomingDays, currentGroup, groups};
        }, { upcomingDays: [], currentGroup: undefined, groups: [] } as { upcomingDays: UpcomingDay[], currentGroup: number|undefined, groups: number[] });
        this._upcomingDays = upcomingDaysResults.upcomingDays;
        this.requestUpdate()
    }
    private _upcomingDays: UpcomingDay[] = [];
    @property() dateSelectionnee: string|undefined = undefined;

    constructor() {
        super();
    }

    render() {
        return html`
          <ul class="days list-group list-group-horizontal">
            ${repeat(this._upcomingDays, ud => ud.date, ud => {
                return html`
              ${(ud.hidden && ud.firstHiddenFromGroup)?html`
              <li class="list-group-item empty selectable">
                <div class="date-card" @click="${() => this.showHiddenGroup(ud.hiddenGroup!)}">
                  Jours sans créneaux
                </div>
              </li>
              `:html``}
              <li class="list-group-item ${classMap({
                selected: this.dateSelectionnee === ud.date, 
                selectable: this.isSelectable(ud),
                empty: this.dateSelectionnee !== ud.date && ud.total === 0
              })}" style="${styleMap({ display: ud.hidden?'none':'block' })}" @click="${() => this.jourSelectionne(ud)}">
                <div class="date-card ${classMap({
                  'shadow-lg': this.dateSelectionnee === ud.date,
                  'shadow-sm': this.dateSelectionnee !== ud.date && ud.total>0,
                })}">
                  <div class="weekday">${Strings.upperFirst(format(parse(ud.date, 'yyyy-MM-dd', new Date("1970-01-01T00:00:00Z")), 'EEEE', {locale: fr})).replace(".","")}</div>
                  <div class="day">${Strings.upperFirst(format(parse(ud.date, 'yyyy-MM-dd', new Date("1970-01-01T00:00:00Z")), 'dd/MM', {locale: fr}))}</div>
                </div>
                <div class="cpt-rdv">${ud.total>0?html`${ud.total} créneau${Strings.plural(ud.total, "x")}`:html`0 créneaux`}</div>
              </li>
                `;
            })}
          </ul>
        `;
    }

    showHiddenGroup(groupId: number) {
        this._upcomingDays = this._upcomingDays.map(ud => {
            if(ud.hiddenGroup === groupId) {
                return {...ud, firstHiddenFromGroup: undefined, hidden: false, hiddenGroup: undefined};
            } else {
                return ud;
            }
        })
        this.requestUpdate()
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
        const appointmentCount = creneauxQuotidien.total;
        return this.dateSelectionnee !== creneauxQuotidien.date && appointmentCount > 0;
    }
}
