<script>
    import JumpSelector from "./jump-selector.svelte";
    import ModeSelect from "./display-mode-select.svelte"
    import JumpGraphs from "./jump-graphs.svelte"
    import GroundTrack from "./groundtrack.svelte"
    
    var selectedMode = "graphs"

    var Datastore = require("nedb")
    var db = new Datastore("C:/Program Files/Jumpify/jumps.db")
    var selectedJump
    var selectedData
    var dbLoaded = false

    $: if (selectedJump != "Select Jump:" && dbLoaded && typeof(selectedJump) !== "undefined") { db.find({date: selectedJump}, function(err, docs) {
        if(err) alert(err)
        selectedData = docs[0].data
    })}

    //$: console.log(selectedData)

    var data = {};

    db.loadDatabase(function(err) {
        dbLoaded = true
        if(err) alert(err)
        db.find({}, function(err, docs) {
            if(err) alert(err)
            else {
                data = docs
            }
        })
    })
</script>

<jumps>
    <JumpSelector bind:selectedJump={selectedJump}></JumpSelector>
    <ModeSelect bind:selectedMode={selectedMode}></ModeSelect>
    {#if selectedMode == "graphs"}
        <JumpGraphs jump={selectedData}></JumpGraphs>
    {/if}
    {#if selectedMode == "ground track"}
        <GroundTrack jump={selectedData}></GroundTrack>
    {/if}
</jumps>

<style>
    jumps {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        overflow-y: scroll;
        padding-top: 2vw;
    }
</style>