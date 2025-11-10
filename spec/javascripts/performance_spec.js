/**
 * Performance tests for PedigreeJS
 * Measures rebuild times on datasets of varying sizes
 * Phase 2 - Performance baseline measurement
 */

describe('Performance measurements', function() {
	let pedigree = window.pedigreejs.pedigreejs;
	let pedcache = window.pedigreejs.pedigreejs_pedcache;

	beforeEach(function() {
		// Clean up DOM before each test
		$('body').append("<div id='pedigree_perf'></div>");
	});

	afterEach(function() {
		// Clean up after each test
		$('#pedigree_perf').remove();
		pedcache.clear();
		try {
			delete pedigree.utils.roots['pedigree_perf'];
		} catch(e) {
			// ignore
		}
	});

	/**
	 * Helper function to get predefined datasets of various sizes
	 * @param {string} size - Size of dataset: 'small' (10), 'medium' (30), 'large' (50), 'xlarge' (100)
	 * @returns {Array} Dataset array
	 */
	function getTestDataset(size) {
		// Base 10-person dataset (3 generations)
		let dataset10 = [
			{"name": "gf1", "sex": "M", "top_level": true},
			{"name": "gm1", "sex": "F", "top_level": true},
			{"name": "dad", "sex": "M", "mother": "gm1", "father": "gf1"},
			{"name": "mom", "sex": "F", "top_level": true},
			{"name": "child1", "sex": "F", "mother": "mom", "father": "dad", "proband": true},
			{"name": "child2", "sex": "M", "mother": "mom", "father": "dad"},
			{"name": "uncle", "sex": "M", "mother": "gm1", "father": "gf1"},
			{"name": "aunt_in_law", "sex": "F", "top_level": true},
			{"name": "cousin1", "sex": "F", "mother": "aunt_in_law", "father": "uncle"},
			{"name": "cousin2", "sex": "M", "mother": "aunt_in_law", "father": "uncle"}
		];

		if (size === 'small') {
			return dataset10;
		}

		// Extend to 30 persons by adding more family members
		let dataset30 = JSON.parse(JSON.stringify(dataset10));

		// Add grandparents on mom's side
		dataset30.push({"name": "gf2", "sex": "M", "top_level": true});
		dataset30.push({"name": "gm2", "sex": "F", "top_level": true});
		dataset30.find(p => p.name === "mom").mother = "gm2";
		dataset30.find(p => p.name === "mom").father = "gf2";
		delete dataset30.find(p => p.name === "mom").top_level;

		// Add aunts/uncles on mom's side
		dataset30.push({"name": "aunt1", "sex": "F", "mother": "gm2", "father": "gf2"});
		dataset30.push({"name": "uncle1_in_law", "sex": "M", "top_level": true});
		dataset30.push({"name": "cousin3", "sex": "M", "mother": "aunt1", "father": "uncle1_in_law"});
		dataset30.push({"name": "cousin4", "sex": "F", "mother": "aunt1", "father": "uncle1_in_law"});

		// Add more siblings and their families
		dataset30.push({"name": "child3", "sex": "M", "mother": "mom", "father": "dad"});
		dataset30.push({"name": "child3_partner", "sex": "F", "top_level": true});
		dataset30.push({"name": "grandchild1", "sex": "F", "mother": "child3_partner", "father": "child3"});
		dataset30.push({"name": "grandchild2", "sex": "M", "mother": "child3_partner", "father": "child3"});

		// Add great-grandparents
		dataset30.push({"name": "ggf1", "sex": "M", "top_level": true});
		dataset30.push({"name": "ggm1", "sex": "F", "top_level": true});
		dataset30.find(p => p.name === "gf1").mother = "ggm1";
		dataset30.find(p => p.name === "gf1").father = "ggf1";
		delete dataset30.find(p => p.name === "gf1").top_level;

		// Add more cousins
		dataset30.push({"name": "cousin5", "sex": "F", "mother": "aunt_in_law", "father": "uncle"});
		dataset30.push({"name": "cousin6", "sex": "M", "mother": "aunt_in_law", "father": "uncle"});
		dataset30.push({"name": "cousin7", "sex": "F", "mother": "aunt1", "father": "uncle1_in_law"});

		// Add more extended family
		dataset30.push({"name": "uncle2", "sex": "M", "mother": "gm1", "father": "gf1"});
		dataset30.push({"name": "uncle2_partner", "sex": "F", "top_level": true});
		dataset30.push({"name": "cousin8", "sex": "M", "mother": "uncle2_partner", "father": "uncle2"});
		dataset30.push({"name": "cousin9", "sex": "F", "mother": "uncle2_partner", "father": "uncle2"});

		if (size === 'medium') {
			return dataset30;
		}

		// For large (50) and xlarge (100), duplicate and extend the medium dataset
		let datasetLarge = JSON.parse(JSON.stringify(dataset30));

		// Add more branches to reach ~50
		for (let i = 1; i <= 5; i++) {
			let fatherName = "branch" + i + "_dad";
			let motherName = "branch" + i + "_mom";
			datasetLarge.push({"name": fatherName, "sex": "M", "top_level": true});
			datasetLarge.push({"name": motherName, "sex": "F", "top_level": true});

			for (let j = 1; j <= 4; j++) {
				let sex = j % 2 === 0 ? "M" : "F";
				datasetLarge.push({
					"name": "branch" + i + "_child" + j,
					"sex": sex,
					"mother": motherName,
					"father": fatherName
				});
			}
		}

		if (size === 'large') {
			return datasetLarge;
		}

		// For xlarge (100), add even more branches
		let datasetXLarge = JSON.parse(JSON.stringify(datasetLarge));

		for (let i = 6; i <= 15; i++) {
			let fatherName = "branch" + i + "_dad";
			let motherName = "branch" + i + "_mom";
			datasetXLarge.push({"name": fatherName, "sex": "M", "top_level": true});
			datasetXLarge.push({"name": motherName, "sex": "F", "top_level": true});

			for (let j = 1; j <= 5; j++) {
				let sex = j % 2 === 0 ? "M" : "F";
				datasetXLarge.push({
					"name": "branch" + i + "_child" + j,
					"sex": sex,
					"mother": motherName,
					"father": fatherName
				});
			}
		}

		return datasetXLarge;
	}

	/**
	 * Helper function to measure rebuild time
	 * @param {Object} opts - Pedigree options
	 * @returns {number} Time in milliseconds
	 */
	function measureRebuild(opts) {
		performance.mark('rebuild-start');
		pedigree.rebuild(opts);
		performance.mark('rebuild-end');
		performance.measure('rebuild', 'rebuild-start', 'rebuild-end');

		let measure = performance.getEntriesByName('rebuild')[0];
		let duration = measure.duration;

		// Clear marks and measures
		performance.clearMarks();
		performance.clearMeasures();

		return duration;
	}

	/**
	 * Helper function to measure build time
	 * @param {Object} opts - Pedigree options
	 * @returns {number} Time in milliseconds
	 */
	function measureBuild(opts) {
		performance.mark('build-start');
		pedigree.build(opts);
		performance.mark('build-end');
		performance.measure('build', 'build-start', 'build-end');

		let measure = performance.getEntriesByName('build')[0];
		let duration = measure.duration;

		// Clear marks and measures
		performance.clearMarks();
		performance.clearMeasures();

		return duration;
	}

	/**
	 * Helper function to measure both build and rebuild for a dataset
	 * @param {Array} dataset - Pedigree dataset
	 * @returns {Object} Object with buildTime and rebuildTime
	 */
	function measureBuildAndRebuild(dataset) {
		// Clone dataset for build test (to avoid mutation)
		let optsForBuild = {
			targetDiv: 'pedigree_perf',
			dataset: JSON.parse(JSON.stringify(dataset)),
			width: 800,
			height: 600,
			symbol_size: 35,
			DEBUG: false,
			validate: true
		};

		let buildTime = measureBuild(optsForBuild);

		// Clean up and test rebuild with fresh dataset
		$('#pedigree_perf').empty();
		let optsForRebuild = {
			targetDiv: 'pedigree_perf',
			dataset: JSON.parse(JSON.stringify(dataset)),
			width: 800,
			height: 600,
			symbol_size: 35,
			DEBUG: false,
			validate: true
		};

		let rebuildTime = measureRebuild(optsForRebuild);

		return {buildTime: buildTime, rebuildTime: rebuildTime};
	}

	describe('Rebuild performance baseline', function() {
		it('should measure rebuild time for 10-person dataset', function() {
			let dataset = getTestDataset('small');
			console.log('Generated dataset size:', dataset.length, 'persons');

			let times = measureBuildAndRebuild(dataset);
			console.log('Initial build time (10 persons):', times.buildTime.toFixed(2), 'ms');
			console.log('Rebuild time (10 persons):', times.rebuildTime.toFixed(2), 'ms');

			expect(times.buildTime).toBeGreaterThan(0);
			expect(times.rebuildTime).toBeGreaterThan(0);
		});

		it('should measure rebuild time for 30-person dataset', function() {
			let dataset = getTestDataset('medium');
			console.log('Generated dataset size:', dataset.length, 'persons');

			let times = measureBuildAndRebuild(dataset);
			console.log('Initial build time (30 persons):', times.buildTime.toFixed(2), 'ms');
			console.log('Rebuild time (30 persons):', times.rebuildTime.toFixed(2), 'ms');

			expect(times.buildTime).toBeGreaterThan(0);
			expect(times.rebuildTime).toBeGreaterThan(0);
		});

		it('should measure rebuild time for 50-person dataset', function() {
			let dataset = getTestDataset('large');
			console.log('Generated dataset size:', dataset.length, 'persons');

			let times = measureBuildAndRebuild(dataset);
			console.log('Initial build time (50 persons):', times.buildTime.toFixed(2), 'ms');
			console.log('Rebuild time (50 persons):', times.rebuildTime.toFixed(2), 'ms');

			expect(times.buildTime).toBeGreaterThan(0);
			expect(times.rebuildTime).toBeGreaterThan(0);
		});

		it('should measure rebuild time for 100-person dataset', function() {
			let dataset = getTestDataset('xlarge');
			console.log('Generated dataset size:', dataset.length, 'persons');

			let times = measureBuildAndRebuild(dataset);
			console.log('Initial build time (100 persons):', times.buildTime.toFixed(2), 'ms');
			console.log('Rebuild time (100 persons):', times.rebuildTime.toFixed(2), 'ms');

			expect(times.buildTime).toBeGreaterThan(0);
			expect(times.rebuildTime).toBeGreaterThan(0);
		});
	});

	describe('Performance summary', function() {
		it('should run all measurements and display summary', function() {
			console.log('\n========================================');
			console.log('PERFORMANCE BASELINE SUMMARY');
			console.log('========================================\n');

			let results = [];

			// Test configurations
			let configs = [
				{size: 'small', label: '10 persons'},
				{size: 'medium', label: '30 persons'},
				{size: 'large', label: '50 persons'},
				{size: 'xlarge', label: '100 persons'}
			];

			configs.forEach(function(config) {
				let dataset = getTestDataset(config.size);
				let times = measureBuildAndRebuild(dataset);
				let buildTime = times.buildTime;
				let rebuildTime = times.rebuildTime;

				results.push({
					label: config.label,
					size: dataset.length,
					buildTime: buildTime,
					rebuildTime: rebuildTime
				});

				console.log(config.label + ' (' + dataset.length + ' actual):');
				console.log('  Build:   ' + buildTime.toFixed(2) + ' ms');
				console.log('  Rebuild: ' + rebuildTime.toFixed(2) + ' ms');
				console.log('');
			});

			console.log('========================================');
			console.log('ANALYSIS');
			console.log('========================================\n');

			// Find max times
			let maxBuild = Math.max.apply(null, results.map(r => r.buildTime));
			let maxRebuild = Math.max.apply(null, results.map(r => r.rebuildTime));

			console.log('Maximum build time:   ' + maxBuild.toFixed(2) + ' ms');
			console.log('Maximum rebuild time: ' + maxRebuild.toFixed(2) + ' ms');
			console.log('');

			// Check against threshold
			let threshold = 100;
			console.log('Threshold: ' + threshold + ' ms (for medium datasets)');
			console.log('');

			let mediumDatasetResult = results.find(r => r.size >= 30 && r.size <= 50);
			if (mediumDatasetResult) {
				console.log('Medium dataset (' + mediumDatasetResult.size + ' persons):');
				console.log('  Rebuild time: ' + mediumDatasetResult.rebuildTime.toFixed(2) + ' ms');

				if (mediumDatasetResult.rebuildTime > threshold) {
					console.log('  ⚠️  ABOVE THRESHOLD - Optimizations recommended');
				} else {
					console.log('  ✅ BELOW THRESHOLD - Performance acceptable');
				}
			}

			console.log('\n========================================\n');

			expect(results.length).toBe(4);
		});
	});
});
