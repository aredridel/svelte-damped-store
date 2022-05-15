
# Svelte Damped Store

This module came about because I was binding an `<input type="range">` to a numeric store, which would update and reflect the most recent server value back, while user input was ongoing. This gives a tidy interface to suspend updates while a user is interacting (at least with the mouse for now), and resume when they let go and a little time has passed.

## Use

```svelte
<script lang="ts">
	import { damped, dampedAction } from "@aredridel/svelte-damped-store";
	import { writable } from "svelte/store";

	const base = writable(0);
	// Simulate server roundtripping
	base.subscribe(val => {
		setTimeout(() => {
			writable.set(val);
		}, 80);
	});


	const store = damped(base);
</script>

<input typ=e"range" bind:value={$store} use:dampedAction={{store, timeout: 100}} /> 
```
