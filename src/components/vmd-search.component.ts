import {css, customElement, html, LitElement, internalProperty, property } from 'lit-element';
import {SearchRequest, SearchType} from '../state/State'
import {
    Commune,
    Departement,
    Region,
    State,
} from "../state/State";
import {
    CommuneSelected,
    DepartementSelected,
    RegionSelected,
} from "./vmd-lieu-selector.component";

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
          if (SearchRequest.isByRegion(searchRequest)) {
              this.currentSelection = searchRequest.region
          } else if (SearchRequest.isByDepartement(searchRequest)) {
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
    @internalProperty() private currentSelection: Commune | Departement | Region | void = undefined
    @internalProperty() private currentSearchType: SearchType | void = undefined

    render() {
        return html`
            <vmd-lieu-selector class="mb-3"
                  @on-commune-selected="${(event: CustomEvent<CommuneSelected>) => this.onCommuneSelected(event.detail.commune)}"
                  @on-departement-selected="${(event: CustomEvent<DepartementSelected>) => this.onDepartementSelected(event.detail.departement)}"
                  @on-region-selected="${(event: CustomEvent<RegionSelected>) => this.onRegionSelected(event.detail.region)}"
                  .suggest="${State.current.autocomplete.suggest.bind(State.current.autocomplete)}"
                  .value="${this.currentSelection}"
            >
            </vmd-lieu-selector>
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

    private onRegionSelected (region: Region) {
      this.currentSelection = region
      this.dispatchEvent(new CustomEvent<SearchRequest.ByRegion>('on-search', {
        detail: SearchRequest.ByRegion(region, this.currentSearchType || 'standard')
      }))
    }
}
