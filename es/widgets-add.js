/**
/* © 2023 University of Cambridge
/* SPDX-FileCopyrightText: 2023 University of Cambridge
/* SPDX-License-Identifier: GPL-3.0-or-later
**/

// Helpers for adding relatives (children, siblings, parents, partners)
import * as utils from './utils.js';
import {getUniqueTwinID, setMzTwin} from './twins.js';

function determineParentRoles(personA, personB) {
	let motherName, fatherName;
	if(personA.sex === 'F') motherName = personA.name;
	if(personA.sex === 'M') fatherName = personA.name;
	if(!motherName && personB.sex === 'F') motherName = personB.name;
	if(!fatherName && personB.sex === 'M') fatherName = personB.name;
	if(!motherName) motherName = personA.name;
	if(!fatherName) fatherName = personB.name === motherName ? personA.name : personB.name;
	return {mother: motherName, father: fatherName};
}

function createPartnerPlaceholderChild(person, partner) {
	let roles = determineParentRoles(person, partner);
	return {
		name: utils.makeid(4),
		sex: 'U',
		mother: roles.mother,
		father: roles.father
	};
}

function removePlaceholderChildren(dataset, motherName, fatherName) {
	for(let i = dataset.length - 1; i >= 0; i--) {
		let child = dataset[i];
		if(child.partner_placeholder &&
		   child.mother === motherName &&
		   child.father === fatherName) {
			dataset.splice(i, 1);
		}
	}
}

function getTreeNode(flat_tree, dataset, name) {
	if(!name)
		return undefined;
	let node = flat_tree && flat_tree.length ? utils.getNodeByName(flat_tree, name) : undefined;
	if(node)
		return node;
	let dataNode = utils.getNodeByName(dataset, name);
	if(!dataNode)
		return undefined;
	if(dataNode.id === undefined)
		dataNode.id = utils.getIdxByName(dataset, name);
	return {
		data: dataNode,
		depth: utils.getDepth(dataset, name)
	};
}

export function addchild(dataset, node, sex, nchild, twin_type) {
	if(twin_type && $.inArray(twin_type, [ "mztwin", "dztwin" ] ) === -1)
		return new Error("INVALID TWIN TYPE SET: "+twin_type);

	if (typeof nchild === typeof undefined)
		nchild = 1;
	let children = utils.getAllChildren(dataset, node);
	let ptr_name, idx;
	if (children.length === 0) {
		let partner = addsibling(dataset, node, node.sex === 'F' ? 'M': 'F', node.sex === 'F');
		partner.noparents = true;
		ptr_name = partner.name;
		idx = utils.getIdxByName(dataset, node.name)+1;
	} else {
		let c = children[0];
		ptr_name = (c.father === node.name ? c.mother : c.father);
		idx = utils.getIdxByName(dataset, c.name);
	}

	let twin_id;
	if(twin_type)
		twin_id = getUniqueTwinID(dataset, twin_type);
	let newchildren = [];
	for (let i = 0; i < nchild; i++) {
		let child = {"name": utils.makeid(4), "sex": sex,
					 "mother": (node.sex === 'F' ? node.name : ptr_name),
					 "father": (node.sex === 'F' ? ptr_name : node.name)};
		dataset.splice(idx, 0, child);

		if(twin_type)
			child[twin_type] = twin_id;
		newchildren.push(child);
		removePlaceholderChildren(dataset, child.mother, child.father);
	}
	return newchildren;
}

export function addsibling(dataset, node, sex, add_lhs, twin_type, skip_parent_copy = false) {
	if(twin_type && $.inArray(twin_type, [ "mztwin", "dztwin" ] ) === -1)
		return new Error("INVALID TWIN TYPE SET: "+twin_type);

	let newbie = {"name": utils.makeid(4), "sex": sex};
	if(node.top_level) {
		newbie.top_level = true;
	} else if (!skip_parent_copy) {
		newbie.mother = node.mother;
		newbie.father = node.father;
	}
	let idx = utils.getIdxByName(dataset, node.name);

	if(twin_type) {
		setMzTwin(dataset, dataset[idx], newbie, twin_type);
	}

	if(add_lhs) {
		if(idx > 0) idx--;
	} else
		idx++;
	dataset.splice(idx, 0, newbie);
	return newbie;
}

export function addparents(opts, dataset, name) {
	let mother, father;
	let root = utils.roots[opts.targetDiv];
	let flat_tree = root ? utils.flatten(root) : [];
	let tree_node = getTreeNode(flat_tree, dataset, name);
	if(!tree_node)
		throw utils.create_err('Person '+name+' not found when adding parents');
	let node  = tree_node.data;
	let depth = tree_node.depth || utils.getDepth(dataset, node.name);

	let pid = -101;
	let ptr_name;
	let children = utils.getAllChildren(dataset, node);
	if(children.length > 0){
		ptr_name = children[0].mother === node.name ? children[0].father : children[0].mother;
		let ptr_node_meta = getTreeNode(flat_tree, dataset, ptr_name);
		pid = ptr_node_meta && ptr_node_meta.data.id !== undefined ? ptr_node_meta.data.id : utils.getIdxByName(dataset, ptr_name);
	}

	let i;
	if(depth === 1) {
		mother = {"name": utils.makeid(4), "sex": "F", "top_level": true};
		father = {"name": utils.makeid(4), "sex": "M", "top_level": true};
		dataset.splice(0, 0, mother);
		dataset.splice(0, 0, father);

		for(i=0; i<dataset.length; i++){
			if( (dataset[i].top_level || utils.getDepth(dataset, dataset[i].name) === 2) &&
			     dataset[i].name !== mother.name && dataset[i].name !== father.name){
				delete dataset[i].top_level;
				dataset[i].noparents = true;
				dataset[i].mother = mother.name;
				dataset[i].father = father.name;
			}
		}
	} else {
		let motherName = typeof tree_node.data.mother === 'string' ? tree_node.data.mother : tree_node.data.mother;
		motherName = motherName && motherName.name ? motherName.name : motherName;
		let fatherName = typeof tree_node.data.father === 'string' ? tree_node.data.father : tree_node.data.father;
		fatherName = fatherName && fatherName.name ? fatherName.name : fatherName;
		let node_mother = getTreeNode(flat_tree, dataset, motherName);
		let node_father = getTreeNode(flat_tree, dataset, fatherName);
		let node_sibs = utils.getAllSiblings(dataset, node);

		let rid = 10000;
		let lid = tree_node.data.id;
		for(i=0; i<node_sibs.length; i++){
			let sibNode = getTreeNode(flat_tree, dataset, node_sibs[i].name);
			let sid = (sibNode && sibNode.data.id !== undefined) ? sibNode.data.id : utils.getIdxByName(dataset, node_sibs[i].name);
			if(sid < rid && sid > tree_node.data.id)
				rid = sid;
			if(sid < lid)
				lid = sid;
		}
		let add_lhs = (lid >= tree_node.data.id || (pid === lid && rid < 10000));
		if(opts.DEBUG)
			console.log('lid='+lid+' rid='+rid+' nid='+tree_node.data.id+' ADD_LHS='+add_lhs);
		let midx;
		if( (!add_lhs && node_father.data.id > node_mother.data.id) ||
			(add_lhs && node_father.data.id < node_mother.data.id) )
			midx = utils.getIdxByName(dataset, node.father);
		else
			midx = utils.getIdxByName(dataset, node.mother);

		let parent = dataset[midx];
		father = addsibling(dataset, parent, 'M', add_lhs);
		mother = addsibling(dataset, parent, 'F', add_lhs);

		let faidx = utils.getIdxByName(dataset, father.name);
		let moidx = utils.getIdxByName(dataset, mother.name);
		if(faidx > moidx) {
			let tmpfa = dataset[faidx];
			dataset[faidx] = dataset[moidx];
			dataset[moidx] = tmpfa;
		}

		let orphans = utils.getAdoptedSiblings(dataset, node);
		let nid = tree_node.data.id;
		for(i=0; i<orphans.length; i++){
			let orphan_meta = getTreeNode(flat_tree, dataset, orphans[i].name);
			let oid = orphan_meta && orphan_meta.data.id !== undefined ? orphan_meta.data.id : utils.getIdxByName(dataset, orphans[i].name);
			if(opts.DEBUG)
				console.log('ORPHAN='+i+' '+orphans[i].name+' '+(nid < oid && oid < rid)+' nid='+nid+' oid='+oid+' rid='+rid);
			if((add_lhs || nid < oid) && oid < rid){
				let oidx = utils.getIdxByName(dataset, orphans[i].name);
				dataset[oidx].mother = mother.name;
				dataset[oidx].father = father.name;
			}
		}
	}

	if(depth === 2) {
		mother.top_level = true;
		father.top_level = true;
	}
	let idx = utils.getIdxByName(dataset, node.name);
	dataset[idx].mother = mother.name;
	dataset[idx].father = father.name;
	delete dataset[idx].noparents;

	if('parent_node' in node) {
		let ptr_node = dataset[utils.getIdxByName(dataset, ptr_name)];
		if('noparents' in ptr_node) {
			ptr_node.mother = mother.name;
			ptr_node.father = father.name;
		}
	}
}

/**
 * Add a partner to a person in the pedigree
 *
 * @param {Object} opts - Pedigree options
 * @param {Array} dataset - Pedigree dataset
 * @param {string} name - Name of person to add partner to
 * @param {Object} config - Optional configuration
 * @param {string} config.partner_sex - Sex of partner ('M', 'F', 'U'). Auto-detected if not provided.
 * @param {boolean} config.create_child - Whether to create a child (default: true for D3 layout)
 * @param {string} config.child_sex - Sex of child if created ('M', 'F', 'U'). Default: 'U'.
 * @returns {Object} Created partner object
 *
 * BUGFIXES (2025-11-19):
 * - FIX 1: Correct child index calculation (was incorrect for females)
 * - FIX 2: Allow child gender selection (was always 'M')
 * - FIX 3: Make child creation optional via config
 * - FIX 4: Add validation for opposite sex (warn if same sex)
 * - FIX 5: Unified positioning logic (females left, males right)
 */
export function addpartner(opts, dataset, name, config) {
	// Default configuration
	config = config || {};
	let create_child = (config.create_child !== undefined) ? config.create_child : true;
	let child_sex = config.child_sex || 'U';  // Unknown by default (was 'M')

	let root = utils.roots[opts.targetDiv];
	let flat_tree = root ? utils.flatten(root) : [];
	let tree_node = getTreeNode(flat_tree, dataset, name);
	if(!tree_node)
		throw utils.create_err('Person '+name+' not found when adding partner');

	// FIX 4: Determine partner sex with validation
	let partner_sex;
	if(config.partner_sex) {
		partner_sex = config.partner_sex;
	} else {
		// Auto-detect opposite sex
		if(tree_node.data.sex === 'M') {
			partner_sex = 'F';
		} else if(tree_node.data.sex === 'F') {
			partner_sex = 'M';
		} else {
			// If person is 'U', default to 'U' for partner (user should specify)
			partner_sex = 'U';
			if(opts.DEBUG) {
				console.warn('Person has unknown sex (U), partner also set to U. Consider specifying partner_sex explicitly.');
			}
		}
	}

	// Validation: Warn if same sex (but allow it for modern families)
	if(partner_sex === tree_node.data.sex && tree_node.data.sex !== 'U') {
		if(opts.DEBUG) {
			console.warn('Partner has same sex as person (' + partner_sex + '). This is allowed but may indicate a data error.');
		}
	}

	let partner = {"name": utils.makeid(4), "sex": partner_sex};
	let motherExists = tree_node.data.mother && utils.getIdxByName(dataset, tree_node.data.mother) !== -1;
	let fatherExists = tree_node.data.father && utils.getIdxByName(dataset, tree_node.data.father) !== -1;
	if(tree_node.data.top_level || (!tree_node.data.mother && !tree_node.data.father)) {
		partner.top_level = true;
	} else {
		// Copy existing parents so the partner is rendered at the same depth,
		// while still hiding the visual parent links via the noparents flag.
		if(motherExists)
			partner.mother = tree_node.data.mother;
		if(fatherExists)
			partner.father = tree_node.data.father;
		// If parents are missing in the dataset, fall back to top_level to keep the partner visible
		if(!partner.mother && !partner.father)
			partner.top_level = true;
	}
	partner.noparents = true;

	// FIX 5: Unified positioning logic
	// Convention: Females (mothers) on left, Males (fathers) on right
	let idx = utils.getIdxByName(dataset, tree_node.data.name);

	if(tree_node.data.sex === 'F') {
		// Person is female (mother): partner (male) goes to the right (after)
		idx++;
	} else if(tree_node.data.sex === 'M') {
		// Person is male (father): partner (female) goes to the left (before)
		if(idx > 0) idx--;
	} else {
		// Person is unknown: default to after
		idx++;
	}

	dataset.splice(idx, 0, partner);

	// FIX 2 & FIX 3: Optional child creation with configurable sex
	if(create_child) {
		let child = createPartnerPlaceholderChild(tree_node.data, partner);
		child.sex = child_sex;

		// FIX 1: Correct index calculation - after BOTH parents
		let partner_idx = utils.getIdxByName(dataset, partner.name);
		let person_idx = utils.getIdxByName(dataset, tree_node.data.name);
		let child_idx = Math.max(partner_idx, person_idx) + 1;
		dataset.splice(child_idx, 0, child);
	}

	return partner;
}
