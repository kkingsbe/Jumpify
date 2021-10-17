<svelte:head>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.4.0/dist/leaflet.css"
    integrity="sha512-puBpdR0798OZvTTbP4A8Ix/l+A4dHDD0DGqYW6RQ+9jxkRFclaxxQb/SJAWZfWAkuyeQUytO7+7N4QKrDh+drA=="
    crossorigin="">
</svelte:head>

<script>
    import L from 'leaflet'
    import {onMount} from 'svelte'
    import {DMS2Decimal} from 'dms-to-decimal'

    export let jump
    //$:console.log(jump)

    let loaded = false
    let decimalCoords = []
    var map

    $: if(jump && loaded) {
        console.log(map)
        if(typeof(map) !== 'undefined') map.remove()
        decimalCoords = getDecimalCoords()
        drawMap()
    }

    onMount(async () => {
        decimalCoords = getDecimalCoords()
        drawMap()
        loaded = true
    })

    function drawMap() {
        console.log(decimalCoords[0])
        map = L.map('map',{
            center: decimalCoords[0],
            zoom: 20
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        var polylinePoints = decimalCoords;            
        
        var polyline = L.polyline(polylinePoints).addTo(map);    
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

<groundtrack>
    <div id="map" class="map"></div>
</groundtrack>

<style>
    groundtrack {
        width: 75%;
        height: 75%;
    }
    .map {
        height: 100%;
        width: 100%;
      }
</style>