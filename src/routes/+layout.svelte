<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import '../app.css';
</script>

<svelte:head>
	<title>Heardle – Maisie Peters Edition</title>
</svelte:head>

<!-- Remove bg-black/text-white here so your game can supply its own background -->
<div class="min-h-screen bg-transparent antialiased">
	<slot />
</div>
