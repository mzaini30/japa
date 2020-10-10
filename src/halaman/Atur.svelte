<div class="container">
	<br>
	<p>Beri peringkat pada pernyataan yang sudah kamu pilih tadi</p>
	<table class="table table-bordered">
		<thead>
			<tr>
				<th>Nomor</th>
				<th>Pernyataan</th>
				<th>Peringkat</th>
			</tr>
		</thead>
		<tbody>
			{#each pilihan as x}
				<tr>
					<td>{x + 1}</td>
					<td>
						{#each data[x] as t}
							{@html t}<br>
						{/each}
					</td>
					<td>
						<input type="tel" class="form-control" placeholder="1 - 7">
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
<script type="text/javascript">
	import {data} from '../data.js'
	import {onMount, afterUpdate} from 'svelte'
	let pilihan = []
	onMount(() => {
		if (localStorage.japa) {
			pilihan = JSON.parse(localStorage.japa)
		}
	})
	afterUpdate(() => {
		window.scrollTo({
			top: 0,
			left: 0,
			behavior: 'smooth'
		})
	})
</script>