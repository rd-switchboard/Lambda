/**
 * New node file
 */

var RifCSObject = require('./RifCSObject.js').RifCSObject;

function RifCSCollection(objectRecord) {
	RifCSObject.apply(this, arguments);
}

RifCSCollection.prototype=Object.create(RifCSObject.prototype);
RifCSCollection.prototype.constructor=RifCSCollection;

RifCSCollection.prototype.type = function() {
	return this.objectRecord.$.type;
};

RifCSCollection.prototype.dateModified = function() {
	return this.objectRecord.$.dateModified;
};

RifCSCollection.prototype.dateAccessioned = function() {
	return this.objectRecord.$.dateAccessioned;
};


exports.RifCSCollection = RifCSCollection;