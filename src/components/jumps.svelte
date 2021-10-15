<script>
    import JumpSelector from "./jump-selector.svelte";
    import ModeSelect from "./display-mode-select.svelte"
    import JumpGraphs from "./jump-graphs.svelte"

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
    <ModeSelect></ModeSelect>
    <JumpGraphs jump={selectedData}></JumpGraphs>
</jumps>

<style>
    jumps {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        height: 100%;
        padding-top: 2vw;
    }
</style>