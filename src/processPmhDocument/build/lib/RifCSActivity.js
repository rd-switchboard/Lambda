/**
 * New node file
 */

var RifCSObject = require('./RifCSObject.js').RifCSObject;

function RifCSActivity(objectRecord) {
	RifCSObject.apply(this, arguments);
}

RifCSActivity.prototype=Object.create(RifCSObject.prototype);
RifCSActivity.prototype.constructor=RifCSActivity;

RifCSActivity.prototype.type = function() {
	return this.objectRecord.$.type;
};

RifCSActivity.prototype.dateModified = function() {
	return this.objectRecord.$.dateModified;
};

exports.RifCSActivity = RifCSActivity;