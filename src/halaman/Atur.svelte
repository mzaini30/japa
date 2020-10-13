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
{#if selesai}
	<div class="btn btn-info melayang-kanan" on:click={kirim}>Kirim...</div>
{/if}
<style type="text/css">
	.melayang {
		position: fixed;
		left: 20px;
		bottom: 0;
	}
	.melayang-kanan {
		position: fixed;
		right: 20px;
		bottom: 20px;
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
	let selesai = false
	let diAtasTujuh = false
	let result = ''
	let pilihan = []
	let isian = []
	let wa = '62895704160388'
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
	const kirim = () => {
		location.href = `https://docs.google.com/forms/d/e/1FAIpQLSfCnA8dvyQ-hgv9H0JDuXhf2g_QYtqT6zkPq_EGvTM7ReAsrg/viewform?usp=pp_url&entry.2062712989=${biodata.nomorTes}&entry.1440639833=${biodata.nama}&entry.1296372185=${biodata.kelasSekolah}&entry.853594757=${biodata.jk}&entry.1143589728=${pilihan[0] + 1}&entry.1817996895=${isian[0]}&entry.1741278348=${pilihan[1] + 1}&entry.909508085=${isian[1]}&entry.1059735049=${pilihan[2] + 1}&entry.792195048=${isian[2]}&entry.295777424=${pilihan[3] + 1}&entry.896151727=${isian[3]}&entry.886961053=${pilihan[4] + 1}&entry.346649448=${isian[4]}&entry.793693254=${pilihan[5] + 1}&entry.1044684289=${isian[5]}&entry.879971360=${pilihan[6] + 1}&entry.1667482724=${isian[6]}`
	}
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
		if (isian.length == 7) {
			if (error == false && diAtasTujuh == false) {
				selesai = true
			} else {
				selesai = false
			}
		} else {
			selesai = false
		}
	}
</script>
