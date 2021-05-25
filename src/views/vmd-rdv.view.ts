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
   SearchRequest, SearchType,
    State,
    CodeTriCentre,
    StatsCreneauxQuotidien,
    RendezVousDuJour,
    searchTypeConfigFor,
    searchTypeConfigFromSearch
} from "../state/State";
import {formatDistanceToNow, parseISO, startOfDay} from 'date-fns'
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

const MAX_DISTANCE_CENTRE_IN_KM = 100;

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

    @property({type: Array, attribute: false}) lieuxParDepartementAffiches: LieuxAvecDistanceParDepartement | undefined = undefined;
    @property({type: Boolean, attribute: false}) searchInProgress: boolean = false;
    @property({type: Boolean, attribute: false}) miseAJourDisponible: boolean = false;
    @property({type: Array, attribute: false}) cartesAffichees: LieuAffichableAvecDistance[] = [];
    @internalProperty() lieuxParDepartement: LieuxParDepartement|undefined = undefined;
    @internalProperty() protected currentSearch: SearchRequest | void = undefined

    @internalProperty() rdvsDuJourSelectionne: RendezVousDuJour | undefined = undefined;

    protected derniereCommuneSelectionnee: Commune|undefined = undefined;

    protected lieuBackgroundRefreshIntervalId: ReturnType<typeof setTimeout>|undefined = undefined;
    private infiniteScroll = new InfiniteScroll();
    private infiniteScrollObserver: IntersectionObserver | undefined;

    get totalCreneaux() {
        if (!this.lieuxParDepartementAffiches) {
            return 0;
        }
        return this.lieuxParDepartementAffiches
            .lieuxAffichables
            .reduce((total, lieu) => total+lieu.appointment_count, 0);
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
        const searchTypeConfig = searchTypeConfigFromSearch(this.currentSearch, 'standard');
        const standardMode = searchTypeConfig.standardTabSelected;

        return html`
            <div class="criteria-container text-dark rounded-3 py-5 ${classMap({'bg-std': SearchRequest.isStandardType(this.currentSearch), 'bg-highlighted': !SearchRequest.isStandardType(this.currentSearch)})}">
              <div class="rdvForm-fields row align-items-center mb-3 mb-md-5">
                    <vmd-search
                          .value="${this.currentSearch}"
                          @on-search="${this.onSearchSelected}"
                    />
              </div>
              ${standardMode?html`
              <div class="rdvForm-fields row align-items-center">
                <label class="col-sm-24 col-md-auto mb-md-3">
                  Type de vaccin :
                </label>
                <div class="col">
                  <vmd-button-switch class="mb-3"
                                     codeSelectionne="18-55"
                                     .options="${[{code:"18-55", libelle: "Préconisé pour les 18-55 ans"}, {code:"tous", libelle: "Tous"}]}">
                  </vmd-button-switch>
                </div>
              </div>`:html``}
              <div class="rdvForm-fields row align-items-center mb-3 mb-md-5">
                <label for="searchAppointment-distance" class="col-sm-24 col-md-auto mb-md-1 label-for-search p-3 ps-1">
                  Distance :
                </label>
                <div class="px-0 col">
                  <vmd-input-range-with-tooltip
                      id="searchAppointment-distance" codeSelectionne="2km"
                      .options="${[
                          {code: 1, libelle:"<1km"}, {code: 2, libelle:"<2km"}, {code: 5, libelle:"<5km"},
                          {code: 10, libelle:"<10km"}, {code: 20, libelle:"<20km"}, {code: 50, libelle:"<50km"},
                          {code: 100, libelle:"<100km"}, {code: 150, libelle:"<150km"}
                      ]}"
                      @option-selected="${(e: CustomEvent<{value: number|undefined}>) => console.log(`Option sélectionnée : ${e.detail.value}`)}"
                  ></vmd-input-range-with-tooltip>
                </div>
              </div>
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
              ${this.lieuxParDepartement?.creneauxQuotidiens && searchTypeConfig.jourSelectionnable?html`
                <vmd-upcoming-days-selector
                    start="${startOfDay(new Date()).toISOString().substring(0, 10)}"
                    dateSelectionnee="${this.rdvsDuJourSelectionne?.date || ""}"
                    .statsCreneauxQuotidien="${this.lieuxParDepartement.creneauxQuotidiens}"
                    .dailyAppointmentExtractor="${this.currentSearch?searchTypeConfigFor(this.currentSearch.type).dailyAppointmentsExtractor:()=>0}"
                    @jour-selectionne="${(event: CustomEvent<StatsCreneauxQuotidien>) => this.jourSelectionne(event.detail) }"
                ></vmd-upcoming-days-selector>`:html``}

                <h3 class="fw-normal text-center h4 ${classMap({ 'search-highlighted': !SearchRequest.isStandardType(this.currentSearch), 'search-standard': SearchRequest.isStandardType(this.currentSearch) })}"
                    style="${styleMap({display: (this.lieuxParDepartementAffiches) ? 'block' : 'none'})}">
                    ${this.totalCreneaux.toLocaleString()} créneau${Strings.plural(this.totalCreneaux, "x")} de vaccination trouvé${Strings.plural(this.totalCreneaux)}
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
                      <p class="alert alert-warning fs-6">
                          <i class="bi vmdicon-attention-fill"></i>
                          Les plateformes sont très sollicitées, les données affichées par Vite Ma Dose peuvent avoir jusqu'à 15 minutes de retard pour Doctolib.
                      </p>
                        `
                        : html``}
                  </h3>

                <div class="spacer mt-5 mb-5"></div>
                <div class="resultats px-2 py-5 text-dark bg-light rounded-3">
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

    async jourSelectionne(statJourSelectionne: StatsCreneauxQuotidien) {
        this.rdvsDuJourSelectionne = await State.current.rdvDuJour(statJourSelectionne);
        await this.refreshLieux();
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

    abstract codeDepartementAdditionnels(codeDepartementSelectionne: CodeDepartement): CodeDepartement[]

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
                this.lieuxParDepartement = await State.current.lieuxPour([codeDepartement].concat(this.codeDepartementAdditionnels(codeDepartement)));

                if(!this.rdvsDuJourSelectionne) {
                    const dailyAppointmentsExtractor = searchTypeConfigFor(currentSearch.type).dailyAppointmentsExtractor;
                    // Pre-selecting first date having appointments
                    const statsPremierJourAvecCreneaux = this.lieuxParDepartement.creneauxQuotidiens.reduce((statTrouvee, stat) => {
                        return statTrouvee || (dailyAppointmentsExtractor(stat) !== 0?  stat : undefined);
                    }, undefined as StatsCreneauxQuotidien|undefined);
                    if(statsPremierJourAvecCreneaux) {
                        this.rdvsDuJourSelectionne = await State.current.rdvDuJour(statsPremierJourAvecCreneaux);
                    }
                }

                this.lieuxParDepartementAffiches = this.afficherLieuxParDepartement(this.lieuxParDepartement, currentSearch);
                this.cartesAffichees = this.infiniteScroll.ajouterCartesPaginees(this.lieuxParDepartementAffiches, []);

                const commune = SearchRequest.isByCommune(currentSearch) ? currentSearch.commune : undefined
                Analytics.INSTANCE.rechercheLieuEffectuee(
                    codeDepartement,
                    this.currentTri(),
                    currentSearch.type,
                    commune,
                    this.lieuxParDepartementAffiches);
            } finally {
                this.searchInProgress = false;
            }
        } else {
            this.lieuxParDepartementAffiches = undefined;
            this.cartesAffichees = [];
        }
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
    abstract afficherLieuxParDepartement(lieuxParDepartement: LieuxParDepartement, search: SearchRequest): LieuxAvecDistanceParDepartement;
}

@customElement('vmd-rdv-par-commune')
export class VmdRdvParCommuneView extends AbstractVmdRdvView {
    @internalProperty() protected currentSearch: SearchRequest.ByCommune | void = undefined
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
    private currentSearchMarker = {}

    private async updateCurrentSearch() {
      if (this._codeCommuneSelectionne && this._codePostalSelectionne && this._searchType) {
        const marker = {}
        this.currentSearchMarker = marker
        await delay(20)
        if (this.currentSearchMarker !== marker) { return }
        const commune = await State.current.autocomplete.findCommune(this._codePostalSelectionne, this._codeCommuneSelectionne)
        if (commune) {
          this.currentSearch = SearchRequest.ByCommune(commune, this._searchType, this.rdvsDuJourSelectionne?.date)
          this.refreshLieux()
        }
      }
    }

    codeDepartementAdditionnels(codeDepartementSelectionne: CodeDepartement) {
        return DEPARTEMENTS_LIMITROPHES[codeDepartementSelectionne];
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
    afficherLieuxParDepartement(lieuxParDepartement: LieuxParDepartement, search: SearchRequest.ByCommune): LieuxAvecDistanceParDepartement {
        const origin = search.commune
        const distanceAvec = (lieu: Lieu) => (lieu.location ? distanceEntreDeuxPoints(origin, lieu.location) : Infinity)


        const { lieuxDisponibles, lieuxIndisponibles } = lieuxParDepartement

        let lieuxAffichablesBuilder = ArrayBuilder.from([...lieuxDisponibles].map(l => ({...l, disponible: true})))
            .concat([...lieuxIndisponibles].map(l => ({...l, disponible: false})))
            .map(l => ({
                ...l,
                distance: distanceAvec(l),
                appointment_count: searchTypeConfigFor(search.type).cardAppointmentsExtractor(l, this.rdvsDuJourSelectionne?.lieux.find(cpl => cpl.id === l.internal_id))
            })).filter(l =>
                (!l.distance || l.distance < MAX_DISTANCE_CENTRE_IN_KM)
                && (!this.rdvsDuJourSelectionne || this.rdvsDuJourSelectionne.lieux.map(_l => _l.id).includes(l.internal_id))
            )
        if(searchTypeConfigFromSearch(this.currentSearch, 'standard').excludeAppointmentByPhoneOnly) {
            lieuxAffichablesBuilder.filter(l => !l.appointment_by_phone_only)
        }

        lieuxAffichablesBuilder.sortBy(l => this.extraireFormuleDeTri(l, 'distance'))

        const lieuxAffichables = lieuxAffichablesBuilder.build();
        return {
            ...lieuxParDepartement,
            lieuxAffichables,
            lieuxDisponibles: searchTypeConfigFromSearch(this.currentSearch, 'standard').filterLieuxDisponibles(lieuxAffichables)
        };
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
    @internalProperty() protected currentSearch: SearchRequest.ByDepartement | void = undefined

    private async updateCurrentSearch() {
        const code = this._codeDepartement
        if (code && this._searchType) {
          const departements = await State.current.departementsDisponibles()
          const departementSelectionne = departements.find(d => d.code_departement === code);
          if (departementSelectionne) {
            this.currentSearch = SearchRequest.ByDepartement(departementSelectionne, this._searchType, this.rdvsDuJourSelectionne?.date)
            this.refreshLieux()
          }
        }
    }

    codeDepartementAdditionnels () {
        return []
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
    afficherLieuxParDepartement(lieuxParDepartement: LieuxParDepartement, search: SearchRequest): LieuxAvecDistanceParDepartement {
        const { lieuxDisponibles, lieuxIndisponibles } = lieuxParDepartement

        let lieuxAffichablesBuilder = ArrayBuilder.from([...lieuxDisponibles].map(l => ({...l, disponible: true})))
            .concat([...lieuxIndisponibles].map(l => ({...l, disponible: false})))
            .map(l => ({
                ...l,
                distance: undefined,
                appointment_count: searchTypeConfigFor(search.type).cardAppointmentsExtractor(l, this.rdvsDuJourSelectionne?.lieux.find(cpl => cpl.id === l.internal_id))
            })).filter(l =>
                (!this.rdvsDuJourSelectionne || this.rdvsDuJourSelectionne.lieux.map(_l => _l.id).includes(l.internal_id))
            )

        if(searchTypeConfigFromSearch(this.currentSearch, 'standard').excludeAppointmentByPhoneOnly) {
            lieuxAffichablesBuilder.filter(l => !l.appointment_by_phone_only)
        }

        lieuxAffichablesBuilder.sortBy(l => this.extraireFormuleDeTri(l, 'distance'))

        const lieuxAffichables = lieuxAffichablesBuilder.build();

        return {
            ...lieuxParDepartement,
            lieuxAffichables,
            lieuxDisponibles: searchTypeConfigFromSearch(this.currentSearch, 'standard').filterLieuxDisponibles(lieuxAffichables)
        };
    }

    currentCritereTri(): CodeTriCentre {
        return 'date';
    }
}
