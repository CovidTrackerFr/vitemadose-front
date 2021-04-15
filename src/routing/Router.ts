import page from "page";
import { TemplateResult } from "lit-html";
import {html} from "lit-element";

export type SlottedTemplateResultFactory = (subViewSlot: TemplateResult) => TemplateResult;

export type ViewChangedCallback = (templateResultCreator: SlottedTemplateResultFactory, path: string) => void;
export type ViewChangedCallbackCleaner = Function;


class Routing {
    public static readonly INSTANCE = new Routing();

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

        this.declareRoute(`/`, () => (subViewSlot) =>
            html`<vmd-home>${subViewSlot}</vmd-home>`);
        this.declareRoute(`/centres-vaccination-covid-dpt:codeDpt-:nomDpt/age-:trancheAge/`, (params) => (subViewSlot) =>
            html`<vmd-rdv codeDepartementSelectionne="${params[`codeDpt`]}" codeTrancheAgeSelectionne="${params[`trancheAge`]}">${subViewSlot}</vmd-rdv>`);
        this.declareRoute(`/centres-vaccination-covid-dpt:codeDpt-:nomDpt/ville-:codeVille-:nomVille/age-:trancheAge/`, (params) => (subViewSlot) =>
            html`<vmd-rdv codeDepartementSelectionne="${params[`codeDpt`]}" codeTrancheAgeSelectionne="${params[`trancheAge`]}">${subViewSlot}</vmd-rdv>`);
        this.declareRoute(`/centres-vaccination-covid-dpt:codeDpt-:nomDpt/commune:codeCommune-:codePostal-:nomCommune/`, (params) => (subViewSlot) =>
            html`<vmd-rdv codeDepartementSelectionne="${params[`codeDpt`]}" codeCommuneSelectionne="${params[`codeCommune`]}" codePostalSelectionne="${params['codePostal']}">${subViewSlot}</vmd-rdv>`);
        this.declareRoute(`/centres`, (params) => (subViewSlot) =>
            html`<vmd-lieux>${subViewSlot}</vmd-lieux>`);
        this.declareRoute(`/apropos`, (params) => (subViewSlot) =>
            html`<vmd-apropos>${subViewSlot}</vmd-apropos>`);

        page(`*`, (context) => this._notFoundRoute(context));
        page();

        return callbackCleaner;
    }

    private declareRoute(path: string, viewComponentCreator: (pathParams: Record<string, string>) => Promise<SlottedTemplateResultFactory>|SlottedTemplateResultFactory) {
        page(`${this.basePath}${path.substring(path[0]==='/'?1:0)}`, (context) => {
            const slottedViewComponentFactoryResult = viewComponentCreator(context.params);
            ((slottedViewComponentFactoryResult instanceof Promise)?slottedViewComponentFactoryResult:Promise.resolve(slottedViewComponentFactoryResult)).then(slottedViewTemplateFactory => {
                this.currentPath = path;
                this.currentTemplateResultCreator = slottedViewTemplateFactory;

                this._viewChangeCallbacks.forEach(callback => callback(slottedViewTemplateFactory, path));
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

    public navigateToRendezVous(codeDepartement: string, pathLibelleDepartement: string, trancheAge: string) {
        page(`${this.basePath}centres-vaccination-covid-dpt${codeDepartement}-${pathLibelleDepartement}/age-${trancheAge}/`);
    }

    public navigateToRendezVousAvecCommune(codeDepartement: string, pathLibelleDepartement: string, codeCommune: string, codePostal: string, pathLibelleCommune: string) {
        page(`${this.basePath}centres-vaccination-covid-dpt${codeDepartement}-${pathLibelleDepartement}/commune${codeCommune}-${codePostal}-${pathLibelleCommune}/`);
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
