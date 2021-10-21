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
	<!--Icon src="./res/icon.png"></Icon-->
    <div class="items">
        <SidebarItem bind:selected={homeSelected} icon="./res/home.svg"></SidebarItem>
        <SidebarItem bind:selected={jumpsSelected} icon="./res/jumps.png"></SidebarItem>
        <SidebarItem bind:selected={importSelected} icon="./res/import.png"></SidebarItem>
    </div>
</sidebar>

<style>
    sidebar {
        display: flex;
        flex-direction: column;
        justify-content: center;
        width: 5vw;
        margin-left: 0.5vw;
    }

    .items {
        height: 60%;
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding-right: 1vw;
        padding-top: 3vw;
        padding-bottom: 3vw;

        border-right: 1px solid gray;
        background: rgb(12, 11, 24);
        color: white;
        border-radius: 5vw;
    }
</style>