<script>
    import Card from "./stat-card.svelte"
    var Datastore = require("nedb")

    var statsDB = new Datastore("C:/Program Files/Jumpify/stats.db")
    var jumpsDB = new Datastore("C:/Program Files/Jumpify/jumps.db")
    var stats = {
        jumpsLogged: 0,
        maxSpeed: 0,
        maxAlt: 0
    }

    statsDB.loadDatabase(function(err) {
        if(err) alert(err)
        statsDB.find({}, function(err, docs) {
            stats = docs[0]
            console.log(docs)
        })
        jumpsDB.loadDatabase(function(err) {
            if(err) alert(err)
            jumpsDB.find({}, {date: 1}, function(err, docs) {
                if(err) alert(err)
                else {
                    let jumpsToday = 0
                    let today = (new Date().toISOString()).split("T")[0]
                    for(let i = 0; i < docs.length; i ++) {
                        let d = new Date(docs[i].date)
                        let jumpDate = d.toISOString().split("T")[0]
                        if(jumpDate == today) {
                            jumpsToday ++
                        }
                    }
                    stats.jumpsToday = jumpsToday
                }
            })
        })
    })

    
</script>

<container>
    <div class="row">
        <Card statType="Jumps Logged" statValue={stats.jumpsLogged}></Card>
        <Card statType="Freefall Time Logged"></Card>
        <Card statType="Jumps Logged Today" statValue={stats.jumpsToday}></Card>
    </div>
    <div class="row">
        <Card statType="Maximum Speed" statValue={stats.maxSpeed.toFixed(2)}mph></Card>
        <Card statType="Maximum Altitude" statValue={stats.maxAlt.toFixed(2)}ft></Card>
        <Card statType="Average Deployment Altitude"></Card>
    </div>
</container>

<style>
    .row {
       display: flex;
       flex-direction: row;
       justify-content: center;
       margin-bottom: 2.5vw; 
    }

    container {
        display: grid;
    }
</style>