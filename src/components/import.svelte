<script>
    var fs = require('fs'); // Load the File System to execute our common tasks (CRUD)
    var nmea = require('nmea')
    var Datastore = require("nedb")
    var jumpsDB = new Datastore("C:/Program Files/Jumpify/jumps.db")
    var statsDB = new Datastore("C:/Program Files/Jumpify/stats.db")
    jumpsDB.loadDatabase()
    statsDB.loadDatabase()

    let input;
    let files;

    var existingJumpDates = [];

    jumpsDB.loadDatabase(function(err) {
        if(err) alert(err)
        jumpsDB.find({}, {date: 1}, function(err, docs) {
            if(err) alert(err)
            else {
                existingJumpDates = docs;
            }
            generateStats()
        })
    })

    function importFiles() {
        console.log(files)
        for(let i = 0; i < files.length; i++) {
            let file = files[i];
            fs.readFile(file.path, 'utf-8', (err, data) => {
                if(err){
                    alert("An error ocurred reading the file :" + err.message);
                    return;
                }

                let lines = data.split('\n')
                let parsedData = []
                let date = 0
                lines.forEach(line => {
                    let parsed
                    try {
                        parsed = nmea.parse(line)
                        //console.log(parsed)
                    } catch(e) {console.log(e)}
                    
                    if(typeof(parsed) !== "undefined" && parsed.sentence == "RMC" && date == 0) {
                        let parseddate = parsed.date
                        let timestamp = parsed.timestamp

                        let d = parseddate.substring(0,2)
                        let m = parseddate.substring(2,4)
                        let y = parseddate.substring(4,6)
                        let h = timestamp.substring(0,2)
                        let min = timestamp.substring(2,4)
                        let sec = timestamp.substring(4,6)
                        let utc_str = `20${y}-${m}-${d}T${h}:${min}:${sec}Z`
                        let dt = new Date(utc_str)
                        date = dt.toString()
                    }

                    //console.log(parsedData)
                    if(typeof(parsed) !== "undefined" && parsed.sentence == "GGA") {
                        parsedData.push(parsed)
                    }
                    if(typeof(parsed) !== "undefined" && parsed.sentence == "RMC") {
                        //console.log(parsed.speedKnots)
                        if(parsedData.length > 0) parsedData[parsedData.length-1].speedKnots = parsed.speedKnots
                    }
                })

                let alreadyExists = false
                existingJumpDates.forEach(d => {
                    if(d.date == date) alreadyExists = true
                })
                console.log(parsedData)
                if(!alreadyExists) {
                    console.log(existingJumpDates)
                    var doc = {
                        date: date,
                        data: parsedData
                    }
                    jumpsDB.insert(doc, function(err, newDoc) {
                        if(err) alert(err)
                        generateStats()
                    })
                    alert("Import Success")
                } else {
                    alert("ERROR: Jump already imported")
                    generateStats()
                }
                input.value = ''
            });
        }
    }

    function generateStats() {
        statsDB.remove({ }, { multi: true }, function (err, numRemoved) {
            jumpsDB.find({}, function(err, docs) {
                //console.log(docs)
                let jumpsLogged = docs.length
                let maxSpeeds = []
                let maxAlts = []
                docs.forEach(jump => {
                    maxSpeeds.push(jumpMaxSpeed(jump))
                    maxAlts.push(jumpMaxAlt(jump))
                })
                let stats = {
                    jumpsLogged: jumpsLogged,
                    maxSpeed: Math.max(...maxSpeeds),
                    maxAlt: Math.max(...maxAlts)
                }
                
                statsDB.insert(stats, function(err, newDow) {
                    if(err) alert(err)
                })
            })
        });
    }

    function jumpMaxSpeed(jump) {
        let startSec
        let datapoints = []
        let vertS = []
        let ls = []
        let lastAlt = -999
        let lastTime = -1
        var vs_threshold = 30 //mph, threshold for entering freefall
        let ff = false
        //console.log(jump)
        jump.data.forEach(point => {
            let h = point.timestamp.substring(0,2)
            let min = point.timestamp.substring(2,4)
            let sec = point.timestamp.substring(4)
            let a = [h,min,sec]
            let seconds = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2])
            let vs
            let dz
            let dt

            if(typeof(startSec) == "undefined" && point.fixType == "fix") {
                startSec = seconds
                seconds = 0
            } else {
                seconds -= startSec
            }
            
            if(lastAlt == -999) {
                lastAlt = point.alt
                dz = 0
            } else {
                dz = lastAlt - point.alt
                lastAlt = point.alt
            }

            if(lastTime == -1) {
                vs = 0
                dt = 0
                lastTime = seconds
            } else {
                dt = seconds - lastTime
                lastTime = seconds
                vs = dz/dt
            }

            //console.log(point.alt)

            if(vs > vs_threshold && vs < 100) {
                ff = true
            }

            if(point.fixType == "fix" && ff) {
                ls.push(point.speedKnots/1.944) //knots to m/s
                vertS.push(vs)
                let v = Math.sqrt((point.speedKnots/1.944)**2 + (vs)**2) * 2.237
                if(!isNaN(v)) {
                    //console.log(isNaN(v))
                    datapoints.push(v) //Norm and convert m/s to mph
                }
            }
        })
        console.log("--------------------------------------------")
        console.log(jump)
        console.log(Math.max(...datapoints))
        return Math.max(...datapoints)
    }

    function jumpMaxAlt(jump) {
        let startSec
        let datapoints = []
        jump.data.forEach(point => {
            //console.log(point)
            let h = point.timestamp.substring(0,2)
            let min = point.timestamp.substring(2,4)
            let sec = point.timestamp.substring(4)
            let a = [h,min,sec]
            let seconds = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2])

            if(typeof(startSec) == "undefined" && point.fixType == "fix") {
                startSec = seconds
                //console.log(startSec)
                seconds = 0
            } else {
                //console.log(seconds)
                seconds -= startSec
            }

            if(point.fixType == "fix") {
                datapoints.push(point.alt * 3.28084) //Meters to ft
            }
        })

        return Math.max(...datapoints)
    }

    generateStats()
</script>

<import>
    <div class="card">
        <p class="title">Import Data:</p>
        <input id="fileselector" type="file" multiple bind:this={input} bind:files>
        <div class="btn" on:click={importFiles}>
            <p>Import!</p>
        </div>
    </div>
</import>

<style>
    import {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
    }
    .btn {
        background: #28a745;
        padding: 1vw;
        width: fit-content;
        height: fit-content;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 0.5vw;
        cursor: pointer;
        box-shadow: 1px 1px 5px rgb(0 0 0 / 0.3);
    }

    p {
        color: white;
        margin: 0;
        padding: 0;
    }

    .title {
        color: black;
        padding: 0px;
        margin: 0px;
        margin-bottom: 1vw;
        font-size: 1.5vw;
    }

    .card {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: white;
        padding: 2em;
        border-radius: 2vw;
    }

    input {
        color: black;
    }
</style>