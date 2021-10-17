<script>
    var Datastore = require("nedb")
    var db = new Datastore("C:/Program Files/Jumpify/jumps.db")

    var jumpDates = [];
    export let selectedJump;
    let selectedDate

    $: if(typeof(selectedDate) !== 'undefined') selectedJump = selectedDate.toString()

    db.loadDatabase(function(err) {
        if(err) alert(err)
        db.find({}, {date: 1}, function(err, docs) {
            if(err) alert(err)
            else {
                jumpDates = [];
                for(let i = 0; i < docs.length; i++) {
                    jumpDates.push(new Date(docs[i].date))
                }
                jumpDates.sort().reverse()
            }
        })
    })
    
</script>

<selector>
    <select bind:value={selectedDate}>
        <option>Select Jump:</option>
        {#each jumpDates as date}
        <option>{date}</option>
        {/each}
    </select>
</selector>

<style>

</style>