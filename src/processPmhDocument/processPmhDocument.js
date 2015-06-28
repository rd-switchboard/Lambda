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
				// create new put request
				var _request = { PutRequest: { Item: {} } };
				
				// fill request with data
				for(var key in request.values) {
					if (request.values.hasOwnProperty(key)) {
						if (typeof request.values[key] === 'string' ) {
							_request.PutRequest.Item[key] = { S: request.values[key] };
						} else {
							_request.PutRequest.Item[key] = request.values[key];
						}
					}
				}
				
				// create request array if it does not exists
				if (!_requests.RequestItems.hasOwnProperty(request.table)) {
					_requests.RequestItems[request.table] = [];
				}
				
				// add generated request to array
				_requests.RequestItems[request.table].push(_request);
			}
			
			// cut off beginning of requests array, this might not work, 
			// if Node.JS will process this function in a multithread enviroment

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
	dynamodb.batchWriteItem(_requests, function (err, data) {
		if (err) {
			// abort if any error
			return callback(err);
		} 
			
		// check if we have any unrocessed items
		if (null !== data && !isEmptyObject(data.UnprocessedItems)) {
			// maximum error attempts count. 
			// if request has been processed partly. this counter will be reset
			if (++errorAttempts < 10) {
				// setup an delay, calculated by exponential backoff algorithm 
				setTimeout(function() {
					// recursively call the post function
					// if new request will be added, the errorAttempts value will be reset
					postRequests(formatRequests({ RequestItems: data.UnprocessedItems }), callback);
				}, Math.pow(2, errorAttempts) * 50);
			} else {
				callback("Unable to pust Dynamo DB request, maximum number of errors has been reached");
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

function addPropertyValue(key, name, value) {
	requests.push({ 
		table: "PropertyValue", 
		values: { 
			Key : key, 
			PropertyName: name, 
			PropertyValue: value
		} 
	});
}

function addRelationship(key1, key2, type) {
	requests.push({ 
		table: "Relationship", 
		values: { 
			Key1 : key1, 
			Key2 : key2,
			RelationshipType: type, 
			RelationshipDirection: { BOOL: true }
		} 
	});
	requests.push({ 
		table: "Relationship", 
		values: { 
			Key1 : key2, 
			Key2 : key1,
			RelationshipType: type, 
			RelationshipDirection: { BOOL: false }
		} 
	});
}

function processRegistryObject(key, ro) {
	var primaryName = ro.name('primary');
	if (null !== primaryName && primaryName.length) {
		addPropertyValue(key, "title", primaryName[0]);
	}
	
	var identifiers = ro.identifiers();
	if (identifiers.hasOwnProperty("AU-ANL:PEAU")) {
		addPropertyValue(key, "nla", identifiers["AU-ANL:PEAU"]);
	}
	if (identifiers.hasOwnProperty("doi")) {
		addPropertyValue(key, "doi", identifiers.doi);
	}
	if (identifiers.hasOwnProperty("orcid")) {
		addPropertyValue(key, "orcid", identifiers.orcid);
	}
	if (identifiers.hasOwnProperty("orcid")) {
		addPropertyValue(key, "orcid", identifiers.orcid);
	}
	if (identifiers.hasOwnProperty("purl")) {
		addPropertyValue(key, "purl", identifiers.orcid);
	}
	
	var relationships = ro.relatedObjects();
	for (var i = 0; i < relationships.length; ++i) {
		var relationship = relationships[i];
		addRelationship(key, relationship.key, relationship.relation);
	}
}


exports.handler = function(event, context) {
    // log event information
    console.log("Reading options from event:\n", util.inspect(event, {depth: 5}));

    var bucket = event.Records[0].s3.bucket.name;
    console.log("Bucket: " + bucket);

    // Object key may have spaces or unicode non-ASCII characters.
    var key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
    console.log("key: " + key);
    
    async.waterfall(
        [
            function download(next) {
            	console.log("Downloading XML Doument: {" + bucket + "} " + key); 
                // Download the XML Document from S3 into a buffer.
                s3.getObject({ Bucket: bucket, Key: key }, next);
            },
            function parse(response, next) {
            	console.log("Parsing XML Document");
            	// Parse the XML Document
            	parser.parseString(response, next);
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
            		var metadata = record.metadata();
            		
            		if (RifCS.isRifCS(metadata)) {
						var rif = new RifCS(metadata);
						
						var objectsCount = rif.recordsCount();
						for (var nObject = 0; nObject < objectsCount; ++nObject) {
							var registryObject = doc.record(nObject);
							
							if (registryObject.isCollection()) {
								processRegistryObject(header.identifier(), registryObject.asCollection());
							} else if (registryObject.isParty()) {
								processRegistryObject(header.identifier(), registryObject.asParty());
							} else if (registryObject.isActivity()) {
								processRegistryObject(header.identifier(), registryObject.asActivity());
							} else if (registryObject.isService()) {
								processRegistryObject(header.identifier(), registryObject.asService());
							} else {
		            			return next("The registry record is not a collection, party, activity or service");
		            		}
						}
            		} else {
            			return next("The document metadata is not in the know format. Supported metadata formats: [ Rif:CS ]");
            		}
            	}      
            	
            	sendRequests(next);
            }
        ], function (err) {
            if (err) {
                console.error(
                    'Unable to process XML Document ' + bucket + '/' + key +
                    ' due to an error: ' + err
                );
            } else {
                console.log(
                    'Successfully processed XML Document ' + bucket + '/' + key 
                );
            }

            context.done();
        }
    );
};
