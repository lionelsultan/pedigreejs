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

export function copy_dataset(dataset) {
	if(dataset[0].id) { // sort by id
		dataset.sort(function(a,b){return (!a.id || !b.id ? 0: (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0));});
	}

	let disallowed = ["id", "parent_node"];
	let newdataset = [];
	for(let i=0; i<dataset.length; i++){
		let obj = {};
		for(let key in dataset[i]) {
			if(disallowed.indexOf(key) === -1)
				obj[key] = dataset[i][key];
		}
		newdataset.push(obj);
	}
	return newdataset;
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
