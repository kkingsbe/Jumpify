<script>
    export let selected;
    export let icon;
    export let text;
    $: console.log(selected)
    function select() {
        selected = true
    }
</script>

<sidebar-item on:click={select}>
    {#if selected}
        <div class="selected-div"></div>
    {/if}
    {#if !selected}
        <div class="unselected-div"></div>
    {/if}
    <img src={icon}>
</sidebar-item>

<style>
    sidebar-item {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        height: 3.5vw;
        width: 100%;
        padding-right: 2vw;
        cursor: pointer;
    }

    img {
        height: 3vw;
    }

    p {
        font-size: 1.75vw;
    }

    .selected-div {
        height: 100%;
        width: 0.5vw;
        background: white;
    }

    .unselected-div {
        height: 100%;
        width: 0.5vw;
        background: none;
    }
</style>