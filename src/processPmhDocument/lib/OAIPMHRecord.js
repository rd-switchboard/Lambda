var OAIPMHHeader = require('./OAIPMHHeader.js').OAIPMHHeader;

function OAIPMHRecord(record) {
	this.record = record;
}

OAIPMHRecord.prototype.header = function() {
	return new OAIPMHHeader(this.record.header[0]);
};

OAIPMHRecord.prototype.metadata = function() {
	return this.record.metadata[0];
};

exports.OAIPMHRecord = OAIPMHRecord;
