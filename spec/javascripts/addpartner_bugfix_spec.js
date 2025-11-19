/**
 * Tests for addpartner() bugfixes (2025-11-19)
 *
 * BUGS FIXED:
 * - BUG 1: Incorrect child index calculation for females
 * - BUG 2: Child always created with sex 'M'
 * - BUG 3: Child creation forced (no option to skip)
 * - BUG 4: No validation for opposite sex
 * - BUG 5: Inconsistent partner positioning logic
 */

describe('addpartner() Bugfix Tests', function() {
	let widgets = window.pedigreejs.pedigreejs_widgets;
	let utils = window.pedigreejs.pedigreejs_utils;
	let pedcache = window.pedigreejs.pedigreejs_pedcache;

	let opts;
	let dataset;

	beforeEach(function() {
		// Setup clean DOM
		$('body').append("<div id='pedigree_test'></div>");

		// Base dataset
		dataset = [
			{"name": "m1", "sex": "M", "top_level": true},
			{"name": "f1", "sex": "F", "top_level": true}
		];

		opts = {
			targetDiv: 'pedigree_test',
			btn_target: 'test_buttons',
			width: 600,
			height: 400,
			symbol_size: 35,
			DEBUG: false
		};

		// Initialize roots for tree operations
		utils.roots = utils.roots || {};
	});

	afterEach(function() {
		$('#pedigree_test').remove();
		pedcache.clear();
		delete utils.roots['pedigree_test'];
	});

	// ========================================
	// BUG 1: Child Index Calculation
	// ========================================

	describe('BUG 1: Child index calculation', function() {
		it('should insert child at correct position for FEMALE person', function() {
			let dataset_test = utils.copy_dataset(dataset);

			// Add partner to female (f1)
			widgets.addpartner(opts, dataset_test, 'f1');

			// Expected order: m1, f1, partner(M), child
			expect(dataset_test.length).toBe(4);
			expect(dataset_test[0].name).toBe('m1');
			expect(dataset_test[1].name).toBe('f1');
			expect(dataset_test[2].sex).toBe('M');  // Partner
			expect(dataset_test[3].mother).toBe('f1');  // Child correctly positioned
			expect(dataset_test[3].father).toBe(dataset_test[2].name);
		});

		it('should insert child at correct position for MALE person', function() {
			let dataset_test = utils.copy_dataset(dataset);

			// Add partner to male (m1)
			widgets.addpartner(opts, dataset_test, 'm1');

			// Expected order: partner(F), m1, child, f1
			expect(dataset_test.length).toBe(4);
			expect(dataset_test[0].sex).toBe('F');  // Partner inserted before
			expect(dataset_test[1].name).toBe('m1');
			expect(dataset_test[2].mother).toBe(dataset_test[0].name);  // Child
			expect(dataset_test[2].father).toBe('m1');
		});
	});

	// ========================================
	// BUG 2: Child Sex Selection
	// ========================================

	describe('BUG 2: Child sex customization', function() {
		it('should create child with default sex U (unknown)', function() {
			let dataset_test = utils.copy_dataset(dataset);

			widgets.addpartner(opts, dataset_test, 'f1');

			let child = dataset_test.find(p => p.mother === 'f1');
			expect(child).toBeDefined();
			expect(child.sex).toBe('U');  // Default is now 'U' instead of 'M'
		});

		it('should allow custom child sex via config.child_sex', function() {
			let dataset_test = utils.copy_dataset(dataset);

			widgets.addpartner(opts, dataset_test, 'f1', {child_sex: 'F'});

			let child = dataset_test.find(p => p.mother === 'f1');
			expect(child.sex).toBe('F');
		});

		it('should support all sex values (M, F, U)', function() {
			['M', 'F', 'U'].forEach(function(sex) {
				let dataset_test = utils.copy_dataset(dataset);
				widgets.addpartner(opts, dataset_test, 'f1', {child_sex: sex});

				let child = dataset_test.find(p => p.mother === 'f1');
				expect(child.sex).toBe(sex);
			});
		});
	});

	// ========================================
	// BUG 3: Optional Child Creation
	// ========================================

	describe('BUG 3: Optional child creation', function() {
		it('should create child by default (backward compatible)', function() {
			let dataset_test = utils.copy_dataset(dataset);

			widgets.addpartner(opts, dataset_test, 'f1');

			// Default: child created
			expect(dataset_test.length).toBe(4);  // m1, f1, partner, child
			let child = dataset_test.find(p => p.mother === 'f1');
			expect(child).toBeDefined();
		});

		it('should NOT create child when config.create_child = false', function() {
			let dataset_test = utils.copy_dataset(dataset);

			widgets.addpartner(opts, dataset_test, 'f1', {create_child: false});

			// No child created
			expect(dataset_test.length).toBe(3);  // m1, f1, partner only
			let child = dataset_test.find(p => p.mother === 'f1');
			expect(child).toBeUndefined();
		});

		it('should allow adding partner without child, then child later', function() {
			let dataset_test = utils.copy_dataset(dataset);

			// Step 1: Add partner without child
			let partner = widgets.addpartner(opts, dataset_test, 'f1', {create_child: false});
			expect(dataset_test.length).toBe(3);

			// Step 2: Manually add child later
			widgets.addchild(dataset_test, dataset_test[1], 'M', 1);  // f1 = dataset_test[1]
			expect(dataset_test.length).toBe(4);

			let child = dataset_test.find(p => p.mother === 'f1');
			expect(child).toBeDefined();
			expect(child.father).toBe(partner.name);
		});
	});

	// ========================================
	// BUG 4: Sex Validation
	// ========================================

	describe('BUG 4: Partner sex validation', function() {
		it('should auto-detect opposite sex for MALE person', function() {
			let dataset_test = utils.copy_dataset(dataset);

			let partner = widgets.addpartner(opts, dataset_test, 'm1');

			expect(partner.sex).toBe('F');  // Opposite of M
		});

		it('should auto-detect opposite sex for FEMALE person', function() {
			let dataset_test = utils.copy_dataset(dataset);

			let partner = widgets.addpartner(opts, dataset_test, 'f1');

			expect(partner.sex).toBe('M');  // Opposite of F
		});

		it('should allow explicit partner sex via config.partner_sex', function() {
			let dataset_test = utils.copy_dataset(dataset);

			let partner = widgets.addpartner(opts, dataset_test, 'f1', {partner_sex: 'U'});

			expect(partner.sex).toBe('U');
		});

		it('should handle UNKNOWN sex person gracefully', function() {
			let dataset_u = [{"name": "u1", "sex": "U", "top_level": true}];

			let partner = widgets.addpartner(opts, dataset_u, 'u1');

			expect(partner.sex).toBe('U');  // Default to U if person is U
		});

		it('should warn (in DEBUG mode) if same-sex partner created', function() {
			opts.DEBUG = true;
			spyOn(console, 'warn');

			let dataset_test = utils.copy_dataset(dataset);

			// Force same sex
			widgets.addpartner(opts, dataset_test, 'f1', {partner_sex: 'F'});

			expect(console.warn).toHaveBeenCalledWith(
				jasmine.stringMatching(/same sex/i)
			);
		});
	});

	// ========================================
	// BUG 5: Partner Positioning
	// ========================================

	describe('BUG 5: Unified partner positioning', function() {
		it('should position partner AFTER female (convention: F left, M right)', function() {
			let dataset_test = utils.copy_dataset(dataset);

			widgets.addpartner(opts, dataset_test, 'f1');

			// Order: m1, f1, partner(M)
			let f1_idx = utils.getIdxByName(dataset_test, 'f1');
			expect(dataset_test[f1_idx + 1].sex).toBe('M');  // Partner after female
		});

		it('should position partner BEFORE male (convention: F left, M right)', function() {
			let dataset_test = utils.copy_dataset(dataset);

			widgets.addpartner(opts, dataset_test, 'm1');

			// Order: partner(F), m1
			let m1_idx = utils.getIdxByName(dataset_test, 'm1');
			expect(dataset_test[m1_idx - 1].sex).toBe('F');  // Partner before male
		});

		it('should handle edge case: female at index 0', function() {
			let dataset_edge = [{"name": "f_first", "sex": "F", "top_level": true}];

			widgets.addpartner(opts, dataset_edge, 'f_first');

			// Partner should be inserted after (idx 0 + 1 = 1)
			expect(dataset_edge.length).toBe(3);  // f_first, partner, child
			expect(dataset_edge[1].sex).toBe('M');
		});
	});

	// ========================================
	// INTEGRATION TESTS
	// ========================================

	describe('Integration: Multiple partners', function() {
		it('should allow adding multiple partners to same person', function() {
			let dataset_test = utils.copy_dataset(dataset);

			// Add 1st partner
			widgets.addpartner(opts, dataset_test, 'f1', {create_child: false});
			expect(dataset_test.length).toBe(3);

			// Add 2nd partner (remarriage)
			widgets.addpartner(opts, dataset_test, 'f1', {create_child: false});
			expect(dataset_test.length).toBe(4);

			// Count partners (noparents = true)
			let partners = dataset_test.filter(p => p.noparents === true);
			expect(partners.length).toBe(2);
		});

		it('should create children with different partners correctly', function() {
			let dataset_test = utils.copy_dataset(dataset);

			// Add 1st partner with child
			let p1 = widgets.addpartner(opts, dataset_test, 'f1', {child_sex: 'M'});
			let child1 = dataset_test.find(p => p.mother === 'f1' && p.father === p1.name);
			expect(child1).toBeDefined();
			expect(child1.sex).toBe('M');

			// Add 2nd partner with child
			let p2 = widgets.addpartner(opts, dataset_test, 'f1', {child_sex: 'F'});
			let child2_candidates = dataset_test.filter(p => p.mother === 'f1' && p.father === p2.name);
			expect(child2_candidates.length).toBe(1);
			expect(child2_candidates[0].sex).toBe('F');
		});
	});

	// ========================================
	// REGRESSION TESTS
	// ========================================

	describe('Regression: Ensure backward compatibility', function() {
		it('should maintain default behavior when no config provided', function() {
			let dataset_test = utils.copy_dataset(dataset);

			// Old usage: widgets.addpartner(opts, dataset, 'f1')
			widgets.addpartner(opts, dataset_test, 'f1');

			// Should still work (child created, sex = U)
			expect(dataset_test.length).toBe(4);
			let child = dataset_test.find(p => p.mother === 'f1');
			expect(child).toBeDefined();
			expect(child.sex).toBe('U');  // Default changed from M to U (improvement)
		});

		it('should return partner object for chaining', function() {
			let dataset_test = utils.copy_dataset(dataset);

			let partner = widgets.addpartner(opts, dataset_test, 'f1');

			expect(partner).toBeDefined();
			expect(partner.name).toBeDefined();
			expect(partner.sex).toBe('M');
			expect(partner.noparents).toBe(true);
		});
	});
});
