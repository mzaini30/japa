<Router {routes}/>
<script type="text/javascript">
	import Router from 'svelte-spa-router'
	import Beranda from './halaman/Beranda.svelte'
	import Instruksi from './halaman/Instruksi.svelte'
	import Tes from './halaman/Tes.svelte'
	import Atur from './halaman/Atur.svelte'
	const routes = {
		'/': Beranda,
		'/instruksi': Instruksi,
		'/tes/:halaman': Tes,
		'/atur': Atur
	}
</script>