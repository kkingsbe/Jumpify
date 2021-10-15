<script>
    var Chart = require("chart.js")
    export let jump

    var labels = []
    var datapoints = []
    var altChart

    $: if(typeof(jump) !== "undefined") {
        console.log(jump)
        let startSec
        labels = []
        datapoints = []
        jump.forEach(point => {
            //console.log(point)
            let h = point.timestamp.substring(0,2)
            let min = point.timestamp.substring(2,4)
            let sec = point.timestamp.substring(4)
            let a = [h,min,sec]
            let seconds = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2])

            if(typeof(startSec) == "undefined") {
                startSec = seconds
                seconds = 0
            } else {
                seconds -= startSec
            }

            labels.push(seconds)
            datapoints.push(point.alt)
        })
        console.log(labels)

        if(typeof(altChart) !== "undefined")
			altChart.destroy()
        var canvas = document.getElementById("altitude")
        altChart = new Chart(canvas, {
            type: "line",
            data: {
                labels: labels,
                datasets: [
                    {
                        label: "Altitude (m) over time",
                        data: datapoints,
                        fill: true,
                        backgroundColor: "rgba(255, 99, 132, 0.2)",
                        borderColor: "rgba(255, 99, 132, 1)",
                        cubicInterpolationMode: 'monotone',
                        tension: 0.4
                    }
                ]
            }
        })
    }
</script>

<graph>
    <div class="container">
        <canvas id="altitude"></canvas>
    </div>
</graph>

<style>
    .container {
        width: 30vw;
    }
</style>