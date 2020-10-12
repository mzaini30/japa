<div class="container">
	<br>
	<p>
		Nomor Tes: <strong>{biodata.nomorTes}</strong><br>
		Nama: <strong>{biodata.nama}</strong><br>
		Kelas / Sekolah: <strong>{biodata.kelasSekolah}</strong><br>
		JK: <strong>{biodata.jk}</strong>
	</p>
	<hr>
	<p>Beri peringkat pada pernyataan yang sudah kamu pilih tadi</p>
	<div class="table-responsive">
		<table class="table table-bordered">
			<thead>
				<tr>
					<th>No</th>
					<th>Pernyataan</th>
					<th>Rank</th>
				</tr>
			</thead>
			<tbody>
				{#each pilihan as x, n}
					<tr>
						<td>{x + 1}</td>
						<td>
							<ul>
								{#each data[x] as t}
									<li>{@html t}</li>
								{/each}
							</ul>
						</td>
						<td>
							<input type="tel" class="form-control" bind:value={isian[n]}>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
{#if error || diAtasTujuh}
	<div class="alert alert-danger melayang">
		{#if error}
			Peringkat tidak boleh ada yang sama
		{/if}
		{#if diAtasTujuh}
			Peringkat maksimal 7
		{/if}
	</div>
{/if}
<style type="text/css">
	.melayang {
		position: fixed;
		left: 20px;
		bottom: 0;
	}
	ul {
		padding-left: 10px;
	}
	table {
		margin-bottom: 80px;
	}
</style>
<script type="text/javascript">
	import {data} from '../data.js'
	import {onMount, afterUpdate} from 'svelte'
	let error = false
	let diAtasTujuh = false
	let pilihan = []
	let isian = []
	let biodata = {
		nomorTes: '',
		nama: '',
		kelasSekolah: '',
		jk: ''
	}
	onMount(() => {
		if (localStorage.japa) {
			pilihan = JSON.parse(localStorage.japa)
		}
		if (localStorage.dataJapa) {
			biodata = JSON.parse(localStorage.dataJapa)
		}
		window.scrollTo({
			top: 0,
			left: 0,
			behavior: 'smooth'
		})
	})
	$: if (isian) {
		if (isian.length == 7) {
			if ((new Set(isian)).size == 7) {
				error = false
			} else {
				error = true
			}
		} else {
			error = false
		}
		let hitung = 0
		for (let x of isian){
			if (x > 7) {
				hitung++
			}
		}
		if (hitung > 0) {
			diAtasTujuh = true
		} else {
			diAtasTujuh = false
		}
	}
</script>
