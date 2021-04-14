import {LitElement, html, customElement, property, css, unsafeCSS} from 'lit-element';
import {TrancheAgeSelectionne} from "../components/vmd-tranche-age-selector.component";
import {DepartementSelected} from "../components/vmd-departement-selector.component";
import {Router} from "../routing/Router";
import globalCss from "../styles/global.scss";
import homeViewCss from "../styles/views/_home.scss";
import searchDoseCss from "../styles/components/_searchDose.scss";
import searchAppointment from "../styles/components/_searchAppointment.scss";
import {
    CodeDepartement,
    CodeTrancheAge,
    Departement, FEATURES, libelleUrlPathDuDepartement,
    PLATEFORMES,
    State, StatsLieu,
    TRANCHES_AGE
} from "../state/State";

@customElement('vmd-home')
export class VmdHomeView extends LitElement {

    //language=css
    static styles = [
        css`${unsafeCSS(globalCss)}`,
        css`${unsafeCSS(homeViewCss)}`,
        css`${unsafeCSS(searchDoseCss)}`,
        css`${unsafeCSS(searchAppointment)}`,
        css`
            :host {
                display: block;
            }
        `
    ];

    @property({type: String}) codeTrancheAgeSelectionne: CodeTrancheAge|undefined = FEATURES.trancheAgeFilter?undefined:'plus75ans';
    @property({type: String}) codeDepartementSelectionne: CodeDepartement|undefined = undefined;

    @property({type: Array, attribute: false}) departementsDisponibles: Departement[]|undefined = [];
    @property({type: Array, attribute: false}) statsLieu: StatsLieu|undefined = undefined;

    get departementSelectionne(): Departement|undefined {
        if(!this.codeDepartementSelectionne || !this.departementsDisponibles) {
            return undefined;
        }
        return this.departementsDisponibles.find(dpt => dpt.code_departement === this.codeDepartementSelectionne);
    }

    onDepartementSelected(event: CustomEvent<DepartementSelected>) {
        this.codeDepartementSelectionne = event.detail.departement?.code_departement;
        if(this.codeDepartementSelectionne && this.codeTrancheAgeSelectionne) {
            // Auto-trigger search
            this.rechercherRdv();
        }
    }

    rechercherRdv() {
        Router.navigateToRendezVous(
            this.codeDepartementSelectionne!,
            libelleUrlPathDuDepartement(this.departementSelectionne!),
            this.codeTrancheAgeSelectionne!)
    }

    render() {
        return html`
            <div class="searchDose">
                <div class="searchDose-title h1">
                  <slot name="main-title"></slot>
                </div>

                <div class="searchDose-form">
                    <div class="searchDoseForm-fields row align-items-center">
                      ${FEATURES.trancheAgeFilter?html`
                        <div class="col-sm-24 col-md-auto mb-md-3">
                            J'ai
                        </div>
                        <div class="col">
                            <vmd-tranche-age-selector class="mb-3"
                                  @tranche-age-changed="${(event: CustomEvent<TrancheAgeSelectionne>) => this.codeTrancheAgeSelectionne = event.detail.trancheAge?.codeTrancheAge}"
                                  .tranchesAge="${TRANCHES_AGE}"
                            >
                            </vmd-tranche-age-selector>
                        </div>
                        `:html``}
                        <label class="col-sm-24 col-md-auto mb-md-3 form-select-lg">
                            Mon département :
                        </label>
                        <div class="col">
                            <vmd-departement-selector class="mb-3"
                                  @departement-changed="${this.onDepartementSelected}"
                                  .departementsDisponibles="${this.departementsDisponibles}"
                            >
                            </vmd-departement-selector>
                        </div>
                    </div>
                    <div class="searchDoseForm-action">
                        <button class="btn btn-primary btn-lg" ?disabled="${!this.codeDepartementSelectionne || !this.codeTrancheAgeSelectionne}"
                                @click="${this.rechercherRdv}">
                            Rechercher
                        </button>
                    </div>
                </div>
            </div>

            <div class="searchAppointment mt-5">
                <h5 class="text-black-50 text-center mb-5">Trouvez vos rendez-vous avec</h5>

                <div class="row justify-content-center align-items-center">
                  ${Object.values(PLATEFORMES).filter(p => p.promoted).map(plateforme => {
                      return html`
                        <div class="col-auto">
                          <img class="searchAppointment-logo ${plateforme.styleCode}" src="${Router.basePath}assets/images/png/${plateforme.logo}" alt="Créneaux de vaccination ${plateforme.nom}"></a>
                        </div>
                      `
                  })}
                </div>
            </div>

            <div class="spacer mt-5 mb-5"></div>

            <div class="row gx-5">
                <div class="col-sm-24 col-md mb-5 mb-md-0"">
                    <div class="p-5 text-dark bg-light rounded-3 fixed-card-height">
                        <h2>VaccinTracker</h2>

                        <p>
                            Combien de personnes ont été vaccinées ? Combien de premières injections ? Quel pourcentage de seconde injection ? Suivez la campagne vaccinale en France sur Vaccintracker.
                        </p>

                        <div class="row justify-content-center mt-5">
                            <a href="https://covidtracker.fr/vaccintracker/" target="_blank" class="col-auto btn btn-primary btn-lg">
                                Accéder à VaccinTracker&nbsp;<i class="bi vmdicon-arrow-up-right"></i>
                            </a>
                        </div>
                    </div>
                </div>
                <div class="col-sm-24 col-md">
                    <div class="p-5 text-dark bg-light rounded-3 fixed-card-height">
                        <h2>Carte des centres de vaccination contre la Covid-19</h2>

                        <p>
                            Trouvez un centre de vaccination contre la Covid-19 proche de chez vous, consultez les centres pour savoir s’il y a des rendez-vous
                        </p>

                        <div class="row justify-content-center mt-5">
                            <a href="${Router.basePath}centres" class="col-auto btn btn-primary btn-lg">
                                Accéder à la carte des centres&nbsp;<i class="bi vmdicon-arrow-up-right"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <div class="p-5 text-dark bg-light rounded-3 mt-5">
                <div class="row gx-5">
                    <div class="col-24 col-md text-center">
                        <i class="bi vmdicon-commerical-building fs-6 text-primary"></i>
                        <div class="h4 mt-4">${this.statsLieu?.global.disponibles.toLocaleString()}</div>
                        <p>Lieux de vaccination ayant des disponibilités</p>
                    </div>
                    <div class="col-24 col-md text-center">
                        <i class="bi vmdicon-geo-alt-fill fs-6 text-primary"></i>
                        <div class="h4 mt-4">${this.statsLieu?.global.total.toLocaleString()}</div>
                        <p>Lieux de vaccination supportés</p>
                    </div>
                    <div class="col-24 col-md text-center">
                        <i class="bi vmdicon-check-circle-fill fs-6 text-primary"></i>
                        <div class="h4 mt-4">${this.statsLieu?.global.proportion.toLocaleString()}%</div>
                        <p>Proportion des lieux de vaccination ayant des disponibilités</p>
                    </div>
                </div>
            </div>

            <slot name="about"></slot>
        `;
    }

    async connectedCallback() {
        super.connectedCallback();

        const [ departementsDisponibles, statsLieu ] = await Promise.all([
            State.current.departementsDisponibles(),
            State.current.statsLieux()
        ])
        this.departementsDisponibles = departementsDisponibles;
        this.statsLieu = statsLieu;
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        // console.log("disconnected callback")
    }
}
