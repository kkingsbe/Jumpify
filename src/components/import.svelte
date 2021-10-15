<script>
    var fs = require('fs'); // Load the File System to execute our common tasks (CRUD)
    var nmea = require('nmea')
    var Datastore = require("nedb")
    var db = new Datastore("C:/Program Files/Jumpify/jumps.db")
    db.loadDatabase()
    console.log(db)

    let input;
    let files;

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

                    if(typeof(parsed) !== "undefined" && parsed.sentence == "GGA") {
                        parsedData.push(parsed)
                    }

                    if(typeof(parsed) !== "undefined" && parsed.sentence == "RMC") {
                        console.log(parsed.speedKnots)
                        parsedData[parsedData.length-1].speedKnots = parsed.speedKnots
                    }
                })

                console.log(parsedData)

                var doc = {
                    date: date,
                    data: parsedData
                }
                db.insert(doc, function(err, newDoc) {
                    if(err) alert(err)
                })
                alert("Import Success")
                input.value = ''
            });
        }
    }
</script>

<import>
    <input id="fileselector" type="file" bind:this={input} bind:files>
    <div class="btn" on:click={importFiles}>
        <p>Import!</p>
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
</style>