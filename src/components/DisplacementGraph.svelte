<script>
    import Line from "svelte-chartjs/src/Line.svelte"
    export let jump

    var labels = []
    var datapoints = []
    var chartData

    $: if(jump && typeof(jump) !== "undefined") {
        let decimalCoords = getDecimalCoords()
        let startCoords = decimalCoords[0]
        let startSec
        labels = []
        datapoints = []
        for(let i = 0; i < decimalCoords.length; i++) {
            let point = decimalCoords[i]
            let displacement = measure(startCoords[0], startCoords[1], point[0], point[1])

            let h = jump[i].timestamp.substring(0,2)
            let min = jump[i].timestamp.substring(2,4)
            let sec = jump[i].timestamp.substring(4)
            let a = [h,min,sec]
            let seconds = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2])

            if(typeof(startSec) == "undefined") {
                startSec = seconds
                seconds = 0
            } else {
                seconds -= startSec
            }

            labels.push(Math.round(seconds))
            datapoints.push(displacement * 3.281) //Meters to ft
        }
        //console.log(labels)
        //console.log(datapoints)

        chartData = {
            labels: labels,
            datasets: [
                {
                    label: "Lateral Displacement (ft) over time",
                    data: datapoints,
                    fill: true,
                    backgroundColor: "rgba(59, 237, 133, 0.2)",
                    borderColor: "rgba(59, 237, 133, 1)",
                    cubicInterpolationMode: 'monotone',
                    tension: 0.4
                }
            ]
        }
    }

    function measure(lat1, lon1, lat2, lon2){  // generally used geo measurement function
        var R = 6378.137; // Radius of earth in KM
        var dLat = lat2 * Math.PI / 180 - lat1 * Math.PI / 180;
        var dLon = lon2 * Math.PI / 180 - lon1 * Math.PI / 180;
        var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        var d = R * c;
        return d * 1000; // meters
    }

    function getDecimalCoords() {
        let arr = []
        for(let i = 0; i < jump.length; i++) {
            let point = jump[i]
            let lat = point.lat
            let latPole = point.latPole
            let lon = point.lon
            let lonPole = point.lonPole

            if(lat == "" || lon == "") continue

            let latDeg = parseInt(lat.substring(0,2))
            let latMin = parseInt(lat.substring(2,4))
            let latSec = parseFloat(lat.substring(4,8)) * 60

            let lonDeg = parseInt(lon.substring(0,3))
            let lonMin = parseInt(lon.substring(3,5))
            let lonSec = parseFloat(lon.substring(5,9)) * 60
            
            let latDecimal = ConvertDMSToDD(latDeg, latMin, latSec, latPole)
            let lonDecimal = ConvertDMSToDD(lonDeg, lonMin, lonSec, lonPole)

            arr.push([latDecimal, lonDecimal])

            //console.log(`Lat: ${latDecimal.toFixed(2)} Lon: ${lonDecimal.toFixed(2)}`)
            //console.log(`LAT: D: ${latDeg} | M: ${latMin} | S: ${latSec}`)
            //console.log(`LON: D: ${lonDeg} | M: ${lonMin} | S: ${lonSec}`)
        }
        return arr
    }

    function ConvertDMSToDD(degrees, minutes, seconds, direction) {
        var dd = degrees + minutes/60 + seconds/(60*60);

        if (direction == "S" || direction == "W") {
            dd = dd * -1;
        } // Don't do anything for N or E
        return dd;
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