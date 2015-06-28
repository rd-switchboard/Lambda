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

function isEmptyObject(obj) {
	return !Object.keys(obj).length;
}

function coutRequests(_requests) {
	var cnt = 0;
	for (var key in _requests.RequestItems) {
		if (_requests.RequestItems.hasOwnProperty(key)) {
			cnt += _requests.RequestItems[key].length;
		}
	}
	
	return cnt;
}

function formatRequests(_requests) {
	if (typeof _requests === 'undefined') {
		_requests = { 
			RequestItems: {}, 
			ReturnConsumedCapacity: "NONE", 
			ReturnItemCollectionMetrics: "NONE" 
		};
	} else {
		// restore parameters 'just in case'
		_requests.ReturnConsumedCapacity = "NONE";
		_requests.ReturnItemCollectionMetrics = "NONE";
	}
	
	var maxRequests = 25 - coutRequests(_requests);
	if (maxRequests > 0) {
		if (maxRequests > requests.length) {
			maxRequests = requests.length;
		}
		
		for (var i = 0; i < maxRequests; ++i) {
			var request = requests[i];
			var _request = { PutRequest: { Item: {} } };
			
			for(var key in request.values) {
				if (request.values.hasOwnProperty(key)) {
					if (typeof request.values[key] === 'string' ) {
						_request.PutRequest.Item[key] = { S: request.values[key] };
					} else {
						_request.PutRequest.Item[key] = request.values[key];
					}
				}
			}
			
			if (!_requests.RequestItems.hasOwnProperty(request.table)) {
				_requests.RequestItems[request.table] = [];
			}
			_requests.RequestItems[request.table].push(_request);
		}
		
		// cut off beginning of requests array
		requests = requests.slice(maxRequests, requests.length);
	}
	
	return _requests;
}

function postRequests(_requests, delay, tries, callback) {
	dynamodb.batchWriteItem(_requests, function (err, data) {
		if (err) {
			callback(err);
		} else {
			if (null !== data && !isEmptyObject(data.UnprocessedItems)) {
				if (tries > 0) {
					setTimeout(function() {
						postRequests(formatRequests(data.UnprocessedItems), delay + 1, tries - 1, callback);
					}, Math.pow(2, delay) * 50);
				} else {
					callback("Unable to pust Dynamo DB request, maximum number of tries has been reached");
				}					
			} else {
				if (requests.length > 0) {
					// we migth want to add some delay here as well
					postRequests(formatRequests(), 1, 10, callback);
				} else {
					callback(null);
				}
			}
		}
	});
}

function sendRequests(callback) {
	postRequests(formatRequests(), 1, 10, callback);
}

function addPropertyValue(key, name, value) {
	requests.push({ 
		table: "PropertyValue", 
		values: { 
			key : key, 
			PropertyName: name, 
			PropertyValue: value
		} 
	});
}

/*
function addRequest(request, callback) {
	// add request to the stack
	requests.push(request);
	
	// if we have 25 requests, execute the batch
	if (requests.length >= 25) {
		postRequests(callback);
	} else {
		callback(null);
	}
}*/

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
						
						//Key
						//PropertyName
						//ProeprtyValue
						
						
				
						var objectsCount = rif.recordsCount();
						for (var nObject = 0; nObject < objectsCount; ++nObject) {
							var registryObject = doc.record(nObject);
							
							if (registryObject.isCollection()) {
								var collection = registryObject.asCollection(); 
								// TODO add actual properties
								addPropertyValue(header.identifier(), "blah", "blah");
							} else if (registryObject.isParty()) {
								var party = registryObject.asParty(); 
							} else if (registryObject.isActivity()) {
								var activity = registryObject.asActivity(); 
							} else if (registryObject.isService()) {
								var service = registryObject.asService(); 
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
