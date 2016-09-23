var fs = require("fs");
var request = require("superagent");
var cheerio = require("cheerio");
var junk = require("junk");
var github = require('./github');

var GITHUB_ID = github.github.id;
var GITHUB_SECRET = github.github.secret;


// --------------------
// Utils --------------
function date_id() {

    function pad (num, size) {
        var s = num + '';
        while (s.length < size) { s = '0' + s; }
        return s;
    }
    function y(d) { return String( d.getFullYear() ).slice(-2); }
    function m(d) { return pad( d.getMonth() + 1, 2); }
    function d(d) { return pad( d.getDate(), 2); }

    var time = new Date();
    var output = y(time) + '' + m(time) + '' + d(time);
    return output;
}

// Remove directory which is not empty
// http://stackoverflow.com/a/32197381
var rmdir_recursive = function(path) {
	if( fs.existsSync(path) ) {
		fs.readdirSync(path).forEach(function(file,index){
			var curPath = path + "/" + file;
			if(fs.lstatSync(curPath).isDirectory()) { // recurse
				rmdir_recursive(curPath);
			} else { // delete file
				fs.unlinkSync(curPath);
			}
		});
		fs.rmdirSync(path);
	}
};

// Sort an Object
// http://jsfiddle.net/lalatino/mcuzr/
function sortObject(obj) {
    var arr = [];
    var prop;
    for (prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            arr.push({
                'lang': prop,
                'n': obj[prop]
            });
        }
    }
    arr.sort(function(a, b) {
        return b.n - a.n;
    });
    return arr; // returns array
}


// ==============================================
// ==============================================


// ------------------------------------------
// Create file: data/data.json --------------
function create_data_file() {
	function is_dir(element) {
		return fs.lstatSync('./data/'+element).isDirectory()
	}

	var folders = fs.readdirSync('./data');
	    folders = folders.filter(junk.not);
		folders = folders.filter(is_dir);
		folders.sort();
		folders.reverse();

	var remove_folders = folders.slice(2);
		folders = folders.slice(0, 2);

		// Keep only the last two data folders
		for (var i=0; i<remove_folders.length; i++) {
			console.log('./data/' + remove_folders[i]);
			rmdir_recursive('./data/' + remove_folders[i]);
		}

	var locations = [];
		for (var i=0; i<config.length; i++) {
			locations.push( config[i].location );
		}

		var data = {};
			data['folders'] = folders;
			data['locations'] = locations;

		var all_languages = {};
		var all_users = 0;
		var top_users = [];

		function fileExists(filePath) {
		    try { return fs.statSync(filePath).isFile(); }
		    catch (err) { return false; }
		}

		data['items'] = [];
		for ( var i=0; i<config.length; i++ ) {

			var item_data_file = './data/' + folders[0] + '/' + config[i].location + '.json';
			if ( fileExists( item_data_file ) ) {

				var item_data = fs.readFileSync(item_data_file);
				    item_data = JSON.parse(item_data);

				var item_data_langs = {};
					for ( var j=0; j<item_data.length; j++ ) {

						for (var k=0; k<item_data[j]['languages'].length; k++) {
							// location languages
							if ( item_data_langs.hasOwnProperty( item_data[j]['languages'][k] ) ) { item_data_langs[item_data[j]['languages'][k]]++; }
							else { item_data_langs[item_data[j]['languages'][k]] = 1; }

							// all languages
							if ( all_languages.hasOwnProperty( item_data[j]['languages'][k] ) ) { all_languages[item_data[j]['languages'][k]]++; }
							else { all_languages[item_data[j]['languages'][k]] = 1; }
						}

						// Push the top 'n' users for every location
						if (j<25) {
							top_users.push(item_data[j]);
						}
					}
				var item_data_langs_sorted = sortObject( item_data_langs );
					item_data_langs_sorted = item_data_langs_sorted.slice(0, 5);

				data['items'][i] = {
					'label' : config[i].label,
					'location' : config[i].location,
					'users' : item_data.length,
					'languages' : item_data_langs_sorted
				}

				all_users += item_data.length;

			} // end if

		}

		data['all_languages'] = sortObject( all_languages ).slice(0, 10);
		data['all_users'] = all_users;

		top_users = top_users.sort(function(a,b) { return b.contributions - a.contributions; });
		top_users = top_users.slice(0, 10); // TOP n
		data['top_users'] = top_users;

		// console.log( data );
		// console.log( JSON.stringify(data) );

	fs.writeFileSync( './data/data.json', JSON.stringify(data), 'utf-8');
}


// ------------------------------------------
// Scraper ----------------------------------
function get_users( location_config ) {

    // There's a limit of 1K first matches on GitHub (10pages of 100)
    location_config['search']['max_pages'] = ( location_config['search']['max_pages'] > 10 ) ? 10 : location_config['search']['max_pages'];

    var base_url = 'https://api.github.com/search/users';
        base_url += '?client_id=' + GITHUB_ID;
        base_url += '&client_secret=' + GITHUB_SECRET;
        base_url += '&q=type:user';
        base_url += '+location:' + location_config['location']
        base_url += '+repos:%3E' + location_config['search']['min_repos']
        base_url += '+followers:%3E' + location_config['search']['min_followers']
        base_url += '+sort:repositories';

        var include_search = location_config['search']['include'];
        for (var i = 0; i < include_search.length; i++) {
            base_url += '+location:' + encodeURI(include_search[i]);
        }
        base_url += '&per_page=100';
        base_url += '&page=';

        var users = [];
        var requested_pages = 0;
        for (var i = 1; i <= location_config['search']['max_pages']; i++) {

            request
                .get( base_url + i )
                .set( 'User-Agent', 'curl/7.24.0 (x86_64-apple-darwin12.0) libcurl/7.24.0 OpenSSL/0.9.8r zlib/1.2.5' )
                .end( function(err, res) {

                    if ( err ) {
                        console.log( ' (!) - Error:' + err.status + ' > ' + err.message );
                    }

                    // console.log( ' - Requesting : ' + res.req.path );
                    // console.log( ' - Requesting : ' + res.req.path.substr( res.req.path.lastIndexOf('&')+1 ) );
                    process.stdout.write( ' - Requesting : ' + res.req.path.substr( res.req.path.lastIndexOf('&')+1 ) + " \r" );

                    requested_pages++;
                    users = users.concat(res.body.items);
                    if ( requested_pages >= location_config['search']['max_pages'] ) {
                        console.log( ' - User search completed' )
                        getting_users_done();
                    }
                });
        }

    function getting_users_done() {
        var users_output = [];
        for (var i = 0; i < users.length; i++) {

            var user = {
                "id" : users[i]['id'],
                "login" : users[i]['login'],
                "avatar" : users[i]['avatar_url'],
                "url" : users[i]['html_url']
            }

            users_output.push(user);
        }

        the_users = users_output;

        console.log( ' - get_users() function completed.' );
        console.log( ' - Total users found : ' + the_users.length );

        // GO TO THE NEXT STEP...
        get_user_details();
    }
}


function get_user_details() {

    var all_the_users = [];

    function get_details( user ) {

        // process.stdout.write( " - requesting user : " + user['login'] + " ( " + user['url'] + " ). \r" );
        request
            .get(user['url'])
            .end(function(err, res){

                // Defaults everything to false
                user['name']            = false;
                user['company']         = false;
                user['location']        = false;
                user['blog']            = false;
                user['bio']             = false;
                user['followers']       = false;
                user['following']       = false;
                user['contributions']   = false;
				user['repositories'] 	= false;
				user['languages'] 		= false;

                if (res) {

					var $ = cheerio.load( res.text );
	                user['name'] = $('.vcard-fullname[itemprop="name"]').text();
	                user['company'] = $('ul.vcard-details li[itemprop="worksFor"]').text();
	                user['location'] = $('ul.vcard-details li[itemprop="homeLocation"]').text();
	                user['blog'] = $('ul.vcard-details li[itemprop="url"] a').attr('href') || ''; // TODO: check if it is a valid URL
	                user['bio'] = $('div.user-profile-bio').text();

					user['followers'] = parseInt( $('div.user-profile-nav a[href$="followers"] span.counter').text().trim() );
					user['following'] = parseInt( $('div.user-profile-nav a[href$="following"] span.counter').text().trim() );

					var contributions = $('div.js-contribution-graph h2:first-child').text().trim();
						contributions = contributions.split(' ')[0];
						contributions = parseInt(contributions.trim().replace(',', ''));
					user['contributions'] = contributions;

					user['repositories'] = parseInt( $('div.user-profile-nav a[href$="repositories"] span.counter').text().trim() );

					var languages = [];
					$('ol.pinned-repos-list li p.f6').each(function(i, el){
						var lang = $(this).text();
							lang = lang.replace(/([0-9]+),([0-9]+)/, '$1$2');
							lang = lang.replace(/\d+/g, '').trim();

						if ( lang != '' && languages.indexOf(lang) < 0 ) {
							languages.push( lang );
						}

					});
					user['languages'] = languages;

                } else {

                    // Rubbish
                    // error_users.push(user);
                    error_users.push(user['login']);
                }

                // exclude locations
                var exclude_user_by_location = false;
                var exclude = current_config['search']['exclude'] || false;
                if ( exclude ) {
                    for (var i=0; i<exclude.length; i++) {
                        var loc_lc = user['location'].toString().toLowerCase();
                        if ( loc_lc.search(exclude[i]) > -1) {
                            console.log( ' - (!) User ' + user['login'] + ' excluded by location.' );
                            exclude_user_by_location = true;
                            break;
                        }
                    }
                }

                // Exclude by login name
                var exclude_user_by_loginname = false;
                var banned = current_config['search']['users_out'] || false;
                if ( banned ) {
                    for (var i=0; i<banned.length; i++) {
                        if ( user['login'].toString().toLowerCase().search(banned[i]) > -1) {
                            console.log( ' - (!) User ' + user['login'] + ' excluded by login name.' );
                            exclude_user_by_loginname = true;
                            break;
                        }
                    }
                }

                if ( !exclude_user_by_location && !exclude_user_by_loginname ) {

                    all_the_users.push(user);
                }
                requested_users++;

                process.stdout.write(" - User data collecting progress > " + requested_users + " / " + users_num + " \r");
                // console.log( ' - User : ' + user['login'] + ' data taken. ( ' + requested_users + '/' + users_num + ' )' );
                if ( requested_users >= users_num  ) {
                    console.log( ' - User data collecting progress > completed > ' + requested_users + ' users.' );

                    // MOVE TO THE NEXT STEP...
                    the_users = all_the_users;
                    export_data();
                }

            });
    }

    // Iterate over all the users...
    var users_num = the_users.length;
    var requested_users = 0;
    console.log( " - Requesting users details." );
    console.log( ' - Users num: ' + users_num );

    for (var i=0; i<users_num; i++) {
        get_details( the_users[i] );
    }
}


function export_data() {
    console.log(
        ' - Exporting ... trim users: max/parsed',
        current_config['search']['max_users'] + '/' + the_users.length
    );

    // Sort by contributions descending
    the_users.sort(function(a, b) {
        return b['contributions'] - a['contributions'];
    });

    // Slice the array to the maximum number
    the_users = the_users.slice(0, current_config['search']['max_users']);

    // Export data
    var output_filename = target_folder + current_config['location'] + '.json';
    console.log( ' - Writing output on file : ' + output_filename );

    fs.writeFileSync( output_filename, JSON.stringify(the_users), 'utf-8');
    console.log( ' ! DONE ' );
    console.log( ' ! error users: (?) ', error_users );
    console.log( ' ! error users: (#) ', error_users.length );

    // DONE. Go to the next item if apply
	// ELSE create the data/data.json file
    iterator++;
    if ( iterator < config.length ) { run(); }
}


// ==============================================
// ==============================================


// ------------------------------------------
// Init -------------------------------------
function run() {

    // Reset all users data
    error_users = [];
    the_users = [];
    current_config = config[iterator];

    // msg
    console.log( ' --- run() : ' + current_config['location'] + ' : ' + current_config['label']  + ' --- ' );
	console.log( ' --> counter : iterator : ' + iterator + ' > config.length : ' + config.length );

	// This is the END...
	if ( iterator >= (config.length-1) ) {
		create_data_file();
		console.log( ' --> END' );
	}

    // ------
    var target_file = target_folder + current_config['location'] + '.json';
    if ( fs.existsSync(target_file) && skip_if_exists ) {

        // SKIP.
        iterator++;
        if ( iterator < config.length ) { run(); }

    } else {

        // go!
        get_users( current_config );
    }

}

var error_users = [];
var the_users = [];
var iterator = 0;
var skip_if_exists = true;
var target_folder = './data/' + date_id() + '/';
    if (!fs.existsSync( target_folder )){ fs.mkdirSync( target_folder ); }

var config = fs.readFileSync('./app/locations.json');
    config = JSON.parse(config);

var current_config = config[iterator];

	run();
