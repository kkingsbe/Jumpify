<script>
    import Line from "svelte-chartjs/src/Line.svelte"
    export let jump

    var vs_threshold = 30 //mph, threshold for entering freefall
    var labels = []
    var datapoints = []
    var chartData

    $: if(typeof(jump) !== "undefined") {
        //console.log(jump)
        let startSec
        labels = []
        datapoints = []
        let lastAlt = -999
        let lastTime = -1
        let ff = false
        let ffStart = 0
        jump.forEach(point => {
            let h = point.timestamp.substring(0,2)
            let min = point.timestamp.substring(2,4)
            let sec = point.timestamp.substring(4)
            let a = [h,min,sec]
            let seconds = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2])
            let vs
            let dz
            let dt

            if(typeof(startSec) == "undefined" && point.fixType == "fix") {
                startSec = seconds
                seconds = 0
            } else {
                seconds -= startSec
            }
            
            if(lastAlt == -999) {
                lastAlt = point.alt
                dz = 0
            } else {
                dz = lastAlt - point.alt
                lastAlt = point.alt
            }

            if(lastTime == -1) {
                vs = 0
                dt = 0
                lastTime = seconds
            } else {
                dt = seconds - lastTime
                lastTime = seconds
                vs = dz/dt
            }
            //console.log(dt)
            if(vs >= vs_threshold && vs < 100 && !ff) { //Check to see if the vertical speed is over the threshold, if the vertical speed is correct, and if we arent already in freefall
                ff = true //Entered freefall if the vs is higher than the threshold
                ffStart = seconds
                //startSec = seconds
                //console.log(seconds)
                //seconds = 0
            }
            if(point.fixType == "fix" && ff) {
                labels.push(Math.round(seconds - ffStart))
                datapoints.push(vs * 2.237) //M/S to Mph
            }
        })
        //console.log(labels)
        //console.log(datapoints)

        chartData = {
            labels: labels,
            datasets: [
                {
                    label: "Vertical Speed (mph) over time",
                    data: datapoints,
                    fill: true,
                    backgroundColor: "rgba(130, 99, 255, 0.2)",
                    borderColor: "rgba(130, 99, 255, 1)",
                    cubicInterpolationMode: 'monotone',
                    tension: 0.4
                }
            ]
        }
    }
</script>

<graph>
    {#if typeof(jump) !== "undefined"}
    <div class="container">
        <Line data={chartData}></Line>
    </div>
    {/if}
</graph>

<style>
    .container {
        width: 50vw;
        background: white;
        margin-top: 2vw;
        border-radius: 1.5vw;
        padding: 2vw;
        box-shadow: 3px 3px 7px rgb(0 0 0 / 0.3);
    }
</style>