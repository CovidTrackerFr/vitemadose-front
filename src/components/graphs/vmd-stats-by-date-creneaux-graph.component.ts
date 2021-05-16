import {customElement} from 'lit-element';
import {VmdGraphBaseComponent} from "../vmd-graph.base.component";
import {StatsByDate} from "../../state/State";
import Chart from "chart.js";

@customElement('vmd-stats-by-date-creneaux-graph')
export class VmdStatsByDateCreneauxGraphComponent extends VmdGraphBaseComponent<StatsByDate> {

    rebuildGraph(canvas: HTMLCanvasElement, data: StatsByDate): Promise<Chart> {
        var dates = data.dates
        dates.push(dates[dates.length-1])

        var total_appointments = data.total_appointments

        return Promise.resolve(
            new Chart(canvas, {
                type: 'bar',
                data: {
                    labels: dates,
                    datasets: [{
                        label: 'Nombre de créneaux disponibles',
                        backgroundColor: 'rgb(255, 99, 132)',
                        borderColor: 'rgb(255, 99, 132)',
                        barPercentage: 1.0,
                        data: total_appointments,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
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
