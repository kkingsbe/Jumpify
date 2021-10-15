<script>
    import Card from "./stat-card.svelte"
</script>

<container>
    <div class="row">
        <Card statType="Jumps Logged"></Card>
        <Card statType="Freefall Time Logged"></Card>
        <Card statType="Jumps Logged Today"></Card>
    </div>
    <div class="row">
        <Card statType="Maximum Speed"></Card>
        <Card statType="Maximum Altitude"></Card>
        <Card statType="Average Deployment Altitude"></Card>
    </div>
</container>

<style>
    .row {
       display: flex;
       flex-direction: row;
       justify-content: space-around;
       margin-bottom: 5vw; 
    }
    container {
        display: grid;
    }
</style>