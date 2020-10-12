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
							<input type="tel" class="form-control" placeholder="1-7" bind:value={isian[n]}>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
<div class="alert alert-warning melayang">Peringkat tidak boleh ada yang sama</div>
<style type="text/css">
	.melayang {
		position: fixed;
		left: 20px;
		bottom: 20px;
	}
</style>
<script type="text/javascript">
	import {data} from '../data.js'
	import {onMount, afterUpdate} from 'svelte'
	let pilihan = []
	let isian = [1, 1, 3, 4, 1, 6, 7]
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
	})
	afterUpdate(() => {
		window.scrollTo({
			top: 0,
			left: 0,
			behavior: 'smooth'
		})
	})
</script>
