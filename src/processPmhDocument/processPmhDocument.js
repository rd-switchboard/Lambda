/**
 * Process OAI:PMH Document from AWS S3 storage and extract all records harmonized metadata into AWS Dynamo DB 
 * 
 * Supported formats:
 *    RIF:CS
 *    
 * Author: Dima Kudriavcev (dmitrij@kudriavcev.info)
 */

var xml2js = require('xml2js');
var async = require('async');
var AWS = require('aws-sdk');

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
                console.log(util.inspect(result, false, null));
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