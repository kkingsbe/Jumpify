<script>
    import Map from 'ol/Map';
    import View from 'ol/View';
    import TileLayer from 'ol/layer/Tile';
    import XYZ from 'ol/source/XYZ';

    new Map({
    target: 'map',
    layers: [
        new TileLayer({
        source: new XYZ({
            url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        })
        })
    ],
    view: new View({
        center: [0, 0],
        zoom: 2
    })
    });
</script>

<svelte:head>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/openlayers/openlayers.github.io@master/en/v6.9.0/css/ol.css" type="text/css">
</svelte:head>

<groundtrack>
    <div id="map" class="map"></div>
</groundtrack>

<style>
    groundtrack {
        width: 100%;
        height: 100%;
    }
    .map {
        height: 400px;
        width: 100%;
      }
</style>