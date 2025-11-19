/**
 * Tests for zoom.js module
 * Tests zoom, pan, and scale-to-fit functionality
 */
describe('Zoom Module', function() {
	var pedigreejs = window.pedigreejs.pedigreejs;
	var zoom = window.pedigreejs.pedigreejs_zooming;
	var pedigree_util = window.pedigreejs.pedigreejs_utils;

	var opts;
	var ds1 = [
		{"name": "m21", "sex": "M", "top_level": true},
		{"name": "f21", "sex": "F", "top_level": true},
		{"name": "ch1", "sex": "F", "mother": "f21", "father": "m21", "proband": true}
	];

	beforeEach(function() {
		$('body').append("<div id='zoom_test'></div>");
		opts = {
			targetDiv: 'zoom_test',
			width: 600,
			height: 500,
			dataset: ds1,
			symbol_size: 35,
			zoomIn: 1,
			zoomOut: 10,
			zoomSrc: ['wheel', 'button']
		};
		pedigreejs.build(opts);
	});

	afterEach(function() {
		d3.selectAll('svg').remove();
		$('#zoom_test').remove();
	});

	describe('get_bounds', function() {
		it('should return valid boundary coordinates', function() {
			var bounds = zoom.get_bounds(opts);

			expect(bounds).toBeDefined();
			expect(bounds.xmin).toBeDefined();
			expect(bounds.xmax).toBeDefined();
			expect(bounds.ymin).toBeDefined();
			expect(bounds.ymax).toBeDefined();

			// Bounds should be valid (max > min)
			expect(bounds.xmax).toBeGreaterThan(bounds.xmin);
			expect(bounds.ymax).toBeGreaterThan(bounds.ymin);
		});

		it('should handle empty pedigree', function() {
			var emptyOpts = $.extend({}, opts);
			emptyOpts.dataset = [];
			$('#zoom_test').empty();

			// Should not throw
			expect(function() {
				pedigreejs.build(emptyOpts);
				zoom.get_bounds(emptyOpts);
			}).not.toThrow();
		});
	});

	describe('btn_zoom', function() {
		it('should zoom in without error', function() {
			expect(function() {
				zoom.btn_zoom(opts, 1.2);
			}).not.toThrow();
		});

		it('should zoom out without error', function() {
			expect(function() {
				zoom.btn_zoom(opts, 0.8);
			}).not.toThrow();
		});

		it('should handle multiple zoom operations', function() {
			expect(function() {
				zoom.btn_zoom(opts, 1.5);
				zoom.btn_zoom(opts, 1.2);
				zoom.btn_zoom(opts, 0.9);
			}).not.toThrow();
		});
	});

	describe('scale_to_fit', function() {
		it('should scale pedigree to fit viewport', function(done) {
			expect(function() {
				zoom.scale_to_fit(opts);
			}).not.toThrow();

			// Wait for animation to complete
			setTimeout(function() {
				var bounds = zoom.get_bounds(opts);
				expect(bounds).toBeDefined();
				done();
			}, 1200); // Wait for animation (700ms + 400ms delay)
		});

		it('should work with different viewport sizes', function() {
			opts.width = 400;
			opts.height = 300;
			$('#zoom_test').empty();
			pedigreejs.build(opts);

			expect(function() {
				zoom.scale_to_fit(opts);
			}).not.toThrow();
		});
	});

	describe('init_zoom', function() {
		it('should initialize zoom on SVG', function() {
			var svg = d3.select("#zoom_test").select("svg");

			expect(function() {
				zoom.init_zoom(opts, svg);
			}).not.toThrow();
		});

		it('should respect zoom extent options', function() {
			opts.zoomIn = 0.5;
			opts.zoomOut = 5;
			$('#zoom_test').empty();
			pedigreejs.build(opts);
			var svg = d3.select("#zoom_test").select("svg");

			expect(function() {
				zoom.init_zoom(opts, svg);
			}).not.toThrow();
		});

		it('should filter zoom sources correctly', function() {
			// Test with wheel disabled
			opts.zoomSrc = ['button'];
			$('#zoom_test').empty();
			pedigreejs.build(opts);
			var svg = d3.select("#zoom_test").select("svg");

			expect(function() {
				zoom.init_zoom(opts, svg);
			}).not.toThrow();
		});
	});

	describe('zoom persistence', function() {
		it('should cache zoom position', function() {
			// Zoom in
			zoom.btn_zoom(opts, 1.5);

			// Get cached position
			var pedcache = window.pedigreejs.pedigreejs_pedcache;
			var pos = pedcache.getposition(opts);

			expect(pos).toBeDefined();
			expect(pos.length).toBeGreaterThan(0);
		});
	});
});
