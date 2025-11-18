/**
/* © 2023 University of Cambridge
/* SPDX-FileCopyrightText: 2023 University of Cambridge
/* SPDX-License-Identifier: GPL-3.0-or-later
**/

/**
 * Mark two siblings as twins (monozygotic or dizygotic)
 * Assigns matching twin IDs and synchronizes age/yob between twins
 * @param {Array} dataset - Array of person objects
 * @param {Object} d1 - First twin person object
 * @param {Object} d2 - Second twin person object
 * @param {string} twin_type - Type of twin relationship: 'mztwin' or 'dztwin'
 * @returns {boolean} True if successful, false if no twin ID available (max 10 twin pairs)
 * @example
 * setMzTwin(dataset, person1, person2, 'mztwin');
 */
export function setMzTwin(dataset, d1, d2, twin_type) {
	if(!d1[twin_type]) {
		d1[twin_type] = getUniqueTwinID(dataset, twin_type);
		if(!d1[twin_type])
			return false;
	}
	d2[twin_type] = d1[twin_type];
	if(d1.yob)
		d2.yob = d1.yob;
	if(d1.age && (d1.status === "0" || !d1.status))
		d2.age = d1.age;
	return true;
}

/**
 * Get the next available unique twin ID
 * Twin IDs are: 1-9 and 'A', supporting up to 10 twin pairs per pedigree
 * @param {Array} dataset - Array of person objects
 * @param {string} twin_type - Type of twin: 'mztwin' or 'dztwin'
 * @returns {number|string|undefined} Next available twin ID (1-9 or 'A'), or undefined if all used
 */
export function getUniqueTwinID(dataset, twin_type) {
	let mz = [1, 2, 3, 4, 5, 6, 7, 8, 9, "A"];
	for(let i=0; i<dataset.length; i++) {
		if(dataset[i][twin_type]) {
			let idx = mz.indexOf(dataset[i][twin_type]);
			if (idx > -1)
				mz.splice(idx, 1);
		}
	}
	if(mz.length > 0)
		return mz[0];
	return undefined;
}

/**
 * Synchronize attributes between twins after changes
 * For monozygotic twins: syncs sex, yob, and age (if alive)
 * For dizygotic twins: syncs yob and age (if alive) only
 * @param {Array} dataset - Array of person objects
 * @param {Object} d1 - The twin whose attributes should be copied to their twin(s)
 */
export function syncTwins(dataset, d1) {
	if(!d1.mztwin && !d1.dztwin)
		return;
	let twin_type = (d1.mztwin ? "mztwin" : "dztwin");
	for(let i=0; i<dataset.length; i++) {
		let d2 = dataset[i];
		if(d2[twin_type] && d1[twin_type] === d2[twin_type] && d2.name !== d1.name) {
			if(twin_type === "mztwin")
			  d2.sex = d1.sex;
			if(d1.yob)
				d2.yob = d1.yob;
			if(d1.age && (d1.status === 0 || !d1.status))
				d2.age = d1.age;
		}
	}
}

/**
 * Validate twin relationships and remove orphaned twin markers
 * Removes twin IDs from individuals who don't have at least one twin partner
 * Supports multiplets (triplets, quadruplets, etc.)
 * @param {Array} dataset - Array of person objects to validate
 */
export function checkTwins(dataset) {
	let twin_types = ["mztwin", "dztwin"];
	for(let i=0; i<dataset.length; i++) {
		for(let j=0; j<twin_types.length; j++) {
			let twin_type = twin_types[j];
			if(dataset[i][twin_type]) {
				let count = 0;
				for(let j=0; j<dataset.length; j++) {
					if(dataset[j][twin_type] === dataset[i][twin_type])
						count++;
				}
				if(count < 2)
					delete dataset[i][twin_type];
			}
		}
	}
}
