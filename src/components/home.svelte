<script>
	export let name;
	import HomeBanner from "./home-banner.svelte"
    import StatCardContainer from "./stat-card-container.svelte"
</script>

<home>
	<HomeBanner></HomeBanner>
    <StatCardContainer></StatCardContainer>
</home>

<style>
	home {
		text-align: center;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		height: 100%;
		width: 100%;
	}
</style>