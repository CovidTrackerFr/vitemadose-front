import {css, customElement, html, LitElement, internalProperty, property } from 'lit-element';
import {DoseType, SearchRequest, SearchType, TYPE_RECHERCHE_PAR_DEFAUT} from '../state/State'
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
    @property() public set value (searchRequest: SearchRequest | undefined) {
      if (!searchRequest) {
        this.currentSelection = undefined
        this.currentSearchType = undefined
      } else {
          this.currentSearchType = searchRequest.type
          this.doseType = searchRequest.doseType;
          if (SearchRequest.isByDepartement(searchRequest)) {
              this.currentSelection = searchRequest.departement
          } else {
              this.currentSelection = searchRequest.commune
          }
      }
      this.currentValue = searchRequest
    }
    public get value (): SearchRequest | undefined {
      return this.currentValue
    }
    @internalProperty() private currentValue: SearchRequest | undefined = undefined
    @internalProperty() private currentSelection: Commune | Departement | undefined = undefined
    @internalProperty() private currentSearchType: SearchType | undefined = undefined
    @internalProperty() private doseType: DoseType | undefined = undefined

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
        detail: SearchRequest.ByCommune(commune, this.currentSearchType || TYPE_RECHERCHE_PAR_DEFAUT,
            this.currentValue?.date, this.doseType || 'covid')
      }))
    }

    private onDepartementSelected (departement: Departement) {
      this.currentSelection = departement
      this.dispatchEvent(new CustomEvent<SearchRequest.ByDepartement>('on-search', {
        detail: SearchRequest.ByDepartement(departement, this.currentSearchType || TYPE_RECHERCHE_PAR_DEFAUT,
            this.currentValue?.date, this.doseType || 'covid')
      }))
    }
}
