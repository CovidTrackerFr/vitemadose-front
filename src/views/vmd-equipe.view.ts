import {css, unsafeCSS, customElement, html, LitElement, internalProperty } from 'lit-element';
import {repeat} from "lit-html/directives/repeat";
import equipeCss from './vmd-equipe.view.scss'

import {
    Contributor,
    State,
} from "../state/State";

import {CSS_Global} from "../styles/ConstructibleStyleSheets";

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
                      <p>Vite Ma Dose est conçu, développé, opéré et maintenu avec joie et entrain par une équipe d'au moins ${this.team.length} bénévoles.</p>
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
      const vmdThemeColors = ['3dc4d1','ec505c','4e7dd6','b15baf']
      const fallbackPictureUrl = `https://source.boringavatars.com/beam/240/${c.pseudo}?colors=${vmdThemeColors.join(',')}`
      const content = html`
        <div class="photo">
          <img src="${c.photo || fallbackPictureUrl}" alt="Avatar de ${c.nom || c.pseudo}">
        </div>
        <div class="links">
          ${this.renderLinks(c)}
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

    private renderLinks(c: Contributor) {
      const icons = {
        'twitter': 'vmdicon-twitter-fill',
        'linkedin': 'vmdicon-linkedin-fill',
        'github': 'vmdicon-github-fill',
      }
      const defaultIcon = 'vmdicon-link'
      const list = repeat(c.links, (l) => l.site, (l) => {
        const normalizedUrl = l.url.startsWith('http') ? l.url : `https://${l.url}`
        return html `
          <li>
            <a
              href="${normalizedUrl}"
              title="Profil ${l.site} de ${c.nom || c.pseudo}"
              target="_blank nofollow"
            >
              <i class="${icons[l.site] || defaultIcon}"></i>
            </a>
          </li>
        `
      })
      return html`<ul>${list}<ul>`
    }

    private mainLink(c: Contributor): string | void {
      if (c.site_web) {
        return c.site_web.startsWith('http') ? c.site_web : `https://${c.site_web}`
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

