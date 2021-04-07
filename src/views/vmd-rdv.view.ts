import {
    LitElement,
    html,
    customElement,
    property,
    css,
    unsafeCSS,
    PropertyValues
} from 'lit-element';
import {TrancheAge, TrancheAgeSelected} from "../components/vmd-tranche-age-selector.component";
import {Departement, DepartementSelected} from "../components/vmd-departement-selector.component";
import {repeat} from "lit-html/directives/repeat";
import globalCss from "../styles/global.scss";
import {Router} from "../routing/Router";
import {Dates, ISODateString} from "../utils/Dates";
import rdvViewCss from "../styles/views/_rdv.scss";

export type Centre = {
    departement: string;
    nom: string;
    url: string;
    plateforme: string;
    prochain_rdv: ISODateString|null;
};

@customElement('vmd-rdv')
export class VmdRdvView extends LitElement {

    //language=css
    static styles = [
        css`${unsafeCSS(globalCss)}`,
        css`${unsafeCSS(rdvViewCss)}`,
        css`
        `
    ];

    @property({type: String, attribute: true}) trancheAge: TrancheAge|undefined = undefined;
    @property({type: String, attribute: true}) codeDepartement: string|undefined = undefined;

    @property({type: Object, attribute: false}) departement: Departement|undefined = undefined;
    @property({type: Array, attribute: false}) centresAvecDispos: Centre[] = [];
    @property({type: Array, attribute: false}) centresSansDispos: Centre[] = [];

    constructor() {
        super();
    }

    findCentres() {
        if(this.trancheAge && this.codeDepartement) {
            fetch(`https://raw.githubusercontent.com/CovidTrackerFr/vitemadose/data-auto/data/output/${this.codeDepartement}.json?trancheAge=${this.trancheAge}`)
                .then(resp => resp.json())
                .then(results => {
                    this.centresAvecDispos = results.centres_disponibles;
                    this.centresSansDispos = results.centres_indisponibles;
                });
        } else {
            this.centresAvecDispos = [];
            this.centresSansDispos = [];
        }
    }


    protected update(changedProperties: PropertyValues) {
        super.update(changedProperties);

        if(changedProperties.has('trancheAge') || changedProperties.has('codeDepartement')) {
            this.findCentres()
        }
    }

    render() {
        return html`
            <div class="p-5 text-dark bg-light rounded-3">
                <div class="rdvForm-fields row align-items-center">
                    <div class="col-sm-24 col-md-auto mb-md-3 mt-md-3">
                        J'ai
                    </div>
                    <div class="col">
                        <vmd-tranche-age-selector class="mb-3 mt-md-3" trancheAge="${this.trancheAge}" @tranche-age-changed="${this.trancheAgeUpdated}"></vmd-tranche-age-selector>
                    </div>
                    <div class="col-sm-24 col-md-auto mb-md-3 mt-md-3">
                        J'habite en
                    </div>
                    <div class="col">
                        <vmd-departement-selector class="mb-3 mt-md-3" codeDepartement="${this.codeDepartement}" @departement-changed="${this.departementUpdated}"></vmd-departement-selector>
                    </div>
                </div>
            </div>

            <div class="spacer mt-5 mb-5"></div>

            <h4 class="fw-normal text-center">Résultats pour : <span class="fw-bold">${this.departement?.nom_departement}, ${this.trancheAge}</span></h4>

            <div class="spacer mt-5 mb-5"></div>
            
            <div class="p-5 text-dark bg-light rounded-3">
                <h5 class="row align-items-center justify-content-center mb-5">
                    <i class="bi bi-check-circle-fill text-success me-2 fs-3 col-auto"></i>
                    <span class="col-auto">
                        ${this.centresAvecDispos.length} Centres(s) ayant des disponibilités
                    </span>
                </h5>

                ${repeat(this.centresAvecDispos, (c => `${c.departement}||${c.nom}||${c.plateforme}`), (centre) => {
                    return html`
                        <div class="card rounded-3 mb-5">
                            <div class="card-body">
                                <div class="row align-items-center">
                                    <div class="col">
                                        <h5 class="card-title">${Dates.isoToFRDatetime(centre.prochain_rdv)}</h5>
                                        <p class="card-text">${centre.nom}</p>
                                    </div>
                                    
                                    <div class="col-auto">
                                        <a href="${centre.url}" target="_blank" class="btn btn-primary btn-lg">Prendre rendez-vous</a>
                                        <div class="row align-items-center justify-content-center mt-3">
                                            <div class="col-auto text-black-50">
                                                avec Doctolib.fr
                                            </div>
                                            <div class="col-auto">
                                                <img class="rdvPlatformLogo" src="/src/assets/images/png/logo_doctolib.png" alt="Doctolib">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `
                })}

                <div class="spacer mt-5 mb-5"></div>

                <h5 class="row align-items-center justify-content-center mb-5">
                    <i class="bi bi-x-circle-fill text-black-50 me-2 fs-3 col-auto"></i>
                    <span class="col-auto text-black-50">
                        Autres centres sans créneaux de vaccination détecté
                    </span>
                </h5>

                ${repeat(this.centresSansDispos, (c => `${c.departement}||${c.nom}||${c.plateforme}`), (centre) => {
                    return html`
                        <div class="card rounded-3 mb-5 bg-disabled">
                            <div class="card-body">
                                <div class="row align-items-center">
                                    <div class="col">
                                        <h5 class="card-title">Aucun rendez-vous</h5>
                                        <p class="card-text">${centre.nom}</p>
                                    </div>

                                    <div class="col-auto">
                                        <a href="${centre.url}" target="_blank" class="btn btn-info btn-lg">Vérifier le centre</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `
                })}
            </div>
        `;
    }

    connectedCallback() {
        super.connectedCallback();
        this.findCentres();
    }

    trancheAgeUpdated(event: CustomEvent<TrancheAgeSelected>) {
        this.trancheAge = event.detail.trancheAge;
        this.refreshPageWhenValidParams();
    }

    departementUpdated(event: CustomEvent<DepartementSelected>) {
        this.departement = event.detail.departement;
        this.codeDepartement = this.departement?.code_departement;
        this.refreshPageWhenValidParams();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        // console.log("disconnected callback")
    }

    private refreshPageWhenValidParams() {
        if(this.codeDepartement && this.trancheAge) {
            Router.navigateToRendezVous(this.codeDepartement, this.trancheAge);
        }
    }
}
