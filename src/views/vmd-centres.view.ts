import {css, customElement, html, LitElement, unsafeCSS} from 'lit-element';
import globalCss from "../styles/global.scss";
import {map, marker, tileLayer} from 'leaflet'
// @ts-ignore
import {MarkerClusterGroup}  from 'leaflet.markercluster'

// Code imported "as is" from https://github.com/rozierguillaume/covidtracker-tools/blob/main/src/ViteMaDose/carteCentres.html

// TODO: Refactor this as the code is really ugly / unmaintainable :-)

@customElement('vmd-centres')
export class VmdCentresView extends LitElement {

    //language=css
    static styles = [
        css`${unsafeCSS(globalCss)}`,
        css`
            :host {
                display: block;
            }
            #mapid { height: 180px; }
        `
    ];

    render() {
        return html`
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"
                integrity="sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A=="
                crossorigin=""/>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.4.1/MarkerCluster.Default.css" integrity="sha512-BBToHPBStgMiw0lD4AtkRIZmdndhB6aQbXpX7omcrXeG2PauGBl2lzq2xUZTxaLxYz5IDHlmneCZ1IJ+P3kYtQ==" crossorigin="anonymous" />

          <h3 style="margin-top : 80px;" id="centres-vaccination">Centres de vaccination</h3>
          <p>Carte des centres de vaccination. Source des données : Ministère de la Santé. Mise à jour plusieurs fois par jour.</p>
          <p>
            <b>Nos conseils pour trouver un RDV</b><br>
            Les données affichées sur cette carte proviennent du Ministère de la Santé. Pour trouver un rendez-vous rapidement, nous vous conseillons de cliquer sur les centres les plus proches de chez vous, puis de cliquer sur le lien Doctolib, Keldoc ou Maiia présent sur la fiche du centre, lorsqu'il est renseigné. Vous pouvez aussi appeler le centre si son numéro est renseigné. N'hésitez pas à revenir plusieurs fois par jour, les données sont très régulièrement mises à jour.
          </p>
          <div id="mapid" style="height: 80vh; width: 90vw; max-width: 100%; max-height: 600px;"></div>

          <br>
          <br>
        `;
    }

    connectedCallback() {
        super.connectedCallback();

        this.requestUpdate().then(() => this.loadMap());
    }

    private loadMap() {
        let data = [] as any[];
        let longitudes = [] as any[];
        let latitudes = [] as any[];
        let noms = [] as any[];
        let reservation = [] as any[];
        let rdv_tel = [] as any[];
        let adresses = [] as any[];
        let modalites = [] as any[];
        let date_ouverture = [] as any[];
        let maj = [] as any[];

        const div = this.shadowRoot?.querySelector('#mapid');
        const url="https://www.data.gouv.fr/fr/datasets/r/5cb21a85-b0b0-4a65-a249-806a040ec372"

        let request = fetch(url)
            .then(response => response.arrayBuffer())
            .then(buffer => {
                let decoder = new TextDecoder();
                let csv = decoder.decode(buffer);
                let data_array = VmdCentresView.CSVToArray(csv, ";");

                data_array.slice(1, data_array.length-1).map((value: any[], idx) => {
                    longitudes.push(value[10])
                    latitudes.push(value[11])
                    noms.push(value[1])
                    reservation.push(value[34])
                    date_ouverture.push(value[33])
                    rdv_tel.push(value[35])
                    modalites.push(value[35])
                    adresses.push(value[5] + " " + value[6] + ", " + value[7] + " " + value[9])
                    maj.push(value[22].slice(0, 16))
                })

                VmdCentresView.ajouter_pins({
                    latitudes, reservation, modalites, noms, adresses, longitudes, mymap, date_ouverture, rdv_tel, maj, markers
                });
            })
            .catch(function () {
                // this.dataError = true;
                console.log("error1")
            });

        var mymap = map(this.shadowRoot!.querySelector("#mapid") as HTMLElement).setView([46.505, 3], 6);
        var markers = new MarkerClusterGroup({ disableClusteringAtZoom: 9 });

        var OpenStreetMap_Mapnik = tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mymap);
    }

    // ref: http://stackoverflow.com/a/1293163/2343
    // This will parse a delimited string into an array of
    // arrays. The default delimiter is the comma, but this
    // can be overriden in the second argument.
    private static CSVToArray(strData: string, strDelimiter: string ){
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
        return( arrData );
    }

    private static ajouter_pins({ latitudes, reservation, modalites, noms, adresses, longitudes, mymap, date_ouverture, rdv_tel, maj, markers }: any){
        latitudes.map((lat: any, idx: number)=>{
            var reservation_str = ""
            if (typeof reservation[idx] != 'undefined'){

                if (reservation[idx].slice(0, 4)=="http"){
                    reservation_str = "<a href='" + reservation[idx] + "'>" + reservation[idx]
                }
            }
            else{
                reservation_str = reservation[idx]
            }

            var modalites_str = modalites[idx]

            var string_popup = "<span style='font-size: 150%;'>" + noms[idx] + "</span><br><b>Adresse :</b> " + adresses[idx] + "<br><b>Réservation :</b> " + reservation_str + "</a><br><b>Tél :</b> <a href:'tel:" + rdv_tel[idx] + "'>" + rdv_tel[idx] + "</a><br><b>Date d'ouverture :</b> "+ date_ouverture[idx] + "<br><b>Modalités :</b> " + modalites_str + "<br><b>Mise à jour :</b> " + maj[idx]
            var newMarker = marker([longitudes[idx], lat]).bindPopup(string_popup) //.addTo(this.mymap);
            newMarker.on('click', function(e: any) {
                // @ts-ignore
                this.openPopup();
            });
            markers.addLayer(newMarker);


        })
        mymap.addLayer(markers);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        // console.log("disconnected callback")
    }
}
