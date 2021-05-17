import {customElement, property} from 'lit-element';
import {VmdGraphBaseComponent} from "../vmd-graph.base.component";
import Chart from "chart.js";
import {HistoriqueLieu} from "../../state/State";

@customElement('vmd-location-stats-graph')
export class VmdLocationStatsGraphComponent extends VmdGraphBaseComponent<any> {

    @property() color!: string;

    rebuildGraph(canvas: HTMLCanvasElement, data: HistoriqueLieu): Promise<Chart> {
        return Promise.resolve(
            new Chart(canvas, {
                type: 'line',
                data: {
                    labels: data.stats.map(s => s.date),
                    datasets: [
                        {
                            label: 'Nombre de créneaux disponibles',
                            backgroundColor: this.color,
                            // barPercentage: 1.0,
                            // borderWidth: 0,
                            data: data.stats.map(s => s.chronodose_appointment_count),
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
                                min: 0,
                                stepSize: 1
                            }
                        }]
                    }
                }
            }
        )
        )
    }

}
