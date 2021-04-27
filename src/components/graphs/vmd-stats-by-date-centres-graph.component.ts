import {customElement} from 'lit-element';
import {VmdGraphBaseComponent} from "../vmd-graph.base.component";
import {StatsByDate} from "../../state/State";
import Chart from "chart.js";

@customElement('vmd-stats-by-date-centres-graph')
export class VmdStatsByDateGraphComponent extends VmdGraphBaseComponent<StatsByDate> {

    rebuildGraph(canvas: HTMLCanvasElement, data: StatsByDate): Promise<Chart> {
        let N = data.dates.length
        return Promise.resolve(
            new Chart(canvas, {
                type: 'bar',
                data: {
                    labels: data.dates,
                    datasets: [
                        {
                            label: 'Centres disponibles',
                            backgroundColor: '#5561d9',
                            borderColor: '#5561d9',
                            data: data.total_centres_disponibles,
                        },
                        {
                            label: 'Centres indisponibles',
                            backgroundColor: 'rgb(255, 99, 132)',
                            borderColor: 'rgb(255, 99, 132)',
                            data: data.total_centres,
                        },
                    ]
                },
                options: {
                    scales:{
                        xAxes: [{
                            stacked: true,
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
                            //stacked: true,
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
