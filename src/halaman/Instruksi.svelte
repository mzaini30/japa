<div class="container">
	<br>
	<p>Selamat pagi adik-adik.</p>
	<p>Dalam buku ini terdapat sejumlah pernyataan untuk mengungkap minat pada bidang tertentu. Terdapat 99 pilihan. Tugas adik-adik adalah membaca semua pilihan tersebut. Kemudian, pilihlah 7 (tujuh) dari 99 yang menggambarkan diri adik. Tulislah nomor yang menggambarkan pilihan di kertas yang disediakan. Kemudian, rangkinglah dari 1 sampai dengan 7. Nomor 1 menunjukkan yang paling diminati, nomor 2 diminati, nomor 3 cukup diminati, dst.</p>
	<hr>
	<form on:submit|preventDefault={lanjut}>
     <div class="form-group">
      <label for="nomor-tes">Nomor Tes</label>
      <input id="nomor-tes" type="tel" class="form-control" bind:value={nomorTes} required>
     </div>
     <div class="form-group">
      <label for="nama">Nama</label>
      <input id="nama" class="form-control" bind:value={nama} required>
     </div>
     <div class="form-group">
      <label for="kelas-sekolah">Kelas / Sekolah</label>
      <input id="kelas-sekolah" class="form-control" bind:value={kelasSekolah} required>
     </div>
     <div class="form-group">
      <label for='jk'>JK</label>
      <input type="text" class="form-control" id="jk" bind:value={jk} required name="">
     </div>
     <div class="form-group text-center">
       <input type="submit" class="btn btn-info" value="Lanjut..." name="">
     </div>
	</form>
</div>
<script type="text/javascript">
  let nomorTes = ''
  let nama = ''
  let kelasSekolah = ''
  let jk = ''
  import {push} from 'svelte-spa-router'
  const lanjut = () => {
    localStorage.setItem('dataJapa', JSON.stringify({nomorTes, nama, kelasSekolah, jk}))
    push('/tes/1')
  }
</script>