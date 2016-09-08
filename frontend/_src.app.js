
var data_file = 'data/data.json';

var vd = {
	data_error_loading : null,

	data_folders : null,
	data_locations : null,
	data_filedata : null,
	data_items : null
};

var vm = new Vue({

	el: '#app',
	data: vd,
	created: function () {
		this.getDataFile();
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
							self.data_folders = res.folders;
							self.data_locations = res.locations;
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
