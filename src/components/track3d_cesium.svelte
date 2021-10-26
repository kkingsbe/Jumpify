<script>
    export let jump
    import {onMount} from 'svelte'
	var Cesium = require("cesium")
	import '../../node_modules/cesium/Build/Cesium/Widgets/widgets.css'

    let viewer
    var mounted = false
    Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3NTY2ODJlYi03Yjk4LTQyNzctYTViNC1hOGExNTVlYzAxZGMiLCJpZCI6NzA3NDcsImlhdCI6MTYzNDYxMTk1M30.2wm8m8_BLf6waLA_-AAgrG96edGS2YUvoS3qmFMXj90"

    var datapoints = []
    var data = []
    $: if(typeof(jump) !== "undefined" && mounted) {
        if(typeof(viewer) !== "undefined") {
            viewer.entities.removeAll();
            viewer.destroy();
        }
        let coords = getDecimalCoords()
        datapoints = []
        let i = 0
        let largestVal = 0
        while(i < coords.length) {
            if(jump[i].fixType == "fix") {
                let coord = coords[i]
                datapoints.push(coord[0])
                datapoints.push(coord[1])
                datapoints.push(jump[i].alt)
                //console.log(jump[i].alt)
                data.push({
                    lat: coord[0],
                    lon: coord[1],
                    alt: jump[i].alt
                })
            }
            i++
        }
        console.log(data)
        //console.log(datapoints)
	    window.CESIUM_BASE_URL = './build';
        mounted = true
        viewer = new Cesium.Viewer('cesiumContainer', {
            terrainProvider : Cesium.createWorldTerrain()
        })
        var purpleArrow = viewer.entities.add({
            name: "Purple straight arrow at height",
            polyline: {
                positions: Cesium.Cartesian3.fromDegreesArrayHeights(datapoints),
                width: 10,
                arcType: Cesium.ArcType.NONE,
                material: new Cesium.PolylineArrowMaterialProperty(
                Cesium.Color.YELLOW
                ),
            },
        });

        viewer.zoomTo(viewer.entities);
        //console.log(datapoints)
    }

    onMount(async () => {
        mounted = true
    })

    function getDecimalCoords() {
        let arr = []
        for(let i = 0; i < jump.length; i++) {
            if(jump[i].fixType == "none") continue
            
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

            arr.push([lonDecimal, latDecimal])

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