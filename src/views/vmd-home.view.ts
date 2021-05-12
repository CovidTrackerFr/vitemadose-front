import {css, customElement, html, LitElement, property } from 'lit-element';
import {Router} from "../routing/Router";
import {
    Commune,
    Departement,
    libelleUrlPathDeCommune,
    libelleUrlPathDuDepartement,
    PLATEFORMES, SearchType,
    State,
    StatsLieu,
} from "../state/State";
import {
    AutocompleteTriggered,
    CommuneSelected,
    DepartementSelected
} from "../components/vmd-commune-or-departement-selector.component";
import {CSS_Global, CSS_Home} from "../styles/ConstructibleStyleSheets";

@customElement('vmd-home')
export class VmdHomeView extends LitElement {

    //language=css
    static styles = [
        CSS_Global,
        CSS_Home,
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
        const searchType: SearchType = window.location.hostname === 'chronodose.fr' ? 'chronodose':'standard';
        if(this.departementSelectione) {
            Router.navigateToRendezVousAvecDepartement(this.departementSelectione.code_departement, libelleUrlPathDuDepartement(this.departementSelectione), searchType);
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
            libelleUrlPathDeCommune(this.communeSelectionee!),
            searchType
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
            <div class="searchAppointment">
                <div class="searchAppointment-title h1">
                  <slot name="main-title"></slot>
                </div>

                <div class="searchAppointment-form">
                    <div class="searchAppointmentForm-fields">
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

            <div class="platforms mt-5">
                <h5 class="text-black-50 text-center mb-5">Trouvez vos rendez-vous avec</h5>

                <div class="row justify-content-center align-items-center">
                  ${Object.values(PLATEFORMES).filter(p => p.promoted).map(plateforme => {
                      return html`
                        <div class="col-auto">
                          <img class="platforms-logo ${plateforme.styleCode}" src="${Router.basePath}assets/images/png/${plateforme.logo}" alt="Créneaux de vaccination ${plateforme.nom}">
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
                                <a href="${Router.basePath}statistiques" >
                                    <div class="h4 mt-4">${this.statsLieu?this.statsLieu.global.disponibles.toLocaleString():""}</div>
                                    <p>Lieux de vaccination ayant des disponibilités</p>
                                </a>
                            </div>
                            <div class="col-24 col-md text-center">
                                <i class="bi vmdicon-geo-alt-fill fs-6 text-primary"></i>
                                <a href="${Router.basePath}statistiques" >
                                    <div class="h4 mt-4">${this.statsLieu?this.statsLieu.global.total.toLocaleString():""}</div>
                                    <p>Lieux de vaccination supportés</p>
                                </a>
                            </div>
                            <div class="col-24 col-md text-center">
                                <i class="bi vmdicon-check-circle-fill fs-6 text-primary"></i>
                                <a href="${Router.basePath}statistiques" >
                                    <div class="h4 mt-4">${this.statsLieu?this.statsLieu.global.creneaux.toLocaleString():""}</div>
                                    <p>Créneaux de vaccination disponibles</p>
                                </a>
                              <em style="font-size: 1.3rem">Ce nombre ne correspond pas au nombre de doses disponibles</em>
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
