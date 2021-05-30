import {
    css,
    customElement,
    html,
    internalProperty,
    LitElement,
    property,
    query,
    unsafeCSS
} from 'lit-element';
import {classMap} from "lit-html/directives/class-map";
import {Commune, Departement} from "../state/State";
import {repeat} from "lit-html/directives/repeat";
import communeSelectorCss from "./vmd-commune-or-departement-selector.component.scss";
import {CSS_Global} from "../styles/ConstructibleStyleSheets";

export type AutocompleteTriggered = { value: string };
export type CommuneSelected = { commune: Commune };
export type DepartementSelected = { departement: Departement };
export type ValueStrCustomEvent<T extends string> = CustomEvent<{value: T}>;

const SVG_CLOSE_ICON = html`<svg width="25" height="25" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd" fill="black"><path d="M12 0c6.623 0 12 5.377 12 12s-5.377 12-12 12-12-5.377-12-12 5.377-12 12-12zm0 1c6.071 0 11 4.929 11 11s-4.929 11-11 11-11-4.929-11-11 4.929-11 11-11zm0 10.293l5.293-5.293.707.707-5.293 5.293 5.293 5.293-.707.707-5.293-5.293-5.293 5.293-.707-.707 5.293-5.293-5.293-5.293.707-.707 5.293 5.293z"/></svg>`

@customElement('vmd-commune-or-departement-selector')
export class VmdCommuneOrDepartmentSelectorComponent extends LitElement {

    //language=css
    static styles = [
        CSS_Global,
        css`${unsafeCSS(communeSelectorCss)}`,
        css`
        `
    ];
    @property({type: Function}) suggest!: (prefix: string) => Promise<Array<Commune|Departement>>

    @property({type: Object})
    set value (v: Commune | Departement | undefined) {
      this._currentValue = v
      if (v === undefined) {
        this.filter = ''
      } else if (this.suggestionIsDepartement(v)) {
        this.fillDepartement(v)
      } else {
        this.fillCommune(v)
      }
    }
    @internalProperty() private _currentValue: Commune | Departement | void = undefined
    @internalProperty() inputHasFocus: boolean = false;
    @query(".autocomplete-input") $autoCompleteInput: HTMLInputElement | undefined;
    @query(".autocomplete-results") $autoCompleteResults: HTMLUListElement | undefined;
    @query(".autocomplete-result[aria-selected='true']") $autoCompleteSelectedResult: HTMLOptionElement | undefined;

    @internalProperty() filter: string = "";
    @internalProperty() suggestions: Array<Commune|Departement> = []
    @internalProperty() currentTaskMarker: {} | void = undefined

    render() {
        return html`
          <form class="row align-items-center"
                @submit="${this.handleSubmit}">
            <label for="searchAppointment-searchbar" class="col-sm-24 col-md-auto mb-md-1 label-for-search p-3 ps-1">
                Localisation :
            </label>
            <div class="px-0 col autocomplete ${classMap({'_open': this.showDropdown, '_withButton': this.filter !== ''})}">
                <input type="search" class="autocomplete-input"
                    autocomplete="off"
                    required
                    @focusin="${this.onFocusIn}"
                    @focusout="${this.onInputBlur}"
                    @keydown="${this.handleKeydown}"
                    @keyup="${this.valueChanged}"
                    .value="${this.filter}"
                    placeholder="Commune, Code postal, Département..."
                    id="searchAppointment-searchbar"
                />
                ${this.filter?html`
                <button type="button" title="Effacer la localisation" class="autocomplete-button" @click="${() => { this.filter = ''; this.shadowRoot!.querySelector("input")!.focus(); } }"><span>${SVG_CLOSE_ICON}</span></button>
                `:html``}
                ${this.recupérationEnCours ? html`
                <div class="spinner-border text-primary" role="status">
                </div>
                `:html``}
                ${this.showDropdown?html`<ul role="listbox" class="autocomplete-results">${this.renderListItems()}</ul>`:html``}
            </div>
          </form>
        `;
    }

    renderListItems() {
        return repeat(this.suggestions, this.keyForSuggestion.bind(this), (suggestion, index) => {
          if (this.suggestionIsDepartement(suggestion)) {
            return this.renderDepartementItem(suggestion, index)
          } else {
            return this.renderCommuneItem(suggestion, index)
          }
        })
    }

    private onFocusIn (e: Event) {
      this.inputHasFocus = true
      if(window.matchMedia("(max-width: 700px)").matches) {
        window.scroll({ top: this.offsetTop - 32, behavior: 'smooth' })
      }
      
      const input = e.target as HTMLInputElement
      if (this._currentValue && input) {
        input.select()
      }
    }

    get recupérationEnCours () {
      return !!this.currentTaskMarker
    }

    get showDropdown() {
        return this.inputHasFocus
            && this.filter
            && this.suggestions.length > 0;
    }

    private onInputBlur () {
      setTimeout(() => {
          this.inputHasFocus = (this.shadowRoot!.querySelector("input") === this.shadowRoot!.activeElement);
      }, 300);
    }

    private async valueChanged(event: KeyboardEvent) {
      const input = event.currentTarget as HTMLInputElement
      if (event.code === 'Escape') {
        input.blur()
      }
      const keysToIgnore = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'];
      if (keysToIgnore.includes(event.key)) {
        return
      }
      this.filter = input.value;
      const marker = {}
      this.currentTaskMarker = marker
      const suggestions = await this.suggest(this.filter)
      if (this.currentTaskMarker !== marker) {
        // A newer autocompletion is ongoing
        return
      }
      this.suggestions = suggestions
      this.currentTaskMarker = undefined
    }

    private departementSelected(dpt: Departement) {
        this.suggestions = []
        this.filter = `${dpt.code_departement} - ${dpt.nom_departement}`;
        this.dispatchEvent(new CustomEvent<DepartementSelected>('on-departement-selected', {
            detail: {
                departement: dpt
            }
        }));
    }

    handleSubmit(event: Event) {
        event.preventDefault();
        if(this.$autoCompleteSelectedResult) {
            this.$autoCompleteSelectedResult.click();
            this.$autoCompleteInput?.blur();
        }
    }

    handleKeydown(event: KeyboardEvent) {
        switch (event.key) {
            case 'ArrowUp':
                event.preventDefault();
                const prevOption = this.$autoCompleteSelectedResult?.previousElementSibling;
                if(prevOption){
                    this.$autoCompleteSelectedResult?.setAttribute('aria-selected','false');
                    prevOption.setAttribute('aria-selected','true');
                }
                this.scrollToOption('up');
                break;
            case 'ArrowDown':
                event.preventDefault();
                const nextOption = this.$autoCompleteSelectedResult?.nextElementSibling;
                if(nextOption){
                    this.$autoCompleteSelectedResult?.setAttribute('aria-selected','false');
                    nextOption.setAttribute('aria-selected','true');
                }
                this.scrollToOption('down');
                break;
            default:
                break;
        }
    }

    scrollToOption(direction: 'up' | 'down') {
        const containerPosition = this.$autoCompleteResults?.getBoundingClientRect();
        const optionPosition = this.$autoCompleteSelectedResult?.getBoundingClientRect();

        if (this.$autoCompleteResults && containerPosition && optionPosition) {
            if (direction === 'down' && optionPosition.bottom > containerPosition.bottom) {
                this.$autoCompleteResults.scrollTop += optionPosition.bottom - containerPosition.bottom;
            } else if (direction === 'up' && optionPosition.top < containerPosition.top) {
                this.$autoCompleteResults.scrollTop -= containerPosition.top - optionPosition.top;
            }
        }
    }
    private communeSelected(commune: Commune) {
        this.suggestions = []
        this.filter = `${commune.codePostal} - ${commune.nom}`;
        this.dispatchEvent(new CustomEvent<CommuneSelected>('on-commune-selected', {
            detail: {
                commune
            }
        }));
    }

    private fillDepartement(departement: Departement) {
        this.filter = `${departement.code_departement} - ${departement.nom_departement}`
    }

    private fillCommune(commune: Commune) {
        this.filter = `${commune?commune.codePostal:"???"} - ${commune?commune.nom:"???"}`;
    }

    private renderCommuneItem (commune: Commune, index: number) {
      return html`<li
        class="autocomplete-result"
        role="option"
        aria-selected="${index === 0}"
        @click="${() => this.communeSelected(commune)}"
        >
          <span class="zipcode">${commune.codePostal}</span> - ${commune.nom}
      </li>`
    }

    private renderDepartementItem (dpt: Departement, index: number) {
      return html`<li
        class="autocomplete-result"
        role="option"
        aria-selected="${index === 0}"
        @click="${() => this.departementSelected(dpt)}"
        >
          <span class="codeDepartement">${dpt.code_departement}</span> - ${dpt.nom_departement}
        </li>`
    }

    private suggestionIsDepartement (suggestion: Departement|Commune): suggestion is Departement {
      return suggestion.hasOwnProperty('code_departement')
    }

    private keyForSuggestion(suggestion: Commune|Departement): string {
      if (this.suggestionIsDepartement(suggestion)) {
        return `dep_${suggestion.code_departement}`
      } else {
        return `com_${suggestion.codePostal}_${suggestion.nom}`
      }
    }
}
