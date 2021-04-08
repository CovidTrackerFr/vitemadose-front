import {
    LitElement,
    html,
    customElement,
    property,
    css,
    unsafeCSS
} from 'lit-element';
import {TrancheAgeSelectionne} from "../components/vmd-tranche-age-selector.component";
import {DepartementSelected} from "../components/vmd-departement-selector.component";
import {repeat} from "lit-html/directives/repeat";
import {styleMap} from "lit-html/directives/style-map";
import globalCss from "../styles/global.scss";
import {Router} from "../routing/Router";
import {Dates} from "../utils/Dates";
import rdvViewCss from "../styles/views/_rdv.scss";
import {
    Centre,
    CentresParDepartement,
    CodeDepartement,
    CodeTrancheAge,
    Departement, LOGOS_PLATEFORMES,
    State, TRANCHES_AGE
} from "../state/State";

@customElement('vmd-rdv')
export class VmdRdvView extends LitElement {

    //language=css
    static styles = [
        css`${unsafeCSS(globalCss)}`,
        css`${unsafeCSS(rdvViewCss)}`,
        css`
        `
    ];

    @property({type: String}) codeTrancheAgeSelectionne: CodeTrancheAge|undefined = undefined;
    @property({type: String}) codeDepartementSelectionne: CodeDepartement|undefined = undefined;

    @property({type: Array, attribute: false}) departementsDisponibles: Departement[]|undefined = undefined;
    @property({type: Array, attribute: false}) centresParDepartement: CentresParDepartement|undefined = undefined;

    get departementSelectionne() {
        if(this.codeDepartementSelectionne && this.departementsDisponibles) {
            return this.departementsDisponibles.find(dept => dept.code_departement === this.codeDepartementSelectionne);
        } else {
            return undefined;
        }
    }

    get trancheAgeSelectionee() {
        if(this.codeTrancheAgeSelectionne) {
            return TRANCHES_AGE.get(this.codeTrancheAgeSelectionne);
        } else {
            return undefined;
        }
    }

    render() {
        return html`
            <div class="p-5 text-dark bg-light rounded-3">
                <div class="rdvForm-fields row align-items-center">
                  <!--
                    <div class="col-sm-24 col-md-auto mb-md-3 mt-md-3">
                        J'ai
                    </div>
                    <div class="col">
                        <vmd-tranche-age-selector class="mb-3 mt-md-3"
                              codeTrancheAgeSelectionne="${this.codeTrancheAgeSelectionne}"
                              .tranchesAge="${TRANCHES_AGE}"
                              @tranche-age-changed="${this.trancheAgeMisAJour}"></vmd-tranche-age-selector>
                    </div>
                    -->
                    <div class="col-sm-24 col-md-auto mb-md-3 mt-md-3">
                        J'habite en
                    </div>
                    <div class="col">
                        <vmd-departement-selector class="mb-3 mt-md-3"
                              codeDepartementSelectionne="${this.codeDepartementSelectionne}"
                              .departementsDisponibles="${this.departementsDisponibles}"
                              @departement-changed="${this.departementUpdated}"></vmd-departement-selector>
                    </div>
                </div>
            </div>

            <div class="spacer mt-5 mb-5"></div>

            <h4 class="fw-normal text-center" style="${styleMap({display: (this.codeDepartementSelectionne && this.codeTrancheAgeSelectionne)?'block':'none'})}">
              Résultats pour : <span class="fw-bold">${this.departementSelectionne?.nom_departement} <!-- , ${this.trancheAgeSelectionee?.libelle} --></span>
            </h4>

            <div class="spacer mt-5 mb-5"></div>
            
            <div class="p-5 text-dark bg-light rounded-3">
                <h5 class="row align-items-center justify-content-center mb-5">
                    <i class="bi bi-calendar-check-fill text-success me-2 fs-3 col-auto"></i>
                    <span class="col col-sm-auto">
                        ${this.centresParDepartement?.centresDisponibles.length || 0} Centres(s) ayant des disponibilités
                    </span>
                </h5>

                ${repeat(this.centresParDepartement?.centresDisponibles || [], (c => `${c.departement}||${c.nom}||${c.plateforme}`), (centre) => {
                    return html`<vmd-appointment-card .centre="${centre}" .rdvPossible="${true}"></vmd-appointment-card>`;
                })}

                <div class="spacer mt-5 mb-5"></div>

                <h5 class="row align-items-center justify-content-center mb-5">
                    <i class="bi bi-calendar-x-fill text-black-50 me-2 fs-3 col-auto"></i>
                    <span class="col col-sm-auto text-black-50">
                        Autres centres sans créneaux de vaccination détecté
                    </span>
                </h5>

                ${repeat(this.centresParDepartement?.centresIndisponibles || [], (c => `${c.departement}||${c.nom}||${c.plateforme}`), (centre) => {
                    return html`<vmd-appointment-card .centre="${centre}" .rdvPossible="${false}"></vmd-appointment-card>`;
                })}
            </div>
        `;
    }

    async connectedCallback() {
        super.connectedCallback();

        const [ departementsDisponibles, centresParDepartement ] = await Promise.all([
            State.current.departementsDisponibles(),
            this.refreshCentres()
        ])

        this.departementsDisponibles = departementsDisponibles;

        // this.findCentres();
    }

    async refreshCentres() {
        if(this.codeDepartementSelectionne && this.codeTrancheAgeSelectionne) {
            this.centresParDepartement = await State.current.centresPour(this.codeDepartementSelectionne, this.codeTrancheAgeSelectionne);
        } else {
            this.centresParDepartement = undefined;
        }
    }

    trancheAgeMisAJour(event: CustomEvent<TrancheAgeSelectionne>) {
        this.codeTrancheAgeSelectionne = event.detail.trancheAge?.codeTrancheAge;
        this.refreshCentres();
        this.refreshPageWhenValidParams();
    }

    departementUpdated(event: CustomEvent<DepartementSelected>) {
        this.codeDepartementSelectionne = event.detail.departement?.code_departement;
        this.refreshCentres();
        this.refreshPageWhenValidParams();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        // console.log("disconnected callback")
    }

    private refreshPageWhenValidParams() {
        if(this.codeDepartementSelectionne && this.codeTrancheAgeSelectionne) {
            Router.navigateToRendezVous(this.codeDepartementSelectionne, this.codeTrancheAgeSelectionne);
        }
    }
}
