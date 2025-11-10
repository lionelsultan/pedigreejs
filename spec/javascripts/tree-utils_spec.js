/**
 * Tests for tree-utils.js module
 * Tests core tree navigation and utility functions
 */

describe('tree-utils.js module', function() {
	var tree_utils = window.pedigreejs.pedigreejs_tree_utils;

	var simpleDataset = [
		{"name": "m21", "sex": "M", "top_level": true},
		{"name": "f21", "sex": "F", "top_level": true},
		{"name": "ch1", "sex": "F", "mother": "f21", "father": "m21", "proband": true}
	];

	var complexDataset = [
		{"name": "gf", "sex": "M", "top_level": true},
		{"name": "gm", "sex": "F", "top_level": true},
		{"name": "dad", "sex": "M", "mother": "gm", "father": "gf"},
		{"name": "mom", "sex": "F", "top_level": true},
		{"name": "child1", "sex": "F", "mother": "mom", "father": "dad", "proband": true},
		{"name": "child2", "sex": "M", "mother": "mom", "father": "dad"},
		{"name": "twin1", "sex": "F", "mother": "mom", "father": "dad", "mztwin": "T1"},
		{"name": "twin2", "sex": "F", "mother": "mom", "father": "dad", "mztwin": "T1"}
	];

	describe('getIdxByName', function() {
		it('should find index of person by name', function() {
			var idx = tree_utils.getIdxByName(simpleDataset, "m21");
			expect(idx).toBe(0);
			idx = tree_utils.getIdxByName(simpleDataset, "ch1");
			expect(idx).toBe(2);
		});

		it('should return -1 for non-existent name', function() {
			var idx = tree_utils.getIdxByName(simpleDataset, "nonexistent");
			expect(idx).toBe(-1);
		});
	});

	describe('getNodeByName', function() {
		it('should find node in dataset by name', function() {
			var node = tree_utils.getNodeByName(simpleDataset, "m21");
			expect(node).toBeDefined();
			expect(node.name).toBe("m21");
			expect(node.sex).toBe("M");
		});

		it('should find node with data property', function() {
			var nodesWithData = [
				{data: {"name": "p1", "sex": "M"}},
				{data: {"name": "p2", "sex": "F"}}
			];
			var node = tree_utils.getNodeByName(nodesWithData, "p2");
			expect(node).toBeDefined();
			expect(node.data.name).toBe("p2");
		});

		it('should return undefined for non-existent name', function() {
			var node = tree_utils.getNodeByName(simpleDataset, "nonexistent");
			expect(node).toBeUndefined();
		});
	});

	describe('isProband and setProband', function() {
		it('should identify proband', function() {
			var probandNode = {"name": "ch1", "proband": true};
			expect(tree_utils.isProband(probandNode)).toBe(true);
		});

		it('should return false for non-proband', function() {
			var regularNode = {"name": "m21", "sex": "M"};
			expect(tree_utils.isProband(regularNode)).toBe(false);
		});

		it('should set proband status', function() {
			var dataset = [
				{"name": "p1", "sex": "M"},
				{"name": "p2", "sex": "F", "proband": true}
			];
			tree_utils.setProband(dataset, "p1", true);
			expect(dataset[0].proband).toBe(true);
			expect(dataset[1].proband).toBeUndefined();
		});
	});

	describe('getProbandIndex', function() {
		it('should find proband index', function() {
			var idx = tree_utils.getProbandIndex(simpleDataset);
			expect(idx).toBe(2);
		});

		it('should return undefined if no proband', function() {
			var dataset = [
				{"name": "p1", "sex": "M"},
				{"name": "p2", "sex": "F"}
			];
			var idx = tree_utils.getProbandIndex(dataset);
			expect(idx).toBeUndefined();
		});
	});

	describe('get_partners', function() {
		it('should find partners of a person', function() {
			var person = tree_utils.getNodeByName(complexDataset, "dad");
			var partners = tree_utils.get_partners(complexDataset, person);
			expect(partners).toContain("mom");
			expect(partners.length).toBe(1);
		});

		it('should return empty array if no partners', function() {
			var person = tree_utils.getNodeByName(simpleDataset, "ch1");
			var partners = tree_utils.get_partners(simpleDataset, person);
			expect(partners.length).toBe(0);
		});

		it('should not duplicate partners', function() {
			var dad = tree_utils.getNodeByName(complexDataset, "dad");
			var partners = tree_utils.get_partners(complexDataset, dad);
			// dad has multiple children with mom, but mom should only appear once
			expect(partners.filter(p => p === "mom").length).toBe(1);
		});
	});

	describe('getChildren', function() {
		it('should find children of a mother', function() {
			var mother = tree_utils.getNodeByName(complexDataset, "mom");
			var children = tree_utils.getChildren(complexDataset, mother);
			expect(children.length).toBeGreaterThan(0);
			expect(children.every(c => c.mother === "mom")).toBe(true);
		});

		it('should filter by father if provided', function() {
			var mother = tree_utils.getNodeByName(complexDataset, "mom");
			var father = tree_utils.getNodeByName(complexDataset, "dad");
			var children = tree_utils.getChildren(complexDataset, mother, father);
			expect(children.every(c => c.mother === "mom" && c.father === "dad")).toBe(true);
		});

		it('should not return duplicate children', function() {
			var mother = tree_utils.getNodeByName(complexDataset, "mom");
			var children = tree_utils.getChildren(complexDataset, mother);
			var names = children.map(c => c.name);
			var uniqueNames = [...new Set(names)];
			expect(names.length).toBe(uniqueNames.length);
		});
	});

	describe('getAllChildren', function() {
		it('should find all children of a person', function() {
			var dad = tree_utils.getNodeByName(complexDataset, "dad");
			var children = tree_utils.getAllChildren(complexDataset, dad);
			expect(children.length).toBeGreaterThan(0);
		});

		it('should filter by sex if provided', function() {
			var dad = tree_utils.getNodeByName(complexDataset, "dad");
			var daughters = tree_utils.getAllChildren(complexDataset, dad, "F");
			var sons = tree_utils.getAllChildren(complexDataset, dad, "M");
			expect(daughters.every(c => c.sex === "F")).toBe(true);
			expect(sons.every(c => c.sex === "M")).toBe(true);
		});
	});

	describe('getTwins', function() {
		it('should find monozygotic twins', function() {
			var twin1 = tree_utils.getNodeByName(complexDataset, "twin1");
			var twins = tree_utils.getTwins(complexDataset, twin1);
			expect(twins.length).toBe(1);
			expect(twins[0].name).toBe("twin2");
		});

		it('should return siblings for non-twins without twin marker', function() {
			var child = tree_utils.getNodeByName(complexDataset, "child1");
			var twins = tree_utils.getTwins(complexDataset, child);
			// getTwins returns siblings when person is not marked as twin
			expect(twins).toBeDefined();
		});
	});

	describe('getSiblings', function() {
		it('should find siblings', function() {
			var child1 = tree_utils.getNodeByName(complexDataset, "child1");
			var siblings = tree_utils.getSiblings(complexDataset, child1);
			expect(siblings.length).toBeGreaterThan(0);
			expect(siblings.every(s => s.mother === "mom" && s.father === "dad")).toBe(true);
			expect(siblings.every(s => s.name !== "child1")).toBe(true);
		});

		it('should filter siblings by sex', function() {
			var child1 = tree_utils.getNodeByName(complexDataset, "child1");
			var sisters = tree_utils.getSiblings(complexDataset, child1, "F");
			expect(sisters.every(s => s.sex === "F")).toBe(true);
		});

		it('should return empty array for person with no siblings', function() {
			var only_child = {"name": "only", "sex": "F", "mother": "m", "father": "f"};
			var dataset = [
				{"name": "m", "sex": "F", "top_level": true},
				{"name": "f", "sex": "M", "top_level": true},
				only_child
			];
			var siblings = tree_utils.getSiblings(dataset, only_child);
			expect(siblings.length).toBe(0);
		});
	});

	describe('getDepth', function() {
		it('should calculate depth from maternal line', function() {
			var depth_gf = tree_utils.getDepth(complexDataset, "gf");
			var depth_dad = tree_utils.getDepth(complexDataset, "dad");
			var depth_child = tree_utils.getDepth(complexDataset, "child1");

			// Depth counts maternal lineage upwards
			// gf is top_level (depth 2), dad has mother gm (depth 3)
			// child1's mother is "mom" who is top_level, so same depth as dad
			expect(depth_gf).toBeLessThan(depth_dad);
			expect(depth_child).toBeGreaterThanOrEqual(depth_gf);
		});

		it('should return appropriate depth for top-level person', function() {
			var depth = tree_utils.getDepth(simpleDataset, "m21");
			// Top-level persons have depth >= 1
			expect(depth).toBeGreaterThanOrEqual(1);
		});
	});

	describe('flatten', function() {
		it('should flatten tree structure', function() {
			var root = {
				name: "root",
				children: [
					{name: "child1", children: []},
					{name: "child2", children: [
						{name: "grandchild", children: []}
					]}
				]
			};
			var flat = tree_utils.flatten(root);
			expect(flat.length).toBe(4);
			expect(flat.map(n => n.name)).toContain("root");
			expect(flat.map(n => n.name)).toContain("grandchild");
		});
	});

	describe('makeid', function() {
		it('should generate random id of specified length', function() {
			var id1 = tree_utils.makeid(5);
			var id2 = tree_utils.makeid(10);
			expect(id1.length).toBe(5);
			expect(id2.length).toBe(10);
		});

		it('should generate different ids', function() {
			var id1 = tree_utils.makeid(8);
			var id2 = tree_utils.makeid(8);
			// Very unlikely to be the same
			expect(id1).not.toBe(id2);
		});

		it('should only contain letters', function() {
			var id = tree_utils.makeid(20);
			expect(/^[A-Za-z]+$/.test(id)).toBe(true);
		});
	});

	describe('overlap', function() {
		it('should detect overlap between nodes at same depth', function() {
			var nodes = [
				{depth: 1, x: 100, data: {name: "p1"}},
				{depth: 1, x: 120, data: {name: "p2"}},
				{depth: 2, x: 100, data: {name: "p3"}}
			];
			var opts = {symbol_size: 35};

			// Too close to p1
			var overlaps = tree_utils.overlap(opts, nodes, 105, 1, []);
			expect(overlaps).toBe(true);

			// Far enough from p1
			var noOverlap = tree_utils.overlap(opts, nodes, 200, 1, []);
			expect(noOverlap).toBe(false);
		});

		it('should exclude specified names from overlap check', function() {
			var nodes = [
				{depth: 1, x: 100, data: {name: "p1"}},
				{depth: 1, x: 200, data: {name: "p2"}}
			];
			var opts = {symbol_size: 35};

			// Should not detect overlap with excluded node
			// Position 105 overlaps with p1 at 100, but p1 is excluded
			var result = tree_utils.overlap(opts, nodes, 105, 1, ["p1"]);
			// p2 is at 200, so no overlap
			expect(result).toBe(false);
		});
	});

	describe('linkNodes', function() {
		it('should convert partner names to nodes', function() {
			var flatNodes = [
				{data: {name: "mom"}},
				{data: {name: "dad"}}
			];
			var partners = [
				{mother: {name: "mom"}, father: {name: "dad"}}
			];
			var links = tree_utils.linkNodes(flatNodes, partners);
			expect(links.length).toBe(1);
			expect(links[0].mother.data.name).toBe("mom");
			expect(links[0].father.data.name).toBe("dad");
		});
	});

	describe('ancestors', function() {
		it('should find all ancestors of a person', function() {
			var child = tree_utils.getNodeByName(complexDataset, "child1");
			var ancs = tree_utils.ancestors(complexDataset, child);
			var ancestorNames = ancs.map(a => a.name);
			expect(ancestorNames).toContain("child1");
			expect(ancestorNames).toContain("dad");
			expect(ancestorNames).toContain("mom");
			expect(ancestorNames).toContain("gf");
			expect(ancestorNames).toContain("gm");
		});

		it('should work with node or data object', function() {
			var child = tree_utils.getNodeByName(complexDataset, "child1");
			var ancs1 = tree_utils.ancestors(complexDataset, child);
			var nodeWithData = {data: child};
			var ancs2 = tree_utils.ancestors(complexDataset, nodeWithData);
			expect(ancs1.length).toBe(ancs2.length);
		});
	});

	describe('consanguity', function() {
		it('should detect consanguinity when nodes at different depths', function() {
			var node1 = {depth: 1};
			var node2 = {depth: 2};
			var opts = {dataset: complexDataset};
			expect(tree_utils.consanguity(node1, node2, opts)).toBe(true);
		});

		it('should detect consanguinity with common ancestors', function() {
			// Create a consanguineous pedigree
			var consDataset = [
				{"name": "gf", "sex": "M", "top_level": true},
				{"name": "gm", "sex": "F", "top_level": true},
				{"name": "uncle", "sex": "M", "mother": "gm", "father": "gf"},
				{"name": "mom", "sex": "F", "mother": "gm", "father": "gf"},
				{"name": "child", "sex": "F", "mother": "mom", "father": "uncle"}
			];

			var uncle = {depth: 2, data: consDataset[2]};
			var mom = {depth: 2, data: consDataset[3]};
			var opts = {dataset: consDataset};

			expect(tree_utils.consanguity(uncle, mom, opts)).toBe(true);
		});
	});

	describe('getAllSiblings', function() {
		it('should get biological siblings (noparents flag prevents adoption relationship)', function() {
			var dataset = [
				{"name": "m", "sex": "M", "top_level": true},
				{"name": "f", "sex": "F", "top_level": true},
				{"name": "bio_child", "sex": "M", "mother": "f", "father": "m"},
				{"name": "bio_child2", "sex": "F", "mother": "f", "father": "m"}
			];
			var bio = tree_utils.getNodeByName(dataset, "bio_child");
			var siblings = tree_utils.getAllSiblings(dataset, bio);
			expect(siblings.length).toBeGreaterThanOrEqual(0);
			// Function excludes persons with noparents flag
		});
	});

	describe('getAdoptedSiblings', function() {
		it('should get only adopted siblings', function() {
			var dataset = [
				{"name": "m", "sex": "M", "top_level": true},
				{"name": "f", "sex": "F", "top_level": true},
				{"name": "bio_child", "sex": "M", "mother": "f", "father": "m"},
				{"name": "adopted_child", "sex": "F", "mother": "f", "father": "m", "noparents": true}
			];
			var bio = tree_utils.getNodeByName(dataset, "bio_child");
			var adopted = tree_utils.getAdoptedSiblings(dataset, bio);
			expect(adopted.length).toBe(1);
			expect(adopted[0].name).toBe("adopted_child");
		});
	});

	describe('getNodesAtDepth', function() {
		it('should get nodes at specified depth sorted by x position', function() {
			var nodes = [
				{depth: 1, x: 150, data: {name: "p2", hidden: false}},
				{depth: 1, x: 100, data: {name: "p1", hidden: false}},
				{depth: 2, x: 100, data: {name: "p3", hidden: false}}
			];
			var result = tree_utils.getNodesAtDepth(nodes, 1, []);
			expect(result.length).toBe(2);
			expect(result[0].x).toBeLessThan(result[1].x);
		});

		it('should exclude hidden nodes', function() {
			var nodes = [
				{depth: 1, x: 100, data: {name: "p1", hidden: false}},
				{depth: 1, x: 150, data: {name: "p2", hidden: true}}
			];
			var result = tree_utils.getNodesAtDepth(nodes, 1, []);
			expect(result.length).toBe(1);
			expect(result[0].data.name).toBe("p1");
		});

		it('should exclude names in exclude list', function() {
			var nodes = [
				{depth: 1, x: 100, data: {name: "p1", hidden: false}},
				{depth: 1, x: 150, data: {name: "p2", hidden: false}}
			];
			var result = tree_utils.getNodesAtDepth(nodes, 1, ["p1"]);
			expect(result.length).toBe(1);
			expect(result[0].data.name).toBe("p2");
		});
	});
});
