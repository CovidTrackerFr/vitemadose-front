import page from "page";
import { TemplateResult } from "lit-html";
import {html} from "lit-element";
import {CodeTriCentre, State} from "../state/State";

export type SlottedTemplateResultFactory = (subViewSlot: TemplateResult) => TemplateResult;

export type ViewChangedCallback = (templateResultCreator: SlottedTemplateResultFactory, path: string) => void;
export type ViewChangedCallbackCleaner = Function;
export type TitleProvider = (pathParams: Record<string, string>) => Promise<string>;


class Routing {
    public static readonly INSTANCE = new Routing();

    private static readonly DEFAULT_TITLE = 'Vite Ma Dose : trouvez un créneau de vaccination COVID-19';
    private static readonly DEFAULT_TITLE_PROMISE: TitleProvider =
        () => Promise.resolve(Routing.DEFAULT_TITLE);

    private _viewChangeCallbacks: ViewChangedCallback[] = [];

    private currentTemplateResultCreator: SlottedTemplateResultFactory|undefined = undefined;
    private currentPath: string|undefined = undefined;

    public get basePath() {
        return import.meta.env.BASE_URL;
    }

    installRoutes(callback?: ViewChangedCallback): ViewChangedCallbackCleaner|undefined {
        const callbackCleaner = callback?this.onViewChanged(callback):undefined;

        page.redirect(`${this.basePath}home`, `/`);
        page.redirect(`${this.basePath}index.html`, `/`);

        this.declareRoute(`/`, 'home', () => (subViewSlot) =>
            html`<vmd-home>${subViewSlot}</vmd-home>`);
        this.declareRoute(`/centres-vaccination-covid-dpt:codeDpt-:nomDpt/age-:trancheAge/`,
            'search_results_by_department', (params) => (subViewSlot) =>
            html`<vmd-rdv-par-departement codeDepartementSelectionne="${params[`codeDpt`]}">${subViewSlot}</vmd-rdv-par-departement>`,
            (params) =>
                State.current.chercheDepartementParCode(params[`codeDpt`])
                    .then(nomDpt => 'Vaccination COVID-19 en ' + nomDpt.nom_departement + ' ' + params[`codeDpt`]));
        this.declareRoute(`/centres-vaccination-covid-dpt:codeDpt-:nomDpt/ville-:codeVille-:nomVille/age-:trancheAge/`,
            'search_results_by_department',(params) => (subViewSlot) =>
            html`<vmd-rdv-par-departement codeDepartementSelectionne="${params[`codeDpt`]}">${subViewSlot}</vmd-rdv-par-departement>`,
            (params) =>
                State.current.chercheDepartementParCode(params[`codeDpt`])
                    .then(nomDpt => 'Vaccination COVID-19 en ' + nomDpt.nom_departement + ' ' + params[`codeDpt`]));
        this.declareRoute(`/centres-vaccination-covid-dpt:codeDpt-:nomDpt`,
            'search_results_by_department',(params) => (subViewSlot) =>
            html`<vmd-rdv-par-departement codeDepartementSelectionne="${params[`codeDpt`]}">${subViewSlot}</vmd-rdv-par-departement>`,
            (params) =>
                State.current.chercheDepartementParCode(params[`codeDpt`])
                    .then(nomDpt => 'Vaccination COVID-19 en ' + nomDpt.nom_departement + ' ' + params[`codeDpt`]));
        this.declareRoute(`/centres-vaccination-covid-dpt:codeDpt-:nomDpt/commune:codeCommune-:codePostal-:nomCommune/en-triant-par-:codeTriCentre`,
            'search_results_by_city',(params) => (subViewSlot) =>
            html`<vmd-rdv-par-commune 
                          codeCommuneSelectionne="${params[`codeCommune`]}" 
                          codePostalSelectionne="${params[`codePostal`]}"
                          critèreDeTri="${params[`codeTriCentre`]}">
                     ${subViewSlot}
                 </vmd-rdv-par-commune>`,
            (params) =>
                State.current.chercheCommuneParCode(Router.basePath, params['codeDpt'], params['codeCommune'])
                    .then(commune => 'Vaccination COVID-19 à ' + commune.nom + ' ' + commune.codePostal));
        this.declareRoute(`/centres`, 'centres',(params) => (subViewSlot) =>
            html`<vmd-lieux>${subViewSlot}</vmd-lieux>`);
        this.declareRoute(`/apropos`, 'a_propos',(params) => (subViewSlot) =>
            html`<vmd-apropos>${subViewSlot}</vmd-apropos>`);

        page(`*`, (context) => this._notFoundRoute(context));
        page();

        return callbackCleaner;
    }

    private declareRoute(path: string, pageName: string, viewComponentCreator: (pathParams: Record<string, string>) => Promise<SlottedTemplateResultFactory>|SlottedTemplateResultFactory,
                         titlePromise = Routing.DEFAULT_TITLE_PROMISE) {
        page(`${this.basePath}${path.substring(path[0]==='/'?1:0)}`, (context) => {
            const slottedViewComponentFactoryResult = viewComponentCreator(context.params);
            ((slottedViewComponentFactoryResult instanceof Promise)?slottedViewComponentFactoryResult:Promise.resolve(slottedViewComponentFactoryResult)).then(slottedViewTemplateFactory => {
                this.currentPath = path;
                this.currentTemplateResultCreator = slottedViewTemplateFactory;

                titlePromise(context.params)
                    .catch(() => Routing.DEFAULT_TITLE)
                    .then(title => document.title = title);

                this._viewChangeCallbacks.forEach(callback => callback(slottedViewTemplateFactory, path));

                (window as any).dataLayer.push({
                    'event': 'change_screen',
                    'site_name' : 'vite_ma_dose',
                    'page_type' : pageName
                });
            })
        });
    }

    onViewChanged(callback: ViewChangedCallback): ViewChangedCallbackCleaner {
        this._viewChangeCallbacks.push(callback);
        return () => {
            const idx = this._viewChangeCallbacks.findIndex(registeredCallback => registeredCallback === callback);
            this._viewChangeCallbacks.splice(idx, 1);
        }
    }

    private _notFoundRoute(context: PageJS.Context) {
        console.error(`Route not found : ${context.path} ! Redirecting to home...`);
        this.navigateToHome();
    }

    public navigateToRendezVousAvecDepartement(codeDepartement: string, pathLibelleDepartement: string) {
        page(`${this.basePath}centres-vaccination-covid-dpt${codeDepartement}-${pathLibelleDepartement}`);
    }

    public navigateToRendezVousAvecCommune(codeTriCentre: CodeTriCentre, codeDepartement: string, pathLibelleDepartement: string, codeCommune: string, codePostal: string, pathLibelleCommune: string) {
        page(`${this.basePath}centres-vaccination-covid-dpt${codeDepartement}-${pathLibelleDepartement}/commune${codeCommune}-${codePostal}-${pathLibelleCommune}/en-triant-par-${codeTriCentre}`);
    }

    navigateToHome() {
        page(`${this.basePath}`);
    }

    navigateToUrlIfPossible(url: string) {
        if(url) {
            window.open(url, '_blank')
        }
    }
}

export const Router = Routing.INSTANCE;
