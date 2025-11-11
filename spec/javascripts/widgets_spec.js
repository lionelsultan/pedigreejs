/**
 * Tests for widgets.js module
 * Focus on UI-facing helpers such as addchild/addsibling used by toolbar actions.
 */

describe('widgets.js module', function() {
	var widgets = window.pedigreejs.pedigreejs_widgets;

	function createParentPair() {
		return [
			{"name": "dad", "sex": "M", "top_level": true},
			{"name": "mom", "sex": "F", "top_level": true},
			{"name": "c0", "sex": "F", "mother": "mom", "father": "dad"}
		];
	}

	describe('addchild', function() {
		it('creates a placeholder partner when the first child is added to a single parent', function() {
			var dataset = [
				{"name": "soloMom", "sex": "F", "top_level": true}
			];
			var originalParent = dataset[0];

			var newChildren = widgets.addchild(dataset, dataset[0], 'F', 1);

			expect(newChildren.length).toBe(1);

			var placeholderPartner = dataset.find(function(p) {
				return p.noparents === true && p.name !== newChildren[0].name;
			});

			expect(placeholderPartner).toBeDefined();
			expect(placeholderPartner.sex).toBe('M');
			expect(placeholderPartner.top_level).toBe(true);
				expect(newChildren[0].father).toBe(placeholderPartner.name);
				expect(newChildren[0].mother).toBe(originalParent.name);
		});

		it('rejects unsupported twin types to mirror widget validation', function() {
			var dataset = createParentPair();
			var error = widgets.addchild(dataset, dataset[0], 'F', 1, 'triplet');

			expect(error instanceof Error).toBeTrue();
			expect(error.message).toContain('INVALID TWIN TYPE');
		});

		it('creates monozygotic twins that share the same twin id and sex', function() {
			var dataset = createParentPair();

			var twins = widgets.addchild(dataset, dataset[0], 'F', 2, 'mztwin');

			expect(twins.length).toBe(2);
			expect(twins[0].mztwin).toBeDefined();
			expect(twins[0].mztwin).toEqual(twins[1].mztwin);
			expect(twins[0].sex).toBe('F');
			expect(twins[1].sex).toBe('F');

			// All new twins should point to the same parents
			expect(twins[0].mother).toBe('mom');
			expect(twins[0].father).toBe('dad');
		});
	});

	describe('addsibling', function() {
		it('syncs dizygotic twin ids while preserving individual sexes', function() {
			var dataset = createParentPair();
			var existingChild = dataset[2];

			var twinSibling = widgets.addsibling(dataset, existingChild, 'M', false, 'dztwin');

			var refreshedOriginal = dataset.find(function(p) { return p.name === existingChild.name; });

			expect(twinSibling.dztwin).toBeDefined();
			expect(refreshedOriginal.dztwin).toEqual(twinSibling.dztwin);
			expect(refreshedOriginal.sex).toBe('F');
			expect(twinSibling.sex).toBe('M');
			expect(twinSibling.mother).toBe(existingChild.mother);
			expect(twinSibling.father).toBe(existingChild.father);
		});
	});
});
