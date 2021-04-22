import { css, customElement, html, LitElement, property, unsafeCSS } from "lit-element";
import { classMap } from "lit-html/directives/class-map";
import { Commune, Departement } from "../state/State";
import { repeat } from "lit-html/directives/repeat";
import communeSelectorCss from "./vmd-commune-selector.component.scss";
import globalCss from "../styles/global.scss";
import { Strings } from "../utils/Strings";
import { TemplateResult } from "lit-html";
import { DirectiveFn } from "lit-html/lib/directive";

export type AutocompleteTriggered = { value: string };
export type CommuneSelected = { commune: Commune };
export type DepartementSelected = { departement: Departement };

@customElement("vmd-commune-selector")
export class VmdCommuneSelectorComponent extends LitElement {
  //language=css
  static styles = [
    css`
      ${unsafeCSS(globalCss)}
    `,
    css`
      ${unsafeCSS(communeSelectorCss)}
    `,
    css``,
  ];

  @property({ type: String }) codeCommuneSelectionne: string | undefined = undefined;

  @property({ type: Boolean, attribute: false }) inputHasFocus: boolean = false;
  @property({ type: Boolean, attribute: false }) inputModeFixedToText = true;
  @property({ type: String, attribute: false }) inputMode: "numeric" | "text" = "numeric";
  @property({ type: String, attribute: false }) communeHiglight: Commune | undefined;
  @property({ type: String, attribute: false }) departementHiglight: Departement | undefined;
  @property({ type: String, attribute: false }) itemIndexHiglight: Commune | Departement | undefined;

  @property({ type: Array, attribute: false }) autocompleteTriggers: Set<string> | undefined;
  @property({ type: Boolean, attribute: false }) recuperationCommunesEnCours: boolean = false;
  @property({ type: Array, attribute: false }) set communesDisponibles(cd: Commune[] | undefined) {
    if (cd !== this._communesDisponibles) {
      this._communesDisponibles = cd;
      this.filtrerCommunesAffichees();
      this.requestUpdate("communesDisponibles");
      this.requestUpdate("communesAffichees");
    }
  }
  get communesDisponibles(): Commune[] | undefined {
    return this._communesDisponibles;
  }
  private _communesDisponibles: Commune[] | undefined = undefined;

  @property({ type: Array, attribute: false }) communesAffichees: Commune[] | undefined = undefined;
  @property({ type: String, attribute: false }) filter: string = "";

  private filterMatchingAutocomplete: string | undefined = undefined;

  get showDropdown() {
    return (
      this.inputHasFocus &&
      ((this.inputMode === "text" && this.communesAffichees && this.communesAffichees.length) ||
        this.inputMode === "numeric")
    );
  }

  get communeSelectionnee(): Commune | undefined {
    let communesDisponibles = this.communesDisponibles;
    if (this.codeCommuneSelectionne && communesDisponibles) {
      return communesDisponibles.find((c) => c.code === this.codeCommuneSelectionne);
    }
    return undefined;
  }

  private filtrerCommunesAffichees() {
    // /!\ important note : this is important to have the same implementation of toFullTextSearchableString()
    // function here, than the one used in communes-import.js tooling
    const fullTextSearchableQuery = Strings.toFullTextSearchableString(this.filter);

    this.communesAffichees = this.communesDisponibles
      ? this.communesDisponibles
          .filter((commune) => {
            const fullTextSearchableNomCommune = Strings.toFullTextSearchableString(commune.nom);

            return (
              commune.codePostal.indexOf(fullTextSearchableQuery) === 0 ||
              fullTextSearchableNomCommune.indexOf(fullTextSearchableQuery) !== -1
            );
          })
          .filter((_, index) => index < 50)
      : undefined;

    this.communeHiglight = this.communesAffichees ? this.communesAffichees[0] : undefined;
    console.log("this.communeHiglight", this.communeHiglight);
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
    if (this.filterMatchingAutocomplete && this.filter.indexOf(this.filterMatchingAutocomplete) !== 0) {
      this.filterMatchingAutocomplete = undefined;
    }

    if (this.filter && this.autocompleteTriggers) {
      // Checking every possible substrings of this.filter
      // For exemple, if this.filter = "abcdef", we're testing "a", then "ab", then "abc" etc..
      // against this.autocompleteTriggeres, to see if one matches
      // And if one matches, comparing if this is the same than for previous this.filter's value
      // If it didn't changed, then we only have to refresh filtered communes with the new this.filter value
      // If it changed, then we need to raise a new autocomplete-triggered event, so that
      // communesDisponibles is updated with a new autocomplete key
      const filterMatchedAnAutocomplete = this.filter.split("").some((_, filterSizeAttempt) => {
        const filterAttempt = this.filter.substring(0, this.filter.length - filterSizeAttempt);
        const searchableFilterAttempt = Strings.toFullTextSearchableString(filterAttempt);
        if (this.autocompleteTriggers!.has(searchableFilterAttempt)) {
          if (filterAttempt === this.filterMatchingAutocomplete) {
            this.filtrerCommunesAffichees();
          } else {
            this.filterMatchingAutocomplete = filterAttempt;
            this.dispatchEvent(
              new CustomEvent<AutocompleteTriggered>("autocomplete-triggered", {
                detail: {
                  value: searchableFilterAttempt,
                },
              })
            );
          }
          return true;
        }
        return false;
      });

      // In the case we didn't changed any autocomplete trigger yet (typically, when we entered a
      // too-short this.filter), then we ensure that communesDisponibles are left empty
      if (!filterMatchedAnAutocomplete) {
        this.communesDisponibles = [];
        this.communeHiglight = undefined;
      }
    }
  }

  communeSelected(commune: Commune) {
    this.filter = `${commune.codePostal} - ${commune.nom}`;
    this.communesDisponibles = [];

    this.dispatchEvent(
      new CustomEvent<CommuneSelected>("on-commune-selected", {
        detail: {
          commune,
        },
      })
    );
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
      this.inputHasFocus = this.shadowRoot!.querySelector("input") === this.shadowRoot!.activeElement;
    }, 300);
  }

  render() {
    return html`
      <div
        class="autocomplete ${classMap({
          _open: this.showDropdown,
          _withButton: this.filter || !this.inputModeFixedToText,
        })}"
      >
        <input
          type="text"
          class="autocomplete-input"
          @focusin="${() => {
            this.inputHasFocus = true;
          }}"
          @focusout="${this.hideDropdownWhenInputHasNotFocus}"
          @keyup="${this.valueChanged}"
          .value="${this.filter}"
          inputmode="${this.inputMode}"
          placeholder="${this.inputModeFixedToText
            ? "Commune, Code postal, Département..."
            : this.inputMode === "numeric"
            ? "Saisissez un code postal"
            : "Saisissez un nom de commune"}"
        />
        ${this.filter
          ? html`
              <button
                class="autocomplete-button"
                @click="${() => {
                  this.filter = "";
                  this.shadowRoot!.querySelector("input")!.focus();
                }}"
              >
                <span>X</span>
              </button>
            `
          : html``}
        ${this.inputModeFixedToText
          ? html``
          : html`
              <button class="autocomplete-button">
                <span>${this.inputMode === "numeric" ? html`0-9` : html`A-Z`}</span>
              </button>
            `}
        ${this.recuperationCommunesEnCours
          ? html` <div class="spinner-border text-primary" style="height: 25px; width: 25px" role="status"></div> `
          : html``}
        ${this.showDropdown
          ? html`
              <ul class="autocomplete-results" role="listbox">
                ${this.inputMode === "numeric" && (!this.communesAffichees || !this.communesAffichees.length)
                  ? html`
                      <li
                        class="autocomplete-result switch-to-text"
                        role="option"
                        @click="${() => {
                          this.inputMode = "text";
                          this.shadowRoot!.querySelector("input")!.focus();
                        }}"
                      >
                        <em>Je ne connais pas le code postal</em>
                      </li>
                    `
                  : html``}
                ${this.renderListItems()}
              </ul>
            `
          : html``}
      </div>
    `;
  }

  renderListItems(): TemplateResult | DirectiveFn {
    return repeat(
      this.communesAffichees || [],
      (c) => `comm_${c.codePostal}__${c.nom}`,
      (commune, index) => {
        return html`<li
          class="autocomplete-result ${!this.departementHiglight && commune === this.communeHiglight
            ? "autocomplete-result__highlight"
            : ""}"
          role="option"
          @mouseover="${() => {
            this.communeHiglight = commune;
            this.departementHiglight = undefined;
          }}"
          @click="${() => this.communeSelected(commune)}"
        >
          <span class="zipcode">${commune.codePostal}</span> - ${commune.nom}
          ${!this.departementHiglight && commune === this.communeHiglight ? "❤" : ""}
        </li>`;
      }
    );
  }

  connectedCallback() {
    super.connectedCallback();

    if (this.inputModeFixedToText) {
      this.inputMode = "text";
    }
    // console.log("connected callback")
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // console.log("disconnected callback")
  }

  fillCommune(commune: Commune | undefined, autoCompleteCodePostal: string) {
    this.filter = `${commune ? commune.codePostal : "???"} - ${commune ? commune.nom : "???"}`;
    this.filterMatchingAutocomplete = autoCompleteCodePostal;
  }
}

@customElement("vmd-commune-or-departement-selector")
export class VmdCommuneOrDepartmentSelectorComponent extends VmdCommuneSelectorComponent {
  @property({ type: Array, attribute: false }) departementsDisponibles: Departement[] = [];
  @property({ type: Array, attribute: false }) departementsAffiches: Departement[] = [];

  departementSelectionne(dpt: Departement) {
    this.filter = `${dpt.code_departement} - ${dpt.nom_departement}`;
    this.communesDisponibles = [];
    this.departementsAffiches = [];

    this.dispatchEvent(
      new CustomEvent<DepartementSelected>("on-departement-selected", {
        detail: {
          departement: dpt,
        },
      })
    );
  }

  valueChanged(event: KeyboardEvent) {
    console.log(event.key);

    switch (event.key) {
      case "Enter":
        if (this.departementHiglight) {
          this.departementSelectionne(this.departementHiglight);
        } else if (this.communeHiglight) {
          this.communeSelected(this.communeHiglight);
        }
        break;

      case "ArrowUp":
        event.preventDefault();
        this.goToPreviousCommune();
        break;
      case "ArrowDown":
        event.preventDefault();
        this.goToNextCommune();
        break;

      default:
        super.valueChanged(event);
        this.filtrerDepartementsAffichees();
        break;
    }
  }

  goToPreviousCommune() {
    if (this.departementHiglight) {
      const prevIndex = this.departementsAffiches.indexOf(this.departementHiglight) - 1;
      if (prevIndex >= 0) {
        this.departementHiglight = this.departementsAffiches[prevIndex];
      }
    } else if (this.communeHiglight && this.communesAffichees) {
      const prevIndex = this.communesAffichees.indexOf(this.communeHiglight) - 1;
      if (prevIndex >= 0) {
        this.communeHiglight = this.communesAffichees[prevIndex];
      } else if (this.departementsAffiches) {
        this.communeHiglight = this.communeHiglight;
        // show the latest dept
        this.departementHiglight = this.departementsAffiches[this.departementsAffiches.length - 1];
      }
    }

    console.log(
      "dept",
      this.departementHiglight && this.departementsAffiches
        ? this.departementsAffiches.indexOf(this.departementHiglight) + 1
        : undefined,
      this.departementsAffiches.length,

      this.departementHiglight,
      "comm",
      this.communeHiglight && this.communesAffichees
        ? this.communesAffichees.indexOf(this.communeHiglight) + 1
        : undefined,
      this.communesAffichees?.length,
      this.communeHiglight
    );
  }
  goToNextCommune() {
    if (this.departementHiglight) {
      const nextIndex = this.departementsAffiches.indexOf(this.departementHiglight) + 1;
      if (nextIndex < this.departementsAffiches.length) {
        this.departementHiglight = this.departementsAffiches[nextIndex];
      } else if (this.communesAffichees) {
        this.departementHiglight = undefined;
        // show the first comm
        this.communeHiglight = this.communesAffichees[0];
      }
    } else if (this.communeHiglight && this.communesAffichees) {
      const nextIndex = this.communesAffichees.indexOf(this.communeHiglight) + 1;
      if (nextIndex < this.communesAffichees.length) {
        this.communeHiglight = this.communesAffichees[nextIndex];
      } else {
        // this.communeHiglight = undefined;
        // // show the latest dept
        // this.departementHiglight = this.departementsAffiches
        //   ? this.departementsAffiches[this.departementsAffiches.length]
        //   : undefined;
      }
    }
    console.log(
      "dept",
      this.departementHiglight && this.departementsAffiches
        ? this.departementsAffiches.indexOf(this.departementHiglight) + 1
        : undefined,
      this.departementsAffiches.length,

      this.departementHiglight,
      "comm",
      this.communeHiglight && this.communesAffichees
        ? this.communesAffichees.indexOf(this.communeHiglight) + 1
        : undefined,
      this.communesAffichees?.length,
      this.communeHiglight
    );
  }

  private filtrerDepartementsAffichees() {
    const fullTextSearchableQuery = Strings.toFullTextSearchableString(this.filter);

    this.departementsAffiches = this.departementsDisponibles
      ? this.departementsDisponibles.filter((dpt) => {
          const fullTextSearchableNomCommune = Strings.toFullTextSearchableString(dpt.nom_departement);

          return (
            dpt.code_departement.indexOf(fullTextSearchableQuery) === 0 ||
            fullTextSearchableNomCommune.indexOf(fullTextSearchableQuery) !== -1
          );
        })
      : [];

    this.departementHiglight = this.departementsAffiches ? this.departementsAffiches[0] : undefined;
    console.log("this.departementHiglight", this.departementHiglight);
  }

  renderListItems(): TemplateResult | DirectiveFn {
    return html`
      ${repeat(
        this.departementsAffiches || [],
        (d) => `dept_${d.code_departement}__${d.nom_departement}`,
        (dpt, index) => {
          return html`<li
            class="autocomplete-result ${dpt === this.departementHiglight ? "autocomplete-result__highlight" : ""}"
            role="option"
            @mouseover="${() => {
              this.communeHiglight = undefined;
              this.departementHiglight = dpt;
            }}"
            @click="${() => this.departementSelectionne(dpt)}"
          >
            <span class="codeDepartement">${dpt.code_departement}</span> - ${dpt.nom_departement}
            ${dpt === this.departementHiglight ? "❤" : ""}
          </li>`;
        }
      )}
      ${super.renderListItems()}
    `;
  }

  fillDepartement(departement: Departement | undefined) {
    this.filter = `${departement ? departement.code_departement : "???"} - ${
      departement ? departement.nom_departement : "???"
    }`;
    // this.filterMatchingAutocomplete = autoCompleteCodePostal;
  }
}
