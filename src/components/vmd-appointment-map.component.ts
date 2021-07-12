import { css, unsafeCSS, customElement, html, LitElement, property, internalProperty } from 'lit-element';
import { Icon, map, marker, tileLayer, LatLngTuple } from 'leaflet';
import leafletCss from 'leaflet/dist/leaflet.css';
import leafletMarkerCss from 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { Router } from '../routing/Router';
import { LieuAffichableAvecDistance, Coordinates, SearchRequest, TYPES_LIEUX } from '../state/State';
import { CSS_Global } from '../styles/ConstructibleStyleSheets';
import { format as formatDate, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Strings } from '../utils/Strings';

@customElement('vmd-appointment-map')
export class VmdAppointmentMapComponent extends LitElement {
  //language=css
  static styles = [
    CSS_Global,
    css`
      ${unsafeCSS(leafletCss)}
    `,
    css`
      ${unsafeCSS(leafletMarkerCss)}
    `,
    css`
      :host {
        display: flex;
        align-items: center;
        flex-direction: column;
      }
      :host button {
        margin: 1em;
      }
      :host .dialog {
        width: 100%;
        padding: 0 1em;
      }
      #appointment-map {
        min-height: 500px;
      }
    `,
  ];
  @property({ type: Object, attribute: false }) lieux!: LieuAffichableAvecDistance[];
  @property() private map: L.Map | void = undefined
  @property() private showMap: boolean = false
  @internalProperty() protected currentSearch: SearchRequest | void = undefined;

  constructor() {
    super();
  }

  render() {
    console.log(this.currentSearch, this.lieux)
    return html`
    <button class="btn btn-primary" @click="${this.toggleMap}">Voir la carte</button>
    ${this.showMap ? html`<div class="dialog"><div id="appointment-map"></div>`: html``}
    `;
  }

  private toggleMap() {
    this.showMap = !this.showMap;
    if (this.map) {
      this.map.off();
      this.map.remove();
      this.map = undefined;
    } else {
      setTimeout(() => {
        this.map = this.loadMap();
      }, 10)
      // this.requestUpdate()
    }

  }

  private loadMap() : L.Map {
    const coordinates =
      this.currentSearch instanceof SearchRequest.ByCommune &&
      this.toCoordinates((this.currentSearch as SearchRequest.ByCommune).commune);
    const mymap = map(this.shadowRoot!.querySelector('#appointment-map') as HTMLElement).setView(
      coordinates || [46.505, 3],
      13
    );

    tileLayer(
      'https://{s}.tile.jawg.io/jawg-sunny/{z}/{x}/{y}.png?access-token=sOXVrxPultoFMoo0oQigvvfXgPxaX0OFlFJF7y1rw0ZQy1c1yFTSnXSVOBqw0W6Y',
      {
        maxZoom: 19,
        attribution:
          '<a href="http://jawg.io" title="Tiles Courtesy of Jawg Maps" target="_blank" class="jawg-attrib">&copy; <b>Jawg</b>Maps</a> | <a href="https://www.openstreetmap.org/copyright" title="OpenStreetMap is open data licensed under ODbL" target="_blank" class="osm-attrib">&copy; OSM contributors</a>',
      }
    ).addTo(mymap);
    const { markers, bounds } = this.creer_pins(this.lieux, coordinates || [0, 0]);
    markers.addTo(mymap);
    mymap.fitBounds([
      [bounds.minLat, bounds.minLon],
      [bounds.maxLat, bounds.maxLon],
    ]);
    return mymap
  }

  private toCoordinates(o: Coordinates): LatLngTuple | void {
    if (o && typeof o.latitude === 'number' && typeof o.longitude === 'number') {
      return [o.latitude, o.longitude];
    }
  }

  // connectedCallback() {
  //   super.connectedCallback();

  //   this.requestUpdate().then(() => this.loadMap());
  // }

  private creer_pins(lieux: LieuAffichableAvecDistance[], defaultCoordinates: LatLngTuple) {
    const bounds = {
      minLat: defaultCoordinates[0] || 180,
      maxLat: defaultCoordinates[0] || -180,
      minLon: defaultCoordinates[1] || 180,
      maxLon: defaultCoordinates[1] || -180,
    };
    const markers = lieux
      .filter((lieu) => lieu.disponible)
      .reduce((markers: L.MarkerClusterGroup, lieu: LieuAffichableAvecDistance) => {
        const coordinates = this.toCoordinates(lieu.location);
        if (coordinates) {
          var string_popup = `
            <span style='font-size: 1.5em;' class="fw-bold text-dark">${lieu.nom}</span>
            <vmd-appointment-metadata class="mb-2" widthType="full-width" icon="vmdicon-geo-alt-fill">
              <em slot="content">${lieu.metadata.address}</em>
            </vmd-appointment-metadata>
            ${
              lieu.metadata.phone_number
                ? `
            <vmd-appointment-metadata class="mb-2" widthType="fit-to-content" icon="vmdicon-telephone-fill">
              <span slot="content">
                <a href="tel:${lieu.metadata.phone_number}"
                    @click="${(e: Event) => {
                      e.stopImmediatePropagation();
                    }}">
                    ${Strings.toNormalizedPhoneNumber(lieu.metadata.phone_number)}
                </a>
              </span>
            </vmd-appointment-metadata>
            `
                : ''
            }
            <vmd-appointment-metadata class="mb-2" widthType="fit-to-content" icon="vmdicon-commerical-building">
              <span slot="content">${TYPES_LIEUX[lieu.type]}</span>
            </vmd-appointment-metadata>
            <vmd-appointment-metadata class="mb-2" widthType="fit-to-content" icon="vmdicon-syringe" .displayed="${!!lieu.vaccine_type}">
              <span slot="content">${lieu.vaccine_type}</span>
            </vmd-appointment-metadata>
            <vmd-appointment-metadata class="mb-2" widthType="fit-to-content" icon="vmdicon-calendar2-check-fill">
              <span slot="content">${this.prochainRDV(lieu)}</span>
            </vmd-appointment-metadata>
            <a href="${
              lieu.url
            }" target="_blank" style="color: #fff; margin-top: 0.5em;" class="btn btn-sm btn-primary">
              Prendre rendez-vous
            </a>
            `;
          if (lieu.distance === undefined || lieu.distance < 50) {
            bounds.minLat = Math.min(coordinates[0], bounds.minLat);
            bounds.maxLat = Math.max(coordinates[0], bounds.maxLat);
            bounds.minLon = Math.min(coordinates[1], bounds.minLon);
            bounds.maxLon = Math.max(coordinates[1], bounds.maxLon);
          }
          var newMarker = marker(coordinates, {
            icon: new Icon.Default({ imagePath: `${Router.basePath}assets/images/png/` }),
          }).bindPopup(string_popup);
          newMarker.on('click', function () {
            // @ts-ignore
            this.openPopup();
          });
          markers.addLayer(newMarker);
        }

        return markers;
      }, new L.MarkerClusterGroup({ disableClusteringAtZoom: 9 }));

    return { markers, bounds };
  }
  private prochainRDV(lieu: LieuAffichableAvecDistance): string {
    if (lieu && lieu.prochain_rdv) {
      return this.toTitleCase(formatDate(parseISO(lieu.prochain_rdv), "EEEE d MMMM 'à' HH:mm", { locale: fr }));
    } else {
      return 'Aucun rendez-vous';
    }
  }

  private toTitleCase(date: string): string {
    return date.replace(/(^|\s)([a-z])(\w)/g, (_, leader, letter, loser) =>
      [leader, letter.toUpperCase(), loser].join('')
    );
  }
}
