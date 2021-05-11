import {css, customElement, html, LitElement, property, unsafeCSS} from "lit-element";
import {repeat} from "lit-html/directives/repeat";
import flammableCss from "./vmd-flammable.component.scss";
import MD5 from 'crypto-js/md5'
import toHex from 'crypto-js/enc-hex'
import { Memoize } from 'typescript-memoize'


export type ValueStrCustomEvent<T extends string> = CustomEvent<{value: T}>;

export type Option = {
    code: string;
    libelle: string;
};

@customElement('vmd-flammable')
export class VmdButtonSwitchComponent extends LitElement {
    @property({type: Number}) parts = 600
    @property({type: Number}) intensity: number = 0.1;

    //language=css
    static styles = [
        css`${unsafeCSS(flammableCss)}`
    ];
    render () {
      return html`
          <div class="flammable"
            style="--parts: ${this.parts}; --intensity: ${this.intensity}"

            >
            ${this.particles()}
          </div>
          <div class="wrapper">
            <slot />
          </div>
      `
    }

    particles () {
      return repeat(range(Math.round(this.intensity * this.parts)), (i: number) => `${i}`, (i) => {
        const x = this.pseudoRandom(`part_${i}`)
        const random = this.pseudoRandom(`random_${i}`)
        return html`<div class="particle"
          style="--x-seed: ${x}; --delay-seed: ${random}; --deviation-seed: ${this.pseudoRandom(`deviation_${i}`)}"
        />`
      })
    }

    @Memoize()
    private pseudoRandom (str: string): number {
      const position: number = parseInt(toHex.stringify(MD5(str)).substr(0, 4), 16)
      return position / MAX_16_BIT
    }
}

const MAX_16_BIT = parseInt('ffff', 16)

function range (to: number) {
  const list = []
  for (let i=0; i<to; ++i) {
    list.push(i)
  }
  return list
}
