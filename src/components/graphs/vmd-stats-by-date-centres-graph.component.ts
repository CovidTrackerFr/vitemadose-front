import {customElement} from 'lit-element';
import {VmdGraphBaseComponent} from "../vmd-graph.base.component";
import {StatsByDate} from "../../state/State";
import Chart from "chart.js";

@customElement('vmd-stats-by-date-centres-graph')
export class VmdStatsByDateCentresGraphComponent extends VmdGraphBaseComponent<StatsByDate> {

    rebuildGraph(canvas: HTMLCanvasElement, data: StatsByDate): Promise<Chart> {
        return Promise.resolve(
            new Chart(canvas, {
                type: 'bar',
                data: {
                    labels: data.dates,
                    datasets: [
                        {
                            label: 'Lieux ayant des RDV disponibles',
                            backgroundColor: '#5561d9',
                            barPercentage: 1.0,
                            borderWidth: 0,
                            data: data.total_centres_disponibles,
                        },
                        {
                            label: 'Total lieux de vaccination',
                            barPercentage: 1.0,
                            borderWidth: 0,
                            backgroundColor: 'grey',
                            data: data.total_centres,
                        },

                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
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
