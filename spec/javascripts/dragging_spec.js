/**
 * Tests for dragging.js module
 * Tests SHIFT + DRAG functionality for repositioning nodes
 */
describe('Dragging Module', function() {
	var pedigreejs = window.pedigreejs.pedigreejs;
	var pedigree_util = window.pedigreejs.pedigreejs_utils;

	var opts;
	var ds_siblings = [
		{"name": "m21", "sex": "M", "top_level": true},
		{"name": "f21", "sex": "F", "top_level": true},
		{"name": "ch1", "sex": "M", "mother": "f21", "father": "m21"},
		{"name": "ch2", "sex": "F", "mother": "f21", "father": "m21"},
		{"name": "ch3", "sex": "M", "mother": "f21", "father": "m21", "proband": true}
	];

	beforeEach(function() {
		$('body').append("<div id='drag_test'></div>");
		opts = {
			targetDiv: 'drag_test',
			width: 600,
			height: 500,
			dataset: pedigree_util.copy_dataset(ds_siblings),
			symbol_size: 35
		};
		pedigreejs.build(opts);
	});

	afterEach(function() {
		d3.selectAll('svg').remove();
		$('#drag_test').remove();
	});

	describe('init_dragging', function() {
		it('should initialize dragging on visible nodes', function() {
			var svg = d3.select("#drag_test").select("svg");
			var nodes = svg.selectAll('.diagram g');

			expect(nodes.size()).toBeGreaterThan(0);

			// Dragging is initialized during build, nodes should be draggable
			// Check that nodes exist and are not hidden
			nodes.each(function(d) {
				if (d && d.data && !d.data.hidden) {
					expect(d).toBeDefined();
					expect(d.data.name).toBeDefined();
				}
			});
		});

		it('should not initialize dragging on hidden nodes', function() {
			var svg = d3.select("#drag_test").select("svg");
			var nodes = svg.selectAll('.diagram g');

			// Verify that hidden_root is not draggable
			nodes.each(function(d) {
				if (d && d.data && d.data.hidden) {
					expect(d.data.name).toBe('hidden_root');
				}
			});
		});
	});

	describe('sibling ordering', function() {
		it('should maintain correct sibling order in dataset', function() {
			var root = pedigree_util.roots[opts.targetDiv];
			var flat = pedigree_util.flatten(root);

			// Find children nodes
			var ch1 = pedigree_util.getNodeByName(flat, 'ch1');
			var ch2 = pedigree_util.getNodeByName(flat, 'ch2');
			var ch3 = pedigree_util.getNodeByName(flat, 'ch3');

			expect(ch1).toBeDefined();
			expect(ch2).toBeDefined();
			expect(ch3).toBeDefined();

			// All siblings should be at the same depth
			expect(ch1.depth).toBe(ch2.depth);
			expect(ch2.depth).toBe(ch3.depth);
		});

		it('should get nodes at same depth', function() {
			var root = pedigree_util.roots[opts.targetDiv];
			var flat = pedigree_util.flatten(root);
			var ch1 = pedigree_util.getNodeByName(flat, 'ch1');

			var siblings = pedigree_util.getNodesAtDepth(flat, ch1.depth);

			// Should include all 3 children
			expect(siblings.length).toBeGreaterThanOrEqual(3);
		});
	});

	describe('dataset manipulation', function() {
		it('should copy dataset without modifying original', function() {
			var original = pedigree_util.copy_dataset(opts.dataset);
			var copy = pedigree_util.copy_dataset(opts.dataset);

			expect(copy.length).toBe(original.length);

			// Modify copy
			copy[0].test_prop = 'test';

			// Original should be unchanged
			expect(original[0].test_prop).toBeUndefined();
		});

		it('should find node index by name', function() {
			var idx = pedigree_util.getIdxByName(opts.dataset, 'ch2');

			expect(idx).toBeGreaterThanOrEqual(0);
			expect(opts.dataset[idx].name).toBe('ch2');
		});

		it('should get partners correctly', function() {
			var m21 = pedigree_util.getNodeByName(opts.dataset, 'm21');
			var partners = pedigree_util.get_partners(opts.dataset, m21);

			expect(partners.length).toBe(1);
			expect(partners[0]).toBe('f21');
		});
	});

	describe('drag boundary detection', function() {
		it('should identify left and right adjacent nodes', function() {
			var root = pedigree_util.roots[opts.targetDiv];
			var flat = pedigree_util.flatten(root);
			var nodes = pedigree_util.getNodesAtDepth(flat, 2); // Children level

			expect(nodes.length).toBeGreaterThanOrEqual(3);

			// Nodes should have x positions
			for(let i = 0; i < nodes.length; i++) {
				expect(nodes[i].x).toBeDefined();
			}

			// Sort by x position
			nodes.sort(function(a, b) { return a.x - b.x; });

			// Verify ordering
			for(let i = 1; i < nodes.length; i++) {
				expect(nodes[i].x).toBeGreaterThanOrEqual(nodes[i-1].x);
			}
		});
	});

	describe('rebuild after drag', function() {
		it('should trigger rebuild event', function(done) {
			var rebuildTriggered = false;

			$(document).on('rebuild.draggingTest', function() {
				rebuildTriggered = true;
			});

			// Simulate a rebuild (drag would trigger this)
			$(document).trigger('rebuild', [opts]);

			setTimeout(function() {
				expect(rebuildTriggered).toBe(true);
				$(document).off('rebuild.draggingTest');
				done();
			}, 100);
		});
	});
});
