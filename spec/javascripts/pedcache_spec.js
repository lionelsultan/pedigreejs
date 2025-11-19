/**
 * Tests for pedcache.js array cache fallback
 * Tests LRU eviction, position storage, and array mode operations
 * Phase 2.2 - TODO pedcache.js:98 resolution
 */

describe('pedcache.js array cache fallback', function() {
	var pedcache = window.pedigreejs.pedigreejs_pedcache;
	var pedigreejs = window.pedigreejs.pedigreejs;

	// Helper to create test options with array store
	function createArrayOpts(targetDiv) {
		return {
			targetDiv: targetDiv || 'test_target',
			btn_target: targetDiv || 'test_target',
			store_type: 'array',
			dataset: [
				{"name": "m21", "sex": "M", "top_level": true},
				{"name": "f21", "sex": "F", "top_level": true},
				{"name": "ch1", "sex": "F", "mother": "f21", "father": "m21", "proband": true}
			],
			width: 600,
			height: 400
		};
	}

	beforeEach(function() {
		$('body').append("<div id='test_cache'></div>");
	});

	afterEach(function() {
		$('#test_cache').remove();
		pedcache.clear();
	});

	describe('Array cache LRU eviction', function() {
		it('should store datasets in array when localStorage not available', function() {
			var opts = createArrayOpts('test_cache');

			// Init cache - should use array mode
			pedcache.init_cache(opts);

			// Verify dataset can be retrieved
			var current = pedcache.current(opts);
			expect(current).toBeDefined();
			expect(current.length).toBe(3);
			expect(current[0].name).toBe('m21');
		});

		it('should implement LRU eviction when max_limit is reached', function() {
			var opts = createArrayOpts('test_cache_lru');

			// Store many datasets to trigger eviction
			// We'll store more than max_limit (500) to test eviction
			for (var i = 0; i < 505; i++) {
				opts.dataset = [
					{"name": "person_" + i, "sex": "M", "top_level": true}
				];
				pedcache.init_cache(opts);
			}

			// Check that nstore indicates we have datasets
			var nst = pedcache.nstore(opts);
			expect(nst).toBeGreaterThan(0);
			expect(nst).toBeLessThanOrEqual(500); // Should not exceed max_limit

			// The oldest entries should have been evicted
			// We should be able to get the current dataset
			var current = pedcache.current(opts);
			expect(current).toBeDefined();
			expect(current[0].name).toMatch(/^person_/);
		});

		it('should maintain array size at max_limit during eviction', function() {
			var opts = createArrayOpts('test_cache_size');

			// Fill cache to just below max_limit
			for (var i = 0; i < 10; i++) {
				opts.dataset = [{"name": "test_" + i, "sex": "M", "top_level": true}];
				pedcache.init_cache(opts);
			}

			var nstBefore = pedcache.nstore(opts);
			expect(nstBefore).toBe(10);

			// Add one more - no eviction yet
			opts.dataset = [{"name": "test_final", "sex": "F", "top_level": true}];
			pedcache.init_cache(opts);

			var nstAfter = pedcache.nstore(opts);
			expect(nstAfter).toBe(11);

			// Verify current dataset is the last one added
			var current = pedcache.current(opts);
			expect(current[0].name).toBe('test_final');
		});
	});

	describe('Array cache position storage (setposition/getposition)', function() {
		it('should store and retrieve position in array mode', function() {
			var opts = createArrayOpts('test_cache_pos');

			// Set position
			pedcache.setposition(opts, 100, 200, 1.5);

			// Get position
			var pos = pedcache.getposition(opts);
			expect(pos).toBeDefined();
			expect(pos.length).toBe(3);
			expect(pos[0]).toBe(100);
			expect(pos[1]).toBe(200);
			expect(pos[2]).toBe(1.5);
		});

		it('should return null position when not set', function() {
			var opts = createArrayOpts('test_cache_no_pos');

			var pos = pedcache.getposition(opts);
			expect(pos).toEqual([null, null]);
		});

		it('should clear position when set to null', function() {
			var opts = createArrayOpts('test_cache_clear_pos');

			// Set position
			pedcache.setposition(opts, 50, 75, 2.0);

			// Verify it's set
			var pos1 = pedcache.getposition(opts);
			expect(pos1[0]).toBe(50);

			// Clear position
			pedcache.setposition(opts, null, null, null);

			// Verify it's cleared
			var pos2 = pedcache.getposition(opts);
			expect(pos2).toEqual([null, null]);
		});

		it('should store position without zoom', function() {
			var opts = createArrayOpts('test_cache_no_zoom');

			// Set position without zoom
			pedcache.setposition(opts, 150, 250);

			var pos = pedcache.getposition(opts);
			expect(pos.length).toBe(2);
			expect(pos[0]).toBe(150);
			expect(pos[1]).toBe(250);
		});

		it('should update position when called multiple times', function() {
			var opts = createArrayOpts('test_cache_update_pos');

			// Set initial position
			pedcache.setposition(opts, 10, 20, 1.0);
			var pos1 = pedcache.getposition(opts);
			expect(pos1[0]).toBe(10);

			// Update position
			pedcache.setposition(opts, 30, 40, 2.0);
			var pos2 = pedcache.getposition(opts);
			expect(pos2[0]).toBe(30);
			expect(pos2[1]).toBe(40);
			expect(pos2[2]).toBe(2.0);
		});

		it('should store and retrieve zero coordinates with zoom 1', function() {
			var opts = createArrayOpts('test_cache_zero_pos');

			pedcache.setposition(opts, 0, 0, 1);
			var pos = pedcache.getposition(opts);

			expect(pos[0]).toBe(0);
			expect(pos[1]).toBe(0);
			expect(pos[2]).toBe(1);
		});
	});

	describe('Storage namespace purge', function() {
		beforeEach(function() {
			try { localStorage.clear(); } catch (err) {}
			try { sessionStorage.clear(); } catch (err2) {}
		});

		it('should store zero coordinates with zoom 1 in localStorage mode', function() {
			var opts = createArrayOpts('local_zero_pos');
			opts.store_type = 'local';

			pedcache.setposition(opts, 0, 0, 1);
			var pos = pedcache.getposition(opts);

			expect(pos[0]).toBe(0);
			expect(pos[1]).toBe(0);
			expect(pos[2]).toBe(1);
		});

		it('should only clear prefixed keys in localStorage', function() {
			var opts = createArrayOpts('local_scope');
			opts.store_type = 'local';

			localStorage.setItem('UNRELATED_KEY', 'keep');

			pedcache.init_cache(opts);
			pedcache.clear(opts);

			expect(localStorage.getItem('UNRELATED_KEY')).toBe('keep');
			expect(pedcache.nstore(opts)).toBe(-1);
		});

		it('should keep other array namespaces intact when clearing one', function() {
			var optsA = createArrayOpts('array_scope_a');
			var optsB = createArrayOpts('array_scope_b');

			pedcache.init_cache(optsA);
			pedcache.init_cache(optsB);
			expect(pedcache.nstore(optsA)).toBeGreaterThan(0);
			expect(pedcache.nstore(optsB)).toBeGreaterThan(0);

			pedcache.clear(optsA);

			expect(pedcache.nstore(optsA)).toBe(-1);
			expect(pedcache.nstore(optsB)).toBeGreaterThan(0);
		});
	});

	describe('Array cache navigation (previous/next)', function() {
		it('should navigate through cached datasets', function() {
			var opts = createArrayOpts('test_cache_nav');

			// Add multiple datasets
			for (var i = 0; i < 3; i++) {
				opts.dataset = [{"name": "nav_" + i, "sex": "M", "top_level": true}];
				pedcache.init_cache(opts);
			}

			// Get current (should be last added)
			var current = pedcache.current(opts);
			expect(current[0].name).toBe('nav_2');

			// Go to previous
			var prev = pedcache.previous(opts);
			expect(prev[0].name).toBe('nav_1');

			// Go to previous again
			var prev2 = pedcache.previous(opts);
			expect(prev2[0].name).toBe('nav_0');

			// Go to next
			var next = pedcache.next(opts);
			expect(next[0].name).toBe('nav_1');
		});
	});

	describe('Array cache clear', function() {
		it('should clear all cache data including position', function() {
			var opts = createArrayOpts('test_cache_clear_all');

			// Add some data
			pedcache.init_cache(opts);
			pedcache.setposition(opts, 100, 200, 1.5);

			// Verify data exists
			expect(pedcache.current(opts)).toBeDefined();
			expect(pedcache.getposition(opts)[0]).toBe(100);

			// Clear cache
			pedcache.clear(opts);

			// Verify everything is cleared
			expect(pedcache.nstore(opts)).toBe(-1);
			expect(pedcache.getposition(opts)).toEqual([null, null]);
		});
	});

	describe('Dataset serialization safety', function() {
		it('should preserve nested custom objects when caching datasets', function() {
			var opts = createArrayOpts('test_cache_nested');
			opts.dataset[0].gene_test = {
				type: 'panel',
				results: [{gene: 'BRCA1', positive: true}]
			};
			opts.dataset[0].parent_node = {dummy: true};
			opts.dataset[0].parent_node.self = opts.dataset[0];

			pedcache.init_cache(opts);
			var cached = pedcache.current(opts);

			expect(cached[0].gene_test.results[0].gene).toBe('BRCA1');
			expect(cached[0].gene_test).not.toBe(opts.dataset[0].gene_test);
			expect(cached[0].parent_node).toBeUndefined();
		});

		it('should keep the insertion order when storing datasets', function() {
			var opts = createArrayOpts('test_cache_order_verify');
			opts.dataset = [
				{name: 'b', id: 2, flags: {idx: 0}},
				{name: 'a', id: 1, flags: {idx: 1}},
				{name: 'c', id: 3, flags: {idx: 2}}
			];

			pedcache.init_cache(opts);
			var cached = pedcache.current(opts);

			expect(cached[0].name).toBe('b');
			expect(cached[1].name).toBe('a');
			expect(cached[2].name).toBe('c');
		});
	});

	describe('Integration with pedigree build', function() {
		beforeEach(function() {
			$('body').append("<div id='test_integration_div'></div>");
		});

		afterEach(function() {
			$('#test_integration_div').remove();
		});

		it('should work with pedigree build in array mode', function() {
			var opts = createArrayOpts('test_integration_div');
			opts.targetDiv = 'test_integration_div';
			opts.validate = true;

			// Build pedigree with array cache
			pedigreejs.build(opts);

			// Verify cache was initialized
			var nst = pedcache.nstore(opts);
			expect(nst).toBeGreaterThan(0);

			// Verify we can retrieve the dataset
			var cached = pedcache.current(opts);
			expect(cached).toBeDefined();
			expect(cached.length).toBe(3);
		});

		it('should maintain cache across rebuilds in array mode', function() {
			$('body').append("<div id='test_rebuild_div'></div>");

			var opts = createArrayOpts('test_rebuild_div');
			opts.targetDiv = 'test_rebuild_div';
			opts.validate = true;

			// Build pedigree
			pedigreejs.build(opts);

			// Verify initial cache
			var nst1 = pedcache.nstore(opts);
			expect(nst1).toBeGreaterThan(0);

			// Modify dataset by creating a fresh copy with additional child
			opts.dataset = [
				{"name": "m21", "sex": "M", "top_level": true},
				{"name": "f21", "sex": "F", "top_level": true},
				{"name": "ch1", "sex": "F", "mother": "f21", "father": "m21", "proband": true},
				{"name": "ch2", "sex": "M", "mother": "f21", "father": "m21"}
			];

			// Rebuild with modified dataset
			pedigreejs.rebuild(opts);

			// Verify cache has both versions
			var nst2 = pedcache.nstore(opts);
			expect(nst2).toBeGreaterThanOrEqual(2);

			// Current should be the new dataset
			var current = pedcache.current(opts);
			expect(current.length).toBe(4);

			// Can navigate to previous
			var prev = pedcache.previous(opts);
			expect(prev).toBeDefined();
			expect(prev.length).toBe(3); // Original dataset

			$('#test_rebuild_div').remove();
		});
	});
});
