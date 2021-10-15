<script>
    var Datastore = require("nedb")
    var db = new Datastore("C:/Program Files/Jumpify/jumps.db")

    var jumpDates = [];

    db.loadDatabase(function(err) {
        db.find({}, {date: 1}, function(err, docs) {
            jumpDates = docs;
            console.log(jumpDates)
        })
    })
    
</script>

<selector>
    <select>
        {#each jumpDates as date}
        <option>{date.date}</option>
        {/each}
    </select>
</selector>

<style>

</style>