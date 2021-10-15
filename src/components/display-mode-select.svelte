<script>

</script>

<modeSelect>
    <div class="mode selected">Graphs</div>
    <div class="mode">Ground Track</div>
    <div class="mode">3D Track</div>
</modeSelect>

<style>
    modeSelect {
        display: flex;
        flex-direction: row;
        justify-content: space-around;
        width: 100%;
        margin-top: 2vw;
    }

    .mode {
        font-size: 1.5vw;
        background: #6c757d;
        color: white;
        padding: 0.75vw;
        border-radius: 0.5vw;
        cursor: pointer;
        box-shadow: 1px 1px 5px rgb(0 0 0 / 0.3);
    }

    .selected {
        background: #007bff !important;
    }
</style>