
/*var ResourceType = {
	scopus: 'scopus',
	scidir: 'scidir'
};

var SearchViewType = {
	STANDARD: 'STANDARD',
	COMPLETE: 'COMPLETE'
};
*/
// avaliable options:
// artnum, aucite, citedby-count, coverDate, creator, orig-load-date, pagecount, pagefirst,
// pageRange, publicationName, pubyear, relevancy, title, volume

var http = require("http");

function SortType(field, asc) {
	this.field = field;
	this.asc = asc;
}

function Facet(type) {
	this.type = type;	
	this.count = null;
	this.sort = null;
	this.prefix = null;
}

Facet.prototype.withCount = function( v ) {
	this.count = v;
	return this;
};

Facet.prototype.withSort = function( v ) {
	this.sort = v;
	return this;
};

Facet.prototype.withPrefix = function( v ) {
	this.prefix = v;
	return this;
};

Facet.prototype.toString = function() {
	var params = [];
	if (null !== this.count) {
		params.push('count=' + this.count);
	}	
	if (null !== this.sort) {
		params.push('sort=' + this.sort);
	}
	if (null !== this.prefix) {
		params.push('prefix=' + this.prefix);
	}
	return this.type + params.length > 0 ? '(' + params.join() + ')' : '';
};

/*function isArray(v) {
	return Array.isArray ? Array.isArray( v ) : Object.prototype.toString.call( v ) === '[object Array]';
}*/

function ScopusQuery() {
	// array of fields to query
	this.searchFields = null; 
	
	// predefined fields to query ('STANDARD' or 'COMPLETE')
	this.searchViewType = null; 
	
	// suppress navigation links in the output (true or false)
	this.suppressNavLinks = null;
	
	// represents the date range associated with the search, 
	// with the lowest granularity being year (2002-2007  for example).
	this.searchDate = null; 
	
	// Numeric value representing the results offset (i.e. starting position for the search results). 
	// The maximum for this value is a system-level default (varies with search cluster) minus the 
	// number of results requested. If not specified the offset will be set to zero (i.e. first search 
	// result)
	// ex. start=5 
	
	var start = null;
	
	//Numeric value representing the maximum number of results to be returned for the search. If not 
	// provided this will be set to a system default based on service level.
	// In addition the number cannot exceed the maximum system default - if it does an error will be 
	// returned.
	// ex. count=10 
	
	var count = null;
	
	// array of SortType objects
	var sortTypes = null; 
	
	// content type: core, dummy or all
	var contentType = null;
	
	// subject
	var subject = null;
	
	var alias = null;
	
	var resolveGroups = null;
	
	var authorFormat = null;
	
	var facets = null;
}

ScopusQuery.prototype.withSearchFields = function( v ) {
	// assign new fields array to the object. If parameter is not array, envelop it into new array
	if (Array.isArray( v )) {
		this.searchFields = v;
	} else if (null !== v ) {
		this.searchFields = [ v ];
	} else {
		this.searchFields = null;
	}
	 
	// return this to allow chain-call
	return this;
};

ScopusQuery.prototype.withSearchViewType = function( v ) { 
	this.searchViewType = v;
	 
	// return this to allow chain-call
	return this;
};

ScopusQuery.prototype.withSuppressNavLinks = function( v ) {	 
	this.suppressNavLinks = v;
	 
	// return this to allow chain-call
	return this;
};

ScopusQuery.prototype.withSearchDate = function( v ) { 
	this.searchDate = v;
	 
	// return this to allow chain-call
	return this;
};


ScopusQuery.prototype.withStart = function( v ) { 
	this.start = v;
	 
	// return this to allow chain-call
	return this;
};

ScopusQuery.prototype.withCount = function( v ) { 
	this.count = v;
	 
	// return this to allow chain-call
	return this;
};

ScopusQuery.prototype.withSortTypes = function( v ) {
	// assign new fields array to the object. If parameter is not array, envelop it into new array
	if (Array.isArray( v )) {
		this.sortTypes = v;
	} else if (null !== v ) {
		this.sortTypes = [ v ];
	} else {
		this.sortTypes = null;
	}
	 
	// return this to allow chain-call
	return this;
};

ScopusQuery.prototype.withContentType = function( v ) { 
	this.contentType = v;
	 
	// return this to allow chain-call
	return this;
};

ScopusQuery.prototype.withSubject = function( v ) { 
	this.subject = v;
	 
	// return this to allow chain-call
	return this;
};


ScopusQuery.prototype.withAlias = function( v ) { 
	this.alias = v;
	 
	// return this to allow chain-call
	return this;
};

ScopusQuery.prototype.withResolveGroups = function( v ) { 
	this.resolveGroups = v;
	 
	// return this to allow chain-call
	return this;
};

ScopusQuery.prototype.authorFormat = function( v ) { 
	this.authorFormat = v;
	 
	// return this to allow chain-call
	return this;
};

ScopusQuery.prototype.withFacets = function( v ) {
	// assign new fields array to the object. If parameter is not array, envelop it into new array
	if (Array.isArray( v )) {
		this.facets = v;
	} else if (null !== v ) {
		this.facets = [ v ];
	} else {
		this.facets = null;
	}
	 
	// return this to allow chain-call
	return this;
};

/**
 * Query Scopus for metadata
 * 
 * Parameters:
 * resourceType - type of resource, at this moment, only 'scopus' and 'scidir' are supported
 */



ScopusQuery.prototype.generateURL = function(resourceType, query) {
	var params = {
		query: encodeURIComponent(query)
	};

	if (null !== this.searchFields && this.searchFields.length > 0) {
		params.field = this.searchFields.join(); // the ',' separator is default		
	} else if (null !== this.searchViewType) {
		params.view = this.searchViewType;
	} 
	
	if (null !== this.suppressNavLinks) {
		params.suppressNavLinks = this.suppressNavLinks;
	} 
	
	if (null !== this.searchDate) {
		params.date = this.searchDate;
	} 
	
	if (null !== this.start) {
		params.start = this.start;
	}
	
	if (null !== this.count) {
		params.count = this.count;
	}
	
	if (null !== this.sortTypes && this.sortTypes.length > 0) {
		params.sort = this.sortTypes
			.map(function(t) {
				return (t.asc ? '+' : '-') + t.field;
			})
			.join();
	}
	
	if (null !== this.contentType) {
		params.content = this.contentType;
	}
	
	if (null !== this.subject) {
		params.subj = this.subject;
	}

	if (null !== this.alias) {
		params.alias = this.alias;
	}
	
	if (null !== this.resolveGroups) {
		params.resolveGroups = this.resolveGroups;
	}

	if (null !== this.authorFormat) {
		params.authorFormat = this.authorFormat;
	}
		
	if (null !== this.facets && this.facets.length > 0) {
		params.facet = this.facets
			.map(function(f) {
				return f.toString();
			})
			.join();
	}
			
	return 'https://api.elsevier.com/content/search/' + resourceType + '?' + 
		params.keys().map(function(key) {
			return key + '=' + encodeURIComponent(params[key]);
		}).join('&');
};

ScopusQuery.prototype.query = function(resourceType, query) {
	
};


exports.ScopusQuery = ScopusQuery;
exports.SortType = SortType;
exports.Facet = Facet;

