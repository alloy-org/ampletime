import {_dataURLFromBlob} from "./data-structures.js";
import {_durationToSeconds} from "./date-time.js";
import {_getEntryName} from "./entries.js";

//===================================================================================
// ==== REPORT GENERATION ====
//===================================================================================
/*
 * Returns a data URL pointing to a square PNG of a given "color".
 * Used in the table included in the report.
 */
export async function _createLegendSquare(color, options) {
    console.log(`_createLegendSquare(${color})`);
    // Create a canvas and get its context
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const size = options.legendSquareSize;  // size in pixels
    canvas.width = size;
    canvas.height = size;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);
    console.log(canvas);

    function canvasToBlob(canvas) {
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/png');
        });
    };
    console.log(canvasToBlob);

    let blob = await canvasToBlob(canvas);
    console.log(blob);
    return await _dataURLFromBlob(blob);
}

//===================================================================================
/*
 * Generates a chart using QuickChart. Gets a list of objects with "Color", "Task Name" and "Duration"
 * Returns a data URL pointing to the chart image.
 */
export async function _generatePie(taskDurations, options) {
    console.log(`generatePie(${taskDurations})`);
    // We don't want the whole MD link in the chart
    const labels = taskDurations.map(task => _getEntryName(task));
    console.log(labels);
    const data = taskDurations.map(task => _durationToSeconds(task['Duration']));  // Duration in hours
    console.log(data);

    const chart = new QuickChart();
    chart.setVersion('4');
    chart.setWidth(500)
    chart.setHeight(500);

    chart.setConfig({
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{ data: data, backgroundColor: options.colors }]
        },
        options: {
            plugins: {
                legend: {
                    // Hide the legend because it's too large & ugly
                    display: false
                },
                // On the chart itself, show percentages instead of durations
                // Only show percentages if larger than a certain value, to avoid jankiness
                datalabels: {
                    display: true,
                    formatter: (value, ctx) => {
                        let sum = 0;
                        let dataArr = ctx.chart.data.datasets[0].data;
                        dataArr.map(data => {
                            sum += data;
                        });
                        let percentage = (value*100 / sum).toFixed(0);
                        if (percentage < 7) return "";
                        return percentage + "%";
                    },
                    color: '#fff',
                },
            },
        }
    });

    console.log(chart.getUrl());
    let response = await fetch(chart.getUrl());
    let blob = await response.blob();
    let dataURL = await _dataURLFromBlob(blob);
    return dataURL;
}