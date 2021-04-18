import {css, customElement, html, LitElement, property, unsafeCSS} from 'lit-element';
import {Router} from "../routing/Router";
import globalCss from "../styles/global.scss";
import homeViewCss from "../styles/views/_home.scss";
import searchDoseCss from "../styles/components/_searchDose.scss";
import searchAppointment from "../styles/components/_searchAppointment.scss";
import {
    Commune,
    Departement,
    libelleUrlPathDeCommune,
    libelleUrlPathDuDepartement,
    PLATEFORMES,
    State,
    StatsLieu,
} from "../state/State";
import {
    AutocompleteTriggered,
    CommuneSelected,
    DepartementSelected
} from "../components/vmd-commune-selector.component";

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

    @property({type: Array, attribute: false}) communesAutocomplete: Set<string>|undefined = undefined;
    @property({type: Array, attribute: false}) recuperationCommunesEnCours: boolean = false;
    @property({type: Array, attribute: false}) communesDisponibles: Commune[]|undefined = undefined;
    @property({type: Array, attribute: false}) statsLieu: StatsLieu|undefined = undefined;

    private departementsDisponibles: Departement[]|undefined = [];
    private communeSelectionee: Commune|undefined = undefined;
    private departementSelectione: Departement|undefined = undefined;

    rechercherRdv() {
        if(this.departementSelectione) {
            Router.navigateToRendezVousAvecDepartement(this.departementSelectione.code_departement, libelleUrlPathDuDepartement(this.departementSelectione));
            return;
        }

        const departement = this.departementsDisponibles?this.departementsDisponibles.find(dpt => dpt.code_departement === this.communeSelectionee!.codeDepartement):undefined;
        if(!departement) {
            console.error(`Can't find departement matching code ${this.communeSelectionee!.codeDepartement}`)
            return;
        }

        Router.navigateToRendezVousAvecCommune(
            'distance',
            departement.code_departement,
            libelleUrlPathDuDepartement(departement),
            this.communeSelectionee!.code, this.communeSelectionee!.codePostal,
            libelleUrlPathDeCommune(this.communeSelectionee!)
        )
    }

    async communeAutocompleteTriggered(event: CustomEvent<AutocompleteTriggered>) {
        this.recuperationCommunesEnCours = true;
        this.communesDisponibles = await State.current.communesPourAutocomplete(Router.basePath, event.detail.value);
        this.recuperationCommunesEnCours = false;
        this.requestUpdate('communesDisponibles')
    }

    communeSelected(commune: Commune) {
        this.communeSelectionee = commune;
        this.rechercherRdv();
    }

    departementSelected(departement: Departement) {
        this.departementSelectione = departement;
        this.rechercherRdv();
    }

    render() {
        return html`
            <div class="searchDose">
                <div class="searchDose-title h1">
                  <slot name="main-title"></slot>
                </div>

                <div class="searchDose-form">
                    <div class="searchDoseForm-fields row align-items-center">
                        <label class="col-sm-24 col-md-auto mb-md-3 form-select-lg">
                            Localisation :
                        </label>
                        <div class="col">
                            <vmd-commune-or-departement-selector class="mb-3"
                                  @autocomplete-triggered="${this.communeAutocompleteTriggered}"
                                  @on-commune-selected="${(event: CustomEvent<CommuneSelected>) => this.communeSelected(event.detail.commune)}"
                                  @on-departement-selected="${(event: CustomEvent<DepartementSelected>) => this.departementSelected(event.detail.departement)}"
                                  .departementsDisponibles="${this.departementsDisponibles}"
                                  .autocompleteTriggers="${this.communesAutocomplete}"
                                  .communesDisponibles="${this.communesDisponibles}"
                                  .recuperationCommunesEnCours="${this.recuperationCommunesEnCours}"
                            >
                            </vmd-commune-or-departement-selector>
                        </div>
                    </div>
                </div>
            </div>

            <div class="searchAppointment mt-5">
                <h5 class="text-black-50 text-center mb-5">Trouvez vos rendez-vous avec</h5>

                <div class="row justify-content-center align-items-center">
                  ${Object.values(PLATEFORMES).filter(p => p.promoted).map(plateforme => {
                      return html`
                        <div class="col-auto">
                          <a href=""><img class="searchAppointment-logo ${plateforme.styleCode}" src="${Router.basePath}assets/images/png/${plateforme.logo}" alt="Créneaux de vaccination ${plateforme.nom}"></a>
                        </div>
                      `
                  })}
                </div>
            </div>

            <div class="spacer mt-5 mb-5"></div>

            <div class="container-xxl">
                <div class="row gx-5">
                    <div class="col-sm-24 col-md mb-5 mb-md-0 homeCard">
                        <div class="p-5 text-dark bg-light homeCard-container">
                            <div class="homeCard-content">
                                <h2>VaccinTracker</h2>
        
                                <p>
                                    Combien de personnes ont été vaccinées ? Combien de premières injections ? Quel pourcentage de seconde injection ? Suivez la campagne vaccinale en France sur Vaccintracker.
                                </p>
                            </div>

                            <div class="homeCard-actions">
                                <div class="row justify-content-center justify-content-lg-start mt-5">
                                    <a href="https://covidtracker.fr/vaccintracker/" target="_blank" class="col-auto btn btn-primary btn-lg">
                                        Accéder à VaccinTracker&nbsp;<i class="bi vmdicon-arrow-up-right"></i>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-sm-24 col-md homeCard">
                        <div class="p-5 text-dark bg-light homeCard-container">
                            <div class="homeCard-content">
                                <h2>Carte des centres de vaccination contre la Covid-19</h2>
        
                                <p>
                                    Trouvez un centre de vaccination contre la Covid-19 proche de chez vous, consultez les centres pour savoir s’il y a des rendez-vous
                                </p>
                            </div>

                            <div class="homeCard-actions">
                                <div class="row justify-content-center justify-content-lg-start mt-5">
                                    <a href="${Router.basePath}centres" class="col-auto btn btn-primary btn-lg">
                                        Accéder à la carte des centres&nbsp;<i class="bi vmdicon-arrow-up-right"></i>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="homeCard">
                    <div class="p-5 text-dark bg-light homeCard-container mt-5">
                        <div class="row gx-5">
                            <div class="col-24 col-md text-center">
                                <i class="bi vmdicon-commerical-building fs-6 text-primary"></i>
                                <div class="h4 mt-4">${this.statsLieu?this.statsLieu.global.disponibles.toLocaleString():""}</div>
                                <p>Lieux de vaccination ayant des disponibilités</p>
                            </div>
                            <div class="col-24 col-md text-center">
                                <i class="bi vmdicon-geo-alt-fill fs-6 text-primary"></i>
                                <div class="h4 mt-4">${this.statsLieu?this.statsLieu.global.total.toLocaleString():""}</div>
                                <p>Lieux de vaccination supportés</p>
                            </div>
                            <div class="col-24 col-md text-center">
                                <i class="bi vmdicon-check-circle-fill fs-6 text-primary"></i>
                                <div class="h4 mt-4">${this.statsLieu?this.statsLieu.global.proportion.toLocaleString():""}%</div>
                                <p>Proportion des lieux de vaccination ayant des disponibilités</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <slot name="about"></slot>
        `;
    }

    async connectedCallback() {
        super.connectedCallback();

        const [ departementsDisponibles, statsLieu, autocompletes ] = await Promise.all([
            State.current.departementsDisponibles(),
            State.current.statsLieux(),
            State.current.communeAutocompleteTriggers(Router.basePath)
        ])
        this.departementsDisponibles = departementsDisponibles;
        this.statsLieu = statsLieu;
        this.communesAutocomplete = new Set(autocompletes);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        // console.log("disconnected callback")
    }
}
