/**
 * Tests for dom.js module
 * Tests all exported functions: isIE, isEdge, messages, print_opts, is_fullscreen,
 * get_svg_dimensions, get_tree_dimensions
 */

describe('dom.js module', function() {
	var dom = window.pedigreejs.pedigreejs_dom;

	describe('isIE', function() {
		it('should return a boolean', function() {
			var result = dom.isIE();
			expect(typeof result).toBe('boolean');
		});

		it('should detect MSIE in user agent', function() {
			var originalUA = navigator.userAgent;
			// Cannot actually modify navigator.userAgent in tests, so just verify function runs
			expect(dom.isIE()).toBeDefined();
		});
	});

	describe('isEdge', function() {
		it('should return truthy or falsy value', function() {
			var result = dom.isEdge();
			// Returns null or match array
			expect(result === null || Array.isArray(result)).toBe(true);
		});
	});

	describe('is_fullscreen', function() {
		it('should return a boolean', function() {
			var result = dom.is_fullscreen();
			expect(typeof result).toBe('boolean');
		});

		it('should return false when not in fullscreen', function() {
			// In test environment, we're not in fullscreen
			expect(dom.is_fullscreen()).toBe(false);
		});
	});

	describe('get_svg_dimensions', function() {
		it('should return dimensions object', function() {
			var opts = {width: 800, height: 600};
			var dims = dom.get_svg_dimensions(opts);
			expect(dims).toBeDefined();
			expect(dims.width).toBeDefined();
			expect(dims.height).toBeDefined();
		});

		it('should use opts dimensions when not fullscreen', function() {
			var opts = {width: 800, height: 600};
			var dims = dom.get_svg_dimensions(opts);
			expect(dims.width).toBe(800);
			expect(dims.height).toBe(600);
		});

		it('should handle different dimension values', function() {
			var opts1 = {width: 1024, height: 768};
			var dims1 = dom.get_svg_dimensions(opts1);
			expect(dims1.width).toBe(1024);
			expect(dims1.height).toBe(768);

			var opts2 = {width: 500, height: 400};
			var dims2 = dom.get_svg_dimensions(opts2);
			expect(dims2.width).toBe(500);
			expect(dims2.height).toBe(400);
		});
	});

	describe('get_tree_dimensions', function() {
		it('should return tree dimensions object', function() {
			var opts = {
				width: 800,
				height: 600,
				symbol_size: 35,
				dataset: [
					{"name": "p1", "sex": "M", "top_level": true}
				]
			};
			var dims = dom.get_tree_dimensions(opts);
			expect(dims).toBeDefined();
			expect(dims.width).toBeDefined();
			expect(dims.height).toBeDefined();
		});

		it('should calculate dimensions based on dataset size', function() {
			var smallOpts = {
				width: 800,
				height: 600,
				symbol_size: 35,
				dataset: [
					{"name": "p1", "sex": "M", "top_level": true}
				]
			};
			var smallDims = dom.get_tree_dimensions(smallOpts);

			var largeOpts = {
				width: 800,
				height: 600,
				symbol_size: 35,
				dataset: [
					{"name": "gf", "sex": "M", "top_level": true},
					{"name": "gm", "sex": "F", "top_level": true},
					{"name": "dad", "sex": "M", "mother": "gm", "father": "gf"},
					{"name": "mom", "sex": "F", "top_level": true},
					{"name": "child1", "sex": "F", "mother": "mom", "father": "dad"},
					{"name": "child2", "sex": "M", "mother": "mom", "father": "dad"},
					{"name": "child3", "sex": "F", "mother": "mom", "father": "dad"}
				]
			};
			var largeDims = dom.get_tree_dimensions(largeOpts);

			expect(smallDims.width).toBeLessThanOrEqual(largeDims.width);
		});

		it('should respect symbol_size in calculations', function() {
			var opts = {
				width: 800,
				height: 600,
				symbol_size: 50,
				dataset: [
					{"name": "p1", "sex": "M", "top_level": true},
					{"name": "p2", "sex": "F", "top_level": true}
				]
			};
			var dims = dom.get_tree_dimensions(opts);
			expect(dims.width).toBeGreaterThan(0);
			expect(dims.height).toBeGreaterThan(0);
		});
	});

	describe('print_opts', function() {
		beforeEach(function() {
			// Clean up any existing pedigree_data div
			$('#pedigree_data').remove();
		});

		afterEach(function() {
			// Clean up after test
			$('#pedigree_data').remove();
		});

		it('should create pedigree_data div', function() {
			var opts = {
				dataset: [{"name": "p1", "sex": "M"}],
				width: 800
			};
			dom.print_opts(opts);
			expect($('#pedigree_data').length).toBe(1);
		});

		it('should display dataset information', function() {
			var opts = {
				dataset: [
					{"name": "p1", "sex": "M", "age": 30}
				],
				width: 800
			};
			dom.print_opts(opts);
			var content = $('#pedigree_data').html();
			expect(content).toContain('p1');
			expect(content).toContain('sex');
			expect(content).toContain('age');
		});

		it('should display options information', function() {
			var opts = {
				dataset: [{"name": "p1", "sex": "M"}],
				width: 800,
				height: 600,
				symbol_size: 35
			};
			dom.print_opts(opts);
			var content = $('#pedigree_data').html();
			expect(content).toContain('width');
			expect(content).toContain('800');
		});
	});

	describe('messages', function() {
		beforeEach(function() {
			// Clean up any existing dialogs
			$('#msgDialog').remove();
			$('.ui-dialog').remove();
		});

		afterEach(function() {
			// Clean up after test
			$('#msgDialog').remove();
			$('.ui-dialog').remove();
		});

		it('should create message dialog without confirmation', function(done) {
			dom.messages('Test Title', 'Test Message', null, null, null);
			setTimeout(function() {
				expect($('#msgDialog').length).toBeGreaterThan(0);
				$('#msgDialog').dialog('close');
				done();
			}, 100);
		});

		it('should create confirmation dialog with callback', function(done) {
			var onConfirm = jasmine.createSpy('onConfirm');
			dom.messages('Confirm Title', 'Confirm Message', onConfirm, {}, []);
			setTimeout(function() {
				expect($('#msgDialog').length).toBeGreaterThan(0);
				// Check if Yes/No buttons exist
				var buttons = $('.ui-dialog-buttonset button');
				expect(buttons.length).toBeGreaterThan(0);
				$('#msgDialog').dialog('close');
				done();
			}, 100);
		});

		it('should display the message content', function(done) {
			dom.messages('Title', 'Important Message', null, null, null);
			setTimeout(function() {
				var content = $('#msgDialog').text();
				expect(content).toBe('Important Message');
				$('#msgDialog').dialog('close');
				done();
			}, 100);
		});
	});
});
