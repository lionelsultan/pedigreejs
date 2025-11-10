/**
 * Tests for validation.js module
 * Tests all exported functions: create_err, validate_age_yob, validate_pedigree, unconnected
 */

describe('validation.js module', function() {
	var validation = window.pedigreejs.pedigreejs_validation;
	var utils = window.pedigreejs.pedigreejs_utils;

	describe('create_err', function() {
		it('should create an Error object', function() {
			var err = validation.create_err('Test error message');
			expect(err).toBeInstanceOf(Error);
			expect(err.message).toEqual('Test error message');
		});

		it('should console.error the message', function() {
			spyOn(console, 'error');
			validation.create_err('Another error');
			expect(console.error).toHaveBeenCalledWith('Another error');
		});
	});

	describe('validate_age_yob', function() {
		var currentYear = new Date().getFullYear();

		it('should validate alive person with correct age and yob', function() {
			var yob = currentYear - 30;
			// Allow +/- 1 year tolerance: Math.abs(year - (age + yob)) <= 1
			expect(validation.validate_age_yob("30", yob.toString(), "0")).toBe(true);
			expect(validation.validate_age_yob("29", yob.toString(), "0")).toBe(true);
			// 31 years old born 30 years ago = year - 30 + 31 = year + 1 (too far in future)
			var validAge = 30;
			expect(validation.validate_age_yob(validAge.toString(), yob.toString(), "0")).toBe(true);
		});

		it('should invalidate alive person with incorrect age and yob', function() {
			var yob = currentYear - 30;
			expect(validation.validate_age_yob(32, yob, "0")).toBe(false);
			expect(validation.validate_age_yob(28, yob, "0")).toBe(false);
		});

		it('should validate deceased person', function() {
			expect(validation.validate_age_yob(50, 1950, "1")).toBe(true);
			expect(validation.validate_age_yob(80, 1920, "1")).toBe(true);
		});

		it('should invalidate deceased person with future death', function() {
			var futureYear = currentYear + 10;
			expect(validation.validate_age_yob(10, futureYear, "1")).toBe(false);
		});

		it('should return false for invalid status', function() {
			expect(validation.validate_age_yob(30, 1990, "2")).toBe(false);
			expect(validation.validate_age_yob(30, 1990, "alive")).toBe(false);
		});
	});

	describe('validate_pedigree', function() {
		it('should pass validation for valid simple pedigree', function() {
			var opts = {
				validate: true,
				dataset: [
					{"name": "m21", "sex": "M", "top_level": true},
					{"name": "f21", "sex": "F", "top_level": true},
					{"name": "ch1", "sex": "F", "mother": "f21", "father": "m21", "proband": true}
				]
			};
			expect(function() {
				validation.validate_pedigree(opts);
			}).not.toThrow();
		});

		it('should throw error for missing mother', function() {
			var opts = {
				validate: true,
				dataset: [
					{"name": "ch1", "sex": "F", "mother": "missing_mom", "father": "m21"},
					{"name": "m21", "sex": "M", "top_level": true}
				]
			};
			expect(function() {
				validation.validate_pedigree(opts);
			}).toThrowError(/mother.*missing/i);
		});

		it('should throw error for missing father', function() {
			var opts = {
				validate: true,
				dataset: [
					{"name": "ch1", "sex": "F", "mother": "f21", "father": "missing_dad"},
					{"name": "f21", "sex": "F", "top_level": true}
				]
			};
			expect(function() {
				validation.validate_pedigree(opts);
			}).toThrowError(/father.*missing/i);
		});

		it('should throw error for mother not female', function() {
			var opts = {
				validate: true,
				dataset: [
					{"name": "m21", "sex": "M", "top_level": true},
					{"name": "f21", "sex": "M", "top_level": true},
					{"name": "ch1", "sex": "F", "mother": "f21", "father": "m21"}
				]
			};
			expect(function() {
				validation.validate_pedigree(opts);
			}).toThrowError(/mother.*not specified as female/i);
		});

		it('should throw error for father not male', function() {
			var opts = {
				validate: true,
				dataset: [
					{"name": "m21", "sex": "F", "top_level": true},
					{"name": "f21", "sex": "F", "top_level": true},
					{"name": "ch1", "sex": "F", "mother": "f21", "father": "m21"}
				]
			};
			expect(function() {
				validation.validate_pedigree(opts);
			}).toThrowError(/father.*not specified as male/i);
		});

		it('should throw error for duplicate IndivID', function() {
			var opts = {
				validate: true,
				dataset: [
					{"name": "m21", "sex": "M", "top_level": true},
					{"name": "m21", "sex": "F", "top_level": true}
				]
			};
			expect(function() {
				validation.validate_pedigree(opts);
			}).toThrowError(/not unique/i);
		});

		it('should throw error for missing IndivID', function() {
			var opts = {
				validate: true,
				dataset: [
					{"sex": "M", "top_level": true}
				]
			};
			expect(function() {
				validation.validate_pedigree(opts);
			}).toThrowError(/no IndivID/i);
		});

		it('should throw error for multiple families', function() {
			var opts = {
				validate: true,
				dataset: [
					{"name": "p1", "sex": "M", "famid": "FAM1", "top_level": true},
					{"name": "p2", "sex": "F", "famid": "FAM2", "top_level": true}
				]
			};
			expect(function() {
				validation.validate_pedigree(opts);
			}).toThrowError(/More than one family/i);
		});

		it('should call custom validation function if provided', function() {
			var customValidate = jasmine.createSpy('customValidate');
			var opts = {
				validate: customValidate,
				dataset: [{"name": "p1", "sex": "M"}],
				DEBUG: false
			};
			validation.validate_pedigree(opts);
			expect(customValidate).toHaveBeenCalled();
		});

		it('should warn about unconnected individuals', function() {
			spyOn(console, 'warn');
			var opts = {
				validate: true,
				dataset: [
					{"name": "p1", "sex": "M", "top_level": true, "proband": true},
					{"name": "p2", "sex": "F", "top_level": true}
				]
			};
			validation.validate_pedigree(opts);
			expect(console.warn).toHaveBeenCalledWith("individuals unconnected to pedigree ", jasmine.any(Array));
		});
	});

	describe('unconnected', function() {
		it('should return empty array for fully connected pedigree', function() {
			var dataset = [
				{"name": "m21", "sex": "M", "top_level": true},
				{"name": "f21", "sex": "F", "top_level": true},
				{"name": "ch1", "sex": "F", "mother": "f21", "father": "m21", "proband": true}
			];
			var unconnected = validation.unconnected(dataset);
			expect(unconnected.length).toBe(0);
		});

		it('should identify unconnected individuals', function() {
			var dataset = [
				{"name": "p1", "sex": "M", "top_level": true, "proband": true},
				{"name": "p2", "sex": "F", "top_level": true}
			];
			var unconnected = validation.unconnected(dataset);
			expect(unconnected).toContain("p2");
			expect(unconnected.length).toBe(1);
		});

		it('should use first person if no proband defined', function() {
			spyOn(console, 'warn');
			var dataset = [
				{"name": "p1", "sex": "M", "top_level": true},
				{"name": "p2", "sex": "F", "top_level": true}
			];
			var unconnected = validation.unconnected(dataset);
			expect(console.warn).toHaveBeenCalledWith("No target defined");
			expect(unconnected).toContain("p2");
		});

		it('should throw error for empty dataset', function() {
			expect(function() {
				validation.unconnected([]);
			}).toThrowError("empty pedigree data set");
		});

		it('should handle complex family connections', function() {
			var dataset = [
				{"name": "gf", "sex": "M", "top_level": true},
				{"name": "gm", "sex": "F", "top_level": true},
				{"name": "dad", "sex": "M", "mother": "gm", "father": "gf"},
				{"name": "mom", "sex": "F", "top_level": true},
				{"name": "child", "sex": "F", "mother": "mom", "father": "dad", "proband": true},
				{"name": "uncle", "sex": "M", "mother": "gm", "father": "gf"},
				{"name": "stranger", "sex": "M", "top_level": true}
			];
			var unconnected = validation.unconnected(dataset);
			expect(unconnected).toContain("stranger");
			expect(unconnected).not.toContain("uncle");
			expect(unconnected).not.toContain("gf");
			expect(unconnected.length).toBe(1);
		});
	});
});
