var fs = require("fs");
var request = require("superagent");
var cheerio = require("cheerio");
var junk = require("junk");
var github = require('./github');

var GITHUB_ID = github.github.id;
var GITHUB_SECRET = github.github.secret;

console.log(GITHUB_ID);
