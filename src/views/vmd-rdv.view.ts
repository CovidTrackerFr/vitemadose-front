import {
    css,
    customElement,
    html,
    LitElement,
    property, PropertyValues, query,
    unsafeCSS
} from 'lit-element';
import {repeat} from "lit-html/directives/repeat";
import {styleMap} from "lit-html/directives/style-map";
import {Router} from "../routing/Router";
import rdvViewCss from "./vmd-rdv.view.scss";
import distanceEntreDeuxPoints from "../distance"
import {
    CodeDepartement,
    CodeTriCentre,
    Commune,
    Departement,
    libelleUrlPathDeCommune,
    libelleUrlPathDuDepartement,
    Lieu, LieuAffichableAvecDistance, LieuxAvecDistanceParDepartement,
    LieuxParDepartement, SearchType,
    State,
    TRIS_CENTRE
} from "../state/State";
import {Dates} from "../utils/Dates";
import {Strings} from "../utils/Strings";
import {
    ValueStrCustomEvent,
    AutocompleteTriggered,
    CommuneSelected, DepartementSelected, VmdCommuneOrDepartmentSelectorComponent
} from "../components/vmd-commune-or-departement-selector.component";
import {DEPARTEMENTS_LIMITROPHES} from "../utils/Departements";
import {TemplateResult} from "lit-html";
import {Analytics} from "../utils/Analytics";
import {LieuCliqueCustomEvent} from "../components/vmd-appointment-card.component";
import {setDebouncedInterval} from "../utils/Schedulers";
import {ArrayBuilder} from "../utils/Arrays";
import {classMap} from "lit-html/directives/class-map";
import {CSS_Global} from "../styles/ConstructibleStyleSheets";
import tippy from 'tippy.js';

const MAX_DISTANCE_CENTRE_IN_KM = 100;

export abstract class AbstractVmdRdvView extends LitElement {

    //language=css
    static styles = [
        CSS_Global,
        css`${unsafeCSS(rdvViewCss)}`,
        css`
        `
    ];

    @property({type: String}) codeDepartementSelectionne: CodeDepartement | undefined = undefined;
    @property({type: String}) searchType: SearchType = "standard";

    @property({type: Array, attribute: false}) communesAutocomplete: Set<string>|undefined = undefined;
    @property({type: Array, attribute: false}) recuperationCommunesEnCours: boolean = false;

    @property({type: Array, attribute: false}) communesDisponibles: Commune[]|undefined = undefined;
    @property({type: Array, attribute: false}) departementsDisponibles: Departement[] = [];

    @property({type: Array, attribute: false}) lieuxParDepartementAffiches: LieuxAvecDistanceParDepartement | undefined = undefined;
    @property({type: Boolean, attribute: false}) searchInProgress: boolean = false;
    @property({type: Boolean, attribute: false}) miseAJourDisponible: boolean = false;

    @query("#chronodose-label") $chronodoseLabel!: HTMLSpanElement;

    protected derniereCommuneSelectionnee: Commune|undefined = undefined;
    protected lieuBackgroundRefreshIntervalId: number|undefined = undefined;


    get communeSelectionnee(): Commune|undefined {
        if(this.derniereCommuneSelectionnee) {
            return this.derniereCommuneSelectionnee;
        }

        // Calling a non-getter as getter overriden methods don't seem to be able to call
        // super.departementSelectionne
        return this.getCommuneSelectionnee();
    }

    get departementSelectionne(): Departement|undefined {
        // Calling a non-getter as getter overriden methods don't seem to be able to call
        // super.departementSelectionne
        return this.getDepartementSelectionne();
    }

    resetCommuneSelectionneeTo(commune: Commune|undefined) {
        this.derniereCommuneSelectionnee = commune;
    }

    protected getDepartementSelectionne(): Departement|undefined {
        if(this.codeDepartementSelectionne && this.departementsDisponibles) {
            return this.departementsDisponibles.find(d => this.codeDepartementSelectionne === d.code_departement);
        }

        return undefined;
    }

    protected getCodeCommuneSelectionne(): string|undefined {
        if(!this.communeSelectionnee) {
            return undefined;
        }
        return this.communeSelectionnee.code;
    }

    protected getCommuneSelectionnee(): Commune|undefined {
        return undefined;
    }

    get totalCreneaux() {
        if (!this.lieuxParDepartementAffiches) {
            return 0;
        }
        return this.lieuxParDepartementAffiches
            .lieuxAffichables
            .reduce((total, lieu) => total+lieu.appointment_count, 0);
    }

    async communeAutocompleteTriggered(autocomplete: string) {
        this.recuperationCommunesEnCours = true;
        this.communesDisponibles = await State.current.communesPourAutocomplete(Router.basePath, autocomplete);
        this.recuperationCommunesEnCours = false;
        this.requestUpdate('communesDisponibles')
    }

    async communeSelected(commune: Commune, triggerNavigation: boolean): Promise<void> {
        if(!this.communeSelectionnee) {
            this.derniereCommuneSelectionnee = commune;

            const departement = this.departementsDisponibles.find(d => d.code_departement === commune.codeDepartement);
            Router.navigateToRendezVousAvecCommune('distance',
                commune.codeDepartement,
                libelleUrlPathDuDepartement(departement!),
                commune.code,
                commune.codePostal,
                libelleUrlPathDeCommune(commune),
                this.searchType
            );
            return;
        }

        if(`${this.communeSelectionnee.code}-${this.communeSelectionnee.codePostal}` !== `${commune.code}-${commune.codePostal}` || this.codeDepartementSelectionne !== commune.codeDepartement) {
            this.codeDepartementSelectionne = commune.codeDepartement;
            this.resetCommuneSelectionneeTo(commune);

            if(triggerNavigation) {
                this.refreshPageWhenValidParams();
            }
        }

        return Promise.resolve();
    }

    async departementSelected(departement: Departement, triggerNavigation: boolean): Promise<void> {
        if(this.communeSelectionnee) {
            Router.navigateToRendezVousAvecDepartement(departement.code_departement, libelleUrlPathDuDepartement(departement), this.searchType);
            return;
        }

        if(departement.code_departement !== this.codeDepartementSelectionne) {
            this.codeDepartementSelectionne = departement.code_departement;

            if(triggerNavigation) {
                this.refreshPageWhenValidParams();
            }
        }

        return Promise.resolve();
    }

    render() {
        const lieuxDisponibles = (this.lieuxParDepartementAffiches && this.lieuxParDepartementAffiches.lieuxAffichables)?
            this.lieuxParDepartementAffiches.lieuxAffichables.filter(l => {
                if(this.searchType === 'chronodose') {
                    return l.appointment_count > 0;
                } else /* if(this.searchType === 'standard') */ {
                    return l.disponible;
                }
            }):[];

        return html`
            <div class="criteria-container text-dark rounded-3 pb-3 ${classMap({'bg-std': this.searchType==='standard', 'bg-chronodose': this.searchType==='chronodose'})}">
              <ul class="p-0 d-flex flex-row mb-5 bg-white fs-5">
                <li class="col bg-std text-std tab ${classMap({selected: this.searchType==='standard'})}" @click="${() => this.updateSearchTypeTo('standard')}">
                  Tous les créneaux
                </li>
                <li class="col bg-chronodose text-chronodose tab ${classMap({selected: this.searchType==='chronodose'})}" @click="${() => this.updateSearchTypeTo('chronodose')}">
                  <span id="chronodose-label" title="Les chronodoses sont des doses de vaccin réservables à court terme sans critères d'éligibilité">Chronodoses<i class="bi vmdicon-help-circled"></i> uniquement</span>
                </li>
              </ul>
              <div class="rdvForm-fields row align-items-center mb-3 mb-md-5">
                    <label class="col-sm-24 col-md-auto">
                      Localisation :
                    </label>
                    <div class="col">
                        <vmd-commune-or-departement-selector class="mb-3"
                              @autocomplete-triggered="${(event: CustomEvent<AutocompleteTriggered>) => this.communeAutocompleteTriggered(event.detail.value)}"
                              @on-commune-selected="${(event: CustomEvent<CommuneSelected>) => this.communeSelected(event.detail.commune, true)}"
                              @on-departement-selected="${(event: CustomEvent<DepartementSelected>) => this.departementSelected(event.detail.departement, true)}"
                              codeCommuneSelectionne="${this.getCodeCommuneSelectionne()}"
                              .departementsDisponibles="${this.departementsDisponibles}"
                              .autocompleteTriggers="${this.communesAutocomplete}"
                              .communesDisponibles="${this.communesDisponibles}"
                              .recuperationCommunesEnCours="${this.recuperationCommunesEnCours}"
                        >
                        </vmd-commune-or-departement-selector>
                    </div>
                </div>
                ${this.renderAdditionnalSearchCriteria()}
            </div>

            <div class="spacer mt-5 mb-5"></div>

            ${this.searchInProgress?html`
              <div class="d-flex justify-content-center">
                <div class="spinner-border text-primary" style="height: 50px; width: 50px" role="status">
                </div>
              </div>
            `:html`
                <h3 class="fw-normal text-center h4" style="${styleMap({display: (this.codeDepartementSelectionne) ? 'block' : 'none'})}">
                  ${this.totalCreneaux.toLocaleString()} créneau${Strings.plural(this.totalCreneaux, "x")} de vaccination trouvé${Strings.plural(this.totalCreneaux)}
                  ${this.libelleLieuSelectionne()}
                  <br/>
                  ${(this.lieuxParDepartementAffiches && this.lieuxParDepartementAffiches.derniereMiseAJour) ?
                      html`
                      <span class="fs-6 text-black-50">
                        Dernière mise à jour : il y a
                        ${Dates.formatDurationFromNow(this.lieuxParDepartementAffiches!.derniereMiseAJour)}
                        ${this.miseAJourDisponible?html`
                          <button class="btn btn-primary" @click="${() => { this.refreshLieux(); this.miseAJourDisponible = false; }}">Rafraîchir</button>
                        `:html``}
                      </span>`
                      : html``}
                </h3>

                <div class="spacer mt-5 mb-5"></div>
                <div class="resultats px-2 py-5 text-dark bg-light rounded-3">
                    ${lieuxDisponibles.length ? html`
                        <h2 class="row align-items-center justify-content-center mb-5 h5 px-3">
                            <i class="bi vmdicon-calendar2-check-fill text-success me-2 fs-3 col-auto"></i>
                            <span class="col col-sm-auto">
                                ${lieuxDisponibles.length} Lieu${Strings.plural(lieuxDisponibles.length, 'x')} de vaccination avec des disponibilités
                            </span>
                        </h2>
                    ` : html`
                        <h2 class="row align-items-center justify-content-center mb-5 h5">
                          <i class="bi vmdicon-calendar-x-fill text-black-50 me-2 fs-3 col-auto"></i>
                          <span class="col col-sm-auto">
                            Aucun créneau de vaccination trouvé
                          </span>
                        </h2>
                        <div class="px-3 mb-5">
                          <em>Nous n’avons pas trouvé de <strong>rendez-vous de vaccination</strong> Covid-19
                            sur les plateformes de réservation. Nous vous recommandons toutefois de vérifier manuellement
                            les rendez-vous de vaccination auprès des sites qui gèrent la réservation de créneau de vaccination.
                            Pour ce faire, cliquez sur le bouton “vérifier le centre de vaccination”.</em>
                        </div>
                    `}

                    ${repeat(this.lieuxParDepartementAffiches?this.lieuxParDepartementAffiches.lieuxAffichables:[], (c => `${c.departement}||${c.nom}||${c.plateforme}}`), (lieu, index) => {
                        return html`<vmd-appointment-card
                            style="--list-index: ${index}"
                            .lieu="${lieu}"
                            theme="${this.searchType}"
                            .highlightable="${this.searchType === 'chronodose'}"
                            @prise-rdv-cliquee="${(event: LieuCliqueCustomEvent) => this.prendreRdv(event.detail.lieu)}"
                            @verification-rdv-cliquee="${(event: LieuCliqueCustomEvent) =>  this.verifierRdv(event.detail.lieu)}"
                        />`;
                    })}
                </div>
                ${this.searchType==='standard'?html`
                <div class="eligibility-criteria fade-in-then-fade-out">
                    <p>Les critères d'éligibilité sont vérifiés lors de la prise de rendez-vous</p>
                </div>`:html``}
            `}
        `;
    }

    updated(changedProperties: PropertyValues) {
        super.updated(changedProperties);
        tippy(this.$chronodoseLabel, {
            content: (el) => el.getAttribute('title')!
        })
    }


    abstract onCommuneAutocompleteLoaded(autocompletes: Set<string>): Promise<void>

    async onceStartupPromiseResolved() {
        // to be overriden
    }

    async connectedCallback() {
        super.connectedCallback();

        await Promise.all([
            State.current.departementsDisponibles(),
            State.current.communeAutocompleteTriggers(Router.basePath)
        ]).then(async ([departementsDisponibles, autocompletes]: [Departement[], string[]]) => {
            this.departementsDisponibles = departementsDisponibles;

            this.communesAutocomplete = new Set(autocompletes);
            await this.onCommuneAutocompleteLoaded(this.communesAutocomplete);
        });

        await this.onceStartupPromiseResolved();
        await this.refreshLieux();

        this.lieuBackgroundRefreshIntervalId = setDebouncedInterval(async () => {
            if(this.codeDepartementSelectionne) {
                const derniereMiseAJour = this.lieuxParDepartementAffiches?this.lieuxParDepartementAffiches.derniereMiseAJour:undefined;
                const lieuxAJourPourDepartement = await State.current.lieuxPour(this.codeDepartementSelectionne, true)
                this.miseAJourDisponible = (derniereMiseAJour !== lieuxAJourPourDepartement.derniereMiseAJour);

                // Used only to refresh derniereMiseAJour's displayed relative time
                await this.requestUpdate();
            }
        }, 45000);
    }

    preventRafraichissementLieux(): boolean {
        // overridable
        return false;
    }

    abstract codeDepartementAdditionnels(codeDepartementSelectionne: CodeDepartement): CodeDepartement[]

    async refreshLieux() {
        if(this.codeDepartementSelectionne && !this.preventRafraichissementLieux()) {
            try {
                this.searchInProgress = true;
                const [lieuxDepartement, ...lieuxDepartementsLimitrophes] = await Promise.all([
                    State.current.lieuxPour(this.codeDepartementSelectionne),
                    ...this.codeDepartementAdditionnels(this.codeDepartementSelectionne).map(dept => State.current.lieuxPour(dept))
                ]);

                const lieuxParDepartement = [lieuxDepartement].concat(lieuxDepartementsLimitrophes).reduce((mergedLieuxParDepartement, lieuxParDepartement) => ({
                    codeDepartements: mergedLieuxParDepartement.codeDepartements.concat(lieuxParDepartement.codeDepartements),
                    derniereMiseAJour: mergedLieuxParDepartement.derniereMiseAJour,
                    lieuxDisponibles: mergedLieuxParDepartement.lieuxDisponibles.concat(lieuxParDepartement.lieuxDisponibles),
                    lieuxIndisponibles: mergedLieuxParDepartement.lieuxIndisponibles.concat(lieuxParDepartement.lieuxIndisponibles),
                }), {
                    codeDepartements: [],
                    derniereMiseAJour: lieuxDepartement.derniereMiseAJour,
                    lieuxDisponibles: [],
                    lieuxIndisponibles: []
                } as LieuxParDepartement);

                this.lieuxParDepartementAffiches = this.afficherLieuxParDepartement(lieuxParDepartement);
                if(this.searchType === 'chronodose') {
                    this.lieuxParDepartementAffiches.lieuxAffichables = this.lieuxParDepartementAffiches.lieuxAffichables.filter(l => {
                        return !l.appointment_by_phone_only
                    })
                }

                Analytics.INSTANCE.rechercheLieuEffectuee(
                    this.codeDepartementSelectionne,
                    this.communeSelectionnee,
                    this.lieuxParDepartementAffiches);
            } finally {
                this.searchInProgress = false;
            }
        } else {
            this.lieuxParDepartementAffiches = undefined;
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();

        if(this.lieuBackgroundRefreshIntervalId) {
            clearInterval(this.lieuBackgroundRefreshIntervalId);
            this.lieuBackgroundRefreshIntervalId = undefined;
        }
    }

    _onRefreshPageWhenValidParams(): "return"|"continue" {
        // To be overriden

        return "continue";
    }

    protected refreshPageWhenValidParams() {
        this.refreshLieux();

        if(this._onRefreshPageWhenValidParams() === 'return') {
            return;
        }

        if (this.codeDepartementSelectionne) {
            Router.navigateToRendezVousAvecDepartement(this.codeDepartementSelectionne, libelleUrlPathDuDepartement(this.departementSelectionne!), this.searchType);
        }
    }

    private prendreRdv(lieu: Lieu) {
        if(lieu.url) {
            Analytics.INSTANCE.clickSurRdv(lieu);
        }
        Router.navigateToUrlIfPossible(lieu.url);
    }

    private verifierRdv(lieu: Lieu) {
        if(lieu.url) {
            Analytics.INSTANCE.clickSurVerifRdv(lieu);
        }
        Router.navigateToUrlIfPossible(lieu.url);
    }

    renderAdditionnalSearchCriteria(): TemplateResult {
        return html``;
    }

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
        this.searchType = searchType;
    }

    protected transformLieuEnFonctionDuTypeDeRecherche(lieu: LieuAffichableAvecDistance) {
        if(this.searchType === 'chronodose') {
            return {...lieu, appointment_count: ((!lieu.appointment_schedules?.length)?[]:lieu.appointment_schedules)?.find(s => s.name === 'chronodose')?.total || 0 };
        } else /* if(this.searchType === 'standard') */ {
            return lieu;
        }
    }

    abstract libelleLieuSelectionne(): TemplateResult;
    abstract afficherLieuxParDepartement(lieuxParDepartement: LieuxParDepartement): LieuxAvecDistanceParDepartement;

}

@customElement('vmd-rdv-par-commune')
export class VmdRdvParCommuneView extends AbstractVmdRdvView {
    @property({type: String}) codeCommuneSelectionne: string | undefined = undefined;
    @property({type: String}) codePostalSelectionne: string | undefined = undefined;

    @property({type: String}) critèreDeTri: 'date' | 'distance' = 'distance'

    preventRafraichissementLieux() {
        return !this.communeSelectionnee;
    }

    codeDepartementAdditionnels(codeDepartementSelectionne: CodeDepartement) {
        return DEPARTEMENTS_LIMITROPHES[codeDepartementSelectionne];
    }

    protected getDepartementSelectionne(): Departement|undefined {
        let communeSelectionnee = this.communeSelectionnee;
        if(communeSelectionnee && this.departementsDisponibles) {
            return this.departementsDisponibles.find(d => communeSelectionnee!.codeDepartement === d.code_departement);
        }

        return super.getDepartementSelectionne();
    }

    _onRefreshPageWhenValidParams() {
        // To be overriden
        if(this.departementSelectionne && this.communeSelectionnee && this.codePostalSelectionne) {
            Router.navigateToRendezVousAvecCommune(this.critèreDeTri, this.departementSelectionne.code_departement, libelleUrlPathDuDepartement(this.departementSelectionne), this.communeSelectionnee.code, this.communeSelectionnee.codePostal, libelleUrlPathDeCommune(this.communeSelectionnee), this.searchType);
            return 'return';
        }

        return 'continue';
    }


    libelleLieuSelectionne(): TemplateResult {
        return html`
          autour de
          <span class="fw-bold">${this.communeSelectionnee?`${this.communeSelectionnee.nom} (${this.communeSelectionnee.codePostal})`:"???"}
          </span>
        `
    }

    async onCommuneAutocompleteLoaded(autocompletes: Set<string>): Promise<void> {
        if(this.codePostalSelectionne && this.codeCommuneSelectionne) {
            let codePostalSelectionne = this.codePostalSelectionne;
            await this.refreshBasedOnCodePostalSelectionne(autocompletes, codePostalSelectionne);
        }
    }

    private async refreshBasedOnCodePostalSelectionne(autocompletes: Set<string>, codePostalSelectionne: string) {
        const autoCompleteCodePostal = this.getAutoCompleteCodePostal(autocompletes, codePostalSelectionne);
        if (!autoCompleteCodePostal) {
            console.error(`Can't find autocomplete matching codepostal ${codePostalSelectionne}`);
            return autocompletes;
        }

        await this.updateCommunesDisponiblesBasedOnAutocomplete(autoCompleteCodePostal);

        const communeSelectionnee = this.getCommuneSelectionnee();
        if (communeSelectionnee) {
            this.fillCommuneInSelector(communeSelectionnee, autoCompleteCodePostal);
            await this.communeSelected(communeSelectionnee, false);
        }

        return autocompletes;
    }

    private getAutoCompleteCodePostal(autocompletes: Set<string>, codePostalSelectionne: string) {
        return codePostalSelectionne.split('')
            .map((_, index) => codePostalSelectionne!.substring(0, index + 1))
            .find(autoCompleteAttempt => autocompletes.has(autoCompleteAttempt));
    }

    private async updateCommunesDisponiblesBasedOnAutocomplete(autoCompleteCodePostal: string) {
        this.recuperationCommunesEnCours = true;
        this.communesDisponibles = await State.current.communesPourAutocomplete(Router.basePath, autoCompleteCodePostal)
        this.recuperationCommunesEnCours = false;
    }

    private fillCommuneInSelector(communeSelectionnee: Commune, autoCompleteCodePostal: string) {
        const component = (this.shadowRoot!.querySelector("vmd-commune-or-departement-selector") as VmdCommuneOrDepartmentSelectorComponent)
        component.fillCommune(communeSelectionnee, autoCompleteCodePostal);
    }

    protected getCommuneSelectionnee(): Commune|undefined {
        if(!this.codeCommuneSelectionne || !this.communesDisponibles) {
            return undefined;
        }
        return this.communesDisponibles.find(c => c.code === this.codeCommuneSelectionne && c.codePostal === this.codePostalSelectionne);
    }

    resetCommuneSelectionneeTo(commune: Commune|undefined) {
        super.resetCommuneSelectionneeTo(commune);
        this.codeCommuneSelectionne = commune?commune.code:undefined;
        this.codePostalSelectionne = commune?commune.codePostal:undefined;
    }

    afficherLieuxParDepartement(lieuxParDepartement: LieuxParDepartement): LieuxAvecDistanceParDepartement {
        const origin = (this.communeSelectionnee!.latitude && this.communeSelectionnee!.longitude)?
            {longitude:this.communeSelectionnee!.longitude, latitude: this.communeSelectionnee!.latitude}:undefined;
        const distanceAvec = origin?
            (lieu: Lieu) => (lieu.location ? distanceEntreDeuxPoints(origin, lieu.location) : Infinity)
            :() => undefined;

        const { lieuxDisponibles, lieuxIndisponibles } = {
            lieuxDisponibles: lieuxParDepartement?lieuxParDepartement.lieuxDisponibles:[],
            lieuxIndisponibles: lieuxParDepartement?lieuxParDepartement.lieuxIndisponibles:[],
        };

        return {
            ...lieuxParDepartement,
            lieuxAffichables: ArrayBuilder.from([...lieuxDisponibles].map(l => ({...l, disponible: true})))
                .concat([...lieuxIndisponibles].map(l => ({...l, disponible: false})))
                .map(l => ({...l, distance: distanceAvec(l) }))
                .map(l => this.transformLieuEnFonctionDuTypeDeRecherche(l))
                .filter(l => !l.distance || l.distance < MAX_DISTANCE_CENTRE_IN_KM)
                .sortBy(l => this.extraireFormuleDeTri(l, this.critèreDeTri))
                .build()
        };
    }

    critereTriUpdated(triCentre: CodeTriCentre) {
        this.critèreDeTri = triCentre;

        Analytics.INSTANCE.critereTriCentresMisAJour(triCentre);

        this.refreshPageWhenValidParams();
    }

    renderAdditionnalSearchCriteria(): TemplateResult {
        if(this.searchType === 'standard') {
            return html`
          <div class="rdvForm-fields row align-items-center">
            <label class="col-sm-24 col-md-auto mb-md-3">
              Je recherche une dose de vaccin :
            </label>
            <div class="col">
              <vmd-button-switch class="mb-3"
                     codeSelectionne="${this.critèreDeTri}"
                     .options="${Array.from(TRIS_CENTRE.values()).map(tc => ({code: tc.codeTriCentre, libelle: tc.libelle }))}"
                     @changed="${(event: ValueStrCustomEvent<CodeTriCentre>) => this.critereTriUpdated(event.detail.value)}">
              </vmd-button-switch>
            </div>
          </div>
        `;
        } else {
            return html``;
        }
    }

    protected updateSearchTypeTo(searchType: SearchType) {
        super.updateSearchTypeTo(searchType);
        if(this.searchType === 'chronodose') {
            // This is pointless to sort by time in chronodrive search
            this.critèreDeTri = 'distance';
        }

        this.refreshPageWhenValidParams();
    }
}

@customElement('vmd-rdv-par-departement')
export class VmdRdvParDepartementView extends AbstractVmdRdvView {

    async onceStartupPromiseResolved() {
        if(this.codeDepartementSelectionne) {
            const departementSelectionne = this.departementsDisponibles.find(d => d.code_departement === this.codeDepartementSelectionne);
            if (departementSelectionne) {
                const component = (this.shadowRoot!.querySelector("vmd-commune-or-departement-selector") as VmdCommuneOrDepartmentSelectorComponent)
                component.fillDepartement(departementSelectionne);

                await this.departementSelected(departementSelectionne, false);
            }
        }
    }

    async onCommuneAutocompleteLoaded () {
    }
    codeDepartementAdditionnels () {
      return []
    }

    libelleLieuSelectionne(): TemplateResult {
        return html`
          pour
          <span class="fw-bold">${this.departementSelectionne?`${this.departementSelectionne.nom_departement} (${this.departementSelectionne.code_departement})`:"???"}
          </span>
        `
    }

    afficherLieuxParDepartement(lieuxParDepartement: LieuxParDepartement): LieuxAvecDistanceParDepartement {
        const { lieuxDisponibles, lieuxIndisponibles } = {
            lieuxDisponibles: lieuxParDepartement?lieuxParDepartement.lieuxDisponibles:[],
            lieuxIndisponibles: lieuxParDepartement?lieuxParDepartement.lieuxIndisponibles:[],
        };

        return {
            ...lieuxParDepartement,
            lieuxAffichables: ArrayBuilder.from([...lieuxDisponibles].map(l => ({...l, disponible: true})))
                .concat([...lieuxIndisponibles].map(l => ({...l, disponible: false})))
                .map(l => ({...l, distance: undefined }))
                .map(l => this.transformLieuEnFonctionDuTypeDeRecherche(l))
                .sortBy(l => this.extraireFormuleDeTri(l, 'date'))
                .build()
        };
    }
}
