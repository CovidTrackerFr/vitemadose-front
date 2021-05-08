import {css, customElement, html, LitElement, internalProperty, property } from 'lit-element';
import {SearchRequest, SearchType} from '../state/State'
import {
    Commune,
    Departement,
    State,
} from "../state/State";
import {
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
        this.currentSearchType = undefined
      } else {
          this.currentSearchType = searchRequest.type
          if (SearchRequest.isByDepartement(searchRequest)) {
              this.currentSelection = searchRequest.departement
          } else {
              this.currentSelection = searchRequest.commune
          }
      }
      this.currentValue = searchRequest
    }
    public get value (): SearchRequest | void {
      return this.currentValue
    }
    @internalProperty() private currentValue: SearchRequest | void = undefined
    @internalProperty() private currentSelection: Commune | Departement | void = undefined
    @internalProperty() private currentSearchType: SearchType | void = undefined

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
        detail: SearchRequest.ByCommune(commune, 'distance', this.currentSearchType || 'standard')
      }))
    }

    private onDepartementSelected (departement: Departement) {
      this.currentSelection = departement
      this.dispatchEvent(new CustomEvent<SearchRequest.ByDepartement>('on-search', {
        detail: SearchRequest.ByDepartement(departement, this.currentSearchType || 'standard')
      }))
    }
}
