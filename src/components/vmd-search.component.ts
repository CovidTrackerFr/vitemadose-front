import {css, customElement, html, LitElement, internalProperty, property, unsafeCSS} from 'lit-element';
import {Router} from "../routing/Router";
import { SearchRequest } from '../state/State'
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
    @property() public set value (searchRequest: SearchRequest | void) {
      if (!searchRequest) {
        this.currentSelection = undefined
      } else if (SearchRequest.isByDepartement(searchRequest)) {
        this.currentSelection = searchRequest.departement
      } else {
        this.currentSelection = searchRequest.commune
      }
      this.currentValue = searchRequest
    }
    public get value (): SearchRequest | void {
      return this.currentValue
    }
    @internalProperty() private currentValue: SearchRequest | void = undefined
    @internalProperty() private currentSelection: Commune | Departement | void = undefined

    render() {
        return html`
            <vmd-commune-or-departement-selector class="mb-3"
                  @on-commune-selected="${(event: CustomEvent<CommuneSelected>) => this.onCommuneSelected(event.detail.commune)}"
                  @on-departement-selected="${(event: CustomEvent<DepartementSelected>) => this.onDepartementSelected(event.detail.departement)}"
                  .suggest="${State.current.autocomplete.suggest.bind(State.current.autocomplete)}"
                  .value="${this.currentSelection}"
            >
            </vmd-commune-or-departement-selector>
        `;
    }

    private onCommuneSelected (commune: Commune) {
      this.currentSelection = commune
      this.dispatchEvent(new CustomEvent<SearchRequest.ByCommune>('on-search', {
        detail: {
          par: 'commune',
          commune
        }
      }))
    }

    private onDepartementSelected (departement: Departement) {
      this.currentSelection = departement
      this.dispatchEvent(new CustomEvent<SearchRequest.ByDepartement>('on-search', {
        detail: {
          par: 'departement',
          departement
        }
      }))
    }
}
