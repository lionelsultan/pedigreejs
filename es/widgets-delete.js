/**
/* © 2023 University of Cambridge
/* SPDX-FileCopyrightText: 2023 University of Cambridge
/* SPDX-License-Identifier: GPL-3.0-or-later
**/

// Helpers for deleting nodes and descendants from the dataset
import * as utils from './utils.js';
import {checkTwins} from './twins.js';

function adjacent_nodes(root, node, excludes) {
	let dnodes = utils.getNodesAtDepth(utils.flatten(root), node.depth, excludes);
	let lhs_node, rhs_node;
	for(let i=0; i<dnodes.length; i++) {
		if(dnodes[i].x < node.x)
			lhs_node = dnodes[i];
		if(!rhs_node && dnodes[i].x > node.x)
			rhs_node = dnodes[i];
	}
	return [lhs_node, rhs_node];
}

export function delete_node_dataset(dataset, node, opts, onDone) {
	let root = utils.roots[opts.targetDiv];
	let fnodes = utils.flatten(root);
	let deletes = [];
	let i, j;

	if(node.id === undefined) {
		let d3node = utils.getNodeByName(fnodes, node.name);
		if(d3node !== undefined)
			node = d3node.data;
	}

	if(node.parent_node) {
		for(i=0; i<node.parent_node.length; i++){
			let parent = node.parent_node[i];
			let ps = [utils.getNodeByName(dataset, parent.mother.name),
					  utils.getNodeByName(dataset, parent.father.name)];
			for(j=0; j<ps.length; j++) {
				if(ps[j].name === node.name || ps[j].noparents !== undefined || ps[j].top_level) {
					dataset.splice(utils.getIdxByName(dataset, ps[j].name), 1);
					deletes.push(ps[j]);
				}
			}

			let children = parent.children;
			let children_names = $.map(children, function(p, _i){return p.name;});
			for(j=0; j<children.length; j++) {
				let child = utils.getNodeByName(dataset, children[j].name);
				if(child){
					child.noparents = true;
					let ptrs = utils.get_partners(dataset, child);
					let ptr;
					if(ptrs.length > 0)
						ptr = utils.getNodeByName(dataset, ptrs[0]);
					if(ptr && ptr.mother !== child.mother) {
						child.mother = ptr.mother;
						child.father = ptr.father;
					} else if(ptr) {
						let child_node  = utils.getNodeByName(fnodes, child.name);
						let adj = adjacent_nodes(root, child_node, children_names);
						child.mother = adj[0] ? adj[0].data.mother : (adj[1] ? adj[1].data.mother : null);
						child.father = adj[0] ? adj[0].data.father : (adj[1] ? adj[1].data.father : null);
					} else {
						dataset.splice(utils.getIdxByName(dataset, child.name), 1);
					}
				}
			}
		}
	} else {
		let idxToRemove = utils.getIdxByName(dataset, node.name);
		if(idxToRemove >= 0)
			dataset.splice(idxToRemove, 1);
	}

	for(i=0; i<deletes.length; i++) {
		let del = deletes[i];
		let sibs = utils.getAllSiblings(dataset, del);
		if(sibs.length < 1) {
			let data_node  = utils.getNodeByName(fnodes, del.name);
			let ancestors = [];
			if(data_node && typeof data_node.ancestors === 'function')
				ancestors = data_node.ancestors();
			else
				ancestors = utils.ancestors(dataset, del);
			for(j=0; j<ancestors.length; j++) {
				let ancestor = ancestors[j];
				let ancestorData = ancestor && ancestor.data ? ancestor.data : ancestor;
				if(opts.DEBUG)
					console.log(ancestorData);
				let motherName = ancestorData && ancestorData.mother ? (ancestorData.mother.name ? ancestorData.mother.name : ancestorData.mother) : null;
				let fatherName = ancestorData && ancestorData.father ? (ancestorData.father.name ? ancestorData.father.name : ancestorData.father) : null;
				if(motherName && fatherName) {
					if(opts.DEBUG)
						console.log('DELETE ', motherName, fatherName);
					let mIdx = utils.getIdxByName(dataset, motherName);
					let fIdx = utils.getIdxByName(dataset, fatherName);
					if(mIdx >= 0)
						dataset.splice(mIdx, 1);
					if(fIdx >= 0)
						dataset.splice(fIdx, 1);
				}
			}
		}
	}
	checkTwins(dataset);

	let uc;
	let baselineDisconnected = [];
	try	{
		let newopts = $.extend({}, opts);
		newopts.dataset = utils.copy_dataset(dataset);
		utils.validate_pedigree(newopts);
		uc = utils.unconnected(dataset);
		if(opts && opts.dataset)
			baselineDisconnected = utils.unconnected(opts.dataset);
	} catch(err) {
		utils.messages('Warning', 'Deletion of this pedigree member is disallowed.')
		throw err;
	}
	let hadDisconnectedBefore = baselineDisconnected.length > 0;
	if(uc.length > 0) {
		if(!hadDisconnectedBefore) {
			console.error("individuals unconnected to pedigree ", uc);
			let confirmCallback = onDone ? function(localOpts, localDataset){
				onDone(localOpts, localDataset);
			} : null;
			utils.messages("Warning", "Deleting this will split the pedigree. Continue?", confirmCallback, opts, dataset);
			return;
		}
	}

	if(onDone) {
		onDone(opts, dataset);
	}
	return dataset;
}
