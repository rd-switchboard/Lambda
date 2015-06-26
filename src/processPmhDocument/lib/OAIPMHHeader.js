/**
 * New node file
 */
function OAIPMHHeader(header) {
	this.header = header;
} 

OAIPMHHeader.prototype.identifier = function() {
	return this.header.identifier[0];
};

OAIPMHHeader.prototype.datestamp = function() {
	return this.header.datestamp[0];
};

OAIPMHHeader.prototype.getSpec = function(specType) {
	if (Array.isArray(this.header.setSpec)) {
		for (var spec in this.header.setSpec) {
			var s = this.header.setSpec[spec];
			if (s.indexOf(specType + ":") === 0) {
				return s.substring(specType.length + 1);
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
