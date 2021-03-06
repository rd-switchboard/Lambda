/**
 * Process OAI:PMH Document from AWS S3 storage and extract all records harmonized metadata into AWS Dynamo DB 
 * 
 * Supported formats:
 *    RIF:CS
 *    
 * Author: Dima Kudriavcev (dmitrij@kudriavcev.info)
 * Vession: 0.1.0
 */

var xml2js = require('xml2js');
var async = require('async');
var AWS = require('aws-sdk');
//var Set = require("collections/set");
var _ = require('underscore');
var Set = require("collections/set");
var OAIPMH = require('./lib').OAIPMH;
var RifCS = require('./lib').RifCS;

// for debug only
var util = require('util');

// get reference to S3 client
var s3 = new AWS.S3();

// get reference to Dynamo DB
var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

// create parser
var parser = new xml2js.Parser();

/* request format:
	{
		table: tableName,
		values: {
			key: value
		}
	}
*/

var requests = [];
var properties = {};
var indexes = {};
var relationships = {};
var errorAttempts = 0;

function isEmptyObject(obj) {
	// return true, if object is empty
	return !Object.keys(obj).length;
}

function countRequests(_requests) {
	// count request for each table
	var cnt = 0;
	for (var key in _requests.RequestItems) {
		if (_requests.RequestItems.hasOwnProperty(key)) {
			cnt += _requests.RequestItems[key].length;
		}
	}
	
	return cnt;
}

function formatValue(value) {
	if (typeof value === 'string' ) {
		return { S: value };
	} else if (Object.prototype.toString.call( value ) === '[object Array]') {
		return { SS: value };
	} else {
		return value;
	}
}

function formatProperties() {
	for(var id in properties) { 
		if (properties.hasOwnProperty(id)) {
			var values = properties[id];
			var requestItem = { PutRequest: { Item: { key: { S: id } } } };
	
			for(var key in values) {
				if (values.hasOwnProperty(key)) {
					requestItem.PutRequest.Item[key] = formatValue(values[key]);
				}
			}
			
			requests.push({ Table: "PropertyValue", Item: requestItem });
		}
	}
	
	properties = {};
}

function formatIndexes() {
	for (var idx in indexes) { 
		if (indexes.hasOwnProperty(idx)) {
			var index = indexes[idx];
			
			requests.push({ Table: "PropertyIndex", Item: { PutRequest: { Item: { 
				index: { S: idx },
				key: { S: index.key },
				name: { S: index.name }			
			} } } });
		}
	}
	
	indexes = {};
}

function formatRelationships() {
	for (var id1 in relationships) {
		if (relationships.hasOwnProperty(id1)) {
			var relationship = relationships[id1];
			
			for (var id2 in relationship) {
				if (relationship.hasOwnProperty(id2)) {
					
					requests.push({ Table: "Relationship", Item: { PutRequest: { Item: { 
						key1: { S: id1 },
						key2: { S: id2 },
						type: formatValue( relationship[id2].toArray() )		
					} } } });					
				}
			}
		}
	}
	
	relationships = {};
}

function formatRequests(_requests) {
	// if this is a first call of the function, generate the request object
	if (typeof _requests === 'undefined') {
		_requests = { 
			RequestItems: {}, 
			ReturnConsumedCapacity: "NONE", 
			ReturnItemCollectionMetrics: "NONE" 
		};
	} else {
		// restore parameters 'just in case' (might not be needed)
		_requests.ReturnConsumedCapacity = "NONE";
		_requests.ReturnItemCollectionMetrics = "NONE";
	}
	
	// if we have some request to process
	if (requests.length > 0) {
		var maxRequests = 25 - countRequests(_requests);
		if (maxRequests > 0) {
			// restore error attempts to zero, if any new records has been added
			errorAttempts = 0;
			
			// make sure we do not ask for more requests what actually exists in the pool
			if (maxRequests > requests.length) {
				maxRequests = requests.length;
			}
			
			// take requests from the front of the array
			for (var i = 0; i < maxRequests; ++i) {
				// extract one pending request
				var request = requests[i];
				
				// create request array if it does not exists
				if (!_requests.RequestItems.hasOwnProperty(request.Table)) {
					_requests.RequestItems[request.Table] = [];
				}
				
				// add generated request to array
				_requests.RequestItems[request.Table].push(request.Item);
			}
			
			// cut off beginning of requests array, this might not work, 
			// if Node.JS will process this function in a multithread environment

			if (maxRequests < requests.length) {
				requests = requests.slice(maxRequests, requests.length);
			} else {
				requests = [];
			}
		}
	}
	
	// return generated request object
	return _requests;
}

function postRequests(_requests, callback) {
	console.log("Sending Batch requests");
	
	dynamodb.batchWriteItem(_requests, function (err, data) {
		if (err) {
			// abort if any error
			return callback(err);
		} 
			
		// check if we have any unrocessed items
		if (null !== data) {
			
			if (!isEmptyObject(data.UnprocessedItems)) {
				console.log("Some requests was unprocessed");
				
				// maximum error attempts count. 
				// if request has been processed partly. this counter will be reset
				if (++errorAttempts < 10) {
					// setup an delay, calculated by exponential backoff algorithm 
					setTimeout(function() {
						// recursively call the post function
						// if new request will be added, the errorAttempts value will be reset
						postRequests(formatRequests({ RequestItems: data.UnprocessedItems }), callback);
					}, 1); // Math.pow(2, errorAttempts) * 50
				} else {
					callback("Unable to pust Dynamo DB request, maximum number of errors has been reached");
				}
			} else {
				callback(null);
			}
		}
	});
}

function sendRequests(callback) {
	async.whilst(
			function() { 
				return requests.length > 0; 
			},
			function (callback) {
				postRequests(formatRequests(), callback);
			},
			callback);
}

/*
function formatRequest(request) {
	var _request = { TableName: request.table, Item: {} };
	
	for(var key in request.values) {
		if (request.values.hasOwnProperty(key)) {
			if (typeof request.values[key] === 'string' ) {
				_request.Item[key] = { S: request.values[key] };
			} else {
				_request.Item[key] = request.values[key];
			}
		}
	}
		
	return _request;
}

function sendRequests2(callback) {
	var n = 0;
	
	async.whilst(
		function() { 
			return n < requests.length; 
		},
		function (callback) {
			dynamodb.putItem(formatRequest(requests[n++]), callback);
		},
		callback);
}*/

function setPropertyValues(id, values) {
	if (properties.hasOwnProperty(id)) {
		_.extend(properties[id], values);
	} else {
		properties[id] = values;
	}
}

function addPropertyIndex(index, id, name) {
	if (!indexes.hasOwnProperty(index)) {
		indexes[index] = { key: id, name: name };
	}
}

function addRelationship(id1, id2, type) {
	var relationship;
	if (!relationships.hasOwnProperty(id1)) {
		 relationships[id1] = relationship = {};
	} else {
		relationship = relationships[id1];
	}
	if (!relationship.hasOwnProperty(id2)) {
		relationship[id2] = new Set([ type ]);
	} else {	
		relationship[id2].add(type);
	}
}

function processRegistryObject(id, props, ro) {
	var primaryName = ro.name('primary');
	if (null !== primaryName && primaryName.length) {
		props.name = primaryName[0];
	}
	
	var identifiers = ro.identifiers();
	if (identifiers.hasOwnProperty("local")) {
		props.local = identifiers.local;
		addPropertyIndex(props.local, id, "local");
	}
	if (identifiers.hasOwnProperty("uri")) {
		props.uri = identifiers.uri;
		addPropertyIndex(props.uri, id, "uri");
	}
	if (identifiers.hasOwnProperty("AU-ANL:PEAU")) {
		props.nla = identifiers["AU-ANL:PEAU"];
		addPropertyIndex(props.nla, id, "nla");
	}
	if (identifiers.hasOwnProperty("doi")) {
		props.doi = identifiers.doi;
		addPropertyIndex(props.doi, id, "doi");
	}
	if (identifiers.hasOwnProperty("orcid")) {
		props.orcid = identifiers.orcid;
		addPropertyIndex(props.orcid, id, "orcid");
	}
	if (identifiers.hasOwnProperty("purl")) {
		props.purl = identifiers.purl;
		addPropertyIndex(props.purl, id, "purl");
	}
 
	setPropertyValues(id, props);	
	
	var relationships = ro.relatedObjects();
	for (var i = 0; i < relationships.length; ++i) {
		var relationship = relationships[i];
		addRelationship(id, relationship.key, relationship.relation);
	}
}

function processCollection(id, props, ro) {
	props.type = "Collection";
	processRegistryObject(id, props, ro.asCollection());
}

function processParty(id, props, ro) {
	props.type = "Party";
	processRegistryObject(id, props, ro.asParty());
}

function processActivity(id, props, ro) {
	props.type = "Activity";
	processRegistryObject(id, props, ro.asActivity());
}

function processService(id, props, ro) {
	props.type = "Service";
	processRegistryObject(id, props, ro.asService());
}

function getZerroed(val) {
	return (val < 10 ? "0" : "") + val;
}

function getDateTime() {
    var date = new Date();

    return date.getFullYear() + 
    	"-" + getZerroed(date.getMonth() + 1) +
    	"-" + getZerroed(date.getDate()) +
    	" " + getZerroed(date.getHours()) +
    	":" + getZerroed(date.getMinutes()) + 
    	":" + getZerroed(date.getSeconds());
}

function recordImport(source, file, status, callback) {
	var params = { 
		TableName: "Import", 
		Item: { 
			Source: { S: source }, 
			File: { S: file },
			Status: { S: status },
			Date: { S: getDateTime() } 
		} 
	};
	
	dynamodb.putItem(params, function(err, data) {
		callback(err);
	});
}

exports.handler = function(event, context) {
    // log event information
   // console.log("Reading options from event:\n", util.inspect(event, {depth: 5}));
	errorAttempts = 0;	
	
    var bucket = event.Records[0].s3.bucket.name;
    console.log("Bucket: " + bucket);

    // Object key may have spaces or unicode non-ASCII characters.
    var key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
    console.log("key: " + key);
    
    async.waterfall(
        [
         	function begin(next) {
         		console.log("Recording initial status"); 
         		recordImport("ands", bucket + "/" + key, "Processing", next);
         	},         
            function download(next) {
            	console.log("Downloading XML Doument: {" + bucket + "} " + key); 
                // Download the XML Document from S3 into a buffer.
                s3.getObject({ Bucket: bucket, Key: key }, next);
            },
            function parse(response, next) {
            	console.log("Parsing XML Document");
            	// Parse the XML Document
            	parser.parseString(response.Body.toString(), next);
            },
            function process (result, next) {
            	console.log("Processing XML Document");
            	// Process the XML Document
                //console.log(util.inspect(result, false, null));
            	var doc = new OAIPMH(result);
            	if (!doc.root()) {
            		return next("This is not an OAI:PMH Document");
            	}
            	
            	var recordsCount = doc.recordsCount();
            	for (var nRecord = 0; nRecord < recordsCount; ++nRecord) {
            		var record = doc.record(nRecord);
            		var header = record.header();
            		if (!header.isDeleted()) {
	            		var metadata = record.metadata();
	            		
	            		console.log("Processing Record with id: " + nRecord);
	            		
	            		if (RifCS.isRifCS(metadata)) {
							var rif = new RifCS(metadata);
							var objectsCount = rif.recordsCount();
							for (var nObject = 0; nObject < objectsCount; ++nObject) {
								var registryObject = rif.record(nObject);
			            		var id = registryObject.key();
								var props = { source: "ands", ands_id: header.identifier() };
								
								console.log("Object Identificator: " + id);
								
								if (registryObject.isCollection()) {
									processCollection(id, props, registryObject);
								} else if (registryObject.isParty()) {
									processParty(id, props, registryObject);
								} else if (registryObject.isActivity()) {
									processActivity(id, props, registryObject);
								} else if (registryObject.isService()) {
									processService(id, props, registryObject);
								} else {
			            			return next("The registry record is not a collection, party, activity or service");
			            		}
							}
	            		} else {
	            			return next("The document metadata is not in the know format. Supported metadata formats: [ Rif:CS ]");
	            		}
            		} else {
            			console.log("The record has been deleted");
            		}            			
            	}      
            	
            	formatProperties();
            	formatIndexes();
            	formatRelationships();
            	
            	sendRequests(next);
            },
         	function end(next) {
         		console.log("Recording final status"); 
         		recordImport("ands", bucket + "/" + key, "Imported", next);
         	} 
        ], function (err) {
            if (err) {
    	        console.error(
   	        		 'Unable to process XML Document ' + bucket + '/' + key +
       	             ' due to an error: ' + err
    	        );
    	        
    	        recordImport("ands", bucket + "/" + key, "Error: " + err, function (err, data) {
    	        	if (err) {
    	        		 console.error('Unable to record import status because of: ' + err);
    	        	}
    	        });
            } else {
                console.log(
                    'Successfully processed XML Document ' + bucket + '/' + key 
                );
            }

            context.done();
        }
    );
};
