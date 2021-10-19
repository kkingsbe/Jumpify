<script>
    export let jump
    import {onMount} from 'svelte'
	import { Viewer, Cesium } from 'cesium';
	import '../../node_modules/cesium/Build/Cesium/Widgets/widgets.css'

    let viewer
    var mounted = false
    //Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3NTY2ODJlYi03Yjk4LTQyNzctYTViNC1hOGExNTVlYzAxZGMiLCJpZCI6NzA3NDcsImlhdCI6MTYzNDYxMTk1M30.2wm8m8_BLf6waLA_-AAgrG96edGS2YUvoS3qmFMXj90"

    var datapoints = []
    $: if(typeof(jump) !== "undefined" && mounted) {
        let coords = getDecimalCoords()
        datapoints = []
        let i = 0
        let largestVal = 0
        while(i < coords.length) {
            let coord = coords[i]
            datapoints.push([coords[0], coords[1], jump[i].alt])
            i++
        }
        console.log(datapoints)
    }

    onMount(async () => {
	    window.CESIUM_BASE_URL = './build';
        mounted = true
        viewer = new Viewer('cesiumContainer')
    })

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

<track3d>
    <div id="cesiumContainer" class="container"></div>
</track3d>

<style>
    track3d {
        width: 75%;
        height: 75%;
    }
    .container {
        width: 100%;
        height: 100%;
    }
</style>