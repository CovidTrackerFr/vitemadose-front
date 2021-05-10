import {css, customElement, html, LitElement, property, unsafeCSS} from "lit-element";
import {repeat} from "lit-html/directives/repeat";
import flammableCss from "./vmd-flammable.component.scss";

export type ValueStrCustomEvent<T extends string> = CustomEvent<{value: T}>;

export type Option = {
    code: string;
    libelle: string;
};

@customElement('vmd-flammable')
export class VmdButtonSwitchComponent extends LitElement {
    parts = 500

    //language=css
    static styles = [
        css`${unsafeCSS(flammableCss)}`
    ];
    render () {
      return html`
          <div class="flammable">
            ${this.particles()}
          </div>
          <div class="wrapper">
            <slot />
          </div>
      `
    }

    particles () {
      return repeat(range(500), (i: number) => `${i}`, () => {
        return html`<div class="particle"></div>`
      })
    }
}

function range (to: number) {
  const list = []
  for (let i=0; i<to; ++i) {
    list.push(i)
  }
  return list
}
