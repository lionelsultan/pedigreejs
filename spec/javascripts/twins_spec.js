/**
 * Tests for twins.js module
 * Tests monozygotic (MZ) and dizygotic (DZ) twin functionality
 */
describe('Twins Module', function() {
	var pedigreejs = window.pedigreejs.pedigreejs;
	var twins = window.pedigreejs.pedigreejs_twins;
	var pedigree_util = window.pedigreejs.pedigreejs_utils;

	var dataset;

	beforeEach(function() {
		dataset = [
			{"name": "m21", "sex": "M", "top_level": true},
			{"name": "f21", "sex": "F", "top_level": true},
			{"name": "twin1", "sex": "M", "mother": "f21", "father": "m21", "yob": 1990, "age": 34, "status": "0"},
			{"name": "twin2", "sex": "M", "mother": "f21", "father": "m21", "yob": 1989, "age": 33, "status": "0"},
			{"name": "ch3", "sex": "F", "mother": "f21", "father": "m21", "proband": true}
		];
	});

	describe('getUniqueTwinID', function() {
		it('should return first available ID for empty dataset', function() {
			var emptyDataset = [];
			var id = twins.getUniqueTwinID(emptyDataset, 'mztwin');

			expect(id).toBe(1);
		});

		it('should return next available ID when some are used', function() {
			dataset[2].mztwin = 1;
			dataset[3].mztwin = 1;

			var id = twins.getUniqueTwinID(dataset, 'mztwin');

			expect(id).toBe(2);
		});

		it('should support up to 10 twin pairs', function() {
			var testDataset = [];
			for(let i = 1; i <= 9; i++) {
				testDataset.push({"name": "t" + i, "mztwin": i});
			}
			testDataset.push({"name": "tA", "mztwin": "A"});

			var id = twins.getUniqueTwinID(testDataset, 'mztwin');

			expect(id).toBeUndefined();
		});

		it('should work for dizygotic twins', function() {
			var id = twins.getUniqueTwinID(dataset, 'dztwin');

			expect(id).toBe(1);
		});
	});

	describe('setMzTwin', function() {
		it('should set matching twin IDs for both siblings', function() {
			var d1 = dataset[2]; // twin1
			var d2 = dataset[3]; // twin2

			var result = twins.setMzTwin(dataset, d1, d2, 'mztwin');

			expect(result).toBe(true);
			expect(d1.mztwin).toBeDefined();
			expect(d2.mztwin).toBe(d1.mztwin);
		});

		it('should synchronize yob between twins', function() {
			var d1 = dataset[2]; // twin1 (yob: 1990)
			var d2 = dataset[3]; // twin2 (yob: 1989)

			twins.setMzTwin(dataset, d1, d2, 'mztwin');

			expect(d2.yob).toBe(d1.yob);
			expect(d2.yob).toBe(1990);
		});

		it('should synchronize age for alive twins', function() {
			var d1 = dataset[2]; // twin1 (age: 34, status: "0")
			var d2 = dataset[3]; // twin2 (age: 33, status: "0")

			twins.setMzTwin(dataset, d1, d2, 'mztwin');

			expect(d2.age).toBe(d1.age);
			expect(d2.age).toBe(34);
		});

		it('should not synchronize age for deceased twins', function() {
			var d1 = dataset[2];
			var d2 = dataset[3];
			d1.status = "1"; // deceased
			d1.age = 50;
			d2.age = 33;

			twins.setMzTwin(dataset, d1, d2, 'mztwin');

			// Age should not be synced for deceased
			expect(d2.age).toBe(33);
		});

		it('should work with dizygotic twins', function() {
			var d1 = dataset[2];
			var d2 = dataset[3];

			var result = twins.setMzTwin(dataset, d1, d2, 'dztwin');

			expect(result).toBe(true);
			expect(d1.dztwin).toBeDefined();
			expect(d2.dztwin).toBe(d1.dztwin);
		});

		it('should use existing twin ID if already set', function() {
			var d1 = dataset[2];
			var d2 = dataset[3];
			d1.mztwin = 5; // Pre-existing twin ID

			twins.setMzTwin(dataset, d1, d2, 'mztwin');

			expect(d2.mztwin).toBe(5);
		});
	});

	describe('syncTwins', function() {
		beforeEach(function() {
			dataset[2].mztwin = 1;
			dataset[3].mztwin = 1;
		});

		it('should synchronize sex for monozygotic twins', function() {
			var d1 = dataset[2];
			d1.sex = "F";

			twins.syncTwins(dataset, d1);

			expect(dataset[3].sex).toBe("F");
		});

		it('should not synchronize sex for dizygotic twins', function() {
			dataset[2].dztwin = 1;
			dataset[3].dztwin = 1;
			delete dataset[2].mztwin;
			delete dataset[3].mztwin;

			var d1 = dataset[2];
			d1.sex = "F";
			var originalSex = dataset[3].sex;

			twins.syncTwins(dataset, d1);

			expect(dataset[3].sex).toBe(originalSex);
		});

		it('should synchronize yob', function() {
			var d1 = dataset[2];
			d1.yob = 1995;

			twins.syncTwins(dataset, d1);

			expect(dataset[3].yob).toBe(1995);
		});

		it('should synchronize age for alive twins', function() {
			var d1 = dataset[2];
			d1.age = 40;
			d1.status = 0;

			twins.syncTwins(dataset, d1);

			expect(dataset[3].age).toBe(40);
		});

		it('should not affect non-twin siblings', function() {
			var d1 = dataset[2];
			var d3 = dataset[4]; // ch3 - not a twin
			var originalCh3Sex = d3.sex;

			d1.sex = "F";
			twins.syncTwins(dataset, d1);

			expect(d3.sex).toBe(originalCh3Sex);
		});
	});

	describe('checkTwins', function() {
		it('should remove twin marker if only one twin exists', function() {
			dataset[2].mztwin = 1;
			// dataset[3] does not have mztwin set

			twins.checkTwins(dataset);

			expect(dataset[2].mztwin).toBeUndefined();
		});

		it('should keep twin marker if two or more twins exist', function() {
			dataset[2].mztwin = 1;
			dataset[3].mztwin = 1;

			twins.checkTwins(dataset);

			expect(dataset[2].mztwin).toBe(1);
			expect(dataset[3].mztwin).toBe(1);
		});

		it('should handle multiple twin pairs', function() {
			dataset[2].mztwin = 1;
			dataset[3].mztwin = 1;
			dataset[4].dztwin = 2;

			// Add another dizygotic twin
			dataset.push({"name": "twin3", "sex": "M", "mother": "f21", "father": "m21", "dztwin": 2});

			twins.checkTwins(dataset);

			expect(dataset[2].mztwin).toBe(1);
			expect(dataset[3].mztwin).toBe(1);
			expect(dataset[4].dztwin).toBe(2);
			expect(dataset[5].dztwin).toBe(2);
		});

		it('should handle triplets', function() {
			dataset[2].mztwin = 1;
			dataset[3].mztwin = 1;
			dataset.push({"name": "twin3", "sex": "M", "mother": "f21", "father": "m21", "mztwin": 1});

			twins.checkTwins(dataset);

			// All three should keep their twin marker
			expect(dataset[2].mztwin).toBe(1);
			expect(dataset[3].mztwin).toBe(1);
			expect(dataset[5].mztwin).toBe(1);
		});
	});

	describe('twin integration', function() {
		it('should display twins correctly in pedigree', function() {
			$('body').append("<div id='twins_test'></div>");

			var opts = {
				targetDiv: 'twins_test',
				width: 600,
				height: 500,
				dataset: pedigree_util.copy_dataset(dataset),
				symbol_size: 35
			};

			dataset[2].mztwin = 1;
			dataset[3].mztwin = 1;

			expect(function() {
				pedigreejs.build(opts);
			}).not.toThrow();

			d3.selectAll('svg').remove();
			$('#twins_test').remove();
		});
	});
});
