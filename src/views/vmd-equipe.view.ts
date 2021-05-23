import {css, unsafeCSS, customElement, html, LitElement, internalProperty } from 'lit-element';
import {repeat} from "lit-html/directives/repeat";
import equipeCss from './vmd-equipe.view.scss'

import {
    Contributor,
    State,
} from "../state/State";

import {CSS_Global} from "../styles/ConstructibleStyleSheets";

const DEFAULT_PICTURE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5QUWFgkw2H/zhQAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAP0lEQVQY06WNQQ6AMBACGeL/n7XPWjw0sYnVHnSODASqSlISLdg+LnFrAN3tIdb1SKx3kvjxdd5ry08NfFwDJ0OrHVn+VpHQAAAAAElFTkSuQmCC'

@customElement('vmd-equipe')
export class VmdEquipe extends LitElement {
    static styles = [
        CSS_Global,
        css `${unsafeCSS(equipeCss)}`,
        css`
            :host {
                display: block;
            }
        `
    ];

    @internalProperty() team: Contributor[] = []

    render() {
        return html`
                <br>
                <div class="container">
                  <div class="row">
                    <div class="col">
                      <h2 class="h1">L'équipe</h2>
                    </div>
                  </div>
                  <div class="row">
                    <div class="col-24">
                      <p>Vite Ma Dose est conçu, développé et maintenu avec joie et entrain par une équipe d'au moins ${this.team.length} bénévoles.</p>
                    </div>
                  </div>
                </div>
                <br>

                <div class="container">
                  <div class="contributors">
                    ${repeat(this.team, (c) => c.pseudo, (c: Contributor) => this.renderContributor(c))}
                  </div>
                </div>
        `;
    }

    renderContributor (c: Contributor) {
      const content = html`
        <div class="photo">
          <img src="${c.photo || DEFAULT_PICTURE}" alt="Avatar de ${c.nom || c.pseudo}">
        </div>
        <div class="info">
          <h4 class="h5">@${c.pseudo}</h4>
          <h5 class="h6">${c.nom || c.pseudo}</h5>
          <div class="job">
            ${c.job}
          </div>
        </div>
        <div class="teams">
          <ul>
            ${repeat(c.teams, (t) => t, (t) => html`<li class="team">${t}</li>`)}
          </ul>
        </div>
      `
      const mainLink = this.mainLink(c)
      if (mainLink) {
        return html`
          <a href="${mainLink}" target="_blank nofollow" class="contributor">
            ${content}
          </a>
        `
      } else {
        return html`
          <div class="contributor">${content}</div>
        `
      }
    }

    private mainLink(c: Contributor): string | void {
      if (c.site_web) {
        return c.site_web
      }
      return c.links.map(({ url }) => url)[0]
    }


    async connectedCallback() {
      super.connectedCallback();
      this.team = await State.current.teamMembers()
    }


    disconnectedCallback() {
      super.disconnectedCallback();
    }
}

