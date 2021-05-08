import {css, customElement, html, LitElement, unsafeCSS} from 'lit-element';
import globalCss from "../styles/global.scss";
import leafletCss from 'leaflet/dist/leaflet.css';
import leafletMarkerCss from 'leaflet.markercluster/dist/MarkerCluster.Default.css';
// @ts-ignore
import {MarkerClusterGroup}  from 'leaflet.markercluster'

@customElement('vmd-chronodose')
export class VmdChronodoseView extends LitElement {

    //language=css
    static styles = [
        css`${unsafeCSS(globalCss)}`,
        css`${unsafeCSS(leafletCss)}`,
        css`${unsafeCSS(leafletMarkerCss)}`,
        css`
            :host {
                display: block;
            }
            #mapid { height: 180px; }
        `
    ];

    render() {
        return html`
          <h2 class="h1"> Chronodose : trouvez un créneau de vaccination en 24h</h2>
          Vite Ma Dose présente Chronodose, une fonctionnalité permettant de trouver une dose de vaccin Covid19 en 24h pour tous les plus 18 ans, sans condition d'éligibilité. Cette fonctionnalité sera déployée sur Vite Ma Dose d'ici au mercredi 12 mai, disponible sur le <u><a href="https://vitemadose.covidtracker.fr">site internet</a></u>, et les applications mobiles (<u><a href="http://apple.co/3dFMGy3">iOS</a></u> et <u><a href="http://apple.co/3dFMGy3">Android</a></u>).<br>
          Grâce à Chronodose, chaque personne de plus de 18 ans souhaitant se faire vacciner contre la Covid19 pourra chercher un rendez-vous en moins de 24h facilement et rapidement. Un système de notification sera aussi implémenté permettant d'alerter les utilisateurs des disponibilités de créneaux de vaccination Chronodose.
          <div class="homeCard-actions">
            <div class="row justify-content-center justify-content-lg-start mt-5">
                <a href="https://vitemadose.covidtracker.fr/" target="_blank" class="col-auto btn btn-primary btn-lg">
                    Accéder à Vite Ma Dose&nbsp;<i class="bi vmdicon-arrow-up-right"></i>
                </a>
            </div>
          </div>
        `;
    }
}
