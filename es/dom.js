/**
/* © 2023 University of Cambridge
/* SPDX-FileCopyrightText: 2023 University of Cambridge
/* SPDX-License-Identifier: GPL-3.0-or-later
**/

// DOM manipulation and UI functions

export function isIE() {
	 let ua = navigator.userAgent;
	 /* MSIE used to detect old browsers and Trident used to newer ones*/
	 return ua.indexOf("MSIE ") > -1 || ua.indexOf("Trident/") > -1;
}

export function isEdge() {
	 return navigator.userAgent.match(/Edge/g);
}

function showDialog(title, msg, onConfirm, opts, dataset) {
	const errModalEl = document.getElementById('errModal');
	const modalTitle = errModalEl.querySelector('.modal-title');
	const modalBodyInput = errModalEl.querySelector('.modal-body');
	if(onConfirm) {
		$('#errModal button.hidden').removeClass("hidden");
		$('#errModal button:contains("OK")').on( "click", function() {
			onConfirm(opts, dataset);
			$('#errModal button:contains("OK")').off('click');
		});
	} else {
		const cancelBtn = $('#errModal button:contains("CANCEL")');
		if(!cancelBtn.hasClass("hidden")) cancelBtn.addClass("hidden");
		$('#errModal button:contains("OK")').off('click');
	}

	modalTitle.textContent = title;
	modalBodyInput.textContent = msg;
	$("#errModal").modal("show");
}

/**
 * Show message or confirmation dialog.
 * @param title	 - dialog window title
 * @param msg	   - message to diasplay
 * @param onConfirm - function to call in a confirmation dialog
 * @param opts	  - pedigreejs options
 * @param dataset	- pedigree dataset
 */
export function messages(title, msg, onConfirm, opts, dataset) {
	try {
		if(onConfirm) {
			$('<div id="msgDialog">'+msg+'</div>').dialog({
					modal: true,
					title: title,
					width: 350,
					buttons: {
						"Yes": function () {
							$(this).dialog('close');
							onConfirm(opts, dataset);
						},
						"No": function () {
							$(this).dialog('close');
						}
					}
				});
		} else {
			$('<div id="msgDialog">'+msg+'</div>').dialog({
				title: title,
				width: 350,
				buttons: [{
					text: "OK",
					click: function() { $( this ).dialog( "close" );}
				}]
			});
		}
	} catch(err) {
		showDialog(title, msg, onConfirm, opts, dataset);
	}
}

// print options and dataset
export function print_opts(opts){
	$("#pedigree_data").remove();
	$("body").append("<div id='pedigree_data'></div>" );
	let key;
	for(let i=0; i<opts.dataset.length; i++) {
		let person = "<div class='row'><strong class='col-md-1 text-right'>"+opts.dataset[i].name+"</strong><div class='col-md-11'>";
		for(key in opts.dataset[i]) {
			if(key === 'name') continue;
			if(key === 'parent')
				person += "<span>"+key + ":" + opts.dataset[i][key].name+"; </span>";
			else if (key === 'children') {
				if (opts.dataset[i][key][0] !== undefined)
					person += "<span>"+key + ":" + opts.dataset[i][key][0].name+"; </span>";
			} else
				person += "<span>"+key + ":" + opts.dataset[i][key]+"; </span>";
		}
		$("#pedigree_data").append(person + "</div></div>");

	}
	$("#pedigree_data").append("<br /><br />");
	for(key in opts) {
		if(key === 'dataset') continue;
		$("#pedigree_data").append("<span>"+key + ":" + opts[key]+"; </span>");
	}
}

export function is_fullscreen(){
	return !!(document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
}

export function get_svg_dimensions(opts) {
	return {'width' : (is_fullscreen()? window.innerWidth  : opts.width),
			'height': (is_fullscreen()? window.innerHeight : opts.height)};
}

export function get_tree_dimensions(opts) {
	// Import needed function
	const getDepth = (dataset, name) => {
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

		let idx = getIdxByName(dataset, name);
		let depth = 1;

		while(idx >= 0 && ('mother' in dataset[idx] || dataset[idx].top_level)){
			idx = getIdxByName(dataset, dataset[idx].mother);
			depth++;
		}
		return depth;
	};

	const getAllChildren = (dataset, person, sex) => {
		return $.map(dataset, function(p, _i){
			return !('noparents' in p) &&
				   (p.mother === person.name || p.father === person.name) &&
				   (!sex || p.sex === sex) ? p : null;
		});
	};

	// / get score at each depth used to adjust node separation
	let svg_dimensions = get_svg_dimensions(opts);
	let maxscore = 0;
	let generation = {};
	for(let i=0; i<opts.dataset.length; i++) {
		let depth = getDepth(opts.dataset, opts.dataset[i].name);
		let children = getAllChildren(opts.dataset, opts.dataset[i]);

		// score based on no. of children and if parent defined
		let score = 1 + (children.length > 0 ? 0.55+(children.length*0.25) : 0) + (opts.dataset[i].father ? 0.25 : 0);
		if(depth in generation)
			generation[depth] += score;
		else
			generation[depth] = score;

		if(generation[depth] > maxscore)
			maxscore = generation[depth];
	}

	let max_depth = Object.keys(generation).length*opts.symbol_size*3.5;
	let tree_width =  (svg_dimensions.width - opts.symbol_size > maxscore*opts.symbol_size*1.65 ?
					   svg_dimensions.width - opts.symbol_size : maxscore*opts.symbol_size*1.65);
	let tree_height = (svg_dimensions.height - opts.symbol_size > max_depth ?
					   svg_dimensions.height - opts.symbol_size : max_depth);
	return {'width': tree_width, 'height': tree_height};
}
