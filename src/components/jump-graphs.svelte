<script>
    export let jump
    import Altgraph from "./altgraph.svelte"
    import VSGraph from "./VSGraph.svelte"
    import HSGraph from "./HSGraph.svelte"
    import DisplacementGraph from "./DisplacementGraph.svelte"
    import SpeedGraph from "./SpeedGraph.svelte"
</script>

<graphs>
    <SpeedGraph bind:jump={jump}></SpeedGraph>
    <Altgraph bind:jump={jump}></Altgraph>
    <VSGraph bind:jump={jump}></VSGraph>
    <HSGraph bind:jump={jump}></HSGraph>
    <DisplacementGraph bind:jump={jump}></DisplacementGraph>
</graphs>

<style>
    graphs {
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 2vw;
    }
</style>