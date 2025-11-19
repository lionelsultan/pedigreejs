/**
/* © 2023 University of Cambridge
/* SPDX-FileCopyrightText: 2023 University of Cambridge
/* SPDX-License-Identifier: GPL-3.0-or-later
**/

// Pedigree validation functions

export function create_err(err) {
	console.error(err);
	return new Error(err);
}

/**
 * Validate age and yob is consistent with current year. The sum of age and
 * yob should not be greater than or equal to current year. If alive the
 * absolute difference between the sum of age and year of birth and the
 * current year should be <= 1.
 * @param age	- age in years.
 * @param yob	- year of birth.
 * @param status - 0 = alive, 1 = dead.
 * @return true if age and yob are consistent with current year otherwise false.
 */
export function validate_age_yob(age, yob, status) {
	let year = new Date().getFullYear();
	let sum = parseInt(age) + parseInt(yob);
	// check status is an expected string
	if (status !== "1" && status !== "0")
		return false

	if(status === "1") {   // deceased
		return year >= sum;
	}
	// Phase 3.3.1: Assouplir validation pour éviter faux positifs (anniversaire non encore passé)
	return Math.abs(year - sum) <= 2 && year >= sum;
}

/**
 * Validate pedigree dataset for consistency and completeness
 * Checks for:
 * - Consistent parent sex (mothers=F, fathers=M)
 * - Unique IndivIDs (names)
 * - Required fields (name, sex)
 * - Single family (no multiple famids)
 * - Warns about unconnected individuals
 * @param {Object} opts - Options object containing dataset and validation settings
 * @param {Array} opts.dataset - Array of person objects to validate
 * @param {boolean|function} opts.validate - Validation mode: true (default validation), false (skip), or custom function
 * @param {boolean} [opts.DEBUG=false] - Enable debug logging
 * @throws {Error} If validation fails with specific error message
 * @example
 * validate_pedigree({
 *   dataset: [...],
 *   validate: true
 * });
 */
export function validate_pedigree(opts){
	// Import needed functions dynamically to avoid circular dependencies
	const getIdxByName = (arr, name) => {
		let idx = -1;
		$.each(arr, function(i, p) {
			if (name === p.name) {
				idx = i;
				return idx;
			}
		});
		return idx;
	};

	if(opts.validate) {
		if (typeof opts.validate == 'function') {
			if(opts.DEBUG)
				console.log('CALLING CONFIGURED VALIDATION FUNCTION');
			return opts.validate.call(this, opts);
		}

		// check consistency of parents sex
		let uniquenames = [];
		let famids = [];
		let display_name;
		for(let p=0; p<opts.dataset.length; p++) {
			if(!p.hidden) {
				if(opts.dataset[p].mother || opts.dataset[p].father) {
					display_name = opts.dataset[p].display_name;
					if(!display_name)
						display_name = 'unnamed';
					display_name += ' (IndivID: '+opts.dataset[p].name+')';
					let mother = opts.dataset[p].mother;
					let father = opts.dataset[p].father;
					if(!mother || !father) {
						throw create_err('Missing parent for '+display_name);
					}

					let midx = getIdxByName(opts.dataset, mother);
					let fidx = getIdxByName(opts.dataset, father);
					if(midx === -1)
						throw create_err('The mother (IndivID: '+mother+') of family member '+
										 display_name+' is missing from the pedigree.');
					if(fidx === -1)
						throw create_err('The father (IndivID: '+father+') of family member '+
										 display_name+' is missing from the pedigree.');
					if(opts.dataset[midx].sex !== "F")
						throw create_err("The mother of family member "+display_name+
								" is not specified as female. All mothers in the pedigree must have sex specified as 'F'.");
					if(opts.dataset[fidx].sex !== "M")
						throw create_err("The father of family member "+display_name+
								" is not specified as male. All fathers in the pedigree must have sex specified as 'M'.");
				}
			}


			if(!opts.dataset[p].name)
				throw create_err(display_name+' has no IndivID.');
			if($.inArray(opts.dataset[p].name, uniquenames) > -1)
				throw create_err('IndivID for family member '+display_name+' is not unique.');
			uniquenames.push(opts.dataset[p].name);

			if($.inArray(opts.dataset[p].famid, famids) === -1 && opts.dataset[p].famid) {
				famids.push(opts.dataset[p].famid);
			}
		}

		if(famids.length > 1) {
			throw create_err('More than one family found: '+famids.join(", ")+'.');
		}
		// warn if there is a break in the pedigree
		let uc = unconnected(opts.dataset);
		if(uc.length > 0)
			console.warn("individuals unconnected to pedigree ", uc);
	}
}

//combine arrays ignoring duplicates
function combineArrays(arr1, arr2) {
	for(let i=0; i<arr2.length; i++)
		if($.inArray( arr2[i], arr1 ) === -1) arr1.push(arr2[i]);
}

function include_children(connected, p, dataset) {
	// Import needed functions
	const get_partners = (dataset, anode) => {
		let ptrs = [];
		for(let i=0; i<dataset.length; i++) {
			let bnode = dataset[i];
			if(anode.name === bnode.mother && $.inArray(bnode.father, ptrs) === -1)
				ptrs.push(bnode.father);
			else if(anode.name === bnode.father && $.inArray(bnode.mother, ptrs) === -1)
				ptrs.push(bnode.mother);
		}
		return ptrs;
	};

	const getAllChildren = (dataset, person, sex) => {
		return $.map(dataset, function(p, _i){
			return !('noparents' in p) &&
				   (p.mother === person.name || p.father === person.name) &&
				   (!sex || p.sex === sex) ? p : null;
		});
	};

	if($.inArray( p.name, connected ) === -1)
		return;
	combineArrays(connected, get_partners(dataset, p));
	let children = getAllChildren(dataset, p);
	$.each(children, function( _child_idx, child ) {
		if($.inArray( child.name, connected ) === -1) {
			connected.push(child.name);
			combineArrays(connected, get_partners(dataset, child));
		}
	});
}

//return a list of individuals that aren't connected to the target
export function unconnected(dataset){
	// Import needed functions
	const getProbandIndex = (dataset) => {
		const isProband = (obj) => {
			return typeof $(obj).attr('proband') !== typeof undefined && $(obj).attr('proband') !== false;
		};
		let proband;
		$.each(dataset, function(i, val) {
			if (isProband(val)) {
				proband = i;
				return proband;
			}
		});
		return proband;
	};

	const getNodeByName = (nodes, name) => {
		for (let i = 0; i < nodes.length; i++) {
			if(nodes[i].data && name === nodes[i].data.name)
				return nodes[i];
			else if (name === nodes[i].name)
				return nodes[i];
		}
	};

	const get_partners = (dataset, anode) => {
		let ptrs = [];
		for(let i=0; i<dataset.length; i++) {
			let bnode = dataset[i];
			if(anode.name === bnode.mother && $.inArray(bnode.father, ptrs) === -1)
				ptrs.push(bnode.father);
			else if(anode.name === bnode.father && $.inArray(bnode.mother, ptrs) === -1)
				ptrs.push(bnode.mother);
		}
		return ptrs;
	};

	let target = dataset[ getProbandIndex(dataset) ];
	if(!target){
		console.warn("No target defined");
		if(dataset.length === 0) {
			throw new Error("empty pedigree data set");
		}
		target = dataset[0];
	}
	let connected = [target.name];
	let change = true;
	let ii = 0;
	while(change && ii < 200) {
		ii++;
		let nconnect = connected.length;
		$.each(dataset, function( _idx, p ) {
			if($.inArray( p.name, connected ) !== -1) {
				// check if this person or a partner has a parent
				let ptrs = get_partners(dataset, p);
				let has_parent = (p.name === target.name || !p.noparents);
				for(let i=0; i<ptrs.length; i++){
					if(!getNodeByName(dataset, ptrs[i]).noparents)
						has_parent = true;
				}

				if(has_parent){
					if(p.mother && $.inArray( p.mother, connected ) === -1)
						connected.push(p.mother);
					if(p.father && $.inArray( p.father, connected ) === -1)
						connected.push(p.father);
				}
			} else if( !p.noparents &&
					  ((p.mother && $.inArray( p.mother, connected ) !== -1) ||
					   (p.father && $.inArray( p.father, connected ) !== -1))){
				connected.push(p.name);
			}
			// include any children
			include_children(connected, p, dataset);
		});
		change = (nconnect !== connected.length);
	}
	let names = $.map(dataset, function(val, _i){return val.name;});
	return $.map(names, function(name, _i){return $.inArray(name, connected) === -1 ? name : null;});
}

/**
 * Determine if the sex of a person can be changed.
 * Sex cannot be changed if the person is already a parent (referenced as mother/father)
 * by other people in the dataset, unless the current sex is 'U' (unknown).
 *
 * Phase 3.1.5 - Unified sex change rules
 *
 * @param node - The person node to check
 * @param dataset - The full pedigree dataset
 * @return true if sex can be changed, false otherwise
 */
export function canChangeSex(node, dataset) {
	// Validation des paramètres
	if(!node || !dataset) {
		return true; // Par défaut, autoriser le changement si données manquantes
	}

	// On peut toujours changer de 'U' (unknown) vers un sexe défini
	// Car 'U' n'a pas de contraintes de cohérence mère/père
	if(node.sex === 'U') {
		return true;
	}

	// Vérifier si ce nœud est référencé comme parent (mother ou father)
	// par d'autres personnes dans le dataset
	const isReferencedAsParent = dataset.some(person => {
		// Un nœud est parent s'il est référencé comme mother ou father
		return person.mother === node.name || person.father === node.name;
	});

	// Si le nœud est déjà parent et a un sexe défini (M ou F),
	// on ne peut pas changer le sexe car cela casserait la cohérence
	// (ex: une mother doit être 'F', un father doit être 'M')
	if(isReferencedAsParent && node.sex !== 'U') {
		return false;
	}

	// Dans tous les autres cas, autoriser le changement
	return true;
}
