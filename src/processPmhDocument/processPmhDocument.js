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
            		return next("This is not OAI:PMH Document");
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
								var collection = registryObject.asCollection(); 
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
