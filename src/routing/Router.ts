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
        this.declareRoute(`${this.basePath}`, () =>
            (subViewSlot) => html`<vmd-home>${subViewSlot}</vmd-home>`);
        this.declareRoute(`${this.basePath}:departement/:trancheAge/rendez-vous`, (params) =>
            (subViewSlot) => html`<vmd-rdv codeDepartementSelectionne="${params[`departement`]}" codeTrancheAgeSelectionne="${params[`trancheAge`]}"></vmd-rdv>`);
        this.declareRoute(`${this.basePath}lieux`, (params) =>
            (subViewSlot) => html`<vmd-lieux>${subViewSlot}</vmd-lieux>`);
        page(`*`, () => this._notFoundRoute());
        page();

        return callbackCleaner;
    }

    private declareRoute(path: string, viewComponentCreator: (pathParams: Record<string, string>) => Promise<SlottedTemplateResultFactory>|SlottedTemplateResultFactory) {
        page(path, (context) => {
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

    private _notFoundRoute() {
        console.error(`Route not found !`);
    }

    public navigateToRendezVous(codeDepartement: string, trancheAge: string) {
        page(`${this.basePath}${codeDepartement}/${trancheAge}/rendez-vous`);
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
