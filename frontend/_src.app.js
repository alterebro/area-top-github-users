



var data_file = 'data/data.json';

var vd = {
	data_error_loading : null,

	data_json : null,
//	data_folders : null,
//	data_locations : null,
	data_filedata : null,
	data_items : null,
	data_items_parsed : null
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
		}

	},

	computed: {

		data_items_parsed : function() {

			var output = [];

			for ( var i=0; i<25; i++ ) {
			// for ( var i=0; i<this.data_items.length; i++ ) {

				var item = this.data_items[i];
					item['name'] = (!item['name']) ? item['login'] : item['name'];
					item['has_user_bio'] = ( !!item['bio'] || !!item['blog'] );

				output.push( item );
			}
			return output;

		}

	},

	methods: {

		getDataFile: function () {

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
							//self.data_folders = res.folders;
							//self.data_locations = res.locations;
							self.data_filedata = 'data/' + res.folders[0] + '/' + res.locations[0];
							self.getItems();
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
		getItems: function() {

			var self = this;
			var xhr = new XMLHttpRequest();
				xhr.overrideMimeType("application/json");
				xhr.open('GET', this.data_filedata, true);
				xhr.onload = function () {

					self.data_items = JSON.parse(this.responseText);

				}
				xhr.send();
				xhr = null;

		}

	}

});
