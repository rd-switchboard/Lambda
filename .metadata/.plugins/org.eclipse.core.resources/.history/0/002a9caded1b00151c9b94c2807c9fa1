/**
 * New node file
 */

var RifCSCollection = require('./RifCSCollection.js').RifCSCollection;

function RifCSRecord(record) {
	this.record = record;
}

RifCSRecord.prototype.group = function() {
	return this.record.$.group;
};

RifCSRecord.prototype.key = function() {
	return this.record.key[0];
};

RifCSRecord.prototype.originatingSource = function() {
	return this.record.key[0];
};

RifCSRecord.prototype.isCollection = function() {
	return typeof this.record.collection !== 'undefined';
};

RifCSRecord.prototype.isParty = function() {
	return typeof this.record.party !== 'undefined';
};

RifCSRecord.prototype.isService = function() {
	return typeof this.record.service !== 'undefined';
};

RifCSRecord.prototype.isActivity = function() {
	return typeof this.record.activity !== 'undefined';
};

RifCSRecord.prototype.asCollection = function() {
	return this.isCollection() ? new RifCSCollection(this.record.collection[0]) : null;
};


exports.RifCSRecord = RifCSRecord;