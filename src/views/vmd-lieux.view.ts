import {css, customElement, html, LitElement, unsafeCSS} from 'lit-element';
import {Icon, LatLngTuple, map, Marker, marker, tileLayer} from 'leaflet'
import leafletCss from 'leaflet/dist/leaflet.css';
import leafletMarkerCss from 'leaflet.markercluster/dist/MarkerCluster.Default.css';
// @ts-ignore
import {MarkerClusterGroup}  from 'leaflet.markercluster'
import {Router} from "../routing/Router";
import {CSS_Global} from "../styles/ConstructibleStyleSheets";
import {State} from "../state/State";

// Code imported (and refactored a little bit)
// from https://github.com/rozierguillaume/covidtracker-tools/blob/main/src/ViteMaDose/carteCentres.html

type LieuCarte = {
    nom: string;
    longitude: number;
    latitude: number;
    reservation: string;
    date_ouverture: string|undefined;
    rdv_tel: string|undefined;
    modalites: string|undefined;
    adresse: string|undefined;
    maj: string|undefined;
};

@customElement('vmd-lieux')
export class VmdLieuxView extends LitElement {

    //language=css
    static styles = [
        CSS_Global,
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
          <slot name="about-lieux"></slot>
          <div id="mapid" style="height: 80vh; width: 90vw; max-width: 100%; max-height: 600px; margin-bottom: 40px"></div>
        `;
    }

    connectedCallback() {
        super.connectedCallback();

        this.requestUpdate().then(() => this.loadMap());
    }

    private async loadMap() {
        const mymap = map(this.shadowRoot!.querySelector("#mapid") as HTMLElement, {

        }).setView([46.505, 3], 6);

        const departements = await State.current.departementsDisponibles();
        const resultatsRechercheLieux = await State.current.lieuxPour(departements.map(d => d.code_departement).filter(code => code !== 'om'));
        const lieuxCarte = resultatsRechercheLieux.lieuxDisponibles.concat(resultatsRechercheLieux.lieuxIndisponibles)
            .filter(lieu => !!lieu.location && !!lieu.location.longitude && lieu.location.latitude)
            // We have some location which have silly locations, like longitude=6786471059425410 (missing comma)
            .filter(lieu => lieu.location.latitude >= -90 && lieu.location.latitude <= 90 && lieu.location.longitude >= -180 && lieu.location.longitude <= 180)
            .map<LieuCarte>(lieu => ({
                nom: lieu.nom,
                longitude: lieu.location.longitude,
                latitude: lieu.location.latitude,
                reservation: lieu.url,
                date_ouverture: undefined,
                rdv_tel: lieu?.metadata?.phone_number,
                modalites: undefined,
                adresse: lieu?.metadata?.address,
                maj: undefined,
            }));

        tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mymap);

        const markers = VmdLieuxView.creer_pins(lieuxCarte);
        mymap.addLayer(markers);
    }

    private static creer_pins(lieux: LieuCarte[]){
        const markers = lieux.reduce((markers, lieu) => {
            let reservation_str = ""
            if (typeof lieu.reservation != 'undefined'){
                if (lieu.reservation.indexOf("http") === 0){
                    reservation_str = `<a href="${lieu.reservation}">${lieu.reservation}</a>`
                }
            } else {
                reservation_str = lieu.reservation;
            }

            const string_popup = `
                <span style='font-size: 150%;'>${lieu.nom}</span>
                <br>
                <b>Adresse :</b> ${lieu.adresse || "-"}
                <br>
                <b>Réservation :</b> ${reservation_str || "-"}
                <br>
                <b>Tél :</b> ${lieu.rdv_tel?`<a href='tel:${lieu.rdv_tel}'>${lieu.rdv_tel}</a>`:`-`}
            `;
            const newMarker = marker([lieu.latitude, lieu.longitude] as LatLngTuple, {
                icon: new Icon.Default({imagePath: `${Router.basePath}assets/images/png/`})
            }).bindPopup(string_popup) //.addTo(this.mymap);
            newMarker.on('click', function() {
                // @ts-ignore
                this.openPopup();
            });

            markers.push(newMarker);
            return markers;
        }, [] as Marker[]);

        const markersGroup = new MarkerClusterGroup({
            disableClusteringAtZoom: 9, chunkedLoading: true,
        })
        markersGroup.addLayers(markers, true);
        return markersGroup;
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        // console.log("disconnected callback")
    }
}
