import {css, customElement, html, LitElement, property, unsafeCSS} from 'lit-element';
import {repeat} from "lit-html/directives/repeat";
import {styleMap} from "lit-html/directives/style-map";
import globalCss from "../styles/global.scss";
import {Router} from "../routing/Router";
import rdvViewCss from "../styles/views/_rdv.scss";
import distanceEntreDeuxPoints from "../distance"
import {
    CodeDepartement,
    CodeTriCentre,
    Commune,
    Departement,
    libelleUrlPathDeCommune,
    libelleUrlPathDuDepartement,
    Lieu, LieuxAvecDistanceParDepartement,
    LieuxParDepartement,
    State,
    TRIS_CENTRE
} from "../state/State";
import {Dates} from "../utils/Dates";
import {Strings} from "../utils/Strings";
import {
    AutocompleteTriggered,
    CommuneSelected, DepartementSelected, VmdCommuneOrDepartmentSelectorComponent,
    VmdCommuneSelectorComponent
} from "../components/vmd-commune-selector.component";
import {DEPARTEMENTS_LIMITROPHES} from "../utils/Departements";
import {ValueStrCustomEvent} from "../components/vmd-selector.component";
import {TemplateResult} from "lit-html";
import {Analytics} from "../utils/Analytics";

const MAX_DISTANCE_CENTRE_IN_KM = 100;

export abstract class AbstractVmdRdvView extends LitElement {

    //language=css
    static styles = [
        css`${unsafeCSS(globalCss)}`,
        css`${unsafeCSS(rdvViewCss)}`,
        css`
        `
    ];

    @property({type: String}) codeDepartementSelectionne: CodeDepartement | undefined = undefined;

    @property({type: Array, attribute: false}) communesAutocomplete: Set<string>|undefined = undefined;
    @property({type: Array, attribute: false}) recuperationCommunesEnCours: boolean = false;

    @property({type: Array, attribute: false}) communesDisponibles: Commune[]|undefined = undefined;
    @property({type: Array, attribute: false}) departementsDisponibles: Departement[] = [];

    @property({type: Array, attribute: false}) lieuxParDepartementAffiches: LieuxAvecDistanceParDepartement | undefined = undefined;
    @property({type: Boolean, attribute: false}) searchInProgress: boolean = false;

    protected derniereCommuneSelectionnee: Commune|undefined = undefined;


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

    get totalDoses() {
        if (!this.lieuxParDepartementAffiches) {
            return 0;
        }
        return this.lieuxParDepartementAffiches
            .lieuxDisponibles
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
                libelleUrlPathDeCommune(commune)
            );
            return;
        }

        if(this.communeSelectionnee.code !== commune.code || this.codeDepartementSelectionne !== commune.codeDepartement) {
            this.codeDepartementSelectionne = commune.codeDepartement;
            this.resetCommuneSelectionneeTo(commune);

            if(triggerNavigation) {
                this.refreshPageWhenValidParams();
            }
        }

        await this.refreshLieux();

        return Promise.resolve();
    }

    async departementSelected(departement: Departement, triggerNavigation: boolean): Promise<void> {
        if(this.communeSelectionnee) {
            Router.navigateToRendezVousAvecDepartement(departement.code_departement, libelleUrlPathDuDepartement(departement));
            return;
        }

        if(departement.code_departement !== this.codeDepartementSelectionne) {
            this.codeDepartementSelectionne = departement.code_departement;

            if(triggerNavigation) {
                this.refreshPageWhenValidParams();
            }

            await this.refreshLieux();
        }

        return Promise.resolve();
    }

    render() {
        return html`
            <div class="p-5 text-dark bg-light rounded-3">
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
                  ${this.totalDoses.toLocaleString()} dose${Strings.plural(this.totalDoses)} de vaccination covid trouvée${Strings.plural(this.totalDoses)}
                  ${this.libelleLieuSelectionne()}
                  <br/>
                  ${(this.lieuxParDepartementAffiches && this.lieuxParDepartementAffiches.derniereMiseAJour) ? html`<span class="fs-6 text-black-50">Dernière mise à jour : il y a ${Dates.formatDurationFromNow(this.lieuxParDepartementAffiches!.derniereMiseAJour)}</span>` : html``}
                </h3>

                <div class="spacer mt-5 mb-5"></div>
                <div class="resultats px-2 py-5 text-dark bg-light rounded-3">
                    ${(this.lieuxParDepartementAffiches && this.lieuxParDepartementAffiches.lieuxDisponibles.length) ? html`
                        <h2 class="row align-items-center justify-content-center mb-5 h5 px-3">
                            <i class="bi vmdicon-calendar2-check-fill text-success me-2 fs-3 col-auto"></i>
                            <span class="col col-sm-auto">
                                ${this.lieuxParDepartementAffiches.lieuxDisponibles.length} Lieu${Strings.plural(this.lieuxParDepartementAffiches.lieuxDisponibles.length, 'x')} de vaccination covid avec des disponibilités
                            </span>
                        </h2>
                    ` : html`
                        <h2 class="row align-items-center justify-content-center mb-5 h5">Aucun créneau de vaccination trouvé</h2>
                        <p>Nous n’avons pas trouvé de <strong>rendez-vous de vaccination</strong> covid sur ces centres, nous vous recommandons toutefois de vérifier manuellement les rendez-vous de vaccination auprès des sites qui gèrent la réservation de créneau de vaccination. Pour ce faire, cliquez sur le bouton “vérifier le centre de vaccination”.</p>
                    `}

                <div class="resultats px-2 py-5 text-dark bg-light rounded-3">
                    ${repeat(this.lieuxParDepartementAffiches?this.lieuxParDepartementAffiches.lieuxDisponibles:[], (c => `${c.departement}||${c.nom}||${c.plateforme}}`), (lieu, index) => {
                        return html`<vmd-appointment-card style="--list-index: ${index}" .lieu="${lieu}" .rdvPossible="${true}" .distance="${lieu.distance}" />`;
                    })}

                  ${(this.lieuxParDepartementAffiches && this.lieuxParDepartementAffiches.lieuxIndisponibles.length) ? html`
                    <div class="spacer mt-5 mb-5"></div>

                    <h5 class="row align-items-center justify-content-center mb-5 px-3">
                        <i class="bi vmdicon-calendar-x-fill text-black-50 me-2 fs-3 col-auto"></i>
                        <span class="col col-sm-auto text-black-50">
                            Autres centres sans créneaux de vaccination détectés
                        </span>
                    </h5>

                    ${repeat(this.lieuxParDepartementAffiches.lieuxIndisponibles || [], (c => `${c.departement}||${c.nom}||${c.plateforme}`), (lieu, index) => {
                        return html`<vmd-appointment-card style="--list-index: ${index}" .lieu="${lieu}" .rdvPossible="${false}"></vmd-appointment-card>`;
                    })}
                  ` : html``}
                </div>
            `}
        `;
    }

    onCommuneAutocompleteLoaded(autocompletes: string[]): Promise<void> {
        return Promise.resolve();
    }

    onceStartupPromiseResolved() {
        // to be overriden
    }

    async connectedCallback() {
        super.connectedCallback();

        await Promise.all([
            State.current.departementsDisponibles().then(departementsDisponibles => {
                this.departementsDisponibles = departementsDisponibles;
            }),
            State.current.communeAutocompleteTriggers(Router.basePath).then(async (autocompletes) => {
                await this.onCommuneAutocompleteLoaded(autocompletes);
                this.communesAutocomplete = new Set(autocompletes);
            })
        ])

        this.onceStartupPromiseResolved();
    }

    preventRafraichissementLieux(): boolean {
        // overridable
        return false;
    }

    codeDepartementAdditionnels(codeDepartementSelectionne: CodeDepartement): CodeDepartement[] {
        // overridable
        return [];
    }

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
        // console.log("disconnected callback")
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
            Router.navigateToRendezVousAvecDepartement(this.codeDepartementSelectionne, libelleUrlPathDuDepartement(this.departementSelectionne!));
        }
    }

    renderAdditionnalSearchCriteria(): TemplateResult {
        return html``;
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
            Router.navigateToRendezVousAvecCommune(this.critèreDeTri, this.departementSelectionne.code_departement, libelleUrlPathDuDepartement(this.departementSelectionne), this.communeSelectionnee.code, this.communeSelectionnee.codePostal, libelleUrlPathDeCommune(this.communeSelectionnee));
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

    async onCommuneAutocompleteLoaded(autocompletes: string[]): Promise<void> {
        if(this.codePostalSelectionne && this.codeCommuneSelectionne) {
            let codePostalSelectionne = this.codePostalSelectionne;
            await this.refreshBasedOnCodePostalSelectionne(autocompletes, codePostalSelectionne);
        } else {
            await this.refreshLieux();
        }
    }

    private async refreshBasedOnCodePostalSelectionne(autocompletes: string[], codePostalSelectionne: string) {
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
        } else {
            await this.refreshLieux();
        }

        return autocompletes;
    }

    private getAutoCompleteCodePostal(autocompletes: string[], codePostalSelectionne: string) {
        const autocompletesSet = new Set(autocompletes);
        return codePostalSelectionne.split('')
            .map((_, index) => codePostalSelectionne!.substring(0, index + 1))
            .find(autoCompleteAttempt => autocompletesSet.has(autoCompleteAttempt));
    }

    private async updateCommunesDisponiblesBasedOnAutocomplete(autoCompleteCodePostal: string) {
        this.recuperationCommunesEnCours = true;
        this.communesDisponibles = await State.current.communesPourAutocomplete(Router.basePath, autoCompleteCodePostal)
        this.recuperationCommunesEnCours = false;
    }

    private fillCommuneInSelector(communeSelectionnee: Commune, autoCompleteCodePostal: string) {
        const component = (this.shadowRoot!.querySelector("vmd-commune-or-departement-selector") as VmdCommuneSelectorComponent)
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
            :(lieu: Lieu) => undefined;

        const { lieuxDisponibles, lieuxIndisponibles } = {
            lieuxDisponibles: lieuxParDepartement?lieuxParDepartement.lieuxDisponibles.map(l => ({
                ...l, distance: distanceAvec(l)
            })).filter(l => !l.distance || l.distance < MAX_DISTANCE_CENTRE_IN_KM):[],
            lieuxIndisponibles: lieuxParDepartement?lieuxParDepartement.lieuxIndisponibles.map(l => ({
                ...l, distance: distanceAvec(l)
            })).filter(l => !l.distance || l.distance < MAX_DISTANCE_CENTRE_IN_KM):[],
        };

        if(this.critèreDeTri==='date') {
            return {
                ...lieuxParDepartement,
                lieuxDisponibles: [...lieuxDisponibles]
                    .sort((a, b) => Date.parse(a.prochain_rdv!) - Date.parse(b.prochain_rdv!)),
                lieuxIndisponibles: [...lieuxIndisponibles]
                    .sort((a, b) => Date.parse(a.prochain_rdv!) - Date.parse(b.prochain_rdv!)),
            };
        } else if(this.critèreDeTri==='distance') {
            return {
                ...lieuxParDepartement!,
                lieuxDisponibles: [...lieuxDisponibles]
                    .sort((a, b) => a.distance! - b.distance!),
                lieuxIndisponibles: [...lieuxIndisponibles]
                    .sort((a, b) => a.distance! - b.distance!),
            };
        } else {
            throw new Error("No critereDeTri defined !");
        }
    }

    critereTriUpdated(triCentre: CodeTriCentre) {
        this.critèreDeTri = triCentre;

        Analytics.INSTANCE.critereTriCentresMisAJour(triCentre);

        this.refreshPageWhenValidParams();
    }

    renderAdditionnalSearchCriteria(): TemplateResult {
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

        await this.refreshLieux();
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
            lieuxDisponibles: lieuxParDepartement?lieuxParDepartement.lieuxDisponibles.map(l => ({
                ...l, distance: undefined
            })):[],
            lieuxIndisponibles: lieuxParDepartement?lieuxParDepartement.lieuxIndisponibles.map(l => ({
                ...l, distance: undefined
            })):[],
        };

        return {
            ...lieuxParDepartement,
            lieuxDisponibles: [...lieuxDisponibles]
                .sort((a, b) => Date.parse(a.prochain_rdv!) - Date.parse(b.prochain_rdv!)),
            lieuxIndisponibles: [...lieuxIndisponibles]
                .sort((a, b) => Date.parse(a.prochain_rdv!) - Date.parse(b.prochain_rdv!)),
        };
    }
}
