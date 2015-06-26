var fs = require('fs'),
    xml2js = require('xml2js'),
    OAIPMH = require('./lib').OAIPMH;

var parser = new xml2js.Parser();
fs.readFile('xml/0.xml', function(err, data) {
    parser.parseString(data, function (err, result) {
	var doc = new OAIPMH(result);
        console.dir(doc.records());
        console.log('Done');
    });
});
