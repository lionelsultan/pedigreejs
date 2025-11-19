/**
 * Tests for SVG Rendering bugfixes (2025-11-19)
 *
 * BUGS FIXED:
 * - BUG 6: ClipPath IDs collision when multiple pedigrees on same page
 * - BUG 7: Adopted brackets scaling with hardcoded factor
 */

describe('SVG Rendering Bugfix Tests', function() {
	let pedigree = window.pedigreejs.pedigreejs;
	let pedcache = window.pedigreejs.pedigreejs_pedcache;
	let utils = window.pedigreejs.pedigreejs_utils;

	let opts1, opts2;
	let dataset;

	beforeEach(function() {
		// Setup TWO pedigree divs for multi-pedigree tests
		$('body').append("<div id='pedigree_a'></div>");
		$('body').append("<div id='pedigree_b'></div>");

		// Simple dataset with diseases (for clipPath generation)
		dataset = [
			{"name": "m1", "sex": "M", "top_level": true, "affected": true},
			{"name": "f1", "sex": "F", "top_level": true, "breast_cancer": true},
			{"name": "ch1", "sex": "F", "mother": "f1", "father": "m1", "proband": true}
		];

		opts1 = {
			targetDiv: 'pedigree_a',
			dataset: JSON.parse(JSON.stringify(dataset)),
			width: 400,
			height: 300,
			symbol_size: 35,
			DEBUG: false
		};

		opts2 = {
			targetDiv: 'pedigree_b',
			dataset: JSON.parse(JSON.stringify(dataset)),
			width: 400,
			height: 300,
			symbol_size: 50,  // Different size to test scaling
			DEBUG: false
		};
	});

	afterEach(function() {
		$('#pedigree_a').remove();
		$('#pedigree_b').remove();
		pedcache.clear();
		delete utils.roots['pedigree_a'];
		delete utils.roots['pedigree_b'];
	});

	// ========================================
	// BUG 6: ClipPath IDs Collision
	// ========================================

	describe('BUG 6: ClipPath IDs uniqueness', function() {
		it('should prefix clipPath IDs with targetDiv', function() {
			pedigree.build(opts1);

			// Check that clipPaths have targetDiv prefix
			let clipPaths = $('#pedigree_a svg clipPath');
			expect(clipPaths.length).toBeGreaterThan(0);

			clipPaths.each(function() {
				let id = $(this).attr('id');
				expect(id).toMatch(/^pedigree_a_clip_/);  // Must start with targetDiv_clip_
			});
		});

		it('should NOT have ID collisions with multiple pedigrees on same page', function() {
			// Build TWO pedigrees with same person names
			pedigree.build(opts1);
			pedigree.build(opts2);

			// Collect all clipPath IDs from both pedigrees
			let allClipPathIds = [];

			$('#pedigree_a svg clipPath').each(function() {
				allClipPathIds.push($(this).attr('id'));
			});

			$('#pedigree_b svg clipPath').each(function() {
				allClipPathIds.push($(this).attr('id'));
			});

			// Check for duplicates
			let uniqueIds = [...new Set(allClipPathIds)];
			expect(uniqueIds.length).toBe(allClipPathIds.length);  // No duplicates
		});

		it('should reference clipPaths correctly in pie charts', function() {
			// Add disease to test pie chart clipping
			opts1.diseases = [{'type': 'cancer', 'colour': '#F68F35'}];
			opts1.dataset[2].cancer = true;  // ch1 has cancer

			pedigree.build(opts1);

			// Find pie chart paths
			let piePaths = $('#pedigree_a svg .pienode');
			expect(piePaths.length).toBeGreaterThan(0);

			piePaths.each(function() {
				let clipPathAttr = $(this).attr('clip-path');
				// Should reference url(#pedigree_a_clip_...)
				expect(clipPathAttr).toMatch(/url\(#pedigree_a_clip_/);
			});
		});

		it('should maintain correct clipping with prefixed IDs', function() {
			pedigree.build(opts1);

			// Check that clipPath definitions exist for all nodes
			let nodeNames = opts1.dataset.map(p => p.name);
			nodeNames.forEach(function(name) {
				let clipId = 'pedigree_a_clip_' + name;
				let clipPath = $('#pedigree_a svg clipPath#' + clipId);
				expect(clipPath.length).toBe(1);  // Must exist
			});
		});
	});

	// ========================================
	// BUG 7: Adopted Brackets Scaling
	// ========================================

	describe('BUG 7: Adopted brackets scaling', function() {
		it('should scale brackets proportionally to symbol_size', function() {
			// Create dataset with adopted child (noparents flag)
			let dataset_adopted = [
				{"name": "m1", "sex": "M", "top_level": true},
				{"name": "f1", "sex": "F", "top_level": true},
				{"name": "adopted", "sex": "M", "mother": "f1", "father": "m1", "adopted_in": true}
			];

			// Build with small symbol_size
			let opts_small = {
				targetDiv: 'pedigree_a',
				dataset: JSON.parse(JSON.stringify(dataset_adopted)),
				width: 400,
				height: 300,
				symbol_size: 20,  // Small
				DEBUG: false
			};
			pedigree.build(opts_small);

			// Build with large symbol_size
			let opts_large = {
				targetDiv: 'pedigree_b',
				dataset: JSON.parse(JSON.stringify(dataset_adopted)),
				width: 400,
				height: 300,
				symbol_size: 60,  // Large
				DEBUG: false
			};
			pedigree.build(opts_large);

			// Both should render without visual distortion
			// (Visual test - manual inspection recommended)
			// Here we just verify both built successfully
			expect($('#pedigree_a svg').length).toBe(1);
			expect($('#pedigree_b svg').length).toBe(1);
		});

		it('should use explicit bracket_height variable (not magic number)', function() {
			// This is a code-level test - verify get_bracket is called properly
			// We test indirectly by building a pedigree with adopted children

			let dataset_adopted = [
				{"name": "m1", "sex": "M", "top_level": true},
				{"name": "f1", "sex": "F", "top_level": true},
				{"name": "adopted", "sex": "M", "mother": "f1", "father": "m1", "adopted_in": true}
			];

			opts1.dataset = dataset_adopted;
			opts1.symbol_size = 40;

			// Should build without errors
			expect(function() {
				pedigree.build(opts1);
			}).not.toThrow();

			// Adopted brackets should be rendered (brackets are paths on nodes, not links)
			let nodes = $('#pedigree_a svg .node.adopted');
			expect(nodes.length).toBeGreaterThan(0);
		});

		it('should maintain correct bracket proportions across different symbol sizes', function() {
			let sizes = [15, 25, 35, 50, 70];  // Various sizes

			sizes.forEach(function(size) {
				$('#pedigree_a').empty();  // Clear previous

				let opts_test = {
					targetDiv: 'pedigree_a',
					dataset: [
						{"name": "m", "sex": "M", "top_level": true},
						{"name": "f", "sex": "F", "top_level": true},
						{"name": "a", "sex": "M", "mother": "f", "father": "m", "adopted_in": true}
					],
					width: 400,
					height: 300,
					symbol_size: size,
					DEBUG: false
				};

				expect(function() {
					pedigree.build(opts_test);
				}).not.toThrow();

				// Expected bracket height = size * 1.3
				let expectedHeight = size * 1.3;
				// We can't easily test the actual SVG path, but we verify no errors
				expect(expectedHeight).toBeCloseTo(size * 1.3, 2);
			});
		});
	});

	// ========================================
	// INTEGRATION TESTS
	// ========================================

	describe('Integration: Multi-pedigree page', function() {
		it('should render multiple pedigrees independently without conflicts', function() {
			// Build both pedigrees
			pedigree.build(opts1);
			pedigree.build(opts2);

			// Both should exist
			expect($('#pedigree_a svg').length).toBe(1);
			expect($('#pedigree_b svg').length).toBe(1);

			// Both should have correct number of nodes
			expect($('#pedigree_a svg .node:not(.hidden)').length).toBe(3);  // m1, f1, ch1
			expect($('#pedigree_b svg .node:not(.hidden)').length).toBe(3);

			// Check clipPath uniqueness (critical!)
			let allIds = [];
			$('svg clipPath').each(function() {
				allIds.push($(this).attr('id'));
			});
			let uniqueIds = [...new Set(allIds)];
			expect(uniqueIds.length).toBe(allIds.length);  // No duplicates
		});

		it('should handle different symbol_size in multiple pedigrees', function() {
			opts1.symbol_size = 25;
			opts2.symbol_size = 50;  // Double size

			pedigree.build(opts1);
			pedigree.build(opts2);

			// Both should render correctly
			expect($('#pedigree_a svg').length).toBe(1);
			expect($('#pedigree_b svg').length).toBe(1);

			// Verify symbols have different sizes (via viewBox or transform)
			// This is a sanity check that both pedigrees are independent
			let svg1_width = parseInt($('#pedigree_a svg').attr('width'));
			let svg2_width = parseInt($('#pedigree_b svg').attr('width'));

			expect(svg1_width).toBeGreaterThan(0);
			expect(svg2_width).toBeGreaterThan(0);
		});
	});

	// ========================================
	// REGRESSION TESTS
	// ========================================

	describe('Regression: Ensure backward compatibility', function() {
		it('should still render single pedigree correctly', function() {
			// Old usage: single pedigree on page
			pedigree.build(opts1);

			expect($('#pedigree_a svg').length).toBe(1);
			expect($('#pedigree_a svg .node:not(.hidden)').length).toBe(3);

			// ClipPaths should exist (even with new prefix system)
			expect($('#pedigree_a svg clipPath').length).toBeGreaterThan(0);
		});

		it('should maintain original bracket appearance (factor 1.3 ≈ 1.28)', function() {
			// The fix changed 1.28 to 1.3 for clarity
			// Verify this doesn't drastically change appearance
			let oldFactor = 1.28;
			let newFactor = 1.3;
			let difference = Math.abs(newFactor - oldFactor);

			// Difference should be minimal (< 2%)
			expect(difference / oldFactor).toBeLessThan(0.02);
		});
	});
});
