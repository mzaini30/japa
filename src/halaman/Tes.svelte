<div class="header">
	<ul class="pagination justify-content-center tanpa-garis">
		{#if terkumpul.length <= 7}
			{#each Array(7) as _, n}
				<li class={terkumpul.length >= n + 1 ? 'active page-item' : 'page-item'}>
					<div class="page-link">&nbsp;</div>
				</li>
			{/each}
			{#if terkumpul.length == 7}
				<li class="page-item"><a href="#/atur" class="page-link" on:click={simpan}>Lanjut...</a></li>
			{/if}
		{:else}
			<li class="page-item"><div class="page-link">Kelebihan</div></li>
		{/if}
	</ul>
</div>
<div class="isi">
	<br>
	{#each Array(9) as _, n}
		{#if params.halaman == n + 1}
			<table class="table table-bordered">
				{#each Array(11) as _, o}
					<tr class={terkumpul.includes(n * 11 + o) ? 'click active' : 'click'} on:click={() => tambahkan(n * 11 + o)}>
						<td>{n * 11 + o + 1}</td>
						<td>
			 			 <ul>
							{#each Array(3) as _, p}
								<li>{@html data[n * 11 + o][p]}</li>
							{/each}
						 </ul>
						</td>
					</tr>
				{/each}
			</table>
		{/if}
	{/each}
</div>
<div class="footer">
	<ul class="pagination justify-content-center">
		{#each Array(9) as _, n}
			<li class={params.halaman == n + 1 ? 'active page-item' : 'page-item'}><a href="#/tes/{n + 1}" class="page-link">{n + 1}</a></li>
		{/each}
	</ul>
</div>
<script type="text/javascript">
	let bagian = 1
	export let params
	import {data} from '../data.js'
	let terkumpul = []
	$: if (params) {
		window.scrollTo({
			top: 0,
			left: 0,
			behavior: 'smooth'
		})
	}
	const simpan = () => localStorage.setItem('japa', JSON.stringify(terkumpul))
	const tambahkan = n => {
		if (terkumpul.includes(n)) {
			let posisi = terkumpul.indexOf(n)
			terkumpul.splice(posisi, 1)
			terkumpul = terkumpul
		} else {
			terkumpul.push(n)
			terkumpul = terkumpul
		}
	}
</script>
<style type="text/css">
	.footer {
		background: rgb(0, 150, 136);
		padding: 10px;
		position: fixed;
		bottom: 0;
		left: 0;
		width: 100%;
	}
	.footer .pagination,
	.header .pagination {
		margin: 0;
	}
	.isi {
		margin-top: 30px;
		margin-bottom: 60px;
	}
	.header {
		background: rgb(0, 150, 136);
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		padding: 10px;
	}
	.click {
		cursor: pointer;
	}
	.click.active {
		background: rgb(255, 87, 34);
		color: white;
	}
	.tanpa-garis .page-link {
		border: none;
	}
</style>
