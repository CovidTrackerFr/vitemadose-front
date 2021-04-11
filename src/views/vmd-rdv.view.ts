import {css, customElement, html, LitElement, property, unsafeCSS} from 'lit-element';
import {TrancheAgeSelectionne} from "../components/vmd-tranche-age-selector.component";
import {DepartementSelected} from "../components/vmd-departement-selector.component";
import {repeat} from "lit-html/directives/repeat";
import {styleMap} from "lit-html/directives/style-map";
import globalCss from "../styles/global.scss";
import {Router} from "../routing/Router";
import rdvViewCss from "../styles/views/_rdv.scss";
import delay from "../delay"
import {
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
    @property({type: Array, attribute: false}) lieuxParDepartement: LieuxParDepartement | undefined = undefined;
    @property({type: Boolean, attribute: false}) searchInProgress: boolean = false;

    @property({type: String, attribute: false}) critèreDeTri: 'date' | 'distance' = 'date'
    @property({type: Boolean, attribute: false}) geolocalisationBloquée = false
    @property({type: Boolean, attribute: false}) geolocalisationIndisponible = false
    @property({type: Boolean, attribute: false}) afficherMessageGeoloc = false
    private userLocation: Coordinates | undefined

    get lieuxDisponiblesTriés () {
      let lieux = this.lieuxParDepartement?.lieuxDisponibles || []
      if (this.critèreDeTri === 'distance' && this.userLocation) {
        const origin = this.userLocation as Coordinates
        const distanceTo = getDistanceFromLatLonInKm.bind(null, origin)
        return [...lieux].sort((a, b) => {
          const distanceA = distanceTo(a.location)
          const distanceB = distanceTo(b.location)
          return distanceA - distanceB
        })
      }
      return [...lieux]
    }

    async trierParDistance (e: Event) {
      e.preventDefault()
      try {
        const location = await this.localisationNavigateur()
        this.userLocation = location
        this.critèreDeTri = 'distance'
      } catch (error) {
        if (error instanceof GeolocationPositionError) {
          if (error.code === 1) {
            this.geolocalisationBloquée = true
            this.prévenirSiBloqué()
          }
          this.geolocalisationIndisponible = true
        }
      }
    }

    async localisationNavigateur (): Promise<Coordinates> {
      const { coords } = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 2000,
        })
      })
      return coords as Coordinates
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
        if (!this.lieuxParDepartement) {
            return 0;
        }
        return this.lieuxParDepartement
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
                  ${this.lieuxParDepartement?.derniereMiseAJour ? html`<span class="fs-6 text-black-50">Dernière mise à jour : il y a ${Dates.formatDurationFromNow(this.lieuxParDepartement?.derniereMiseAJour)}</span>` : html``}
                </h3>

                <div class="spacer mt-5 mb-5"></div>
                <div class="resultats p-5 text-dark bg-light rounded-3">
                    ${this.lieuxDisponiblesTriés.length > 0 ? html`
                        <h2 class="row align-items-center justify-content-center mb-5 h5">
                            <i class="bi bi-calendar-check-fill text-success me-2 fs-3 col-auto"></i>
                            <span class="col col-sm-auto">
                                ${this.lieuxDisponiblesTriés.length} Lieu${Strings.plural(this.lieuxParDepartement?.lieuxDisponibles.length, 'x')} de vaccination covid ont des disponibilités
                            </span>
                        </h2>
                        <div class="tri">
                          <span class="radio-input">
                            <input @change="${() => this.critèreDeTri = 'date'}" type="radio" name="tri" id="tri-date" .checked=${this.critèreDeTri === 'date'} />
                            <label for="tri-date">Au plus tôt</label>
                          </span>
                          <span class="radio-input">
                            <input
                              type="radio" name="tri" id="tri-distance"
                              title="Vous devez autoriser l'accès à la géolocalisation dans votre navigateur"
                              @click="${(e: Event) => this.trierParDistance(e)}"
                              .checked=${this.critèreDeTri === 'distance'}
                              .disabled="${this.geolocalisationBloquée}" />
                            <label for="tri-distance"
                              @click="${() => this.prévenirSiBloqué()}"
                              id="tri-distance-label"
                              data-toggle="tooltip"
                              title="Vous devez autoriser l'accès à la géolocalisation pour ViteMaDose dans votre navigateur"
                            >
                              Au plus proche
                            </label>
                          </span>
                          <p class="blocked-geo ${this.afficherMessageGeoloc ? 'displayed' : ''}">La géolocalisation n'est pas disponible pour ViteMaDose ou alors vous n'avez pas autorisé l'accès</p>
                        </div>
                    ` : html`
                        <h2 class="row align-items-center justify-content-center mb-5 h5">Aucun créneau de vaccination trouvé</h2>
                        <p>Nous n’avons pas trouvé de <strong>rendez-vous de vaccination</strong> covid sur ces centres, nous vous recommandons toutefois de vérifier manuellement les rendez-vous de vaccination auprès des sites qui gèrent la réservation de créneau de vaccination. Pour ce faire, cliquez sur le bouton “vérifier le centre de vaccination”.</p>
                    `}

                <div class="resultats p-5 text-dark bg-light rounded-3">
                    ${repeat(this.lieuxDisponiblesTriés, (c => `${c.departement}||${c.nom}||${c.plateforme}||${this.critèreDeTri}`), (lieu, index) => {
                        let distance = undefined
                        if (this.userLocation) {
                          distance = getDistanceFromLatLonInKm(this.userLocation, lieu.location)
                        }
                        return html`<vmd-appointment-card .lieu="${lieu}" .rdvPossible="${true}" .index="${index}" .distance="${distance}" />`;
                    })}

                  ${this.lieuxParDepartement?.lieuxIndisponibles.length ? html`
                    <div class="spacer mt-5 mb-5"></div>

                    <h5 class="row align-items-center justify-content-center mb-5">
                        <i class="bi bi-calendar-x-fill text-black-50 me-2 fs-3 col-auto"></i>
                        <span class="col col-sm-auto text-black-50">
                            Autres centres sans créneaux de vaccination détecté
                        </span>
                    </h5>

                    ${repeat(this.lieuxParDepartement?.lieuxIndisponibles || [], (c => `${c.departement}||${c.nom}||${c.plateforme}`), (lieu) => {
                        return html`<vmd-appointment-card .lieu="${lieu}" .rdvPossible="${false}"></vmd-appointment-card>`;
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

    async refreshLieux() {
        if (this.codeDepartementSelectionne && this.codeTrancheAgeSelectionne) {
            try {
                this.searchInProgress = true;
                this.lieuxParDepartement = await State.current.lieuxPour(this.codeDepartementSelectionne, this.codeTrancheAgeSelectionne);
            } finally {
                this.searchInProgress = false;
            }
        } else {
            this.lieuxParDepartement = undefined;
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

function getDistanceFromLatLonInKm({ latitude: lat1, longitude: lon1 }: Coordinates, { latitude: lat2, longitude: lon2 }: Coordinates) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1);
  var a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ;
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var kilometers = R * c; // Distance in km
  return kilometers;
}

function deg2rad(deg: number) {
  return deg * (Math.PI/180)
}
