<script>
    export let jump
    
    var THREE = require("three");
    import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
    import {onMount} from 'svelte'

    var width;
    var height;
    var mounted = false

    let camera, scene, renderer;
    let geometry, material, mesh;
    let controls

    var lateralScale = 10000; //What the change in coordinates is multiplied by to improve viewability
    var verticalScale = 0.25; //What the altitude is scaled by
    var lateralSize = 50; //How many units the lateral dimensions will be
    var datapoints = []
    $: if(typeof(jump) !== "undefined" && mounted) {
        let coords = getDecimalCoords()
        datapoints = []
        let i = 0
        let largestVal = 0
        while(i < coords.length) {
            let coord = coords[i]
            console.log(coord)
            if(coords[0][0] - coord[0] > largestVal) largestVal = coords[0][0] - coord[0]
            if(coords[0][1] - coord[1] > largestVal) largestVal = coords[0][1] - coord[1]
            datapoints.push([(coords[0][0] - coord[0]), (coords[0][1] - coord[1]), jump[i].alt*verticalScale])
            i++
        }
        console.log(largestVal)
        for(let x = 0; x < datapoints.length; x++) {
            let point = datapoints[x]
            datapoints[x][0] = (point[0]/largestVal) * lateralSize
            datapoints[x][1] = (point[1]/largestVal) * lateralSize

            console.log(point[0])
            console.log(datapoints[x][0])
            console.log("\n")
        }
        init()
    }

    onMount(async () => {
        mounted = true
        init()
        return () => {
            console.log("unmount")
            renderer.setAnimationLoop( null );
        };
    })

    function init() {
        console.log(datapoints)
        let linePoints = []
        datapoints.forEach(point => {
            linePoints.push(new THREE.Vector3(point[0], point[2], point[1]))
        })

        removeAllChildNodes(document.getElementById("container"))
        camera = new THREE.PerspectiveCamera(70, 2, 1, 1000);
        camera.position.z = 200;
        camera.position.x = 200;
        camera.position.y = 100;

        scene = new THREE.Scene();

        geometry = new THREE.BufferGeometry().setFromPoints( linePoints );
        material = new THREE.MeshNormalMaterial();
        let line = new THREE.Line( geometry, material );

        scene.add( line );
        console.log(line)

        const gridHelper = new THREE.GridHelper( 200, 20 );
        scene.add(gridHelper)

        renderer = new THREE.WebGLRenderer( { antialias: true } );
        renderer.setClearColor(0xffffff)
        renderer.setAnimationLoop( animation );
        renderer.domElement.setAttribute("id", "track3d")
        renderer.domElement.setAttribute("style", "width: 100%; height: 100%;")
        document.getElementById("container").appendChild( renderer.domElement );

        controls = new OrbitControls( camera, renderer.domElement );
        controls.update();
    }

    function animation( time ) {
        //mesh.rotation.x = time / 2000;
        //mesh.rotation.y = time / 1000;

        renderer.render( scene, camera );
        resizeCanvasToDisplaySize();
        controls.update();
    }

    function resizeCanvasToDisplaySize() {
        const canvas = renderer.domElement;
        // look up the size the canvas is being displayed
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        // adjust displayBuffer size to match
        if (canvas.width !== width || canvas.height !== height) {
            // you must pass false here or three.js sadly fights the browser
            renderer.setSize(width, height, false);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();

            // update any render target sizes here
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

    function resize() {
        width = window.innerWidth
        height = window.innerHeight
    }

    function removeAllChildNodes(parent) {
        while (parent.firstChild) {
            parent.removeChild(parent.firstChild);
        }
    }
</script>

<svelte:window on:resize={resize}></svelte:window>

<track3d>
    <div id="container" class="container"></div>
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