<script>
    export let selectedMode

    let graphsSelected = true
    let groundTrackSelected = false
    let track3DSelected = false
    let graphsClass = "mode selected"
    let groundTrackClass = "mode"
    let track3DClass = "mode"

    function selectGraphs() {
        graphsSelected = true
        groundTrackSelected = false
        track3DSelected = false

        selectedMode = "graphs"

        graphsClass = "mode selected"
        groundTrackClass = "mode"
        track3DClass = "mode"
    }

    function selectGroundTrack() {
        graphsSelected = false
        groundTrackSelected = true
        track3DSelected = false

        selectedMode = "ground track"

        graphsClass = "mode"
        groundTrackClass = "mode selected"
        track3DClass = "mode"
    }

    function selectTrack3D() {
        graphsSelected = false
        groundTrackSelected = false
        track3DSelected = true

        selectedMode = "track 3d"
        graphsClass = "mode"
        groundTrackClass = "mode"
        track3DClass = "mode selected"
    }
</script>

<modeSelect>
    <div class={graphsClass} on:click={selectGraphs}>Graphs</div>
    <div class={groundTrackClass} on:click={selectGroundTrack}>Ground Track</div>
    <div class={track3DClass} on:click={selectTrack3D}>3D Track</div>
</modeSelect>

<style>
    modeSelect {
        display: flex;
        flex-direction: row;
        justify-content: space-around;
        width: 100%;
        margin-top: 2vw;
        margin-bottom: 2vw;
    }

    .mode {
        font-size: 1.5vw;
        background: #6c757d;
        color: white;
        padding: 0.75vw;
        border-radius: 0.5vw;
        cursor: pointer;
        box-shadow: 1px 1px 5px rgb(0 0 0 / 0.3);
    }

    .selected {
        background: rgb(255, 212, 40) !important;
        color: rgb(56, 56, 56);
    }
</style>