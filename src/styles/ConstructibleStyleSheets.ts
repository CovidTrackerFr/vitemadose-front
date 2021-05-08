import {css, unsafeCSS} from "lit-element";
import globalCss from "./global.scss";
import homeCss from "../views/vmd-home.view.scss";


export const CSS_Global = css`${unsafeCSS(globalCss)}`
export const CSS_Home = css`${unsafeCSS(homeCss)}`
