var OAIPMHRecord = require('./OAIPMHRecord.js').OAIPMHRecord;

function OAIPMH(document) {
	this.document = document;
}

OAIPMH.prototype.root = function() {
	return this.document["OAI-PMH"];
};

OAIPMH.prototype.responseDate = function() {
	return this.root().responseDate;
};

OAIPMH.prototype.request = function() {
	return this.root().request;
};

OAIPMH.prototype.error = function() {
	return this.root().error;
};

OAIPMH.prototype.recordsCount = function() {
	return this.root().ListRecords[0].record.length;
};

OAIPMH.prototype.record = function(i) {
	var rec = this.root().ListRecords[0].record[i];
	return typeof rec === 'undefined' ? null : new OAIPMHRecord(rec);
};

OAIPMH.prototype.resumptionToken = function() {
	return this.root().ListRecords[0].resumptionToken[0];	
};

exports.OAIPMH = OAIPMH;
