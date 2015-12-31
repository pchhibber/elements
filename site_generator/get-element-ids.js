var fs = require('fs');
var fetch = require('node-fetch');
var urlRegex = /^https:.*?github.*?\/(\w+)\/(\w+)/;
var baseApiEndPoint = 'https://api.travis-ci.org/repos';
var categories = fs.readFileSync('metadata.json', 'utf-8');
var idFilePath = '_site/element-ids.json'
var elementUrls;
var originalLength;

function getJson(url) {
	return fetch(url).then(function(resp) {
		//TODO: will other response status codes do for our task?
		if (resp.status === 200) {
			return resp.json();
		}

		return Promise.reject();
	});
}

categories = JSON.parse(categories);

elementUrls = categories.elements
	.filter(el => el.name !== 'demo-tester')
	.map(el => el.location);

originalLength = elementUrls.length;

//check if all the elements are present on github
elementUrls = elementUrls.map(function(el) {
	var entityApi = el.replace(urlRegex, function(match, owner, name) {
		return baseApiEndPoint + '/' + owner + '/' + name;
	});

	if (entityApi === el) {
		return undefined;
	}

	return entityApi;
});

Promise.all(elementUrls.map(function(entityApi) {
	if (entityApi) {
		return getJson(entityApi);
	}

	return Promise.resolve({});
})).then(function(results) {
	results = results.map(function(result) {
		return result.id;
	});

	return results;
}).catch(function() {
	//we only need the length of the array
	return elementUrls.map(function() {
		return undefined;
	});
}).then(function(elementIds) {
	elementIds = JSON.stringify(elementIds);

	fs.writeFileSync(idFilePath, elementIds);
}).then(function() {
	console.log('Done : creating element ids');
});
