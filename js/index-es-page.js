'use strict';

(function initPedigreeDemoES() {
	function boot() {
		if (pedigreejs.pedigreejs_utils.isIE()) {
			const script = document.createElement('script');
			script.type = 'text/javascript';
			script.src = 'https://cdn.jsdelivr.net/npm/canvg@3.0.7/lib/umd.js';
			document.head.appendChild(script);
		}

		const dataset = [
			{"name": "m11", "sex": "M", "top_level": true},
			{"name": "f11", "display_name": "Jane", "sex": "F", "status": 1, "top_level": true, "breast_cancer_diagnosis_age": 67, "ovarian_cancer_diagnosis_age": 63},
			{"name": "m12", "sex": "M", "top_level": true},
			{"name": "f12", "sex": "F", "top_level": true, "breast_cancer_diagnosis_age": 55},
			{"name": "m21", "sex": "M", "mother": "f11", "father": "m11", "age": 56},
			{"name": "f21", "sex": "F", "mother": "f12", "father": "m12", "breast_cancer_diagnosis_age": 55, "breast_cancer2_diagnosis_age": 60, "ovarian_cancer_diagnosis_age": 58, "age": 63},
			{"name": "ch1", "display_name": "Ana", "sex": "F", "mother": "f21", "father": "m21", "proband": true, "age": 25, "yob": 1996}
		];

		$("#pedigrees").append($("<div id='pedigree_history'></div>"));
		$("#pedigrees").append($("<div id='pedigree'></div>"));

		let opts = {
			'targetDiv': 'pedigree',
			'btn_target': 'pedigree_history',
			'width': ($(window).width() > 450 ? 1000 : $(window).width() - 30),
			'height': 580,
			'symbol_size': 30,
			'edit': true,
			'zoomSrc': ['button'],
			'zoomIn': 0.05,
			'zoomOut': 1.5,
			'optionalLabels': [
				['brca1_gene_test', 'brca2_gene_test', 'palb2_gene_test', 'chek2_gene_test', 'atm_gene_test'],
				['rad51d_gene_test', 'rad51c_gene_test', 'brip1_gene_test'],
				['er_bc_pathology', 'pr_bc_pathology', 'her2_bc_pathology', 'ck14_bc_pathology', 'ck56_bc_pathology']
			],
			'labels': [
				['age', 'yob'],
				['brca1_gene_test', 'brca2_gene_test', 'palb2_gene_test', 'chek2_gene_test', 'atm_gene_test'],
				['bard1_gene_test', 'rad51d_gene_test', 'rad51c_gene_test', 'brip1_gene_test', 'hoxb13_gene_test'],
				['er_bc_pathology', 'pr_bc_pathology', 'her2_bc_pathology', 'ck14_bc_pathology', 'ck56_bc_pathology']
			],
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
		opts = pedigreejs.pedigreejs.build(opts);

		function get_pedigree_bwa4(data) {
			let msg = 'BOADICEA import pedigree file format 4.0 ';
			const famid = opts.dataset[0].famid;

			const probandIdx = pedigreejs.pedigreejs_utils.getProbandIndex(data);
			let sex = 'F';
			if (probandIdx) {
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
				$.each(pedigreejs.pedigreejs_canrisk_file.cancers, function(_cancer, diagnosis_age) {
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

			const file = new Blob([content], { type: 'text/plain' });
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

		$('#save-boadicea').on('click', function() { save(false); });
		$('#save-canrisk').on('click', function() { save(true); });
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', boot);
	} else {
		boot();
	}
})();
