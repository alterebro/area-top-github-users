
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

			return str_fnv1a_color(s);
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



function str_fnv1a_color(str) {
	// FNV-1a implementation based on:
	// https://gist.github.com/vaiorabbit/5657561
    var i, l,
        hval = 0x811c9dc5;
    for (i = 0, l = str.length; i < l; i++) {
        hval ^= str.charCodeAt(i);
        hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
    }
	// return '#' + ("00000" + (hval >>> 0).toString(16)).slice(-6);

	// ------
	// modify color
	function _num(num, add) {
		num = num + add;
		num = ( num > 255 ) ? 255 : num;
		num = ( num < 0 ) ? 0 : num;
		return ('00' + (num.toString(16))).slice(-2);
	}

	var hex = ("00000" + (hval >>> 0).toString(16)).slice(-6);
	var r = parseInt(hex.substr(0,2), 16);
	var g = parseInt(hex.substr(2,2), 16);
	var b = parseInt(hex.substr(4,2), 16);

	r = _num(r, -64);
	g = _num(g, -32);
	b = _num(b, 48);

	return '#' + r + g + b;
}
