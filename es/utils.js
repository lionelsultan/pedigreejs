/**
/* © 2023 University of Cambridge
/* SPDX-FileCopyrightText: 2023 University of Cambridge
/* SPDX-License-Identifier: GPL-3.0-or-later
**/

// General utility functions

// Re-export functions from new modules for backward compatibility
export {validate_pedigree, validate_age_yob, create_err, unconnected} from './validation.js';
export {messages, print_opts, is_fullscreen, get_svg_dimensions, get_tree_dimensions, isIE, isEdge} from './dom.js';
export {
	getIdxByName, getNodeByName, isProband, setProband, getProbandIndex, exists,
	get_partners, getChildren, getAllChildren, getTwins, getSiblings, getAllSiblings,
	getAdoptedSiblings, getDepth, getNodesAtDepth, linkNodes, ancestors, consanguity,
	flatten, overlap, adjust_coords, buildTree, makeid
} from './tree-utils.js';

// Global state (to be refactored later)
export let roots = {};

const globalScope = (function() {
	try {
		// eslint-disable-next-line no-new-func
		return Function('return this')() || {};
	} catch (err) {
		return {};
	}
})();
const globalStructuredClone = (typeof globalScope.structuredClone === 'function') ? globalScope.structuredClone : null;
const canStructuredClone = typeof globalStructuredClone === 'function';

export function deepClone(value) {
	if(value === null || value === undefined || typeof value !== 'object')
		return value;

	if(canStructuredClone) {
		try {
			return globalStructuredClone(value);
		} catch (err) {
			// Fallback to manual clone when structuredClone cannot handle the payload (e.g. functions).
		}
	}
	return cloneValue(value);
}

export function copy_dataset(dataset) {
	if(!Array.isArray(dataset) || dataset.length === 0)
		return [];

	let disallowed = new Set(["id", "parent_node"]);
	return dataset.map(function(person){
		if(!person || typeof person !== 'object')
			return {};

		let clone = {};
		for(let key in person) {
			if(!Object.prototype.hasOwnProperty.call(person, key) || disallowed.has(key))
				continue;
			clone[key] = deepClone(person[key]);
		}
		return clone;
	});
}

function cloneValue(value) {
	if(Array.isArray(value))
		return value.map(deepClone);
	if(value instanceof Date)
		return new Date(value.getTime());
	if(value && typeof value === 'object') {
		let clonedObj = {};
		for(let key in value) {
			if(Object.prototype.hasOwnProperty.call(value, key)) {
				clonedObj[key] = deepClone(value[key]);
			}
		}
		return clonedObj;
	}
	return value;
}

// check if the object contains a key with a given prefix
export function prefixInObj(prefix, obj) {
	let found = false;
	if(obj)
		$.each(obj, function(k, _n){
			if(k.indexOf(prefix+"_") === 0 || k === prefix) {
				found = true;
				return found;
			}
		});
	return found;
}

/**
 *  Get formatted time or data & time
 */
export function getFormattedDate(time){
	let d = new Date();
	if(time)
		return ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2) + ":" + ('0' + d.getSeconds()).slice(-2);
	else
		return d.getFullYear() + "-" + ('0' + (d.getMonth() + 1)).slice(-2) + "-" + ('0' + d.getDate()).slice(-2) + " " + ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2) + ":" + ('0' + d.getSeconds()).slice(-2);
 }

export function capitaliseFirstLetter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

// given the name of a url param get the value
export function urlParam(name){
	let results = new RegExp('[?&]' + name + '=([^&#]*)').exec(window.location.href);
	if (results===null)
	   return null;
	else
	   return results[1] || 0;
}
