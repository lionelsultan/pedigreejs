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

const disallowedKeys = ["id", "parent_node", "parent", "children", "data"];

export function copy_dataset(dataset) {
	if(!Array.isArray(dataset))
		return [];

	let newdataset = [];
	for(let i=0; i<dataset.length; i++){
		let entry = dataset[i];
		let clone = {};
		for(let key in entry) {
			if(!Object.prototype.hasOwnProperty.call(entry, key))
				continue;
			if(disallowedKeys.indexOf(key) > -1)
				continue;

			let value = entry[key];
			if(key === 'mother' || key === 'father') {
				if(value && typeof value === 'object')
					clone[key] = value.name || value.id || null;
				else
					clone[key] = value;
				continue;
			}
			if(typeof value === 'function')
				continue;
			clone[key] = deepClone(value);
		}
		newdataset.push(clone);
	}
	return newdataset;
}

function deepClone(value, seen) {
	if(value === null || typeof value !== 'object')
		return value;

	if(seen === undefined)
		seen = new WeakMap();
	if(seen.has(value))
		return seen.get(value);

	if(Array.isArray(value)) {
		let arr = [];
		seen.set(value, arr);
		for(let i=0; i<value.length; i++)
			arr[i] = deepClone(value[i], seen);
		return arr;
	}

	let cloned = {};
	seen.set(value, cloned);
	for(let key in value) {
		if(Object.prototype.hasOwnProperty.call(value, key)) {
			if(key === 'parent' || key === 'children' || key === 'data' || key === 'parent_node')
				continue;
			cloned[key] = deepClone(value[key], seen);
		}
	}
	return cloned;
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
