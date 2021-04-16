import {
    css,
    customElement,
    html,
    LitElement,
    property,
    PropertyValues,
    unsafeCSS
} from 'lit-element';
import {TrancheAgeSelectionne} from "../components/vmd-tranche-age-selector.component";
import {DepartementSelected} from "../components/vmd-departement-selector.component";
import {repeat} from "lit-html/directives/repeat";
import {styleMap} from "lit-html/directives/style-map";
import globalCss from "../styles/global.scss";
import {Router} from "../routing/Router";
import rdvViewCss from "../styles/views/_rdv.scss";
import delay from "../delay"
import distanceEntreDeuxPoints from "../distance"
import {
    Lieu,
    LieuxParDepartement,
    Coordinates,
    CodeDepartement,
    CodeTrancheAge,
    Departement,
    State,
    TRANCHES_AGE,
    libelleUrlPathDuDepartement,
    Commune,
    libelleUrlPathDeCommune,
    TRIS_CENTRE,
    CodeTriCentre
} from "../state/State";
import {Dates} from "../utils/Dates";
import {Strings} from "../utils/Strings";
import {classMap} from "lit-html/directives/class-map";
import {
    AutocompleteTriggered,
    CommuneSelected,
    VmdCommuneSelectorComponent
} from "../components/vmd-commune-selector.component";
import {DEPARTEMENTS_LIMITROPHES} from "../utils/Departements";
import {ValueStrCustomEvent} from "../components/vmd-selector.component";

type LieuAvecDistance = Lieu & { distance: number|undefined };
type LieuxAvecDistanceParDepartement = LieuxParDepartement & {
    lieuxDisponibles: LieuAvecDistance[];
    lieuxIndisponibles: LieuAvecDistance[];
};

@customElement('vmd-rdv')
export class VmdRdvView extends LitElement {

    //language=css
    static styles = [
        css`${unsafeCSS(globalCss)}`,
        css`${unsafeCSS(rdvViewCss)}`,
        css`
        `
    ];

    @property({type: String}) codeDepartementSelectionne: CodeDepartement | undefined = undefined;
    @property({type: String}) codeCommuneSelectionne: string | undefined = undefined;
    @property({type: String}) codePostalSelectionne: string | undefined = undefined;
    @property({type: String}) critèreDeTri: 'date' | 'distance' = 'distance'

    @property({type: Array, attribute: false}) communesAutocomplete: Set<string>|undefined = undefined;
    @property({type: Array, attribute: false}) recuperationCommunesEnCours: boolean = false;

    @property({type: Array, attribute: false}) communesDisponibles: Commune[]|undefined = undefined;
    @property({type: Array, attribute: false}) departementsDisponibles: Departement[] = [];

    @property({type: Array, attribute: false}) lieuxParDepartementAffiches: LieuxAvecDistanceParDepartement | undefined = undefined;
    @property({type: Boolean, attribute: false}) searchInProgress: boolean = false;


    get communeSelectionnee(): Commune|undefined {
        if(!this.codeCommuneSelectionne || !this.communesDisponibles) {
            return undefined;
        }
        return this.communesDisponibles.find(c => c.code === this.codeCommuneSelectionne);
    }

    get departementSelectionne(): Departement|undefined {
        let communeSelectionnee = this.communeSelectionnee;
        if(communeSelectionnee && this.departementsDisponibles) {
            return this.departementsDisponibles.find(d => communeSelectionnee!.codeDepartement === d.code_departement);
        }

        if(this.codeDepartementSelectionne && this.departementsDisponibles) {
            return this.departementsDisponibles.find(d => this.codeDepartementSelectionne === d.code_departement);
        }

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
        if(commune.codeDepartement !== this.codeDepartementSelectionne) {
            this.codeCommuneSelectionne = commune.code;
            this.codePostalSelectionne = commune.codePostal;
            this.codeDepartementSelectionne = commune.codeDepartement;

            if(triggerNavigation) {
                this.refreshPageWhenValidParams();
            }

            await this.refreshLieux();
        }

        return Promise.resolve();
    }

    critereTriUpdated(triCentre: CodeTriCentre) {
        this.critèreDeTri = triCentre;
        this.refreshPageWhenValidParams();
    }

    render() {
        return html`
            <div class="p-5 text-dark bg-light rounded-3">
                <div class="searchDoseForm-fields row align-items-center">
                  <label class="col-sm-24 col-md-auto mb-md-3 form-select-lg">
                    Je cherche une dose de vaccin :
                  </label>
                  <div class="col">
                    <vmd-selector class="mb-3"
                                  codeSelectionne="${this.critèreDeTri}"
                                  .options="${Array.from(TRIS_CENTRE.values()).map(tc => ({code: tc.codeTriCentre, libelle: tc.libelle }))}"
                                  @changed="${(event: ValueStrCustomEvent<CodeTriCentre>) => this.critereTriUpdated(event.detail.value)}">
                    </vmd-selector>
                  </div>
                </div>

                <div class="rdvForm-fields row align-items-center">
                    <label class="col-sm-24 col-md-auto mb-md-3 form-select-lg">
                        Ma commune :
                    </label>
                    <div class="col">
                        <vmd-commune-selector class="mb-3"
                              @autocomplete-triggered="${(event: CustomEvent<AutocompleteTriggered>) => this.communeAutocompleteTriggered(event.detail.value)}"
                              @on-commune-selected="${(event: CustomEvent<CommuneSelected>) => this.communeSelected(event.detail.commune, true)}"
                              codeCommuneSelectionne="${this.codeCommuneSelectionne}"
                              .autocompleteTriggers="${this.communesAutocomplete}"
                              .communesDisponibles="${this.communesDisponibles}"
                              .recuperationCommunesEnCours="${this.recuperationCommunesEnCours}"
                        >
                        </vmd-commune-selector>
                    </div>
                </div>
            </div>

            <div class="spacer mt-5 mb-5"></div>

            ${this.searchInProgress?html`
              <div class="d-flex justify-content-center">
                <div class="spinner-border text-primary" style="height: 50px; width: 50px" role="status">
                </div>
              </div>
            `:html`
                <h3 class="fw-normal text-center h4" style="${styleMap({display: (this.codeDepartementSelectionne) ? 'block' : 'none'})}">
                  ${this.totalDoses.toLocaleString()} dose${Strings.plural(this.totalDoses)} de vaccination covid trouvée${Strings.plural(this.totalDoses)} autours de
                  <span class="fw-bold">${this.communeSelectionnee?`${this.communeSelectionnee.nom} (${this.communeSelectionnee.codePostal})`:"???"}
                  </span>
                  <br/>
                  ${(this.lieuxParDepartementAffiches && this.lieuxParDepartementAffiches.derniereMiseAJour) ? html`<span class="fs-6 text-black-50">Dernière mise à jour : il y a ${Dates.formatDurationFromNow(this.lieuxParDepartementAffiches!.derniereMiseAJour)}</span>` : html``}
                </h3>

                <div class="spacer mt-5 mb-5"></div>
                <div class="resultats p-5 text-dark bg-light rounded-3">
                    ${(this.lieuxParDepartementAffiches && this.lieuxParDepartementAffiches.lieuxDisponibles.length) ? html`
                        <h2 class="row align-items-center justify-content-center mb-5 h5">
                            <i class="bi vmdicon-calendar2-check-fill text-success me-2 fs-3 col-auto"></i>
                            <span class="col col-sm-auto">
                                ${this.lieuxParDepartementAffiches.lieuxDisponibles.length} Lieu${Strings.plural(this.lieuxParDepartementAffiches.lieuxDisponibles.length, 'x')} de vaccination covid ont des disponibilités
                            </span>
                        </h2>
                    ` : html`
                        <h2 class="row align-items-center justify-content-center mb-5 h5">Aucun créneau de vaccination trouvé</h2>
                        <p>Nous n’avons pas trouvé de <strong>rendez-vous de vaccination</strong> covid sur ces centres, nous vous recommandons toutefois de vérifier manuellement les rendez-vous de vaccination auprès des sites qui gèrent la réservation de créneau de vaccination. Pour ce faire, cliquez sur le bouton “vérifier le centre de vaccination”.</p>
                    `}

                <div class="resultats p-5 text-dark bg-light rounded-3">
                    ${repeat(this.lieuxParDepartementAffiches?this.lieuxParDepartementAffiches.lieuxDisponibles:[], (c => `${c.departement}||${c.nom}||${c.plateforme}||${this.critèreDeTri}`), (lieu, index) => {
                        return html`<vmd-appointment-card style="--list-index: ${index}" .lieu="${lieu}" .rdvPossible="${true}" .distance="${lieu.distance}" />`;
                    })}

                  ${(this.lieuxParDepartementAffiches && this.lieuxParDepartementAffiches.lieuxIndisponibles.length) ? html`
                    <div class="spacer mt-5 mb-5"></div>

                    <h5 class="row align-items-center justify-content-center mb-5">
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

    async connectedCallback() {
        super.connectedCallback();

        const [departementsDisponibles, autocompletes ] = await Promise.all([
            State.current.departementsDisponibles(),
            State.current.communeAutocompleteTriggers(Router.basePath).then(async (autocompletes) => {
                if(this.codePostalSelectionne && this.codeCommuneSelectionne) {
                    const autocompletesSet = new Set(autocompletes);
                    const autoCompleteCodePostal = this.codePostalSelectionne.split('')
                        .map((_, index) => this.codePostalSelectionne!.substring(0, index+1))
                        .find(autoCompleteAttempt => autocompletesSet.has(autoCompleteAttempt));

                    if(!autoCompleteCodePostal) {
                        console.error(`Can't find autocomplete matching codepostal ${this.codePostalSelectionne}`);
                        return autocompletes;
                    }

                    this.recuperationCommunesEnCours = true;
                    this.communesDisponibles = await State.current.communesPourAutocomplete(Router.basePath, autoCompleteCodePostal)
                    this.recuperationCommunesEnCours = false;

                    const communeSelectionnee = this.communesDisponibles.find(c => c.code === this.codeCommuneSelectionne);
                    if (communeSelectionnee) {
                        const component = (this.shadowRoot!.querySelector("vmd-commune-selector") as VmdCommuneSelectorComponent)
                        component.fillCommune(communeSelectionnee, autoCompleteCodePostal);

                        await this.communeSelected(communeSelectionnee, false);
                    }
                }

                await this.refreshLieux();

                return autocompletes;
            })
        ])

        this.departementsDisponibles = departementsDisponibles;
        this.communesAutocomplete = new Set(autocompletes);
    }

    async refreshLieux() {
        const communeSelectionnee = this.communeSelectionnee;
        if (communeSelectionnee && this.codeDepartementSelectionne) {
            try {
                this.searchInProgress = true;
                const [lieuxDepartement, ...lieuxDepartementsLimitrophes] = await Promise.all([
                    State.current.lieuxPour(this.codeDepartementSelectionne),
                    ...DEPARTEMENTS_LIMITROPHES[this.codeDepartementSelectionne].map(dept => State.current.lieuxPour(dept))
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

                const origin = (communeSelectionnee.latitude && communeSelectionnee.longitude)?
                    {longitude:communeSelectionnee.longitude, latitude: communeSelectionnee.latitude}:undefined;
                const distanceAvec = origin?
                    (lieu: Lieu) => (lieu.location ? distanceEntreDeuxPoints(origin, lieu.location) : Infinity)
                    :(lieu: Lieu) => undefined;

                const { lieuxDisponibles, lieuxIndisponibles } = {
                    lieuxDisponibles: lieuxParDepartement?lieuxParDepartement.lieuxDisponibles.map(l => ({
                        ...l, distance: distanceAvec(l)
                    })).filter(l => !l.distance || l.distance < 150):[],
                    lieuxIndisponibles: lieuxParDepartement?lieuxParDepartement.lieuxIndisponibles.map(l => ({
                        ...l, distance: distanceAvec(l)
                    })).filter(l => !l.distance || l.distance < 150):[],
                };

                if(this.critèreDeTri==='date') {
                    this.lieuxParDepartementAffiches = {
                        ...lieuxParDepartement,
                        lieuxDisponibles: [...lieuxDisponibles]
                            .sort((a, b) => Date.parse(a.prochain_rdv!) - Date.parse(b.prochain_rdv!)),
                        lieuxIndisponibles: [...lieuxIndisponibles]
                            .sort((a, b) => Date.parse(a.prochain_rdv!) - Date.parse(b.prochain_rdv!)),
                    };
                } else if(this.critèreDeTri==='distance') {
                    this.lieuxParDepartementAffiches = {
                        ...lieuxParDepartement!,
                        lieuxDisponibles: [...lieuxDisponibles]
                            .sort((a, b) => a.distance! - b.distance!),
                        lieuxIndisponibles: [...lieuxIndisponibles]
                            .sort((a, b) => a.distance! - b.distance!),
                    };
                }
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

    private refreshPageWhenValidParams() {
        this.refreshLieux();
        if(this.departementSelectionne && this.communeSelectionnee && this.codePostalSelectionne) {
            Router.navigateToRendezVousAvecCommune(this.critèreDeTri, this.departementSelectionne.code_departement, libelleUrlPathDuDepartement(this.departementSelectionne), this.communeSelectionnee.code, this.communeSelectionnee.codePostal, libelleUrlPathDeCommune(this.communeSelectionnee));
        } else if (this.codeDepartementSelectionne) {
            Router.navigateToRendezVous(this.codeDepartementSelectionne, libelleUrlPathDuDepartement(this.departementSelectionne!));
        }
    }
}
