describe('utils.copy_dataset', function() {
	var utils = window.pedigreejs.pedigreejs_utils;

	it('preserves the original ordering of the dataset', function() {
		var dataset = [
			{name: 'second', id: 2, meta: {order: 2}},
			{name: 'first', id: 1, meta: {order: 1}},
			{name: 'third', id: 3, meta: {order: 3}}
		];

		var cloned = utils.copy_dataset(dataset);

		expect(cloned.length).toBe(3);
		expect(cloned[0].name).toBe('second');
		expect(cloned[1].name).toBe('first');
		expect(cloned[2].name).toBe('third');
	});

	it('performs a deep clone so nested objects are not shared', function() {
		var dataset = [{
			name: 'p1',
			meta: {
				conditions: [
					{code: 'BRCA1', positive: true}
				],
				notes: {text: 'baseline'}
			}
		}];

		var cloned = utils.copy_dataset(dataset);

		expect(cloned[0].meta.conditions[0]).toEqual({code: 'BRCA1', positive: true});
		expect(cloned[0].meta).not.toBe(dataset[0].meta);

		cloned[0].meta.conditions[0].positive = false;
		cloned[0].meta.notes.text = 'updated';

		expect(dataset[0].meta.conditions[0].positive).toBe(true);
		expect(dataset[0].meta.notes.text).toBe('baseline');
	});
});
