/**
 * New node file
 */

function RifCSObject(objectRecord) {
	this.objectRecord = objectRecord;
}

RifCSObject.prototype.identifiers = function() {
	var result = {};
	if (Array.isArray(this.objectRecord.identifier)) {
		for (var i = 0; i < this.objectRecord.identifier.length; ++i) {
			var identifier = this.objectRecord.identifier[i];
			// check what identifier has a type and value and result has no identifier of that type
			if (typeof identifier._ !== 'undefined' && 
					typeof identifier.$ !== 'undefined' && 
					typeof identifier.$.type !== 'undefined' && 					
					!result.hasOwnProperty(identifier.$.type)) {
				result[identifier.$.type] = identifier._;
			}
		}
	}
	
	return result;
};

RifCSObject.prototype.identifier = function(type) {
	var result = [];
	if (Array.isArray(this.objectRecord.identifier)) {
		for (var i = 0; i < this.objectRecord.identifier.length; ++i) {
			var identifier = this.objectRecord.identifier[i];
			if (typeof identifier._ !== 'undefined' && 
					typeof identifier.$ !== 'undefined' && 
					typeof identifier.$.type !== 'undefined' && 
					identifier.$.type === type) {
					
				result.push(identifier._);
			}
		}
	}
	
	return result;
};

RifCSObject.prototype.name = function(type) {
	var result = [];
	if (Array.isArray(this.objectRecord.name)) {
		for (var i = 0; i < this.objectRecord.name.length; ++i) {
			var name = this.objectRecord.name[i];
			if (typeof name.$ !== 'undefined' && name.$.type === type) {
				if (Array.isArray(name.namePart)) {
					for (var j = 0; j < name.namePart.length; ++j) {
						var namePart = name.namePart[j];
						
						result.push(typeof namePart._ !== 'undefined' ? namePart._ : namePart);
					}
				}					
			}
		}
	}
	
	return result;
};

RifCSObject.prototype.description = function(type) {
	var result = [];
	if (Array.isArray(this.objectRecord.description)) {
		for (var i = 0; i < this.objectRecord.description.length; ++i) {
			var description = this.objectRecord.description[i];
			if (typeof description.$ !== 'undefined' && description.$.type === type) {				
				result.push(typeof description._ !== 'undefined' ? description._ : description);					
			}
		}
	}
	
	return result;	
};

RifCSObject.prototype.subject = function(type) {
	var result = [];
	if (Array.isArray(this.objectRecord.subject)) {
		for (var i = 0; i < this.objectRecord.subject.length; ++i) {
			var subject = this.objectRecord.subject[i];
			if (subject.$.type === type) {			
				result.push(typeof subject._ !== 'undefined' ? subject._ : subject);					
			}
		}
	}
	
	return result;	
};

RifCSObject.prototype.relatedObjects = function(relationType) {
	var result = [];
	if (Array.isArray(this.objectRecord.relatedObject)) {
		for (var i = 0; i < this.objectRecord.relatedObject.length; ++i) {
			var relatedObject = this.objectRecord.relatedObject[i];
			if (typeof relationType === 'undefined' || 
					(typeof relatedObject.relation[0].$ !== 'undefined' &&
							relatedObject.relation[0].$.type === relationType)) {
				result.push({ 
					key: relatedObject.key[0],
					relation: relatedObject.relation[0].$.type
				});
			}
		}
	}
	
	return result;	
};

exports.RifCSObject = RifCSObject;