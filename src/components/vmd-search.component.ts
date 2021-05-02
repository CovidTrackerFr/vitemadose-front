import {css, customElement, html, LitElement, property, unsafeCSS} from 'lit-element';
import {Router} from "../routing/Router";
import {
    Commune,
    Departement,
    libelleUrlPathDeCommune,
    libelleUrlPathDuDepartement,
    PLATEFORMES,
    State,
    StatsLieu,
} from "../state/State";
import {
    AutocompleteTriggered,
    CommuneSelected,
    DepartementSelected
} from "../components/vmd-commune-or-departement-selector.component";

@customElement('vmd-search')
export class VmdSearchComponent extends LitElement {

    //language=css
    static styles = [
        css`
            :host {
                display: block;
            }
        `
    ];

    @property({type: Array, attribute: false}) communesAutocomplete: Set<string>|undefined = undefined;
    @property({type: Array, attribute: false}) recuperationCommunesEnCours: boolean = false;
    @property({type: Array, attribute: false}) communesDisponibles: Commune[]|undefined = undefined;

    private departementsDisponibles: Departement[]|undefined = [];
    private communeSelectionee: Commune|undefined = undefined;
    private departementSelectione: Departement|undefined = undefined;

    rechercherRdv() {
        if(this.departementSelectione) {
            Router.navigateToRendezVousAvecDepartement(this.departementSelectione.code_departement, libelleUrlPathDuDepartement(this.departementSelectione));
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
            libelleUrlPathDeCommune(this.communeSelectionee!)
        )
    }

    async communeAutocompleteTriggered(event: CustomEvent<AutocompleteTriggered>) {
        this.recuperationCommunesEnCours = true;
        this.communesDisponibles = await State.current.communesPourAutocomplete(Router.basePath, event.detail.value);
        this.recuperationCommunesEnCours = false;
        this.requestUpdate('communesDisponibles')
    }

    render() {
        return html`
            <vmd-commune-or-departement-selector class="mb-3"
                  @autocomplete-triggered="${this.communeAutocompleteTriggered}"
                  @on-commune-selected="${(event: CustomEvent<CommuneSelected>) => this.onCommuneSelected(event.detail.commune)}"
                  @on-departement-selected="${(event: CustomEvent<DepartementSelected>) => this.onDepartementSelected(event.detail.departement)}"
                  .departementsDisponibles="${this.departementsDisponibles}"
                  .autocompleteTriggers="${this.communesAutocomplete}"
                  .communesDisponibles="${this.communesDisponibles}"
                  .recuperationCommunesEnCours="${this.recuperationCommunesEnCours}"
            >
            </vmd-commune-or-departement-selector>
        `;
    }

    private onCommuneSelected (commune: Commune) {
      this.communeSelectionee = commune;
      this.dispatchEvent(new CustomEvent<CommuneSelected>('on-commune-selected', {
          detail: {
              commune
          }
      }));
    }

    private onDepartementSelected (departement: Departement) {
      this.departementSelectione = departement;
      this.dispatchEvent(new CustomEvent<DepartementSelected>('on-departement-selected', {
          detail: {
              departement
          }
      }));
    }

    async connectedCallback() {
        super.connectedCallback();

        const [ departementsDisponibles, autocompletes ] = await Promise.all([
            State.current.departementsDisponibles(),
            State.current.communeAutocompleteTriggers(Router.basePath)
        ])
        this.departementsDisponibles = departementsDisponibles;
        this.communesAutocomplete = new Set(autocompletes);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        // console.log("disconnected callback")
    }
}

