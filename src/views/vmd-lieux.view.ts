import {css, customElement, html, LitElement, unsafeCSS} from 'lit-element';
import {Icon, map, marker, tileLayer} from 'leaflet'
import leafletCss from 'leaflet/dist/leaflet.css';
import leafletMarkerCss from 'leaflet.markercluster/dist/MarkerCluster.Default.css';
// @ts-ignore
import {MarkerClusterGroup}  from 'leaflet.markercluster'
import {Router} from "../routing/Router";
import {CSS_Global} from "../styles/ConstructibleStyleSheets";

// Code imported (and refactored a little bit)
// from https://github.com/rozierguillaume/covidtracker-tools/blob/main/src/ViteMaDose/carteCentres.html

type Lieu = {
    nom: string;
    longitude: number;
    latitude: number;
    reservation: string;
    date_ouverture: string;
    rdv_tel: string;
    modalites: string;
    adresse: string;
    maj: string;
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

    private loadMap() {
        const mymap = map(this.shadowRoot!.querySelector("#mapid") as HTMLElement).setView([46.505, 3], 6);
        const url="https://www.data.gouv.fr/fr/datasets/r/5cb21a85-b0b0-4a65-a249-806a040ec372"

        fetch(url)
            .then(response => response.arrayBuffer())
            .then(buffer => {
                const decoder = new TextDecoder();
                const csv = decoder.decode(buffer);
                const data_array = VmdLieuxView.CSVToArray(csv, ";");

                const lieux: Lieu[] = data_array.slice(1, data_array.length-1).map((value: string[]) => ({
                    longitude: Number(value[10]),
                    latitude: Number(value[11]),
                    nom: value[1],
                    reservation: value[34],
                    date_ouverture: value[33],
                    rdv_tel: value[35],
                    modalites: value[37],
                    adresse: value[5] + " " + value[6] + ", " + value[7] + " " + value[9],
                    maj: value[22].slice(0, 16),
                }))

                const markers = VmdLieuxView.creer_pins(lieux);
                mymap.addLayer(markers);
            })
            .catch(function () {
                // this.dataError = true;
                console.log("error1")
            });

        tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mymap);
    }

    // ref: http://stackoverflow.com/a/1293163/2343
    // This will parse a delimited string into an array of
    // arrays. The default delimiter is the comma, but this
    // can be overriden in the second argument.
    private static CSVToArray(strData: string, strDelimiter: string ): string[][]{
        // Check to see if the delimiter is defined. If not,
        // then default to comma.
        strDelimiter = (strDelimiter || ",");

        // Create a regular expression to parse the CSV values.
        let objPattern = new RegExp(
            (
                // Delimiters.
                "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

                // Quoted fields.
                "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

                // Standard fields.
                "([^\"\\" + strDelimiter + "\\r\\n]*))"
            ),
            "gi"
        );


        // Create an array to hold our data. Give the array
        // a default empty first row.
        let arrData = [[]] as string[][];

        // Create an array to hold our individual pattern
        // matching groups.
        let arrMatches = null;


        // Keep looping over the regular expression matches
        // until we can no longer find a match.
        while (arrMatches = objPattern.exec( strData )){

            // Get the delimiter that was found.
            let strMatchedDelimiter = arrMatches[ 1 ];

            // Check to see if the given delimiter has a length
            // (is not the start of string) and if it matches
            // field delimiter. If id does not, then we know
            // that this delimiter is a row delimiter.
            if (
                strMatchedDelimiter.length &&
                strMatchedDelimiter !== strDelimiter
            ){

                // Since we have reached a new row of data,
                // add an empty row to our data array.
                arrData.push( [] );

            }

            let strMatchedValue;

            // Now that we have our delimiter out of the way,
            // let's check to see which kind of value we
            // captured (quoted or unquoted).
            if (arrMatches[ 2 ]){

                // We found a quoted value. When we capture
                // this value, unescape any double quotes.
                strMatchedValue = arrMatches[ 2 ].replace(
                    new RegExp( "\"\"", "g" ),
                    "\""
                );

            } else {

                // We found a non-quoted value.
                strMatchedValue = arrMatches[ 3 ];

            }


            // Now that we have our value string, let's add
            // it to the data array.
            arrData[ arrData.length - 1 ].push( strMatchedValue );
        }

        // Return the parsed data.
        return arrData;
    }

    private static creer_pins(lieux: Lieu[]){
        const markers = lieux.reduce((markers: MarkerClusterGroup, lieu) => {
            let reservation_str = ""
            if (typeof lieu.reservation != 'undefined'){
                if (lieu.reservation.indexOf("http") === 0){
                    reservation_str = `<a href="${lieu.reservation}">${lieu.reservation}</a>`
                }
            } else {
                reservation_str = lieu.reservation;
            }

            var string_popup = `
                <span style='font-size: 150%;'>${lieu.nom}</span>
                <br>
                <b>Adresse :</b> ${lieu.adresse}<br><b>Réservation :</b> ${reservation_str}
                <br>
                <b>Tél :</b> <a href:'tel:${lieu.rdv_tel}'>${lieu.rdv_tel}</a>
                <br>
                <b>Date d'ouverture :</b> ${lieu.date_ouverture}<br><b>Modalités :</b> ${lieu.modalites}
                <br>
                <b>Mise à jour :</b> ${lieu.maj}
            `;
            var newMarker = marker([lieu.longitude, lieu.latitude], {
                icon: new Icon.Default({imagePath: `${Router.basePath}assets/images/png/`})
            }).bindPopup(string_popup) //.addTo(this.mymap);
            newMarker.on('click', function() {
                // @ts-ignore
                this.openPopup();
            });
            markers.addLayer(newMarker);

            return markers;
        }, new MarkerClusterGroup({ disableClusteringAtZoom: 9 }));
        return markers;
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        // console.log("disconnected callback")
    }
}
