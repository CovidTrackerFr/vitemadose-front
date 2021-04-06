import page from "page";
import { TemplateResult } from "lit-html";
import {html} from "lit-element";

export type ViewChangedCallback = (templateResult: TemplateResult, path: string) => void;
export type ViewChangedCallbackCleaner = Function;

class Routing {
    public static readonly INSTANCE = new Routing();

    private _viewChangeCallbacks: ViewChangedCallback[] = [];

    installRoutes(callback?: ViewChangedCallback): this {
        if(callback) {
            this.onViewChanged(callback);
        }

        page.redirect('/', '/home');
        page.redirect('/index.html', '/home');
        this.declareRoute('/home', () =>
            html`<vmd-home></vmd-home>`);
        this.declareRoute('/:departement/:trancheAge/rendez-vous', (params) =>
            html`<vmd-rdv codeDepartement="${params['departement']}" trancheAge="${params['trancheAge']}"></vmd-rdv>`);
        page('*', () => this._notFoundRoute());
        page();

        return this;
    }

    private declareRoute(path: string, viewComponentCreator: (pathParams: Record<string, string>) => Promise<TemplateResult>|TemplateResult) {
        page(path, (context) => {
            const viewComponentResult = viewComponentCreator(context.params);
            ((viewComponentResult instanceof Promise)?viewComponentResult:Promise.resolve(viewComponentResult)).then(viewTemplateResult => {
                this._viewChangeCallbacks.forEach(callback => callback(viewTemplateResult, path));
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
        console.error('Route not found !');
    }

    public navigateToRendezVous(codeDepartement: string, trancheAge: string) {
        page(`/${codeDepartement}/${trancheAge}/rendez-vous`);
    }
}

export const Router = Routing.INSTANCE;
