<script>
    export let statType
    export let statValue;

    switch (statType) {
        case "Jumps Logged":
            statValue = "36"
            break
        case "Freefall Time Logged":
            statValue = "158sec"
            break
        case "Jumps Logged Today":
            statValue = "1"
            break
        case "Maximum Speed":
            statValue = "198mph"
            break
        case "Maximum Altitude":
            statValue = "15,552ft"
            break
        case "Average Deployment Altitude":
            statValue = "4,205ft"
            break
    }
</script>

<card>
    <div class="text">
        <p class="type">{statType}</p>
        <p class="value">{statValue}</p>
    </div>
</card>

<style>
    card {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 20vw;
        height: 11vw;
        background: #FFB869;
        border-radius: 1.5vw;
        padding: 1vw;
        border: 3px solid rgb(80, 80, 80);
        box-shadow: 3px 3px 7px rgb(0 0 0 / 0.3);
        margin-right: 2.5vw;
    }

    .text {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        width: 100%;
        height: 100%;
    }

    .type {
        margin: 0;
        margin-right: auto;
        margin-left: 0vw;
        font-size: 1.5vw;
        font-weight: normal;
        color: rgb(0, 0, 0);
    }

    .value {
        margin: 0;
        margin-left: auto;
        margin-right: 0vw;
        font-size: 4vw;
        color: rgb(54, 54, 54);
    }

    img {
        width: 5vw;
    }
</style>