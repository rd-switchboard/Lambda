var RifCSRecord = require('./RifCSRecord.js').RifCSRecord;

function RifCS(metadata) {
	this.records = metadata.registryObjects[0];
}

RifCS.isRifCS = function(metadata) {
	return typeof metadata.registryObjects !== 'undefined';	
};

RifCS.prototype.recordsCount = function() {
	return this.records.registryObject.length;
};

RifCS.prototype.record = function(i) {
	var rec = this.records.registryObject[i];
	return typeof rec === 'undefined' ? null : new RifCSRecord(rec);
};

exports.RifCS = RifCS;