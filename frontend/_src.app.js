
var data_file = 'data/data.json';

var vd = {
	data_error_loading : null,
	data_json : null,
	data_filedata : null,
	data_items : null,
	data_items_parsed : null,

	data_filedata_prev : null,
	data_items_prev : null,
	data_items_parsed_prev : null,

	current_location : null,
	has_index : null
};

var vm = new Vue({

	el: '#app',
	data: vd,
	created: function () {
		this.getDataFile();
    },

	filters: {

		rank_num : function(n) {
			var out = n + 1;
				out = ( out < 10 ) ? '0' + out : out;
			return '#' + out + '';
		},

		nice_url : function(u) {
			var url = u.replace('https://', '');
				url = url.replace('http://', '');
				url = url.replace('www.', '');
				url = ( url[url.length-1] == '/' ) ? url.substring(0, url.length-1) : url;
				url = ( url.length > 35 ) ? url.substring(0, 32) + '...' : url;
			return url;
		},

		ucwords : function(str) {
			// http://locutus.io/php/strings/ucwords/
			return (str + '').replace(/^([a-z\u00E0-\u00FC])|\s+([a-z\u00E0-\u00FC])/g, function ($1) {
				return $1.toUpperCase();
			});
		},

		extensionless : function(s) {
			return s.substring(0, s.lastIndexOf('.'));
		},

		lang_percent : function(n, t) {
			// return (n * 100 / t).toFixed(2) ;
			return Math.round(n * 100 / t);
		},

		str_to_color : function(s) {
			var c = str2color(s);
			return c.hex;
		}
	},

	computed: {

		data_items_parsed_prev : function() {

			var output = [];
			for ( var i=0; i<this.data_items_prev.length; i++ ) {
				var item = this.data_items_prev[i];
					item['order'] = i;
				output.push( item );
			}
			return output;
		},

		data_items_parsed : function() {

			var has_prev = !!this.data_items_parsed_prev;
			var output = [];

			for ( var i=0; i<this.data_items.length; i++ ) {

				// Limit show to n users
				if ( i >= 50 ) { break; }

				var item = this.data_items[i];

					item['name'] = (!item['name']) ? item['login'] : item['name'];
					item['has_user_bio'] = ( !!item['bio'] || !!item['blog'] );
					item['order'] = i;

					if (has_prev) {
						item['prev'] = this.data_items_parsed_prev.filter(function(a){ return a.id == item['id'] })[0];
						// (http://stackoverflow.com/questions/7364150/find-object-by-id-in-an-array-of-javascript-objects/35398031#35398031)
					}

				output.push( item );
			}
			return output;
		},

		has_index : function() {
			return (this.current_location == '' && this.data_items.length > 1);
		}

	},

	methods: {

		getDataFile: function () {

			var h = window.location.hash.substring(1); // hash value

			var self = this
			var xhr = new XMLHttpRequest()
				xhr.overrideMimeType("application/json");
				xhr.open('GET', data_file, true);
				xhr.onreadystatechange = function() {
					if (this.readyState === 4) {
						if (this.status >= 200 && this.status < 400) {
							// Success
							var res = JSON.parse(this.responseText);
							self.data_json = res;

							if ( res.items.length > 1 && (!h || res.locations.indexOf(h) == -1 ) ) {

								self.data_items = res.top_users;
								self.data_items_prev = null;
								self.current_location = '';

							} else {

								var json_file = ( !!h && res.locations.indexOf(h) > -1 ) ? h : res.locations[0];
								self.current_location = json_file;

								var file_previous = ( res.folders.length > 1 )
									? 'data/' + res.folders[1] + '/' + json_file + '.json'
									: false;
								self.data_filedata_prev = file_previous;
								self.getItems( file_previous, 'data_items_prev' );

								var file_current = 'data/' + res.folders[0] + '/' + json_file + '.json';
								self.data_filedata = file_current;
								self.getItems( file_current, 'data_items' );

							}

							self.data_error_loading = false;

						} else {
							// Error
							self.data_error_loading = true;
						}
					}
				};

				xhr.send();
				xhr = null;
		},
		getItems: function( source, target ) {

			var self = this;
			var xhr = new XMLHttpRequest();
				xhr.overrideMimeType("application/json");
				xhr.open('GET', source, true);
				xhr.onload = function () {

					self[target] = JSON.parse(this.responseText);

				}
				xhr.send();
				xhr = null;

		},

		enroute: function() {
			var selector = document.querySelector('#location-selector');
			window.location.hash = selector.value;
			this.getDataFile();
		}

	}

});


// PHP str_replace mimic
function str_replace(find, replace, str){
	return str.replace(new RegExp("(" + find.map(function(i){return i.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&")}).join("|") + ")", "g"), function(s){ return replace[find.indexOf(s)]});
}

function str2color(str) {

	// Based on Tim Pietrusky's randomstringtocsscolor
	// https://github.com/TimPietrusky/randomstringtocsscolor

	// Make the string a bit more hex'ish
	str = str.toLowerCase();
	var find = 		['g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v'];
	var replace = 	['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];
	str = str_replace(find, replace, str);

	var value = str.split('');
	var result = '';

	for (var i = 0; i < value.length; i++) {
		var val = value[i];
		if (!/^[0-9A-F]{1}$/i.test(val)) {
			val = 0;
		}
		result += val;
	}

    if (result.length % 3) {
		result += Array((3 - result.length % 3) + 1).join("0");
    }

	// Split in 3 groups with equal size
    var regexp = new RegExp("([A-Z0-9]{"+result.length / 3+"})", "i");
    result = result.split(regexp);

    // Remove first 0 (if there is one at first postion of every group
	if (result[1].length > 2) {
		if (result[1].charAt(0) == result[3].charAt(0) == result[5].charAt(0) == 0) {
			result[1] = result[1].substr(1);
			result[3] = result[3].substr(1);
			result[5] = result[5].substr(1);
		}
    }

	// Truncate (first 2 chars stay, the rest gets deleted)
	result[1] = result[1].slice(0, 2);
	result[3] = result[3].slice(0, 2);
	result[5] = result[5].slice(0, 2);

	// Add element if color consists of just 1 char per color
	if (result[1].length == 1) {
		result[1] += result[1];
		result[3] += result[3];
		result[5] += result[5];
	}

	return {
		'hex' : '#' + result[1] + result[3] + result[5],
		'red' : parseInt(result[1], 16),
		'green' : parseInt(result[3], 16),
		'blue' : parseInt(result[5], 16)
	};
}
