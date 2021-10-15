<script>
    export let jump
    import Altgraph from "./altgraph.svelte"
    import VSGraph from "./VSGraph.svelte"
</script>

<graphs>
    <Altgraph bind:jump={jump}></Altgraph>
    <VSGraph bind:jump={jump}></VSGraph>
</graphs>

<style>
    graphs {
        height: 100%;
        width: 100%;
    }
</style>