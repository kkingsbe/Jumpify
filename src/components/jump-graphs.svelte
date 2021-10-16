<script>
    export let jump
    import Altgraph from "./altgraph.svelte"
    import VSGraph from "./VSGraph.svelte"
    import HSGraph from "./HSGraph.svelte"
</script>

<graphs>
    <Altgraph bind:jump={jump}></Altgraph>
    <VSGraph bind:jump={jump}></VSGraph>
    <HSGraph bind:jump={jump}></HSGraph>
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