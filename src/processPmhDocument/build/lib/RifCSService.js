/**
 * New node file
 */

var RifCSObject = require('./RifCSObject.js').RifCSObject;

function RifCSService(objectRecord) {
	RifCSObject.apply(this, arguments);
}

RifCSService.prototype=Object.create(RifCSObject.prototype);
RifCSService.prototype.constructor=RifCSService;

RifCSService.prototype.type = function() {
	return this.objectRecord.$.type;
};

RifCSService.prototype.dateModified = function() {
	return this.objectRecord.$.dateModified;
};

exports.RifCSService = RifCSService;