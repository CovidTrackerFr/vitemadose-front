import {css, query, customElement, html, LitElement, property, unsafeCSS} from "lit-element";
import { delay }  from '../utils/Schedulers'

@customElement('vmd-elastic-height')
export class VmdButtonSwitchComponent extends LitElement {
  static styles = [
    css `
    .mask {
      display: block;
      overflow-y: hidden;
      height: 0px;
      transition: height 300ms ease-in-out;
    }
    `
  ]


  @query(".content") $content: HTMLElement | undefined;
  @query(".mask") $mask: HTMLElement | undefined;
  @property() set hint (_: any) {
    delay(10).then(() => this.checkResize())
  }

  render () {
    return html`
      <div class="mask">
        <div class="content">
          <slot />
        </div>
      </div>
    `
  }

  private async checkResize() {
    if (this.$content && this.$mask) {
      const height = this.$content.offsetHeight
      this.$mask.style.setProperty('height', `${height}px`)
    }
  }
}
