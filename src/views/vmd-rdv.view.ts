import {
    css,
    customElement,
    html,
    internalProperty,
    LitElement,
    property,
    PropertyValues,
    unsafeCSS
} from 'lit-element';
import {repeat} from "lit-html/directives/repeat";
import {styleMap} from "lit-html/directives/style-map";
import {Router} from "../routing/Router";
import rdvViewCss from "./vmd-rdv.view.scss";
import distanceEntreDeuxPoints from "../distance"
import {
    CodeDepartement,
    Commune,
    libelleUrlPathDeCommune,
    libelleUrlPathDuDepartement,
    Lieu,
    LieuAffichableAvecDistance,
    LieuxAvecDistanceParDepartement,
    LieuxParDepartement,
    SearchRequest,
    SearchType,
    State,
    CodeTriCentre,
    searchTypeConfigFor,
    searchTypeConfigFromSearch,
    SearchTypeConfig,
    RendezVousDuJour,
    StatsCreneauxLieuxParJour,
    countCreneauxFromCreneauxParTag, TYPE_RECHERCHE_PAR_DEFAUT
} from "../state/State";
import {formatDistanceToNow, parseISO} from 'date-fns'
import { fr } from 'date-fns/locale'
import {Strings} from "../utils/Strings";
import {DEPARTEMENTS_LIMITROPHES} from "../utils/Departements";
import {TemplateResult} from "lit-html";
import {Analytics} from "../utils/Analytics";
import {LieuCliqueCustomEvent} from "../components/vmd-appointment-card.component";
import {delay, setDebouncedInterval} from "../utils/Schedulers";
import {ArrayBuilder} from "../utils/Arrays";
import {classMap} from "lit-html/directives/class-map";
import {CSS_Global} from "../styles/ConstructibleStyleSheets";
import {InfiniteScroll} from "../state/InfiniteScroll";
import {DisclaimerSeverity, RemoteConfig} from "../utils/RemoteConfig";

export abstract class AbstractVmdRdvView extends LitElement {
    DELAI_VERIFICATION_MISE_A_JOUR = 45000
    DELAI_VERIFICATION_SCROLL = 1000;
    SCROLL_OFFSET = 200;

    //language=css
    static styles = [
        CSS_Global,
        css`${unsafeCSS(rdvViewCss)}`,
        css`
          input[type=time] {
            line-height: 20px;
            width: 80px;
            font-size: 1.6rem;
          }

          .time-range {
            width: auto;
            display: inline-block;
            background-color: white;
            padding: 6px;
            border: 1px solid grey;
          }

          /* see https://css-tricks.com/value-bubbles-for-range-inputs/ */
          .range-wrap {
            position: relative;
            margin: 3rem auto 3rem;
          }
          .bubble {
            background: #5561d9;
            color: white;
            padding: 4px 12px;
            position: absolute;
            border-radius: 4px;
            left: 50%;
            top: 40px;
            transform: translateX(-50%);
          }
          .bubble::after {
            content: "";
            position: absolute;
            width: 2px;
            height: 2px;
            background: #5561d9;
            top: -1px;
            left: 50%;
          }
          
          /* see https://www.cssportal.com/style-input-range/ */
          input[type=range] {
            height: 26px;
            background-color: transparent;
            -webkit-appearance: none;
            margin: 10px 0;
            width: 100%;
          }
          input[type=range]:focus {
            outline: none;
          }
          input[type=range]::-webkit-slider-runnable-track {
            width: 100%;
            height: 14px;
            cursor: pointer;
            animate: 0.2s;
            box-shadow: 1px 1px 1px #5561d9;
            background: #5561d9;
            border-radius: 14px;
            border: 0px solid #000000;
          }
          input[type=range]::-webkit-slider-thumb {
            box-shadow: 0px 0px 0px #000000;
            border: 0px solid #000000;
            height: 20px;
            width: 40px;
            border-radius: 12px;
            background: white;
            cursor: pointer;
            -webkit-appearance: none;
            margin-top: -3px;
          }
          input[type=range]:focus::-webkit-slider-runnable-track {
            background: #5561d9;
          }
          input[type=range]::-moz-range-track {
            width: 100%;
            height: 14px;
            cursor: pointer;
            animate: 0.2s;
            box-shadow: 1px 1px 1px #5561d9;
            background: #5561d9;
            border-radius: 14px;
            border: 0px solid #000000;
          }
          input[type=range]::-moz-range-thumb {
            box-shadow: 0px 0px 0px #000000;
            border: 0px solid #000000;
            height: 20px;
            width: 40px;
            border-radius: 12px;
            background: white;
            cursor: pointer;
          }
          input[type=range]::-ms-track {
            width: 100%;
            height: 14px;
            cursor: pointer;
            animate: 0.2s;
            background: transparent;
            border-color: transparent;
            color: transparent;
          }
          input[type=range]::-ms-fill-lower {
            background: #5561d9;
            border: 0px solid #000000;
            border-radius: 28px;
            box-shadow: 1px 1px 1px #5561d9;
          }
          input[type=range]::-ms-fill-upper {
            background: #5561d9;
            border: 0px solid #000000;
            border-radius: 28px;
            box-shadow: 1px 1px 1px #5561d9;
          }
          input[type=range]::-ms-thumb {
            margin-top: 1px;
            box-shadow: 0px 0px 0px #000000;
            border: 0px solid #000000;
            height: 20px;
            width: 40px;
            border-radius: 12px;
            background: white;
            cursor: pointer;
          }
          input[type=range]:focus::-ms-fill-lower {
            background: #5561d9;
          }
          input[type=range]:focus::-ms-fill-upper {
            background: #5561d9;
          }
        `
    ];

    @internalProperty() lieuxParDepartementAffiches: LieuxAvecDistanceParDepartement | undefined = undefined;
    @internalProperty() creneauxQuotidiensAffiches: RendezVousDuJour[] = [];
    @property({type: Boolean, attribute: false}) searchInProgress: boolean = false;
    @property({type: Boolean, attribute: false}) miseAJourDisponible: boolean = false;
    @property({type: Array, attribute: false}) cartesAffichees: LieuAffichableAvecDistance[] = [];
    @internalProperty() lieuxParDepartement: LieuxParDepartement|undefined = undefined;
    @internalProperty() protected currentSearch: SearchRequest | undefined = undefined

    @internalProperty() jourSelectionne: {date: string, type: 'manual'|'auto'}|undefined = undefined;

    @internalProperty() disclaimerEnabled: boolean = false;
    @internalProperty() disclaimerMessage: string | undefined = undefined;
    @internalProperty() disclaimerSeverity: DisclaimerSeverity | undefined = undefined;

    protected derniereCommuneSelectionnee: Commune|undefined = undefined;

    protected lieuBackgroundRefreshIntervalId: ReturnType<typeof setTimeout>|undefined = undefined;
    private infiniteScroll = new InfiniteScroll();
    private infiniteScrollObserver: IntersectionObserver | undefined;

    constructor(private options: {
        codeDepartementAdditionnels: (codeDepartementSelectionne: CodeDepartement) => CodeDepartement[],
        criteresDeRechercheAdditionnels: () => TemplateResult
    }) {
        super();
    }

    get totalCreneaux() {
        if (!this.creneauxQuotidiensAffiches) {
            return 0;
        }
        return this.creneauxQuotidiensAffiches
            .reduce((total, rdvDuJour) => total+rdvDuJour.total, 0);
    }

    get daySelectorAvailable(): boolean {
        return !!this.lieuxParDepartement?.statsCreneauxLieuxQuotidiens.length && !!this.currentSearch && searchTypeConfigFor(this.currentSearch.type).jourSelectionnable;
    }

    get searchTypeConfig() {
        return searchTypeConfigFromSearch(this.currentSearch, TYPE_RECHERCHE_PAR_DEFAUT)
    }

    async onSearchSelected (event: CustomEvent<SearchRequest>) {
      const search = event.detail
      this.goToNewSearch(search)
    }

    protected async goToNewSearch (search: SearchRequest) {
      if (SearchRequest.isByDepartement(search)) {
        Router.navigateToRendezVousAvecDepartement(search.departement.code_departement, libelleUrlPathDuDepartement(search.departement), search.type);
      } else {
        const departements = await State.current.departementsDisponibles()
        const departement = departements.find(d => d.code_departement === search.commune.codeDepartement);
        const commune = search.commune
        Router.navigateToRendezVousAvecCommune(search.tri, commune.codeDepartement,
          libelleUrlPathDuDepartement(departement!), commune.code, commune.codePostal, libelleUrlPathDeCommune(commune), search.type)
      }
    }



    render() {
        const countLieuxDisponibles = (this.lieuxParDepartementAffiches?.lieuxDisponibles || []).length;
        const searchTypeConfig = this.searchTypeConfig;
        const standardMode = searchTypeConfig.standardTabSelected;
        const creneauxTotaux = this.totalCreneaux;

        return html`
            <div class="criteria-container text-dark rounded-3 py-5 bg-std">
              <div class="rdvForm-fields row align-items-center mb-3 mb-md-5">
                    <vmd-search
                          .value="${this.currentSearch}"
                          @on-search="${this.onSearchSelected}"
                    />
              </div>
              ${this.options.criteresDeRechercheAdditionnels()}
              ${false?html`
              <div class="rdvForm-fields row align-items-center mb-3 mb-md-5">
                <label for="searchAppointment-heures" class="col-sm-24 col-md-auto mb-md-1 label-for-search p-3 ps-1">
                  Horaires :
                </label>
                <div class="col">
                  <vmd-button-switch class="mb-3" style="display: inline-block"
                                     codeSelectionne="allDay"
                                     .options="${[{code:"allDay", libelle: "Toute la journée"}, {code:"horaire", libelle: "Plages horaires:"}]}">
                  </vmd-button-switch>
                  <div class="time-range"><input type="time" /> - <input type="time" /></div>
                  <div class="time-range"><input type="time" /> - <input type="time" /></div>
                  <button class="btn btn-primary">+</button>
                </div>
              </div>`:html``}
            </div>

            <div class="spacer mt-5 mb-5"></div>
            
            ${this.searchInProgress?html`
              <div class="d-flex justify-content-center">
                <div class="spinner-border text-primary" style="height: 50px; width: 50px" role="status">
                </div>
              </div>
            `:html`
                <h3 class="fw-normal text-center h4 search-standard"
                    style="${styleMap({display: (this.lieuxParDepartementAffiches) ? 'block' : 'none'})}">
                    ${creneauxTotaux.toLocaleString()} créneau${Strings.plural(creneauxTotaux, "x")} de vaccination trouvé${Strings.plural(creneauxTotaux)}
                    ${this.libelleLieuSelectionne()}
                  <br/>
                  ${(this.lieuxParDepartementAffiches && this.lieuxParDepartementAffiches.derniereMiseAJour) ?
                      html`
                      <p class="fs-6 text-gray-600">
                        Dernière mise à jour : il y a
                        ${ formatDistanceToNow(parseISO(this.lieuxParDepartementAffiches!.derniereMiseAJour), { locale: fr }) }
                        ${this.miseAJourDisponible?html`
                          <button class="btn btn-primary" @click="${() => { this.refreshLieux(); this.miseAJourDisponible = false; this.launchCheckingUpdates() }}">Rafraîchir</button>
                        `:html``}
                      </p>
                      <p class="alert ${this.disclaimerSeverity === 'error' ? 'alert-danger':'alert-warning'} fs-6 ${this.disclaimerEnabled ? '' : 'd-none'}">
                          <i class="bi vmdicon-attention-fill"></i>
                          ${this.disclaimerMessage}
                      </p>
                        `
                        : html``}
                  </h3>

                <div class="spacer mt-5 mb-5"></div>

                ${this.daySelectorAvailable?html`
                  <div class="resultats px-4 py-3 text-dark bg-light rounded-resultats-top mb-2">
                      <vmd-upcoming-days-selector
                            dateSelectionnee="${this.jourSelectionne?.date || ""}"
                            .creneauxQuotidiens="${this.creneauxQuotidiensAffiches}"
                            @jour-selectionne="${(event: CustomEvent<RendezVousDuJour>) => {
                        this.jourSelectionne = { date: event.detail.date, type: 'manual' };
                        Analytics.INSTANCE.clickSurJourRdv(this.jourSelectionne.date, this.jourSelectionne.type, event.detail.total);
                        this.rafraichirDonneesAffichees();
                    }}"></vmd-upcoming-days-selector>
                  </div>
                `:html``}
                <div class="resultats px-2 py-5 text-dark bg-light ${classMap({ 'rounded-resultats-top': !this.daySelectorAvailable })}">
                    ${countLieuxDisponibles ? html`
                        <h2 class="row align-items-center justify-content-center mb-5 h5 px-3">
                            <i class="bi vmdicon-calendar2-check-fill text-success me-2 fs-3 col-auto"></i>
                            <span class="col col-sm-auto">
                                ${countLieuxDisponibles} Lieu${Strings.plural(countLieuxDisponibles, 'x')} de vaccination avec des disponibilités
                            </span>
                        </h2>
                    ` : html`
                        <h2 class="row align-items-center justify-content-center mb-5 h5">
                          <i class="bi vmdicon-calendar-x-fill text-black-50 me-2 fs-3 col-auto"></i>
                          Aucun créneau de vaccination trouvé
                        </h2>
                        <div class="mb-5 container-content">
                          <p class="fst-italic">Nous n’avons pas trouvé de <strong>rendez-vous de vaccination</strong> Covid-19
                            sur les plateformes de réservation. </p>
                          <p class="fst-italic">Nous vous recommandons toutefois de vérifier manuellement
                            les rendez-vous de vaccination auprès des sites qui gèrent la réservation de créneau de vaccination.
                            Pour ce faire, cliquez sur le bouton “vérifier le centre de vaccination”.
                          </p>
                          <p class="fst-italic">Pour recevoir une notification quand de nouveaux créneaux seront disponibles,
                            nous vous invitons à utiliser les applications mobiles “Vite Ma Dose !” pour
                            <u><a href="https://play.google.com/store/apps/details?id=com.cvtracker.vmd2" target="_blank" rel="noopener">Android</a></u>
                            et <u><a href="http://apple.co/3dFMGy3" target="_blank" rel="noopener">iPhone</a></u>.
                          </p>
                        </div>
                    `}
                        <div id="scroller">
                            ${repeat(this.cartesAffichees || [],
                                       (c => `${c.departement}||${c.nom}||${c.plateforme}}`), 
                                       (lieu, index) => {
                                          return html`<vmd-appointment-card
                                    style="--list-index: ${index}"
                                    .lieu="${lieu}"
                                    theme="${searchTypeConfig.theme}"
                                    @prise-rdv-cliquee="${(event: LieuCliqueCustomEvent) => this.prendreRdv(event.detail.lieu)}"
                                    @verification-rdv-cliquee="${(event: LieuCliqueCustomEvent) =>  this.verifierRdv(event.detail.lieu)}"
                                />`;
                            })}
                            <div id="sentinel"></div>
                        </div>
                ${standardMode?html`
                <div class="eligibility-criteria fade-in-then-fade-out">
                    <p>Les critères d'éligibilité sont vérifiés lors de la prise de rendez-vous</p>
                </div>`:html``}
            `}
        `;
    }

    updated(changedProperties: PropertyValues) {
        super.updated(changedProperties);
        this.registerInfiniteScroll();
    }

    async connectedCallback() {
        super.connectedCallback();
        this.launchCheckingUpdates();
    }

    private registerInfiniteScroll() {
        if (!this.shadowRoot) {
            return;
        }

        const scroller = this.shadowRoot.querySelector('#scroller');
        const sentinel = this.shadowRoot.querySelector('#sentinel');

        if (!scroller || !sentinel) {
            return;
        }

        if (this.infiniteScrollObserver) {
            this.infiniteScrollObserver.disconnect();
        }
        this.infiniteScrollObserver = new IntersectionObserver(entries => {
            if (entries.some(entry => entry.isIntersecting)) {
                this.cartesAffichees = this.infiniteScroll.ajouterCartesPaginees(this.lieuxParDepartementAffiches,
                    this.cartesAffichees);
            }
        }, { root: null, rootMargin: '200px', threshold: 0.0 });
        if (sentinel) {
            this.infiniteScrollObserver.observe(sentinel);
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.stopCheckingUpdates();
        this.stopListeningToScroll();
    }

    stopCheckingUpdates() {
        if(this.lieuBackgroundRefreshIntervalId) {
            clearInterval(this.lieuBackgroundRefreshIntervalId);
            this.lieuBackgroundRefreshIntervalId = undefined;
        }
    }

    private stopListeningToScroll() {
        if (this.infiniteScrollObserver) {
            this.infiniteScrollObserver.disconnect();
        }
    }

    launchCheckingUpdates() {
        if(this.lieuBackgroundRefreshIntervalId === undefined) {
            this.lieuBackgroundRefreshIntervalId = setDebouncedInterval(async () => {
                const currentSearch = this.currentSearch
                if (currentSearch) {
                    const codeDepartement = SearchRequest.isByDepartement(currentSearch)
                        ? currentSearch.departement.code_departement
                        : currentSearch.commune.codeDepartement
                    const derniereMiseAJour = this.lieuxParDepartementAffiches?.derniereMiseAJour
                    const lieuxAJourPourDepartement = await State.current.lieuxPour([codeDepartement])
                    this.miseAJourDisponible = (derniereMiseAJour !== lieuxAJourPourDepartement.derniereMiseAJour);

                    // we stop the update check if there has been one
                    if (this.miseAJourDisponible) {
                        this.stopCheckingUpdates();
                    }
                    // Used only to refresh derniereMiseAJour's displayed relative time
                    await this.requestUpdate();
                }
            }, this.DELAI_VERIFICATION_MISE_A_JOUR);
        }
    }

    async refreshLieux() {
        const currentSearch = this.currentSearch
        if(currentSearch) {
            // FIXME move all of this to testable file
            const codeDepartement = SearchRequest.isByDepartement(currentSearch)
              ? currentSearch.departement.code_departement
              : currentSearch.commune.codeDepartement
            try {
                this.searchInProgress = true;
                await delay(1) // give some time (one tick) to render loader before doing the heavy lifting
                this.lieuxParDepartement = await State.current.lieuxPour([codeDepartement].concat(this.options.codeDepartementAdditionnels(codeDepartement)));

                this.rafraichirDonneesAffichees();

                const commune = SearchRequest.isByCommune(currentSearch) ? currentSearch.commune : undefined
                Analytics.INSTANCE.rechercheLieuEffectuee(
                    codeDepartement,
                    this.currentTri(),
                    currentSearch.type,
                    this.jourSelectionne?.type,
                    this.jourSelectionne?.date,
                    commune,
                    this.lieuxParDepartementAffiches);
            } finally {
                this.searchInProgress = false;
            }
        } else {
            this.lieuxParDepartementAffiches = undefined;
            this.cartesAffichees = [];
        }

        this.disclaimerEnabled = await RemoteConfig.INSTANCE.disclaimerEnabled();
        // Refresh only if needed
        if (this.disclaimerEnabled) {
            this.disclaimerMessage = await RemoteConfig.INSTANCE.disclaimerMessage();
            this.disclaimerSeverity = await RemoteConfig.INSTANCE.disclaimerSeverity();
        }
    }

    private autoSelectJourSelectionne(daySelectorAvailable: boolean) {
        if(daySelectorAvailable) {
            // On voit quel jour selectionner:
            // 1/ on essaie de conserver le même jour selectionné si possible
            // 2/ si pas possible (pas de créneau) on prend le premier jour dispo avec des créneaux
            // 3/ si pas possible (aucun jour avec des créneaux) aucun jour n'est sélectionné
            if(this.jourSelectionne) {
                const creneauxQuotidienSelectionnes = this.creneauxQuotidiensAffiches.find(cq => cq.date === this.jourSelectionne?.date);
                if(!creneauxQuotidienSelectionnes || creneauxQuotidienSelectionnes.total===0) {
                    this.jourSelectionne = undefined;
                }
            }
            if(!this.jourSelectionne) {
                this.jourSelectionne = {
                    date: this.creneauxQuotidiensAffiches.filter(dailyAppointments => dailyAppointments.total !== 0)[0]?.date,
                    type: 'auto'
                };
            }
        } else {
            this.jourSelectionne = undefined;
        }
    }

    rafraichirDonneesAffichees() {
        if(this.currentSearch && this.lieuxParDepartement) {
            const searchTypeConfig = searchTypeConfigFor(this.currentSearch.type);
            const lieuxMatchantCriteres = this.filtrerLieuxMatchantLesCriteres(this.lieuxParDepartement, this.currentSearch);
            // On calcule les créneaux quotidiens en fonction des lieux matchant les critères
            this.creneauxQuotidiensAffiches = this.filtrerCreneauxQuotidiensEnFonctionDesLieuxMatchantLesCriteres(this.lieuxParDepartement.statsCreneauxLieuxQuotidiens, lieuxMatchantCriteres, searchTypeConfig);

            let daySelectorAvailable = this.daySelectorAvailable;
            this.autoSelectJourSelectionne(daySelectorAvailable);

            // On calcule les lieux affichés en fonction du jour sélectionné
            const creneauxQuotidienSelectionnes = this.creneauxQuotidiensAffiches.find(cq => cq.date === this.jourSelectionne?.date);
            const creneauxParLieu = creneauxQuotidienSelectionnes?.creneauxParLieu || [];
            const lieuxMatchantCriteresAvecCountRdvMAJ = lieuxMatchantCriteres.map(l => ({
                ...l,
                appointment_count: searchTypeConfig.cardAppointmentsExtractor(l, daySelectorAvailable, creneauxParLieu)
            }));

            let lieuxDisponiblesAffiches = lieuxMatchantCriteresAvecCountRdvMAJ
                .filter(l => searchTypeConfig.lieuConsidereCommeDisponible(l, creneauxParLieu.find(cpl => cpl.lieu === l.internal_id)))
                .map(l => ({
                    ...l,
                    disponible: true
                }));
            let lieuxIndisponiblesAffiches = lieuxMatchantCriteresAvecCountRdvMAJ
                .filter(l => !searchTypeConfig.lieuConsidereCommeDisponible(l, creneauxParLieu.find(cpl => cpl.lieu === l.internal_id)))
                .map(l => ({
                    ...l,
                    disponible: false
                }));

            this.lieuxParDepartementAffiches = {
                derniereMiseAJour: this.lieuxParDepartement.derniereMiseAJour,
                codeDepartements: this.lieuxParDepartement.codeDepartements,
                lieuxMatchantCriteres: lieuxDisponiblesAffiches.concat(lieuxIndisponiblesAffiches),
                lieuxDisponibles: lieuxDisponiblesAffiches
            };

            this.cartesAffichees = this.infiniteScroll.ajouterCartesPaginees(this.lieuxParDepartementAffiches, []);
        }
      }

      private filtrerCreneauxQuotidiensEnFonctionDesLieuxMatchantLesCriteres(statsCreneauxLieuxParJours: StatsCreneauxLieuxParJour[], lieuxMatchantCriteres: LieuAffichableAvecDistance[], searchTypeConfig: SearchTypeConfig): RendezVousDuJour[] {
        const lieuIdsMatchantCriteres = lieuxMatchantCriteres.map(l => l.internal_id);
        return statsCreneauxLieuxParJours.map(statsCreneauxLieuxParJour => {
          const lieuxAvecCreneauxFromDailyStats = statsCreneauxLieuxParJour.statsCreneauxParLieu
                .map(scpl => ({ lieu: scpl.lieu, creneaux: countCreneauxFromCreneauxParTag(scpl.statsCreneauxParTag, searchTypeConfig.tagCreneau) }))
                .filter(result => result.creneaux > 0)

                const lieuxAvecCreneauxFiltres = lieuxAvecCreneauxFromDailyStats.filter(cpl => lieuIdsMatchantCriteres.includes(cpl.lieu));
            return {
              date: statsCreneauxLieuxParJour.date,
                total: lieuxAvecCreneauxFiltres.reduce((total, lac) => total + lac.creneaux, 0),
                creneauxParLieu: lieuxAvecCreneauxFiltres
            }
        });
    }

    private prendreRdv(lieu: Lieu) {
      if(this.currentSearch && SearchRequest.isByCommune(this.currentSearch) && lieu.url) {
            Analytics.INSTANCE.clickSurRdv(lieu, this.currentTri(), this.currentSearch.type, this.currentSearch.commune);
          }
        Router.navigateToUrlIfPossible(lieu.url);
    }

    private verifierRdv(lieu: Lieu) {
      if(this.currentSearch && SearchRequest.isByCommune(this.currentSearch) && lieu.url) {
            Analytics.INSTANCE.clickSurVerifRdv(lieu, this.currentTri(), this.currentSearch.type, this.currentSearch.commune);
        }
        Router.navigateToUrlIfPossible(lieu.url);
    }

    private currentTri(): CodeTriCentre|"unknown" {
      return this.currentSearch?this.currentSearch.tri:'unknown';
    }

    // FIXME move me to testable files
    protected extraireFormuleDeTri(lieu: LieuAffichableAvecDistance, tri: CodeTriCentre) {
        if(tri === 'date') {
            let firstLevelSort;
            if(lieu.appointment_by_phone_only && lieu.metadata.phone_number) {
                firstLevelSort = 2;
            } else if(lieu.url) {
                firstLevelSort = lieu.appointment_count !== 0 ? (lieu.prochain_rdv!==null? 0:1):3;
              } else {
                firstLevelSort = 4;
            }
            return `${firstLevelSort}__${Strings.padLeft(Date.parse(lieu.prochain_rdv!) || 0, 15, '0')}`;
        } else if(tri === 'distance') {
          let firstLevelSort;

          // Considering only 2 kind of sorting sections :
            // - the one with (potentially) available appointments (with url, or appointment by phone only)
            // - the one with unavailable appointments (without url, or with 0 available appointments)
            if(lieu.appointment_by_phone_only && lieu.metadata.phone_number) {
                firstLevelSort = 0;
              } else if(lieu.url) {
                firstLevelSort = lieu.appointment_count !== 0 ? 0:1;
              } else {
                firstLevelSort = 1;
              }

              return `${firstLevelSort}__${Strings.padLeft(Math.round(lieu.distance!*1000), 8, '0')}`;
        } else {
          throw new Error(`Unsupported tri : ${tri}`);
        }
    }

    protected updateSearchTypeTo(searchType: SearchType) {
        if(this.currentSearch) {
          this.goToNewSearch({
            ...this.currentSearch, type: searchType
          });
        }
    }

    abstract libelleLieuSelectionne(): TemplateResult;
    // FIXME move me to a testable file
    abstract filtrerLieuxMatchantLesCriteres(lieuxParDepartement: LieuxParDepartement, search: SearchRequest): LieuAffichableAvecDistance[];
}

@customElement('vmd-rdv-par-commune')
export class VmdRdvParCommuneView extends AbstractVmdRdvView {
    @internalProperty() protected currentSearch: SearchRequest.ByCommune | undefined = undefined
    @property({type: String}) set searchType(type: SearchType) {
      this._searchType = type
      this.updateCurrentSearch()
    }
    @property({type: String}) set codeCommuneSelectionne(code: string) {
      this._codeCommuneSelectionne = code
      this.updateCurrentSearch()
    }
    @property({type: String}) set codePostalSelectionne (code: string) {
      this._codePostalSelectionne = code
      this.updateCurrentSearch()
    }

    @internalProperty() private _searchType: SearchType | undefined = undefined;
    @internalProperty() private _codeCommuneSelectionne: string | undefined = undefined;
    @internalProperty() private _codePostalSelectionne: string | undefined = undefined;
    @internalProperty() private _distanceSelectionnee: number = 50;

    private currentSearchMarker = {}

    constructor() {
        super({
          codeDepartementAdditionnels: (codeDepartementSelectionne) => DEPARTEMENTS_LIMITROPHES[codeDepartementSelectionne],
            criteresDeRechercheAdditionnels: () => html`
            <div class="rdvForm-fields row align-items-center mb-3 mb-md-5">
            <label for="searchAppointment-distance" class="col-sm-24 col-md-auto mb-md-1 label-for-search p-3 ps-1">
            Distance :
            </label>
            <div class="px-0 col">
              <vmd-input-range-with-tooltip
                  id="searchAppointment-distance" codeSelectionne="${this._distanceSelectionnee}"
                  theme="${this.searchTypeConfig.theme}"
                  .options="${[
                    {code: 1, libelle:"<1km"}, {code: 2, libelle:"<2km"}, {code: 5, libelle:"<5km"},
                    {code: 10, libelle:"<10km"}, {code: 20, libelle:"<20km"}, {code: 50, libelle:"<50km"},
                    {code: 100, libelle:"<100km"}, {code: 150, libelle:"<150km"}
                  ]}"
                  @option-selected="${(e: CustomEvent<{value: number}>) => { this._distanceSelectionnee = e.detail.value; this.rafraichirDonneesAffichees(); }}"
              ></vmd-input-range-with-tooltip>
            </div>
          </div>
            `
        });
    }

    private async updateCurrentSearch() {
      if (this._codeCommuneSelectionne && this._codePostalSelectionne && this._searchType) {
        const marker = {}
        this.currentSearchMarker = marker
        await delay(20)
        if (this.currentSearchMarker !== marker) { return }
        const commune = await State.current.autocomplete.findCommune(this._codePostalSelectionne, this._codeCommuneSelectionne)
        if (commune) {
          this.currentSearch = SearchRequest.ByCommune(commune, this._searchType, this.jourSelectionne?.date)
          this.refreshLieux()
        }
      }
    }

    libelleLieuSelectionne(): TemplateResult {
        let nom = '???'
        if (this.currentSearch) {
          const commune = this.currentSearch.commune
          nom = `${commune.nom} (${commune.codePostal})`
        }
        return html`
          autour de
          <span class="fw-bold">${nom}</span>
        `
    }

    // FIXME move me to testable file
    filtrerLieuxMatchantLesCriteres(lieuxParDepartement: LieuxParDepartement, search: SearchRequest.ByCommune): LieuAffichableAvecDistance[] {
        const origin = search.commune
        const distanceAvec = (lieu: Lieu) => (lieu.location ? distanceEntreDeuxPoints(origin, lieu.location) : Infinity)

        const { lieuxDisponibles, lieuxIndisponibles } = lieuxParDepartement

        let lieuxAffichablesBuilder = ArrayBuilder.from([...lieuxDisponibles].map(l => ({...l, disponible: true})))
            .concat([...lieuxIndisponibles].map(l => ({...l, disponible: false})))
            .map(l => ({ ...l, distance: distanceAvec(l) })
            ).filter(l => (!l.distance || l.distance < this._distanceSelectionnee))
        if(this.searchTypeConfig.excludeAppointmentByPhoneOnly) {
            lieuxAffichablesBuilder.filter(l => !l.appointment_by_phone_only)
        }

        lieuxAffichablesBuilder.sortBy(l => this.extraireFormuleDeTri(l, 'distance'))

        const lieuxMatchantCriteres = lieuxAffichablesBuilder.build();
        return lieuxMatchantCriteres;
    }
}

@customElement('vmd-rdv-par-departement')
export class VmdRdvParDepartementView extends AbstractVmdRdvView {
    @property({type: String})
    set searchType (type: SearchType) {
      this._searchType = type
      this.updateCurrentSearch()
    }
    @property({type: String})
    set codeDepartementSelectionne (code: CodeDepartement) {
      this._codeDepartement = code
      this.updateCurrentSearch()
    }
    @internalProperty() private _searchType: SearchType | void = undefined
    @internalProperty() private _codeDepartement: CodeDepartement | void = undefined
    @internalProperty() protected currentSearch: SearchRequest.ByDepartement | undefined = undefined

    constructor() {
        super({
            codeDepartementAdditionnels: () => [],
            criteresDeRechercheAdditionnels: () => html``
        });
    }

    private async updateCurrentSearch() {
        const code = this._codeDepartement
        if (code && this._searchType) {
          const departements = await State.current.departementsDisponibles()
          const departementSelectionne = departements.find(d => d.code_departement === code);
          if (departementSelectionne) {
            this.currentSearch = SearchRequest.ByDepartement(departementSelectionne, this._searchType, this.jourSelectionne?.date)
            this.refreshLieux()
          }
        }
    }

    libelleLieuSelectionne(): TemplateResult {
        let nom = '???'
        if (this.currentSearch) {
          const departement = this.currentSearch.departement
          nom = `${departement.nom_departement} (${departement.code_departement})`
        }
        return html`
          pour
          <span class="fw-bold">${nom}</span>
        `
    }

    // FIXME move me to testable file
    filtrerLieuxMatchantLesCriteres(lieuxParDepartement: LieuxParDepartement /*, search: SearchRequest */): LieuAffichableAvecDistance[] {
        const { lieuxDisponibles, lieuxIndisponibles } = lieuxParDepartement

        let lieuxAffichablesBuilder = ArrayBuilder.from([...lieuxDisponibles].map(l => ({...l, disponible: true})))
            .concat([...lieuxIndisponibles].map(l => ({...l, disponible: false})))
            .map(l => ({ ...l, distance: undefined }))

        if(this.searchTypeConfig.excludeAppointmentByPhoneOnly) {
            lieuxAffichablesBuilder.filter(l => !l.appointment_by_phone_only)
        }

        lieuxAffichablesBuilder.sortBy(l => this.extraireFormuleDeTri(l, 'distance'))

        const lieuxMatchantCriteres = lieuxAffichablesBuilder.build();
        return lieuxMatchantCriteres;
    }
}
