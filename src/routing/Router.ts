import page from "page";
import { TemplateResult } from "lit-html";
import {html} from "lit-element";
import {CodeTriCentre, SearchType, State} from "../state/State";
import {Analytics} from "../utils/Analytics";

export type SlottedTemplateResultFactory = (subViewSlot: TemplateResult) => TemplateResult;

export type ViewChangedCallback = (templateResultCreator: SlottedTemplateResultFactory, path: string) => void;
export type ViewChangedCallbackCleaner = Function;
export type TitleProvider = (pathParams: Record<string, string>) => Promise<string>;

type RouteDeclaration = {
    pathPattern: string|string[];
    analyticsViewName: (pathParams: Record<string, string>) => string;
    viewContent: (pathParams: Record<string, string>) => Promise<SlottedTemplateResultFactory>|SlottedTemplateResultFactory;
    pageTitleProvider?: TitleProvider;
};

class Routing {
    public static readonly INSTANCE = new Routing();

    private static readonly DEFAULT_TITLE = 'Vite Ma Dose : trouvez un créneau de vaccination COVID-19';
    private static readonly DEFAULT_TITLE_PROMISE: TitleProvider =
        () => Promise.resolve(Routing.DEFAULT_TITLE);

    private _viewChangeCallbacks: ViewChangedCallback[] = [];

    private currentPath: string|undefined = undefined;

    public get basePath() {
        return import.meta.env.BASE_URL;
    }

    installRoutes(callback?: ViewChangedCallback): ViewChangedCallbackCleaner|undefined {
        const callbackCleaner = callback?this.onViewChanged(callback):undefined;

        page.redirect(`${this.basePath}home`, `/`);
        page.redirect(`${this.basePath}index.html`, `/`);

        this.declareRoutes({
            pathPattern: `/`, analyticsViewName: () => 'home',
            viewContent: async () => {
                await import('../views/vmd-home.view')
                return (subViewSlot) =>
                    html`<vmd-home>${subViewSlot}</vmd-home>`
            }
        });
        this.declareRoutes({
            pathPattern: [
                '/centres-vaccination-covid-region:codeRegion-:nomRegion',
                '/centres-vaccination-covid-region:codeRegion-:nomRegion/recherche-:typeRecherche',
            ], analyticsViewName: (pathParams) => `search_results_by_region${pathParams['typeRecherche']==='chronodoses'?'_chronodose':''}`,
            viewContent: async (params) => {
                await import('../views/vmd-rdv.view')
                return (subViewSlot) =>
                    html`<vmd-rdv-par-region
                        searchType="${(params['typeRecherche'] && params['typeRecherche']==='chronodoses')?'chronodose':'standard'}"
                        codeRegionSelectionne="${params[`codeRegion`]}">
                      ${subViewSlot}
                    </vmd-rdv-par-region>`
            },
            pageTitleProvider: (params) =>
                State.current.chercheRegionParCode(params[`codeRegion`])
                    .then(nomReg => `Vaccination COVID-19 en ${nomReg.nom_region}`)
        })
        this.declareRoutes({
            pathPattern: [
                // Legacy URLs with tranche age inside ... used only for old URLs referenced by Google
                `/centres-vaccination-covid-dpt:codeDpt-:nomDpt/age-:trancheAge/`,
                `/centres-vaccination-covid-dpt:codeDpt-:nomDpt/ville-:codeVille-:nomVille/age-:trancheAge/`,
                // Proper URL really used
                `/centres-vaccination-covid-dpt:codeDpt-:nomDpt`,
                `/centres-vaccination-covid-dpt:codeDpt-:nomDpt/recherche-:typeRecherche`
            ], analyticsViewName: (pathParams) => `search_results_by_department${pathParams['typeRecherche']==='chronodoses'?'_chronodose':''}`,
            viewContent: async (params) => {
                await import('../views/vmd-rdv.view')
                return (subViewSlot) =>
                    html`<vmd-rdv-par-departement
                        searchType="${(params['typeRecherche'] && params['typeRecherche']==='chronodoses')?'chronodose':'standard'}"
                        codeDepartementSelectionne="${params[`codeDpt`]}">
                      ${subViewSlot}
                    </vmd-rdv-par-departement>`
            },
            pageTitleProvider: (params) =>
                State.current.chercheDepartementParCode(params[`codeDpt`])
                    .then(nomDpt => `Vaccination COVID-19 en ${nomDpt.nom_departement} ${params[`codeDpt`]}`)
        });
        this.declareRoutes({
            pathPattern: [
                `/centres-vaccination-covid-dpt:codeDpt-:nomDpt/commune:codeCommune-:codePostal-:nomCommune/en-triant-par-:codeTriCentre`,
                `/centres-vaccination-covid-dpt:codeDpt-:nomDpt/commune:codeCommune-:codePostal-:nomCommune/recherche-:typeRecherche/en-triant-par-:codeTriCentre`,
            ], analyticsViewName: (pathParams) => `search_results_by_city${pathParams['typeRecherche']==='chronodoses'?'_chronodose':''}`,
            viewContent: async (params) => {
                await import('../views/vmd-rdv.view')
                return (subViewSlot) =>
                    html`<vmd-rdv-par-commune
                    searchType="${(params['typeRecherche'] && params['typeRecherche']==='chronodoses')?'chronodose':'standard'}"
                    codeCommuneSelectionne="${params[`codeCommune`]}"
                    codePostalSelectionne="${params[`codePostal`]}"
                    critèreDeTri="${params[`codeTriCentre`]}">
                  ${subViewSlot}
                </vmd-rdv-par-commune>`
            },
            pageTitleProvider: (params) =>
                State.current.chercheCommuneParCode(params['codePostal'], params['codeCommune'])
                    .then(commune => `Vaccination COVID-19 à ${commune.nom} ${commune.codePostal}`)
        });
        this.declareRoutes({
            pathPattern: `/centres`, analyticsViewName: () => 'centres',
            viewContent: async () => {
                await import('../views/vmd-lieux.view')
                return (subViewSlot) =>
                    html`<vmd-lieux>${subViewSlot}</vmd-lieux>`
            }
        });
        this.declareRoutes({
            pathPattern: `/statistiques`, analyticsViewName: () => 'statistiques',
            viewContent: async () => {
                await import('../views/vmd-statistiques.view')
                return (subViewSlot) =>
                    html`<vmd-statistiques>${subViewSlot}</vmd-statistiques>`
            }
        });
        this.declareRoutes({
            pathPattern: `/apropos`, analyticsViewName: () => 'a_propos',
            viewContent: async () => {
                await import('../views/vmd-apropos.view')
                return (subViewSlot) =>
                    html`<vmd-apropos>${subViewSlot}</vmd-apropos>`
            }
        });
        this.declareRoutes({
            pathPattern: `/chronodose`, analyticsViewName: () => 'chronodose',
            viewContent: async () => {
                await import('../views/vmd-chronodose.view')
                return (subViewSlot) =>
                    html`<vmd-chronodose>${subViewSlot}</vmd-chronodose>`
            }
        });

        page(`*`, (context) => this._notFoundRoute(context));
        page();

        return callbackCleaner;
    }

    private declareRoutes(routeDeclaration: RouteDeclaration) {
        const paths: string[] = (typeof routeDeclaration.pathPattern === 'string') ? [routeDeclaration.pathPattern] : routeDeclaration.pathPattern;
        paths.forEach(path => {
            this._declareRoute(path, routeDeclaration.analyticsViewName, routeDeclaration.viewContent, routeDeclaration.pageTitleProvider || Routing.DEFAULT_TITLE_PROMISE);
        });
    }

    private _declareRoute(path: string, pageNameSupplier: (pathParams: Record<string,string>) => string, viewComponentCreator: (pathParams: Record<string, string>) => Promise<SlottedTemplateResultFactory>|SlottedTemplateResultFactory,
                         titlePromise = Routing.DEFAULT_TITLE_PROMISE) {
        page(`${this.basePath}${path.substring(path[0]==='/'?1:0)}`, (context) => {
            const slottedViewComponentFactoryResult = viewComponentCreator(context.params);

            Promise.all([
                ((slottedViewComponentFactoryResult instanceof Promise)?
                    slottedViewComponentFactoryResult
                    :
                    Promise.resolve(slottedViewComponentFactoryResult)),
                titlePromise(context.params).catch(() => Routing.DEFAULT_TITLE)
            ]).then(([slottedViewTemplateFactory, title]) => {
                this.currentPath === '/' && window.scroll({ top: 0, behavior: 'smooth' })

                this.currentPath = path;

                document.title = title;

                this._viewChangeCallbacks.forEach(callback => callback(slottedViewTemplateFactory, path));
                Analytics.INSTANCE.navigationSurNouvellePage(pageNameSupplier(context.params));
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

    public navigateToRendezVousAvecRegion(codeRegion: string, pathLibelleRegion: string, searchType: SearchType) {
        page(this.getLinkToRendezVousAvecRegion(codeRegion, pathLibelleRegion, searchType))
    }

    public getLinkToRendezVousAvecRegion(codeRegion: string, pathLibelleRegion: string, searchType: SearchType) {
        return `${this.basePath}centres-vaccination-covid-region${codeRegion}-${pathLibelleRegion}/recherche-${searchType==='chronodose'?'chronodoses':'standard'}`;
    }

    public navigateToRendezVousAvecDepartement(codeDepartement: string, pathLibelleDepartement: string, searchType: SearchType) {
        page(this.getLinkToRendezVousAvecDepartement(codeDepartement, pathLibelleDepartement, searchType));
    }

    public getLinkToRendezVousAvecDepartement(codeDepartement: string, pathLibelleDepartement: string, searchType: SearchType) {
        return `${this.basePath}centres-vaccination-covid-dpt${codeDepartement}-${pathLibelleDepartement}/recherche-${searchType==='chronodose'?'chronodoses':'standard'}`;
    }

    public navigateToRendezVousAvecCommune(codeTriCentre: CodeTriCentre, codeDepartement: string, pathLibelleDepartement: string, codeCommune: string, codePostal: string, pathLibelleCommune: string, searchType: SearchType) {
        page(`${this.basePath}centres-vaccination-covid-dpt${codeDepartement}-${pathLibelleDepartement}/commune${codeCommune}-${codePostal}-${pathLibelleCommune}/recherche-${searchType==='chronodose'?'chronodoses':'standard'}/en-triant-par-${codeTriCentre}`);
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
