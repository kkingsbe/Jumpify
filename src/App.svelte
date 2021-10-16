<script>
	export let name;
	import Sidebar from "./components/sidebar.svelte"
	import Home from "./components/home.svelte"
	import Jumps from "./components/jumps.svelte"
	import Import from "./components/import.svelte"
	var page = 1;
</script>

<main>
	<Sidebar bind:page={page}></Sidebar>
	{#if page == 1}
		<Home></Home>
	{/if}
	{#if page == 2}
		<Jumps></Jumps>
	{/if}
	{#if page == 3}
		<Import></Import>
	{/if}
</main>

<style>
	main {
		text-align: center;
		margin: 0 auto;
		display: flex;
		flex-direction: row;
		height: 100%;
		width: 100%;
		background: white;
		overflow-y: hidden;
	}
</style>