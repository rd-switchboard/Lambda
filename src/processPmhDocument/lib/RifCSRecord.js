/**
 * New node file
 */

var RifCSCollection = require('./RifCSCollection.js').RifCSCollection,
	RifCSParty = require('./RifCSParty.js').RifCSParty,
	RifCSActivity = require('./RifCSActivity.js').RifCSActivity,
	RifCSService = require('./RifCSService.js').RifCSService;

function RifCSRecord(record) {
	this.record = record;
}

RifCSRecord.prototype.group = function() {
	return this.record.$.group;
};

RifCSRecord.prototype.key = function() {
	return typeof this.record.key[0]._ !== 'undefined' ? this.record.key[0]._ : this.record.key[0];
};

RifCSRecord.prototype.originatingSource = function() {
	return typeof this.record.originatingSource[0]._ !== 'undefined' ? this.record.originatingSource[0]._ : this.record.originatingSource[0];
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

RifCSRecord.prototype.asParty = function() {
	return this.isParty() ? new RifCSParty(this.record.party[0]) : null;
};

RifCSRecord.prototype.asService = function() {
	return this.isService() ? new RifCSService(this.record.service[0]) : null;
};

RifCSRecord.prototype.asActivity = function() {
	return this.isActivity() ? new RifCSActivity(this.record.activity[0]) : null;
};

exports.RifCSRecord = RifCSRecord;