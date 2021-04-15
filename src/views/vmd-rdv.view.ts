import {css, customElement, html, LitElement, property, unsafeCSS} from 'lit-element';
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
    FEATURES,
    State,
    TRANCHES_AGE, libelleUrlPathDuDepartement
} from "../state/State";
import {Dates} from "../utils/Dates";
import {Strings} from "../utils/Strings";
import {classMap} from "lit-html/directives/class-map";

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

    @property({type: String}) codeTrancheAgeSelectionne: CodeTrancheAge | undefined = undefined;
    @property({type: String}) codeDepartementSelectionne: CodeDepartement | undefined = undefined;

    @property({type: Array, attribute: false}) departementsDisponibles: Departement[] = [];
    @property({type: Array, attribute: false}) lieuxParDepartementAffiches: LieuxAvecDistanceParDepartement | undefined = undefined;
    @property({type: Boolean, attribute: false}) searchInProgress: boolean = false;

    @property({type: String, attribute: false}) critèreDeTri: 'date' | 'distance' = 'date'
    @property({type: Boolean, attribute: false}) recuperationLocationEnCours = false
    @property({type: Boolean, attribute: false}) geolocalisationBloquée = false
    @property({type: Boolean, attribute: false}) geolocalisationIndisponible = false
    @property({type: Boolean, attribute: false}) afficherMessageGeoloc = false
    private userLocation: Coordinates | undefined

    private lieuxParDepartementTriesParDate: LieuxAvecDistanceParDepartement|undefined = undefined;
    private lieuxParDepartementTriesParDistance: LieuxAvecDistanceParDepartement|undefined = undefined;


    async afficherTriParDistance () {
      let location;
      try {
          this.recuperationLocationEnCours = true
          location = await State.current.localisationNavigateur()
      } finally {
          this.recuperationLocationEnCours = false;
      }
      if (location === 'bloqué') {
        this.geolocalisationBloquée = true
        this.geolocalisationIndisponible = false;
        this.prévenirSiBloqué()
      } else if (location === 'indisponible') {
        this.geolocalisationBloquée = false
        this.geolocalisationIndisponible = true
      } else {
        this.userLocation = location
        this.critèreDeTri = 'distance'
        if(!this.lieuxParDepartementTriesParDistance) {
          this.remplirLieuxParDepartementTresParDistance();
        }
        this.lieuxParDepartementAffiches = this.lieuxParDepartementTriesParDistance;
        this.geolocalisationBloquée = false
        this.geolocalisationIndisponible = false
        this.requestUpdate('lieuxParDepartementAffiches');
      }
      this.requestUpdate('critèreDeTri');
    }

    afficherTriParDate() {
        this.critèreDeTri = 'date';
        this.lieuxParDepartementAffiches = this.lieuxParDepartementTriesParDate;
    }

    async prévenirSiBloqué () {
      if (this.geolocalisationBloquée && !this.afficherMessageGeoloc) {
        this.afficherMessageGeoloc = true
        await delay(5000)
        this.afficherMessageGeoloc = false
      }
    }

    get departementSelectionne() {
        if (this.codeDepartementSelectionne) {
            return this.departementsDisponibles.find(dept => dept.code_departement === this.codeDepartementSelectionne);
        } else {
            return undefined;
        }
    }

    get trancheAgeSelectionee() {
        if (this.codeTrancheAgeSelectionne) {
            return TRANCHES_AGE.get(this.codeTrancheAgeSelectionne);
        } else {
            return undefined;
        }
    }

    get totalDoses() {
        if (!this.lieuxParDepartementTriesParDate) {
            return 0;
        }
        return this.lieuxParDepartementTriesParDate
            .lieuxDisponibles
            .reduce((total, lieu) => total+lieu.appointment_count, 0);
    }

    render() {
        return html`
            <div class="p-5 text-dark bg-light rounded-3">
                <div class="rdvForm-fields row align-items-center">
                  ${FEATURES.trancheAgeFilter ? html`
                    <div class="col-sm-24 col-md-auto mb-md-3 mt-md-3">
                        J'ai
                    </div>
                    <div class="col">
                        <vmd-tranche-age-selector class="mb-3 mt-md-3"
                              codeTrancheAgeSelectionne="${this.codeTrancheAgeSelectionne}"
                              .tranchesAge="${TRANCHES_AGE}"
                              @tranche-age-changed="${this.trancheAgeMisAJour}"></vmd-tranche-age-selector>
                    </div>
                    ` : html``}
                    <label class="col-sm-24 col-md-auto mb-md-3 mt-md-3 form-select-lg">
                      Mon département :
                    </label>
                    <div class="col">
                        <vmd-departement-selector class="mb-3 mt-md-3"
                              codeDepartementSelectionne="${this.codeDepartementSelectionne}"
                              .departementsDisponibles="${this.departementsDisponibles}"
                              @departement-changed="${this.departementUpdated}"></vmd-departement-selector>
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
                <h3 class="fw-normal text-center h4" style="${styleMap({display: (this.codeDepartementSelectionne && this.codeTrancheAgeSelectionne) ? 'block' : 'none'})}">
                  ${this.totalDoses.toLocaleString()} dose${Strings.plural(this.totalDoses)} de vaccination covid trouvée${Strings.plural(this.totalDoses)} pour
                  <span class="fw-bold">${this.departementSelectionne?.nom_departement}
                  ${FEATURES.trancheAgeFilter ? html`, ${this.trancheAgeSelectionee?.libelle}` : html``}
                  </span>
                  <br/>
                  ${this.lieuxParDepartementAffiches?.derniereMiseAJour ? html`<span class="fs-6 text-black-50">Dernière mise à jour : il y a ${Dates.formatDurationFromNow(this.lieuxParDepartementAffiches?.derniereMiseAJour)}</span>` : html``}
                </h3>

                <div class="spacer mt-5 mb-5"></div>
                <div class="resultats p-5 text-dark bg-light rounded-3">
                    ${this.lieuxParDepartementAffiches?.lieuxDisponibles.length ? html`
                        <h2 class="row align-items-center justify-content-center mb-5 h5">
                            <i class="bi vmdicon-calendar2-check-fill text-success me-2 fs-3 col-auto"></i>
                            <span class="col col-sm-auto">
                                ${this.lieuxParDepartementAffiches?.lieuxDisponibles.length} Lieu${Strings.plural(this.lieuxParDepartementAffiches?.lieuxDisponibles.length, 'x')} de vaccination covid ont des disponibilités
                            </span>
                        </h2>
                        <div class="tri">
                          <span class="radio-input">
                            <input @change="${(e: Event) => this.afficherTriParDate()}" type="radio" name="tri" id="tri-date" ?checked=${this.critèreDeTri === 'date'} />
                            <label for="tri-date">Au plus tôt</label>
                          </span>
                          <span class="radio-input">
                            <input
                              type="radio" name="tri" id="tri-distance"
                              title="Vous devez autoriser l'accès à la géolocalisation dans votre navigateur"
                              @click="${(e: Event) => this.afficherTriParDistance()}"
                              ?checked=${this.critèreDeTri === 'distance'}
                              ?disabled="${this.geolocalisationBloquée}" />
                            <label for="tri-distance"
                              @click="${() => this.prévenirSiBloqué()}"
                              id="tri-distance-label"
                              data-toggle="tooltip"
                              title="Vous devez autoriser l'accès à la géolocalisation pour ViteMaDose dans votre navigateur"
                            >
                              Au plus proche
                              ${this.recuperationLocationEnCours?html`
                              <div class="spinner-border text-primary" style="height: 15px; width: 15px" role="status">
                              </div>
                              `:html``}
                            </label>
                          </span>
                          <p class="blocked-geo ${classMap({ displayed: this.afficherMessageGeoloc})}">Vous n'avez pas autorisé l'accès à votre position géographique au site ViteMaDose.</p>
                          <p class="geo-indispo ${classMap({ displayed: this.geolocalisationIndisponible})}">La géolocalisation n'est pas disponible pour ViteMaDose</p>
                        </div>
                    ` : html`
                        <h2 class="row align-items-center justify-content-center mb-5 h5">Aucun créneau de vaccination trouvé</h2>
                        <p>Nous n’avons pas trouvé de <strong>rendez-vous de vaccination</strong> covid sur ces centres, nous vous recommandons toutefois de vérifier manuellement les rendez-vous de vaccination auprès des sites qui gèrent la réservation de créneau de vaccination. Pour ce faire, cliquez sur le bouton “vérifier le centre de vaccination”.</p>
                    `}

                <div class="resultats p-5 text-dark bg-light rounded-3">
                    ${repeat(this.lieuxParDepartementAffiches?.lieuxDisponibles || [], (c => `${c.departement}||${c.nom}||${c.plateforme}||${this.critèreDeTri}`), (lieu, index) => {
                        return html`<vmd-appointment-card style="--list-index: ${index}" .lieu="${lieu}" .rdvPossible="${true}" .distance="${lieu.distance}" />`;
                    })}

                  ${this.lieuxParDepartementAffiches?.lieuxIndisponibles.length ? html`
                    <div class="spacer mt-5 mb-5"></div>

                    <h5 class="row align-items-center justify-content-center mb-5">
                        <i class="bi vmdicon-calendar-x-fill text-black-50 me-2 fs-3 col-auto"></i>
                        <span class="col col-sm-auto text-black-50">
                            Autres centres sans créneaux de vaccination détectés
                        </span>
                    </h5>

                    ${repeat(this.lieuxParDepartementAffiches?.lieuxIndisponibles || [], (c => `${c.departement}||${c.nom}||${c.plateforme}`), (lieu, index) => {
                        return html`<vmd-appointment-card style="--list-index: ${index}" .lieu="${lieu}" .rdvPossible="${false}"></vmd-appointment-card>`;
                    })}
                  ` : html``}
                </div>
            `}
        `;
    }

    async connectedCallback() {
        super.connectedCallback();

        const [departementsDisponibles, lieuxParDepartement] = await Promise.all([
            State.current.departementsDisponibles(),
            this.refreshLieux()
        ])

        this.departementsDisponibles = departementsDisponibles;
    }

    private remplirLieuxParDepartementTresParDistance() {
        if(this.userLocation) {
            const origin = this.userLocation
            const distanceAvec = (lieu: Lieu) => lieu.location ? distanceEntreDeuxPoints(origin, lieu.location) : Infinity

            const lieuxDisponiblesTriesParDistance: LieuAvecDistance[] = (this.lieuxParDepartementTriesParDate?.lieuxDisponibles || []).map(l => ({
                ...l, distance: distanceAvec(l)
            })).sort((a, b) => a.distance! - b.distance!)
            const lieuxIndisponiblesTriesParDistance: LieuAvecDistance[] = (this.lieuxParDepartementTriesParDate?.lieuxIndisponibles || []).map(l => ({
                ...l, distance: distanceAvec(l)
            })).sort((a, b) => a.distance! - b.distance!)

            this.lieuxParDepartementTriesParDistance = {
                ...this.lieuxParDepartementTriesParDate!,
                lieuxDisponibles: lieuxDisponiblesTriesParDistance,
                lieuxIndisponibles: lieuxIndisponiblesTriesParDistance,
            }
        } else {
            this.lieuxParDepartementTriesParDistance = undefined;
        }
    }

    async refreshLieux() {
        if (this.codeDepartementSelectionne) {
            try {
                this.searchInProgress = true;
                const lieuxParDepartement = await State.current.lieuxPour(this.codeDepartementSelectionne);

                const { lieuxDisponibles, lieuxIndisponibles } = {
                    lieuxDisponibles: lieuxParDepartement?.lieuxDisponibles || [],
                    lieuxIndisponibles: lieuxParDepartement?.lieuxIndisponibles || [],
                };

                this.lieuxParDepartementTriesParDate = {
                    ...lieuxParDepartement,
                    lieuxDisponibles: lieuxDisponibles.map(l => ({...l, distance: undefined})),
                    lieuxIndisponibles: lieuxIndisponibles.map(l => ({...l, distance: undefined})),
                };

                this.remplirLieuxParDepartementTresParDistance();

                this.lieuxParDepartementAffiches = this.critèreDeTri==='date'?this.lieuxParDepartementTriesParDate:this.lieuxParDepartementTriesParDistance;
            } finally {
                this.searchInProgress = false;
            }
        } else {
            this.lieuxParDepartementAffiches = undefined;
            this.lieuxParDepartementTriesParDate = undefined;
            this.lieuxParDepartementTriesParDistance = undefined;
        }
    }

    trancheAgeMisAJour(event: CustomEvent<TrancheAgeSelectionne>) {
        this.codeTrancheAgeSelectionne = event.detail.trancheAge?.codeTrancheAge;
        this.refreshLieux();
        this.refreshPageWhenValidParams();
    }

    departementUpdated(event: CustomEvent<DepartementSelected>) {
        this.codeDepartementSelectionne = event.detail.departement?.code_departement;
        this.refreshLieux();
        this.refreshPageWhenValidParams();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        // console.log("disconnected callback")
    }

    private refreshPageWhenValidParams() {
        if (this.codeDepartementSelectionne && this.codeTrancheAgeSelectionne) {
            Router.navigateToRendezVous(this.codeDepartementSelectionne, libelleUrlPathDuDepartement(this.departementSelectionne!), this.codeTrancheAgeSelectionne);
        }
    }
}
