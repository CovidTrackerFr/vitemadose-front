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
    Departement,
    PLATEFORMES,
    State,
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

    @property({type: String}) codeTrancheAgeSelectionne: CodeTrancheAge|undefined = "plus75";
    @property({type: String}) codeDepartementSelectionne: CodeDepartement|undefined = undefined;

    @property({type: Array, attribute: false}) departementsDisponibles: Departement[]|undefined = undefined;

    render() {
        return html`
            <div class="searchDose">
                <h1 class="searchDose-title">
                    Trouvez une dose de vaccin <span class="text-secondary">facilement</span> et <span class="text-primary">rapidement</span>
                </h1>
                
                <div class="searchDose-form">
                    <div class="searchDoseForm-fields row align-items-center">
                      <!--
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
                        -->
                        <div class="col-sm-24 col-md-auto mb-md-3">
                            Mon département :
                        </div>
                        <div class="col">
                            <vmd-departement-selector class="mb-3" 
                                  @departement-changed="${(event: CustomEvent<DepartementSelected>) => this.codeDepartementSelectionne = event.detail.departement?.code_departement}"
                                  .departementsDisponibles="${this.departementsDisponibles}"
                            >
                            </vmd-departement-selector>
                        </div>
                    </div>
                    <div class="searchDoseForm-action">
                        <button class="btn btn-primary btn-lg" ?disabled="${!this.codeDepartementSelectionne || !this.codeTrancheAgeSelectionne}"
                                @click="${() => Router.navigateToRendezVous(this.codeDepartementSelectionne!, this.codeTrancheAgeSelectionne!)}">
                            Rechercher
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="searchAppointment mt-5">
                <h5 class="text-black-50 text-center mb-5">Trouvez vos rendez-vous avec</h5>

                <div class="row justify-content-center align-items-center">
                  ${Object.values(PLATEFORMES).map(plateforme => {
                      return html`
                        <div class="col-auto">
                          <a href=""><img class="searchAppointment-logo ${plateforme.styleCode}" src="${Router.basePath}assets/images/png/${plateforme.logo}" alt="${plateforme.nom}"></a>
                        </div>
                      `
                  })}
                </div>
            </div>
            
            <div class="spacer mt-5 mb-5"></div>
            
            <div class="row g-5">
                <div class="col-sm-24 col-md">
                    <div class="p-5 text-dark bg-light rounded-3">
                        <h2>VaccinTracker</h2>
                        
                        <p>
                            Combien de personnes ont été vaccinées ? Suivez la campagne vaccinale sur VaccinTracker.
                        </p>

                        <div class="row justify-content-center mt-5">
                            <a href="https://covidtracker.fr/vaccintracker/" target="_blank" class="col-auto btn btn-primary btn-lg">
                                Accéder à VaccinTracker&nbsp;<i class="bi bi-arrow-up-right"></i>
                            </a>
                        </div>
                    </div>
                </div>
                <div class="col-sm-24 col-md">
                    <div class="p-5 text-dark bg-light rounded-3">
                        <h2>Carte des centres</h2>
                        
                        <p>
                            Trouvez un centre de vaccination directement sur la carte, appelez les centres pour savoir il y a des rendez-vous.
                        </p>
                        
                        <div class="row justify-content-center mt-5">
                            <a href="${Router.basePath}centres" class="col-auto btn btn-primary btn-lg">
                                Accéder à la carte des centres&nbsp;<i class="bi bi-arrow-up-right"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            
            <h1>L'outil Vite Ma Dose</h1>
            <h2>Quel est l'intérêt de Vite Ma Dose de Vaccin ?</h2>
            L'outil Vite Ma Dose de Vaccin permet de trouver facilement et rapidement un rendez-vous de vaccination proche de chez soi (proche de son domicile, ou de son lieu de travail). Il permet de chercher l'ensemble des rendez-vous de vaccination possibles via les plateformes de réservation comme Doctolib, Maiia, Keldoc ou Ordoclic.
            <h1>La vaccination contre la Covid19</h1>
            <h2>Qui peut-se faire vacciner contre le covid-19 ?</h2>
            <p>On peut être éligible à la vaccination selon son âge, sa santé, ou sa profession.
            Les professionnels de santé sont prioritaires. Les personnes de plus de 50 ans souffrant de « comorbidité » peuvent aussi se faire vacciner. Toutes les personnes de plus de 70 ans sont éligibles à la vaccination contre le covid-19.
            A partir du 16 avril, les plus de 60 ans auront accès à la vaccination contre le coronavirus.</p>

            <h2>Où se faire vacciner ?</h2>
            <p>Si on est éligible, on peut être vacciné chez son médecin généraliste, dans un centre de vaccination, à la pharmacie, ou dans tous les établissements de santé et médico sociaux.</p>

            <h2>Comment réserver un Rendez-vous de vaccination ?</h2>
            <p>On peut se faire vacciner contre le coronavirus en réservant un rendez-vous grâce à Vite Ma Dose. On peut aussi prendre rendez-vous directement via les plateformes Doctolib, Maiia, ou Keldoc, ainsi que chez son médecin généraliste ou en pharmacie.</p>

            <h2>Pourquoi se faire vacciner ?</h2>
            <p>Le vaccin contre le covid-19 protège des formes graves de la maladie. Il semble aussi limiter les contaminations.</p>

            <h2>Comment fonctionne Vite Ma Dose ?</h2>
            <p>Vite Ma Dose est une plateforme où on peut réserver un rendez-vous de vaccination. Vite Ma Dose ne collecte aucune données personnelles.</p>


            <div class="row fs-6 legals">
                <p class="col-sm-24 col-lg-12">
                  Vite Ma Dose! est un outil de CovidTracker permettant de détecter les rendez-vous 
                  disponibles dans votre département afin de vous faire vacciner (sous réserve d'éligibilité).
                  Pour l'instant, seule les plateformes ${Object.values(PLATEFORMES).map(p => p.nom).join(", ")} sont supportées.
                  Vite Ma Dose! n'est pas un outil officiel, n'est pas exhaustif et ne remplace pas une recherche manuelle.
                </p>
            </div>

            CovidTracker 2021 - Tous droits réservés - Merci aux contributeurs
        `;
    }

    async connectedCallback() {
        super.connectedCallback();

        const [ departementsDisponibles ] = await Promise.all([
            State.current.departementsDisponibles()
        ])
        this.departementsDisponibles = departementsDisponibles;
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        // console.log("disconnected callback")
    }
}
