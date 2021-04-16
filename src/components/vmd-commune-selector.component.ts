import {LitElement, html, customElement, property, css, unsafeCSS} from 'lit-element';
import {classMap} from "lit-html/directives/class-map";
import {Commune} from "../state/State";
import {repeat} from "lit-html/directives/repeat";
import communeSelectorCss from "../styles/components/_communeSelector.scss";
import globalCss from "../styles/global.scss";
import {Strings} from "../utils/Strings";


export type AutocompleteTriggered = { value: string };
export type CommuneSelected = { commune: Commune };

@customElement('vmd-commune-selector')
export class VmdCommuneSelectorComponent extends LitElement {

    //language=css
    static styles = [
        css`${unsafeCSS(globalCss)}`,
        css`${unsafeCSS(communeSelectorCss)}`,
        css`
        `
    ];

    @property({type: String}) codeCommuneSelectionne: string | undefined = undefined;
    @property({type: String}) codePostalSelectionne: string | undefined = undefined;

    @property({type: Array, attribute: false}) autocompleteTriggers: Set<string>|undefined;
    @property({type: Boolean, attribute: false}) recuperationCommunesEnCours: boolean = false;
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
    @property({type: Array, attribute: false}) communesAffichees: Commune[]|undefined = undefined;
    @property({type: String, attribute: false}) filter: string = "";
    private filterMatchingAutocomplete: string|undefined = undefined;


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

    valueChanged(event: Event) {
        // Retrieving current filter
        this.filter = (event.currentTarget as HTMLInputElement).value;

        // If we previously matched an autocomplete filter previously, checking that what we matched
        // is still at the 'start' of current filter
        // This is intended to detected start of filter string modifications which would invalidate
        // the current autocompleteFilter
        if(this.filterMatchingAutocomplete && this.filter.indexOf(this.filterMatchingAutocomplete) !== 0) {
            this.filterMatchingAutocomplete = undefined;
        }

        if(this.filter && this.autocompleteTriggers) {
            // Checking every possible substrings of this.filter
            // For exemple, if this.filter = "abcdef", we're testing "a", then "ab", then "abc" etc..
            // against this.autocompleteTriggeres, to see if one matches
            // And if one matches, comparing if this is the same than for previous this.filter's value
            // If it didn't changed, then we only have to refresh filtered communes with the new this.filter value
            // If it changed, then we need to raise a new autocomplete-triggered event, so that
            // communesDisponibles is updated with a new autocomplete key
            const filterMatchedAnAutocomplete = this.filter.split('').some((_, filterSizeAttempt) => {
                let filterAttempt = this.filter.substring(0, filterSizeAttempt+1);
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

    private siwtchAutocompleteButtonFocusClass(handler: (classList: DOMTokenList) => void) {
        const $inputWithButton = this.shadowRoot!.querySelector('.autocomplete._withButton')
        if($inputWithButton) {
            handler($inputWithButton.classList);
        }
    }

    render() {
        return html`
          <div class="autocomplete _withButton ${classMap({'_open': (!!this.communesAffichees && !!this.communesAffichees.length)})}">
            <input type="text" class="autocomplete-input" @keyup="${this.valueChanged}" 
                   @focus="${() => this.siwtchAutocompleteButtonFocusClass((classList) => classList.add('_focus'))}"
                   @blur="${() => this.siwtchAutocompleteButtonFocusClass((classList) => classList.remove('_focus'))}" 
                   .value="${this.filter}" />
            <button class="autocomplete-button">Aa</button>
            ${this.recuperationCommunesEnCours?html`
              <div class="spinner-border text-primary" style="height: 25px; width: 25px" role="status">
              </div>
            `:html``}
            ${(this.communesAffichees && this.communesAffichees.length)?html`
              <ul class="autocomplete-results">
                ${repeat(this.communesAffichees, (c) => `${c.codePostal}__${c.nom}`, ((commune, index) => {
                    return html`<li class="autocomplete-result" @click="${() => this.communeSelected(commune)}"><span class="zipcode">${commune.codePostal}</span> - ${commune.nom}</li>`
                }))}
              </ul>
          </div>
            `:html``}
        `;
    }

    connectedCallback() {
        super.connectedCallback();
        // console.log("connected callback")
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        // console.log("disconnected callback")
    }

    fillCommune(commune: Commune | undefined, autoCompleteCodePostal: string) {
        this.filter = `${commune?commune.codePostal:"???"} - ${commune?commune.nom:"???"}`;
        this.filterMatchingAutocomplete = autoCompleteCodePostal;
    }
}
