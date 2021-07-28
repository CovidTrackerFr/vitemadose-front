import {css, customElement, html, LitElement, property } from 'lit-element';
import {Router} from "../routing/Router";
import {
    libelleUrlPathDeCommune,
    libelleUrlPathDuDepartement,
    PLATEFORMES, SearchType,
    SearchRequest,
    State,
    StatsLieu, Departement,
} from "../state/State";
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

    @property({type: Array, attribute: false}) recuperationCommunesEnCours: boolean = false;
    @property({type: Array, attribute: false}) statsLieu: StatsLieu|undefined = undefined;

    private async onSearch (event: CustomEvent<SearchRequest>) {
      const searchType: SearchType = 'standard';
      if (SearchRequest.isByDepartement(event.detail)) {
        const departement = event.detail.departement
        Router.navigateToRendezVousAvecDepartement(departement.code_departement, libelleUrlPathDuDepartement(departement), searchType)
      } else {
        const commune = event.detail.commune;
        const departements = await State.current.departementsDisponibles();
        const departement: Departement|undefined = departements.find(({ code_departement }) => code_departement === commune.codeDepartement);

        if (!departement) {
            console.error(`Can't find departement matching code ${commune.codeDepartement}`)
            return;
        }

        Router.navigateToRendezVousAvecCommune(
            'distance',
            departement.code_departement,
            libelleUrlPathDuDepartement(departement),
            commune.code,
            commune.codePostal,
            libelleUrlPathDeCommune(commune!),
            searchType
        );
      }
    }

    render() {
        return html`
            <div class="searchAppointment">
                <div class="searchAppointment-title h1">
                  <slot name="main-title"></slot>
                </div>

                <div class="searchAppointment-form">
                    <div class="searchAppointmentForm-fields">
                          <vmd-search
                            @on-search="${this.onSearch.bind(this)}"
                          />
                    </div>
                </div>
            </div>

            <div class="platforms mt-5">
                <h2 class="text-gray-600 text-center mb-5 h5">Trouvez vos rendez-vous avec</h2>

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
                                    <a href="https://covidtracker.fr/vaccintracker/" target="_blank" rel="noreferrer" class="col-auto btn btn-primary btn-lg">
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
                                <i class="bi vmdicon-building fs-6 text-primary"></i>
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

            <div class="spacer mt-5 mb-5"></div>

            <slot name="about"></slot>
        `;
    }

    async connectedCallback() {
        super.connectedCallback();
        this.statsLieu = await State.current.statsLieux()
    }
}
