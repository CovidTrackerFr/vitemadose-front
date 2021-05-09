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
import {Strings} from "../utils/Strings";
import {TemplateResult} from "lit-html";
import {CSS_Global} from "../styles/ConstructibleStyleSheets";

export type AutocompleteTriggered = { value: string };
export type CommuneSelected = { commune: Commune };
export type DepartementSelected = { departement: Departement };
export type ValueStrCustomEvent<T extends string> = CustomEvent<{value: T}>;

type DepartementRecherchable = Departement & {
    fullTextSearchableNom: string;
    fullTextSearchableCodeDepartement: string;
};

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

    @property({type: String}) codeCommuneSelectionne: string | undefined = undefined;

    @internalProperty() inputHasFocus: boolean = false;
    @query(".autocomplete-input") $autoCompleteInput: HTMLInputElement | undefined;
    @query(".autocomplete-results") $autoCompleteResults: HTMLUListElement | undefined;
    @query(".autocomplete-result[aria-selected='true']") $autoCompleteSelectedResult: HTMLOptionElement | undefined;

    @property({type: Array, attribute: false}) autocompleteTriggers: Set<string>|undefined;
    @internalProperty() recuperationCommunesEnCours: boolean = false;
    @property({type: Array, attribute: false}) set communesDisponibles(cd: Commune[]|undefined) {
        if(cd !== this._communesDisponibles) {
            this._communesDisponibles = cd;
            this.filtrerCommunesAffichees();
            this.requestUpdate('communesDisponibles');
            this.requestUpdate('communesAffichees');
        }
    }
    get communesDisponibles(): Commune[]|undefined{ return this._communesDisponibles; }
    private _communesDisponibles: Commune[]|undefined = undefined;

    @internalProperty() communesAffichees: Commune[]|undefined = undefined;
    @internalProperty() departementsAffiches: Departement[] = [];
    @internalProperty() filter: string = "";

    private filterMatchingAutocomplete: string|undefined = undefined;

    get showDropdown() {
        return this.inputHasFocus
            && this.filter
            // This one is done because otherwise we would start showing some departments matching
            // first digit, and this would encourage search by department (whereas search by commune
            // is by far better)
            && this.filter.length >= 2
            && !this.dropDownVide();
    }

    get communeSelectionnee(): Commune | undefined {
        let communesDisponibles = this.communesDisponibles;
        if(this.codeCommuneSelectionne && communesDisponibles) {
            return communesDisponibles.find(c => c.code === this.codeCommuneSelectionne);
        }
        return undefined;
    }

    protected aucuneCommuneAffichee(): boolean {
        return !this.communesAffichees || !this.communesAffichees.length;
    }

    private filtrerCommunesAffichees() {
        // /!\ important note : this is important to have the same implementation of toFullTextSearchableString()
        // function here, than the one used in communes-import.js tooling
        const fullTextSearchableQuery = Strings.toFullTextSearchableString(this.filter)

        this.communesAffichees = this.communesDisponibles?this.communesDisponibles.filter(commune => {
            const fullTextSearchableNomCommune = Strings.toFullTextSearchableString(commune.nom)

            return commune.codePostal.indexOf(fullTextSearchableQuery) === 0
                || fullTextSearchableNomCommune.indexOf(fullTextSearchableQuery) !== -1;
        }).filter((_, index) => index < 50):undefined;
    }

    constructor() {
        super();
    }

    communeSelected(commune: Commune) {
        this.filter = `${commune.codePostal} - ${commune.nom}`;
        this.communesDisponibles = [];

        this.dispatchEvent(new CustomEvent<CommuneSelected>('on-commune-selected', {
            detail: {
                commune
            }
        }));
    }

    hideDropdownWhenInputHasNotFocus() {
        // That's a hacky workaround because I don't know how to handle this more cleanly..
        // The problem is  linked to .autocomplete's @focusout and .switch-to-text's @click
        // It appears that when we click the .switch-to-text <li> tag, .autocomplete's @focusout
        // event is triggered first (strangely far before than .switch-to-text's @click)
        // If we would directly update this.inputHasFocus, I don't know how, but it looks like
        // rendering would happen before .switch-to-text's @click is triggered, thus removing it from
        // the DOM and totally disabling its event capture (thus, not triggering the click handler at all)
        // By adding the setTimeout with a proper duration (note that 50ms wouldn't be enough.. it would
        // still remove the <li> from the DOM prior to it being clicked), we ensure that the @click
        // will be triggered on .switch-to-text first, _then_ the .autocomplete's @focusout will
        // be trigerred
        setTimeout(() => {
            this.inputHasFocus = (this.shadowRoot!.querySelector("input") === this.shadowRoot!.activeElement);
        }, 300);
    }

    render() {
        return html`
          <form class="row align-items-center"
                @submit="${this.handleSubmit}">
            <label for="searchAppointment-searchbar" class="col-sm-24 col-md-auto mb-md-1 label-for-search p-3 ps-1">
                Localisation :
            </label>
            <div class="px-0 col autocomplete ${classMap({'_open': this.showDropdown, '_withButton': this.filter !== ''})}">
                <input type="search" class="autocomplete-input"
                    required
                    @focusin="${() => { this.inputHasFocus = true; window.scroll({ top: this.offsetTop - 32, behavior: 'smooth' }); }}"
                    @focusout="${this.hideDropdownWhenInputHasNotFocus}"
                    @keydown="${this.handleKeydown}"
                    @keyup="${this.valueChanged}"
                    .value="${this.filter}"
                    placeholder="Commune, Code postal, Département..."
                    id="searchAppointment-searchbar"
                />
                ${this.filter?html`
                <button type="button" class="autocomplete-button" @click="${() => { this.filter = ''; this.shadowRoot!.querySelector("input")!.focus(); } }"><span>${SVG_CLOSE_ICON}</span></button>
                `:html``}
                ${this.recuperationCommunesEnCours?html`
                <div class="spinner-border text-primary" style="height: 25px; width: 25px" role="status">
                </div>
                `:html``}
                ${this.showDropdown?html`<ul class="autocomplete-results">${this.renderListItems()}</ul>`:html``}
            </div>
          </form>
        `;
    }

    connectedCallback() {
        super.connectedCallback();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    fillCommune(commune: Commune | undefined, autoCompleteCodePostal: string) {
        this.filter = `${commune?commune.codePostal:"???"} - ${commune?commune.nom:"???"}`;
        this.filterMatchingAutocomplete = autoCompleteCodePostal;
    }

    @property({type: Array, attribute: false}) set departementsDisponibles(dpts: Departement[]) {
        this.departementsCherchables = dpts.map(d => ({...d,
            fullTextSearchableCodeDepartement: Strings.toFullTextSearchableString(d.code_departement),
            fullTextSearchableNom: Strings.toFullTextSearchableString(d.nom_departement)
        }));
    }
    @internalProperty() departementsCherchables: DepartementRecherchable[] = [];

    departementSelectionne(dpt: Departement) {
        this.filter = `${dpt.code_departement} - ${dpt.nom_departement}`;
        this.communesDisponibles = [];
        this.departementsAffiches = [];

        this.dispatchEvent(new CustomEvent<DepartementSelected>('on-departement-selected', {
            detail: {
                departement: dpt
            }
        }));
    }

    valueChanged(event: KeyboardEvent) {
        const keysToIgnore = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'];
        if (keysToIgnore.includes(event.key)) {
          return
        }
        // Retrieving current filter
        this.filter = (event.currentTarget as HTMLInputElement).value;

        // If we previously matched an autocomplete filter previously, checking that what we matched
        // is still at the 'start' of current filter
        // This is intended to detect start of filter string modifications which would invalidate
        // the current autocompleteFilter
        if(this.filterMatchingAutocomplete && !this.filter.startsWith(this.filterMatchingAutocomplete)) {
            this.filterMatchingAutocomplete = undefined;
        }

        if(this.filter && this.autocompleteTriggers) {
            // Checking every possible substrings of this.filter
            // For exemple, if this.filter = "abcdef", we're testing "a", then "ab", then "abc" etc..
            // against this.autocompleteTriggers, to see if one matches
            // And if one matches, comparing if this is the same than for previous this.filter's value
            // If it didn't changed, then we only have to refresh filtered communes with the new this.filter value
            // If it changed, then we need to raise a new autocomplete-triggered event, so that
            // communesDisponibles is updated with a new autocomplete key
            const filterMatchedAnAutocomplete = this.filter.split('').some((_, filterSizeAttempt) => {
                let filterAttempt = this.filter.substring(0, this.filter.length - filterSizeAttempt);
                const searchableFilterAttempt = Strings.toFullTextSearchableString(filterAttempt);
                if(this.autocompleteTriggers!.has(searchableFilterAttempt)) {
                    if(filterAttempt === this.filterMatchingAutocomplete) {
                        this.filtrerCommunesAffichees();
                    } else {
                        this.filterMatchingAutocomplete = filterAttempt;
                        this.dispatchEvent(new CustomEvent<AutocompleteTriggered>('autocomplete-triggered', {
                            detail: {
                                value: searchableFilterAttempt
                            }
                        }));
                    }
                    return true;
                }
                return false;
            });

            // In the case we didn't changed any autocomplete trigger yet (typically, when we entered a
            // too-short this.filter), then we ensure that communesDisponibles are left empty
            if(!filterMatchedAnAutocomplete) {
                this.communesDisponibles = [];
            }
        }

        this.filtrerDepartementsAffichees();

        if (this.$autoCompleteResults) {
            this.$autoCompleteResults.scrollTop = 0;
        }
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

    protected dropDownVide(): boolean {
        return this.aucuneCommuneAffichee() && !this.departementsAffiches.length;
    }

    private filtrerDepartementsAffichees() {
        const fullTextSearchableQuery = Strings.toFullTextSearchableString(this.filter)

        this.departementsAffiches = this.departementsCherchables.filter(dpt => {
            return dpt.fullTextSearchableCodeDepartement.startsWith(fullTextSearchableQuery)
                || dpt.fullTextSearchableNom.includes(fullTextSearchableQuery)
        });
    }

    renderListItems(): TemplateResult {
        const suggestionsCommunes = repeat(this.communesAffichees || [], (c) => `comm_${c.codePostal}__${c.nom}`, this.renderCommuneItem.bind(this))
        const suggestionsDépartements = repeat(this.departementsAffiches || [], (d) => `dept_${d.code_departement}__${d.nom_departement}`, this.renderDepartementItem.bind(this))
        return html`
            ${suggestionsDépartements}
            ${suggestionsCommunes}
        `;
    }

    private renderCommuneItem (commune: Commune, index: number) {
      return html`<li
        class="autocomplete-result"
        role="option"
        aria-selected="${index === 0 && this.departementsAffiches.length === 0}"
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
        @click="${() => this.departementSelectionne(dpt)}"
        >
          <span class="codeDepartement">${dpt.code_departement}</span> - ${dpt.nom_departement}
        </li>`
    }

    fillDepartement(departement: Departement) {
        this.filter = `${departement.code_departement} - ${departement.nom_departement}`
    }
}
