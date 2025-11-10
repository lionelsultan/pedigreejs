/**
/* © 2023 University of Cambridge
/* SPDX-FileCopyrightText: 2023 University of Cambridge
/* SPDX-License-Identifier: GPL-3.0-or-later
**/

// Tree navigation, construction, and geometry functions
import * as pedcache from './pedcache.js';

// given an array of people get an index for a given person
export function getIdxByName(arr, name) {
	let idx = -1;
	$.each(arr, function(i, p) {
		if (name === p.name) {
			idx = i;
			return idx;
		}
	});
	return idx;
}

// given a persons name return the corresponding d3 tree node
export function getNodeByName(nodes, name) {
	for (let i = 0; i < nodes.length; i++) {
		if(nodes[i].data && name === nodes[i].data.name)
			return nodes[i];
		else if (name === nodes[i].name)
			return nodes[i];
	}
	if(nodes && nodes.dataset) {
		for(let j=0; j<nodes.dataset.length; j++) {
			if(name === nodes.dataset[j].name)
				return {data: nodes.dataset[j]};
		}
	}
}

export function isProband(obj) {
	return typeof $(obj).attr('proband') !== typeof undefined && $(obj).attr('proband') !== false;
}

export function setProband(dataset, name, is_proband) {
	$.each(dataset, function(_i, p) {
		if (name === p.name)
			p.proband = is_proband;
		else
			delete p.proband;
	});
}

export function getProbandIndex(dataset) {
	let proband;
	$.each(dataset, function(i, val) {
		if (isProband(val)) {
			proband = i;
			return proband;
		}
	});
	return proband;
}

// check by name if the individual exists
export function exists(opts, name){
	return getNodeByName(pedcache.current(opts), name) !== undefined;
}

//get the partners for a given node
export function get_partners(dataset, anode) {
	let ptrs = [];
	for(let i=0; i<dataset.length; i++) {
		let bnode = dataset[i];
		if(anode.name === bnode.mother && $.inArray(bnode.father, ptrs) === -1)
			ptrs.push(bnode.father);
		else if(anode.name === bnode.father && $.inArray(bnode.mother, ptrs) === -1)
			ptrs.push(bnode.mother);
	}
	return ptrs;
}

export function getChildren(dataset, mother, father) {
	let children = [];
	let names = [];
	if(mother.sex === 'F')
		$.each(dataset, function(_i, p) {
			if(mother.name === p.mother)
				if(!father || father.name === p.father) {
					if($.inArray(p.name, names) === -1 && !p.noparents){
						children.push(p);
						names.push(p.name);
					}
				}
		});
	return children;
}

export function getAllChildren(dataset, person, sex) {
	return $.map(dataset, function(p, _i){
		return !('noparents' in p) &&
			   (p.mother === person.name || p.father === person.name) &&
			   (!sex || p.sex === sex) ? p : null;
	});
}

// get the mono/di-zygotic twin(s)
export function getTwins(dataset, person) {
	let sibs = getSiblings(dataset, person);
	let twin_type = (person.mztwin ? "mztwin" : "dztwin");
	return $.map(sibs, function(p, _i){
		return p.name !== person.name && p[twin_type] === person[twin_type] ? p : null;
	});
}

// get the siblings - sex is an optional parameter
// for only returning brothers or sisters
export function getSiblings(dataset, person, sex) {
	if(person === undefined || !person.mother || person.noparents)
		return [];

	return $.map(dataset, function(p, _i){
		return  p.name !== person.name && !('noparents' in p) && p.mother &&
			   (p.mother === person.mother && p.father === person.father) &&
			   (!sex || p.sex === sex) ? p : null;
	});
}

// get the siblings + adopted siblings - sex is an optional parameter
// for only returning brothers or sisters
export function getAllSiblings(dataset, person, sex) {
	return $.map(dataset, function(p, _i){
		return  p.name !== person.name && !('noparents' in p) && p.mother &&
			   (p.mother === person.mother && p.father === person.father) &&
			   (!sex || p.sex === sex) ? p : null;
	});
}

// get the adopted siblings of a given individual
export function getAdoptedSiblings(dataset, person) {
	return $.map(dataset, function(p, _i){
		return  p.name !== person.name && 'noparents' in p &&
			   (p.mother === person.mother && p.father === person.father) ? p : null;
	});
}

// get the depth of the given person from the root
export function getDepth(dataset, name) {
	let idx = getIdxByName(dataset, name);
	let depth = 1;

	while(idx >= 0 && ('mother' in dataset[idx] || dataset[idx].top_level)){
		idx = getIdxByName(dataset, dataset[idx].mother);
		depth++;
	}
	return depth;
}

// get the nodes at a given depth sorted by their x position
export function getNodesAtDepth(fnodes, depth, exclude_names) {
	return $.map(fnodes, function(p, _i){
		return p.depth === depth && !p.data.hidden && $.inArray(p.data.name, exclude_names) === -1 ? p : null;
	}).sort(function (a,b) {return a.x - b.x;});
}

// convert the partner names into corresponding tree nodes
export function linkNodes(flattenNodes, partners) {
	let links = [];
	for(let i=0; i< partners.length; i++) {
		let motherName = partners[i].mother?.data?.name || partners[i].mother?.name;
		let fatherName = partners[i].father?.data?.name || partners[i].father?.name;
		if(!motherName || !fatherName)
			continue;
		let motherNode = getNodeByName(flattenNodes, motherName);
		let fatherNode = getNodeByName(flattenNodes, fatherName);
		if(motherNode && fatherNode)
			links.push({'mother': motherNode, 'father': fatherNode});
	}
	return links;
}

// get ancestors of a node
export function ancestors(dataset, node) {
	let ancestors = [];
	function recurse(node) {
		if(node.data) node = node.data;
		if('mother' in node && 'father' in node && !('noparents' in node)){
			recurse(getNodeByName(dataset, node.mother));
			recurse(getNodeByName(dataset, node.father));
		}
		ancestors.push(node);
	}
	recurse(node);
	return ancestors;
}

// test if two nodes are consanguinous partners
export function consanguity(node1, node2, opts) {
	if(node1.depth !== node2.depth) // parents at different depths
		return true;
	let ancestors1 = ancestors(opts.dataset, node1);
	let ancestors2 = ancestors(opts.dataset, node2);
	let names1 = $.map(ancestors1, function(ancestor, _i){return ancestor.name;});
	let names2 = $.map(ancestors2, function(ancestor, _i){return ancestor.name;});
	let consanguity = false;
	$.each(names1, function( _index, name ) {
		if($.inArray(name, names2) !== -1){
			consanguity = true;
			return false;
		}
	});
	return consanguity;
}

// return a flattened representation of the tree
export function flatten(root) {
	let flat = [];
	function recurse(node) {
		if(node.children)
			node.children.forEach(recurse);
		flat.push(node);
	}
	recurse(root);
	if(root && root._dataset)
		flat.dataset = root._dataset;
	return flat;
}

// test if x position overlaps a node at the same depth
export function overlap(opts, nodes, xnew, depth, exclude_names) {
	for(let n=0; n<nodes.length; n++) {
		if(depth === nodes[n].depth && $.inArray(nodes[n].data.name, exclude_names) === -1){
			if(Math.abs(xnew - nodes[n].x) < (opts.symbol_size*1.15))
				return true;
		}
	}
	return false;
}

// test if moving siblings by diff overlaps with other nodes
function nodesOverlap(opts, node, diff, root) {
	let descendants = node.descendants();
	let descendantsNames = $.map(descendants, function(descendant, _i){return descendant.data.name;});
	let nodes = root.descendants();
	for(let i=0; i<descendants.length; i++){
		let descendant = descendants[i];
		if(node.data.name !== descendant.data.name){
			let xnew = descendant.x - diff;
			if(overlap(opts, nodes, xnew, descendant.depth, descendantsNames))
				return true;
		}
	}
	return false;
}

// Adjust D3 layout positioning.
// Position hidden parent node centring them between father and mother nodes. Remove kinks
// from links - e.g. where there is a single child plus a hidden child
export function adjust_coords(opts, root, flattenNodes) {
	function recurse(node) {
		if (node.children) {
			node.children.forEach(recurse);

			if(node.data.father !== undefined && node.data.mother !== undefined) { 	// hidden nodes
				let fatherName = (typeof node.data.father === 'string' ? node.data.father : node.data.father.name);
				let motherName = (typeof node.data.mother === 'string' ? node.data.mother : node.data.mother.name);
				if(!fatherName || !motherName)
					return;
				let father = getNodeByName(flattenNodes, fatherName);
				let mother = getNodeByName(flattenNodes, motherName);
				if(!father || !mother)
					return;
				let xmid = (father.x + mother.x) /2;
				if(!overlap(opts, root.descendants(), xmid, node.depth, [node.data.name])) {
					node.x = xmid;   // centralise parent nodes
					let diff = node.x - xmid;
					if(node.children.length === 2 && (node.children[0].data.hidden || node.children[1].data.hidden)) {
						if(!(node.children[0].data.hidden && node.children[1].data.hidden)) {
							let child1 = (node.children[0].data.hidden ? node.children[1] : node.children[0]);
							let child2 = (node.children[0].data.hidden ? node.children[0] : node.children[1]);
							if( ((child1.x < child2.x && xmid < child2.x) || (child1.x > child2.x && xmid > child2.x)) &&
								!overlap(opts, root.descendants(), xmid, child1.depth, [child1.data.name])){
								child1.x = xmid;
							}
						}
					} else if(node.children.length === 1 && !node.children[0].data.hidden) {
						if(!overlap(opts, root.descendants(), xmid, node.children[0].depth, [node.children[0].data.name]))
							node.children[0].x = xmid;
					} else {
						if(diff !== 0 && !nodesOverlap(opts, node, diff, root)){
							if(node.children.length === 1) {
								node.children[0].x = xmid;
							} else {
								let descendants = node.descendants();
								if(opts.DEBUG)
									console.log('ADJUSTING '+node.data.name+' NO. DESCENDANTS '+descendants.length+' diff='+diff);
								for(let i=0; i<descendants.length; i++) {
									if(node.data.name !== descendants[i].data.name)
										descendants[i].x -= diff;
								}
							}
						}
					}
				} else if((node.x < father.x && node.x < mother.x) || (node.x > father.x && node.x > mother.x)){
						node.x = xmid;   // centralise parent nodes if it doesn't lie between mother and father
				}
			}
		}
	}
	recurse(root);
	recurse(root);
}

function contains_parent(arr, m, f) {
	for(let i=0; i<arr.length; i++)
		if(arr[i].mother === m && arr[i].father === f)
			return true;
	return false;
}

// get grandparents index
function get_grandparents_idx(dataset, midx, fidx) {
	let gmidx = midx;
	let gfidx = fidx;
	while(  'mother' in dataset[gmidx] && 'mother' in dataset[gfidx] &&
		  !('noparents' in dataset[gmidx]) && !('noparents' in dataset[gfidx])){
		gmidx = getIdxByName(dataset, dataset[gmidx].mother);
		gfidx = getIdxByName(dataset, dataset[gfidx].mother);
	}
	return {'midx': gmidx, 'fidx': gfidx};
}

// update parent node and sort twins
function updateParent(p, parent, id, nodes, opts) {
	// add to parent node
	if('parent_node' in p)
		p.parent_node.push(parent);
	else
		p.parent_node = [parent];

	// check twins lie next to each other
	if(p.mztwin || p.dztwins) {
		let twins = getTwins(opts.dataset, p);
		for(let i=0; i<twins.length; i++) {
			let twin = getNodeByName(nodes, twins[i].name);
			if(twin)
				twin.id = id++;
		}
	}
	return id;
}

function setChildrenId(children, id) {
	// sort twins to lie next to each other
	children.sort(function(a, b) {
		if(a.mztwin && b.mztwin && a.mztwin === b.mztwin)
			return 0;
		else if(a.dztwin && b.dztwin && a.dztwin === b.dztwin)
			return 0;
		else if(a.mztwin || b.mztwin || a.dztwin || b.dztwin)
			return 1;
		return 0;
	});

	$.each(children, function(_i, p) {
		if(p.id === undefined) p.id = id++;
	});
	return id;
}

export function makeid(len) {
	let text = "";
	let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
	for( let i=0; i < len; i++ )
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	return text;
}

export function buildTree(opts, person, root, partnerLinks, id) {
	if (typeof person.children === typeof undefined)
		person.children = getChildren(opts.dataset, person);

	if (typeof partnerLinks === typeof undefined) {
		partnerLinks = [];
		id = 1;
	}

	let nodes = flatten(root);
	//console.log('NAME='+person.name+' NO. CHILDREN='+person.children.length);
	let partners = [];
	$.each(person.children, function(_i, child) {
		$.each(opts.dataset, function(_j, p) {
			if (((child.name === p.mother) || (child.name === p.father)) && child.id === undefined) {
				let m = getNodeByName(nodes, p.mother);
				let f = getNodeByName(nodes, p.father);
				m = (m !== undefined? m : getNodeByName(opts.dataset, p.mother));
				f = (f !== undefined? f : getNodeByName(opts.dataset, p.father));
				if(!contains_parent(partners, m, f))
					partners.push({'mother': m, 'father': f});
			}
		});
	});
	$.merge(partnerLinks, partners);

	$.each(partners, function(_i, ptr) {
		let mother = ptr.mother;
		let father = ptr.father;
		mother.children = [];
		let parent = {
				name : makeid(4),
				hidden : true,
				parent : null,
				father : father,
				mother : mother,
				children : getChildren(opts.dataset, mother, father)
		};

		let midx = getIdxByName(opts.dataset, mother.name);
		let fidx = getIdxByName(opts.dataset, father.name);
		if(!('id' in father) && !('id' in mother))
			id = setChildrenId(person.children, id);

		// look at grandparents index
		let gp = get_grandparents_idx(opts.dataset, midx, fidx);
		if(gp.fidx < gp.midx) {
			father.id = id++;
			parent.id = id++;
			mother.id = id++;
		} else {
			mother.id = id++;
			parent.id = id++;
			father.id = id++;
		}
		id = updateParent(mother, parent, id, nodes, opts);
		id = updateParent(father, parent, id, nodes, opts);
		person.children.push(parent);
	});
	id = setChildrenId(person.children, id);

	$.each(person.children, function(_i, p) {
		id = buildTree(opts, p, root, partnerLinks, id)[1];
	});
	return [partnerLinks, id];
}
