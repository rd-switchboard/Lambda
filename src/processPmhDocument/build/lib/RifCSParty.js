/**
 * New node file
 */

var RifCSObject = require('./RifCSObject.js').RifCSObject;

function RifCSParty(objectRecord) {
	RifCSObject.apply(this, arguments);
}

RifCSParty.prototype=Object.create(RifCSObject.prototype);
RifCSParty.prototype.constructor=RifCSParty;

RifCSParty.prototype.type = function() {
	return this.objectRecord.$.type;
};

RifCSParty.prototype.dateModified = function() {
	return this.objectRecord.$.dateModified;
};

exports.RifCSParty = RifCSParty;