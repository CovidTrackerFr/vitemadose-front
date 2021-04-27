import {customElement} from 'lit-element';
import {VmdGraphBaseComponent} from "../vmd-graph.base.component";
import {StatsByDate} from "../../state/State";
import Chart from "chart.js";

@customElement('vmd-stats-by-date-creneaux-graph')
export class VmdStatsByDateGraphComponent extends VmdGraphBaseComponent<StatsByDate> {

    rebuildGraph(canvas: HTMLCanvasElement, data: StatsByDate): Promise<Chart> {
        let N = data.dates.length
        return Promise.resolve(
            new Chart(canvas, {
                type: 'bar',
                data: {
                    labels: data.dates,
                    datasets: [{
                        label: 'Nombre de créneaux disponibles',
                        backgroundColor: 'rgb(255, 99, 132)',
                        borderColor: 'rgb(255, 99, 132)',
                        data: data.total_appointments,
                    }]
                },
                options: {
                    scales:{
                        xAxes: [{
                            ticks:{
                                source: 'auto'
                            },
                            type: 'time',
                            distribution: 'linear',
                            gridLines: {
                                display: false
                            },
                            time: {
                                unit: 'day',
                                displayFormats: {
                                    day: 'ddd DD MMM'
                                }
                            }
                        }],
                        yAxes: [{
                            ticks:{
                                min: 0
                            }
                        }]
                    }
                }
            }
        )
        )
    }

}
