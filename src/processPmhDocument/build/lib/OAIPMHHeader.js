/**
 * New node file
 */
function OAIPMHHeader(header) {
	this.header = header;
} 

OAIPMHHeader.prototype.isDeleted = function() {
	return typeof this.header.$ !== 'undefined' 
		&& typeof this.header.$.status !== 'undefined' 
		&& this.header.$.status === 'deleted';
};

OAIPMHHeader.prototype.identifier = function() {
	return this.header.identifier[0];
};

OAIPMHHeader.prototype.datestamp = function() {
	return this.header.datestamp[0];
};

OAIPMHHeader.prototype.getSpec = function(specType) {
	if (Array.isArray(this.header.setSpec)) {
		for (var i = 0; i < this.header.setSpec.length; ++i) {
			var spec = this.header.setSpec[i];
			if (spec.indexOf(specType + ":") === 0) {
				return spec.substring(specType.length + 1);
			}
		}
	}
	
	return null;
};

OAIPMHHeader.prototype.recordDatasource = function() {
	return this.getSpec('datasource');
};

OAIPMHHeader.prototype.recordClass = function() {
	return this.getSpec('class');
};

OAIPMHHeader.prototype.recordGroup = function() {
	return this.getSpec('group');
};

exports.OAIPMHHeader = OAIPMHHeader;

