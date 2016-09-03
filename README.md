## Top GitHub users from a geographical area population.

*( Unfinished - Work in progress )*

Top GitHub users rank generator script for a given geographical area population query. [alterebro.github.io/area-top-github-users](https://alterebro.github.io/area-top-github-users/)


1. Install dependencies

	```sh
	$ sudo npm install
	```


2. Rename `/app/github.sample.js` to `/app/github.js` with your own ID and Secret strings, you can get them by creating a new GitHub application here: [Register a new OAuth application](https://github.com/settings/applications/new)

	```javascript
	exports.github = {
	    'id' : 'alphanumeric_string',
	    'secret' : 'alphanumeric_string'
	}
	```

3. Rename `/app/sample.locations.json` to `/app/locations.json` and edit the file, create as many location items as needed following the same JSON structure as shown below:

	```javascript
	[
	    {
	        "location" : "aquitaine", // main query string
	        "label" : "Aquitaine",
	        "search" : {
	            "include" : ["bordeaux", "pau", "merignac", "pessac", "bayonne", "anglet", "bergerac", "biarritz"], // Array of locations to include on the search query
				"exclude" : ["paris", "montpellier"], // Array of locations to exclude from the search query
				"users_out" : ["username"], // Array of users banned by login name.			
	            "min_repos" : 0, // minimum repositories. num value HIGHER THAN (>)
	            "min_followers" : -1,  // minimum followers. num value HIGHER THAN (>)
	            "max_pages" : 5, // maximum pages to crawl from github (max. 10)
	            "max_users" : 200 // Maximum num of users to be stored.
	        }
	    }

		// .. add more items
	]
	```

4. Execute main script (app/main.js)

	```sh
	$ npm start
	```
