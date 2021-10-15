<script>
    var Datastore = require("nedb")
    var db = new Datastore("C:/Program Files/Jumpify/jumps.db")

    var jumpDates = [];
    export let selectedJump;

    db.loadDatabase(function(err) {
        if(err) alert(err)
        db.find({}, {date: 1}, function(err, docs) {
            if(err) alert(err)
            else {
                jumpDates = docs;
                //console.log(jumpDates)
            }
        })
    })
    
</script>

<selector>
    <select bind:value={selectedJump}>
        <option>Select Jump:</option>
        {#each jumpDates as date}
        <option>{date.date}</option>
        {/each}
    </select>
</selector>

<style>

</style>