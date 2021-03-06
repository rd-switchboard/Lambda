var fs = require('fs'),
    xml2js = require('xml2js'),
    OAIPMH = require('../lib').OAIPMH,
    RifCS = require('../lib').RifCS;
    
var parser = new xml2js.Parser();

describe('OAI:PMH', function() {
	var doc;
	
	before(function(done) {
		fs.readFile('xml/0.xml', function(err, data) {
			if (err) { 
				return done(err);
			}
			
			parser.parseString(data, function (err, document) {
				if (err) {
					return done(err);
				}
				
				doc = new OAIPMH(document);
				
				done();
			});
		});
	});
	
	it ("Should detect what document has been loaded", function() {
		expect(doc).to.exist;
	});
	
	it("Should detect OAI:PMH root node", function() {
		expect(doc.root()).to.exist;
	});
	
	it("Should detect OAI:PMH resumptionToken node", function() {
		expect(doc.resumptionToken()).to.exist;
	});
	
	describe('#records', function() {
		it("Should have 100 records", function() {
			expect(doc.recordsCount()).to.be.equal(100);
		});
		
		it("Should be able to access first record", function() {
			expect(doc.record(0)).to.exist;
		});

		it("Should be able to access last record", function() {
			expect(doc.record(99)).to.exist;
		});

		it("Should be able to not access not existing record", function() {
			expect(doc.record(100)).to.not.exist;
		});

		describe('#record[0]', function() {
			var record 
			
			before(function() {
				record = doc.record(0);
			});
			
			describe('#record[0] header', function() {
				var header;
				
				before(function() {
					header = record.header();
				});
				
				it("Should be able to access record header", function() {
					expect(header).to.exist;
				});
				
				it("The record identifier should be equal to 'oai:ands.org.au::1845'", function() {
					expect(header.identifier()).is.equal("oai:ands.org.au::1845");
				});
	
				it("The record datestamp should be equal to '2014-07-17T02:36:15Z'", function() {
					expect(header.datestamp()).is.equal("2014-07-17T02:36:15Z");
				});
				
				it("The record datasource should be equal to 'Founders-and-Survivors-Genealogical-Connections'", function() {
					expect(header.recordDatasource()).is.equal("Founders-and-Survivors-Genealogical-Connections");
				});
	
				it("The record class should be equal to 'collection'", function() {
					expect(header.recordClass()).is.equal("collection");
				});
				
				it("The record group should be equal to 'The0x20University0x20of0x20Melbourne'", function() {
					expect(header.recordGroup()).is.equal("The0x20University0x20of0x20Melbourne");
				});
			});

			describe('#record[0] metadata', function() {
				it("Should be able to access record metadata", function() {
					expect(record.metadata()).to.exist;
				});
				
				describe('Rif:CS', function() {
					var rif;
					
					before(function() {
						var metadata = record.metadata();
						if (RifCS.isRifCS(metadata))
							rif = new RifCS(metadata);
					});
	
					it("The metadata should be compalible with Rif:CS", function() {
						expect(rif).to.exist;
					});
					
					it("Should have one registry object", function() {
						expect(rif.recordsCount()).to.be.equal(1);
					});
					
					it("Should be able to access first registry object", function() {
						expect(rif.record(0)).to.exist;
					});
	
					it("Should be able to not access not existing registry object", function() {
						expect(rif.record(1)).to.not.exist;
					});
	
					describe('#registry object', function() {
						var record;
						
						before(function() {
							record = rif.record(0);
						});
						
						it("The Rif:CS object key should be equal to 'UNIMELB:AP20:c-khrd-rpt-lifedata'", function() {
							expect(record.key()).to.be.equal('UNIMELB:AP20:c-khrd-rpt-lifedata');
						});

						it("The Rif:CS object originatingSource should be equal to 'http://researchdata.ands.org.au/registry/orca/register_my_data'", function() {
							expect(record.originatingSource()).to.be.equal('http://researchdata.ands.org.au/registry/orca/register_my_data');
						});

						it("The Rif:CS object group should be equal to 'The University of Melbourne'", function() {
							expect(record.group()).to.be.equal('The University of Melbourne');
						});
	
						it("The Rif:CS object should have Collection type", function() {
							expect(record.isCollection()).to.be.equal(true);
						});
						
						it("The Rif:CS object should have not Party type", function() {
							expect(record.isParty()).to.be.not.equal(true);
						});
	
						it("The Rif:CS object should have not Party type", function() {
							expect(record.isActivity()).to.be.not.equal(true);
						});
	
						it("The Rif:CS object should have not Service type", function() {
							expect(rif.record(0).isService()).to.be.not.equal(true);
						});
						
						describe('#collection', function() {
							var collection;
							
							before(function() {
								collection = record.asCollection();
							});
							
							it("Should be accesible object as collection", function() {
								expect(collection).to.exist;
							});
	
							it("Should have dataset type", function() {
								expect(collection.type()).to.be.equal('dataset');
							});

							it("Should have dateModified equal to '2013-05-06T12:54:04'", function() {
								expect(collection.dateModified()).to.be.equal('2013-05-06T12:54:04');
							});

							it("Should have local identifier equal to [ 'UNIMELB:AP20:c-khrd-rpt-lifedata' ]", function() {
								expect(collection.identifier('local')[0]).to.be.equal('UNIMELB:AP20:c-khrd-rpt-lifedata');
							});

							it("Should have primary name equal to [ 'Koori Health Research Database life expectancy dataset' ]", function() {
								expect(collection.name('primary')[0]).to.be.equal('Koori Health Research Database life expectancy dataset');
							});

							it("Should have some full description", function() {
								expect(collection.description('full')).to.exist;
							});
							
							it("Should have some rights description", function() {
								expect(collection.description('rights')).to.exist;
							});
							
							it("Should have local subject equal to [ 'KHRD' ]", function() {
								expect(collection.subject('local')[0]).to.be.equal('KHRD');
							});
							
							it("Should be produced by 'UNIMELB:AP20:s-ap20-khrd' object", function() {
								var relation = collection.relatedObjects('isProducedBy')[0];
								expect(relation.key).to.be.equal('UNIMELB:AP20:s-ap20-khrd')
								expect(relation.relation).to.be.equal('isProducedBy');
							});

						});
					});
				});
			});			
		});
	});	
});





