import {customElement} from 'lit-element';
import {VmdGraphBaseComponent} from "../vmd-graph.base.component";
import {StatsByDate} from "../../state/State";
import Chart from "chart.js";

@customElement('vmd-stats-by-date-graph')
export class VmdStatsByDateGraphComponent extends VmdGraphBaseComponent<StatsByDate> {

    rebuildGraph(canvas: HTMLCanvasElement, data: StatsByDate): Promise<Chart> {
        return Promise.resolve(new Chart(canvas, {
            type: 'line',
            data: {
                labels: data.dates,
                datasets: [{
                    label: 'My First dataset',
                    backgroundColor: 'rgb(255, 99, 132)',
                    borderColor: 'rgb(255, 99, 132)',
                    data: data.total_centres,
                }]
            },
            options: {}
        }));
    }

}
