'use strict';

(function initPedigreeDemo() {
	function boot() {
		if (pedigreejs.pedigreejs_utils.isIE()) {
			const script = document.createElement('script');
			script.type = 'text/javascript';
			script.src = 'https://cdn.jsdelivr.net/npm/canvg@3.0.7/lib/umd.js';
			document.head.appendChild(script);
		}

		const dataset = [
			{"name": "m11", "sex": "M", "top_level": true},
			{"name": "f11", "display_name": "Jane",  "sex": "F", "status": 1, "top_level": true, "breast_cancer_diagnosis_age":67, "ovarian_cancer_diagnosis_age":63},
			{"name": "m12", "sex": "M", "top_level": true},
			{"name": "f12", "sex": "F", "top_level": true, "breast_cancer_diagnosis_age":55},
			{"name": "m21", "sex": "M", "mother": "f11", "father": "m11", "age": 56},
			{"name": "f21", "sex": "F", "mother": "f12", "father": "m12", "breast_cancer_diagnosis_age":55, "breast_cancer2_diagnosis_age": 60, "ovarian_cancer_diagnosis_age":58, "age": 63},
			{"name": "ch1", "display_name": "Ana", "sex": "F", "mother": "f21", "father": "m21", "proband": true, "age": 25, "yob": 1996}
		];

		$("#pedigrees").append($("<div id='pedigree_history'></div>"));
		$("#pedigrees").append($("<div id='pedigree'></div>"));

		let opts = {
			'targetDiv': 'pedigree',
			'btn_target': 'pedigree_history',
			'width': ($(window).width() > 540 ? 500 : $(window).width() - 30),
			'height': 350,
			'symbol_size': 30,
			'edit': true,
			'zoomIn': 0.5,
			'zoomOut': 1.5,
			'font_size': '0.75em',
			'diseases': [
				{'type': 'breast_cancer', 'colour': '#F68F35'},
				{'type': 'breast_cancer2', 'colour': 'pink'},
				{'type': 'ovarian_cancer', 'colour': '#4DAA4D'},
				{'type': 'pancreatic_cancer', 'colour': '#4289BA'},
				{'type': 'prostate_cancer', 'colour': '#D5494A'}
			],
			'DEBUG': pedigreejs.pedigreejs_utils.urlParam('debug') !== null
		};

		const localDataset = pedigreejs.pedigreejs_pedcache.current(opts);
		opts.dataset = (localDataset !== undefined && localDataset !== null) ? localDataset : dataset;
		const startTime = performance.now();
		opts = pedigreejs.pedigreejs.build(opts);
		const buildTime = performance.now() - startTime;

		const datasetStatusEl = document.getElementById('dataset-status');
		const performanceInfoEl = document.getElementById('performance-info');
		
		const updateDatasetStatus = message => {
			if (datasetStatusEl) {
				datasetStatusEl.textContent = message;
			}
		};
		
		const updatePerformanceInfo = (time, personCount) => {
			if (performanceInfoEl) {
				performanceInfoEl.textContent = `${Math.round(time)}ms (${personCount} persons)`;
			}
		};
		
		updateDatasetStatus(localDataset ? 'Restored cached session' : 'Demo dataset loaded');
		updatePerformanceInfo(buildTime, opts.dataset.length);

		const toastEl = document.getElementById('actionToast');
		const toastBody = document.getElementById('actionToastBody');
		const toastTitle = document.getElementById('actionToastTitle');
		const toastTime = document.getElementById('actionToastTime');
		const showToast = (message, title = 'PedigreeJS') => {
			if (!toastEl || typeof bootstrap === 'undefined') return;
			toastBody.textContent = message;
			toastTitle.textContent = title;
			if (toastTime) {
				toastTime.textContent = new Date().toLocaleTimeString();
			}
			bootstrap.Toast.getOrCreateInstance(toastEl).show();
		};

		const zoomHelper = factor => {
			if (pedigreejs.pedigreejs_zooming && typeof pedigreejs.pedigreejs_zooming.btn_zoom === 'function') {
				pedigreejs.pedigreejs_zooming.btn_zoom(opts, factor);
			}
		};

		function get_pedigree_bwa4(data) {
			let msg = 'BOADICEA import pedigree file format 4.0 ';
			const famid = opts.dataset[0].famid;

			const probandIdx  = pedigreejs.pedigreejs_utils.getProbandIndex(data);
			let sex = 'F';
			if (probandIdx !== undefined && probandIdx !== null) {
				sex = data[probandIdx].sex;
			}

			msg += '\nFamID\tName\tTarget\tIndivID\tFathID\tMothID\tSex\tMZtwin\tDead\tAge\tYob';
			msg += '\t1stBrCa\t2ndBrCa\tOvCa\tProCa\tPanCa\tAshkn';
			msg += '\tBRCA1t\tBRCA1r\tBRCA2t\tBRCA2r\tPALB2t\tPALB2r\tATMt\tATMr\tCHEK2t\tCHEK2r\tER\tPR\tHER2\tCK14\tCK56';

			for (let i = 0; i < data.length; i++) {
				const p = data[i];

				msg += '\n' + famid + '\t';
				msg += (p.display_name ? p.display_name : 'NA') + '\t';
				msg += ('proband' in p ? '1' : 0) + '\t';
				msg += p.name + '\t';
				msg += ('father' in p && !('noparents' in p) ? p.father : 0) + '\t';
				msg += ('mother' in p && !('noparents' in p) ? p.mother : 0) + '\t';
				msg += p.sex + '\t';
				msg += ('mztwin' in p ? p.mztwin : 0) + '\t';
				msg += ('status' in p ? p.status : 0) + '\t';
				msg += ('age' in p ? p.age : 0) + '\t';
				msg += ('yob' in p ? p.yob : 0) + '\t';

				let cmsg = '';
				$.each(pedigreejs.pedigreejs_canrisk_file.cancers, function(cancer, diagnosis_age) {
					if (diagnosis_age in p) {
						cmsg += p[diagnosis_age] + '\t';
					} else {
						cmsg += '0\t';
					}
				});
				msg += cmsg;

				msg += ('ashkenazi' in p ? p.ashkenazi : 0) + '\t';

				const gt = ['brca1', 'brca2', 'palb2', 'atm', 'chek2'];
				for (let j = 0; j < gt.length; j++) {
					const key = gt[j] + '_gene_test';
					if (key in p && p[key]['type'] !== '-' && p[key]['result'] !== '-') {
						msg += p[key]['type'] + '\t';
						msg += p[key]['result'] + '\t';
					} else {
						msg += '0\t0\t';
					}
				}

				const ptests = pedigreejs.pedigreejs_canrisk_file.pathology_tests;
				for (let j = 0; j < ptests.length; j++) {
					const attribute = ptests[j] + '_bc_pathology';
					msg += attribute in p ? p[attribute] : '0';
					if (j < ptests.length - 1) {
						msg += '\t';
					}
				}
			}
			return msg;
		}

		function save(asCanRisk) {
			const content = asCanRisk
				? pedigreejs.pedigreejs_canrisk_file.get_non_anon_pedigree(opts.dataset)
				: get_pedigree_bwa4(opts.dataset);
			const filename = asCanRisk ? 'ped.canrisk' : 'ped.boadicea';

			const file = new Blob([content], {type: 'text/plain'});
			const link = document.createElement('a');
			const url = URL.createObjectURL(file);
			link.href = url;
			link.download = filename;
			document.body.appendChild(link);
			link.click();
			setTimeout(function() {
				document.body.removeChild(link);
				window.URL.revokeObjectURL(url);
			}, 0);
		}

		$('#save-boadicea').on('click', function() { 
			save(false); 
			showToast('BOADICEA v4 file generated (non anonymised).', 'BOADICEA export');
		});
		$('#save-canrisk').on('click', function() { 
			save(true); 
			showToast('CanRisk file generated (non anonymised).', 'CanRisk export');
		});

		$('#load').on('change', function(e) {
			const file = e.target.files && e.target.files[0];
			if (file) {
				const reader = new FileReader();
				reader.onload = function(event) {
					try {
						const data = JSON.parse(event.target.result);
						const rebuildStart = performance.now();
						opts.dataset = data;
						pedigreejs.pedigreejs.rebuild(opts);
						const rebuildTime = performance.now() - rebuildStart;
						updateDatasetStatus(`Loaded file: ${file.name}`);
						updatePerformanceInfo(rebuildTime, data.length);
						showToast(`Loaded ${file.name}`, 'Load complete');
					} catch (error) {
						showToast('Error loading file. Please ensure it is a valid JSON pedigree.', 'Load error');
					}
				};
				reader.readAsText(file);
			}
		});

		// Save JSON functionality
		$('#save').on('click', function() {
			const content = JSON.stringify(opts.dataset, null, 2);
			const file = new Blob([content], {type: 'application/json'});
			const link = document.createElement('a');
			const url = URL.createObjectURL(file);
			link.href = url;
			link.download = 'pedigree.json';
			document.body.appendChild(link);
			link.click();
			setTimeout(function() {
				document.body.removeChild(link);
				window.URL.revokeObjectURL(url);
			}, 0);
			showToast('JSON pedigree file generated.', 'Save complete');
		});

		// Print functionality
		$('#print').on('click', function() {
			window.print();
			showToast('Browser print dialog opened.', 'Print dialog');
		});

		// SVG export functionality
		$('#svg_download').on('click', function() {
			const svgElement = document.querySelector('#pedigree svg');
			if (svgElement) {
				const svgData = new XMLSerializer().serializeToString(svgElement);
				const file = new Blob([svgData], {type: 'image/svg+xml'});
				const link = document.createElement('a');
				const url = URL.createObjectURL(file);
				link.href = url;
				link.download = 'pedigree.svg';
				document.body.appendChild(link);
				link.click();
				setTimeout(function() {
					document.body.removeChild(link);
					window.URL.revokeObjectURL(url);
				}, 0);
				showToast('SVG export ready.', 'Export ready');
			} else {
				showToast('No pedigree SVG found for export.', 'Export error');
			}
		});

		// PNG export functionality
		$('#png_download').on('click', function() {
			const svgElement = document.querySelector('#pedigree svg');
			if (svgElement) {
				const canvas = document.createElement('canvas');
				const ctx = canvas.getContext('2d');
				const svgData = new XMLSerializer().serializeToString(svgElement);
				const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
				const img = new Image();
				const url = URL.createObjectURL(svgBlob);
				
				img.onload = function() {
					canvas.width = img.width;
					canvas.height = img.height;
					ctx.drawImage(img, 0, 0);
					
					canvas.toBlob(function(blob) {
						const link = document.createElement('a');
						const pngUrl = URL.createObjectURL(blob);
						link.href = pngUrl;
						link.download = 'pedigree.png';
						document.body.appendChild(link);
						link.click();
						setTimeout(function() {
							document.body.removeChild(link);
							window.URL.revokeObjectURL(pngUrl);
							window.URL.revokeObjectURL(url);
						}, 0);
					}, 'image/png');
					showToast('PNG export ready.', 'Export ready');
				};
				
				img.onerror = function() {
					window.URL.revokeObjectURL(url);
					showToast('Error generating PNG export.', 'Export error');
				};
				
				img.src = url;
			} else {
				showToast('No pedigree SVG found for export.', 'Export error');
			}
		});

		$('#zoom-in-control').on('click', function() {
			const loadingEl = document.getElementById('canvas-loading');
			if (loadingEl) loadingEl.style.display = 'flex';
			
			zoomHelper(1.05);
			showToast('Zoomed in', 'View');
			
			setTimeout(() => {
				if (loadingEl) loadingEl.style.display = 'none';
			}, 300);
		});
		
		$('#zoom-out-control').on('click', function() {
			const loadingEl = document.getElementById('canvas-loading');
			if (loadingEl) loadingEl.style.display = 'flex';
			
			zoomHelper(0.95);
			showToast('Zoomed out', 'View');
			
			setTimeout(() => {
				if (loadingEl) loadingEl.style.display = 'none';
			}, 300);
		});

		$('#fullscreen-toggle').on('click', function() {
			const canvas = document.getElementById('pedigrees');
			const icon = this.querySelector('i');
			
			if (!document.fullscreenElement) {
				canvas.requestFullscreen().then(() => {
					icon.className = 'fa fa-compress';
					this.setAttribute('title', 'Exit fullscreen');
					this.setAttribute('aria-pressed', 'true');
					canvas.style.background = '#f8f9fa';
					canvas.style.padding = '2rem';
					showToast('Entered fullscreen mode', 'View');
				}).catch(() => {
					this.setAttribute('aria-pressed', 'false');
					showToast('Fullscreen not supported', 'Error');
				});
			} else {
				document.exitFullscreen().then(() => {
					icon.className = 'fa fa-expand';
					this.setAttribute('title', 'Toggle fullscreen');
					this.setAttribute('aria-pressed', 'false');
					canvas.style.background = '';
					canvas.style.padding = '';
					showToast('Exited fullscreen mode', 'View');
				});
			}
		});

		$(document).on('fhChange', function() {
			updateDatasetStatus(`History updated ${new Date().toLocaleTimeString()}`);
			showToast('History updated', 'Undo / Redo');
		});
		$(document).on('rebuild', function() {
			updateDatasetStatus(`Canvas rebuilt ${new Date().toLocaleTimeString()}`);
			// Update performance info on rebuild
			const rebuildStart = performance.now();
			setTimeout(() => {
				const rebuildTime = performance.now() - rebuildStart;
				updatePerformanceInfo(rebuildTime, opts.dataset.length);
			}, 50);
		});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', boot);
	} else {
		boot();
	}
})();
