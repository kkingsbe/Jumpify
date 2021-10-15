<script>
	import Icon from "./icon.svelte"
    import SidebarItem from "./sidebar-item.svelte"
    export let page;

    var homeSelected = false;
    var jumpsSelected = false;
    var importSelected = false;

    switch(page) {
        case 1:
            homeSelected = true;
            break;
        case 2:
            jumpsSelected = true;
            break;
        case 3:
            importSelected = true;
            break;
    }

    $: if(homeSelected) {
        selectHome()
        page = 1
    }

    $: if(jumpsSelected) {
        selectJumps()
        page = 2
    }

    $: if(importSelected) {
        selectImport()
        page = 3
    }

    function selectHome() {
        homeSelected = true;
        jumpsSelected = false;
        importSelected = false;
    }

    function selectJumps() {
        homeSelected = false;
        jumpsSelected = true;
        importSelected = false;

        console.log(jumpsSelected)
    }

    function selectImport() {
        homeSelected = false;
        jumpsSelected = false;
        importSelected = true;
    }
</script>

<sidebar>
	<Icon src="./res/icon.png"></Icon>
    <div class="items">
        <SidebarItem bind:selected={homeSelected} icon="./res/home.svg" text="Home"></SidebarItem>
        <SidebarItem bind:selected={jumpsSelected} icon="./res/jumps.png" text="Jumps"></SidebarItem>
        <SidebarItem bind:selected={importSelected} icon="./res/import.png" text="Import"></SidebarItem>
    </div>
</sidebar>

<style>
    sidebar {
        height: 100%;
        display: flex;
        flex-direction: column;
        border-right: 1px solid gray;
        padding-right: 2vw;
    }

    .items {
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-around;
    }
</style>