/**
 * New node file
 */

function RifCSObject(objectRecord) {
	this.objectRecord = objectRecord;
}

RifCSObject.prototype.identifier = function(type) {
	var result = null;
	if (Array.isArray(this.objectRecord.identifier)) {
		for (var i = 0; i < this.objectRecord.identifier.length; ++i) {
			var identifier = this.objectRecord.identifier[i];
			if (identifier.$.type === type) {
				if (null === result) {
					result = [];
				}
					
				result.push(typeof identifier._ !== 'undefined' ? identifier._ : identifier);
			}
		}
	}
	
	return result;
};

RifCSObject.prototype.name = function(type) {
	var result = null;
	if (Array.isArray(this.objectRecord.name)) {
		for (var i = 0; i < this.objectRecord.name.length; ++i) {
			var name = this.objectRecord.name[i];
			if (name.$.type === type) {
				if (null === result) {
					result = [];
				}
				
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
	var result = null;
	if (Array.isArray(this.objectRecord.description)) {
		for (var i = 0; i < this.objectRecord.description.length; ++i) {
			var description = this.objectRecord.description[i];
			if (description.$.type === type) {
				if (null === result) {
					result = [];
				}
				
				result.push(typeof description._ !== 'undefined' ? description._ : description);					
			}
		}
	}
	
	return result;	
};

RifCSObject.prototype.subject = function(type) {
	var result = null;
	if (Array.isArray(this.objectRecord.subject)) {
		for (var i = 0; i < this.objectRecord.subject.length; ++i) {
			var subject = this.objectRecord.subject[i];
			if (subject.$.type === type) {
				if (null === result) {
					result = [];
				}
				
				result.push(typeof subject._ !== 'undefined' ? subject._ : subject);					
			}
		}
	}
	
	return result;	
};

RifCSObject.prototype.relatedObject = function(relationType) {
	var result = null;
	if (Array.isArray(this.objectRecord.relatedObject)) {
		for (var i = 0; i < this.objectRecord.relatedObject.length; ++i) {
			var relatedObject = this.objectRecord.relatedObject[i];
			if (typeof relationType === 'undefined' || 
					(typeof relatedObject.relation[0].$ !== 'undefined' &&
							relatedObject.relation[0].$.type === relationType)) {
				if (null === result) {
					result = [];
				}
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