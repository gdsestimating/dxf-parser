var DxfParser = require('../');
var fs = require('fs');
var path = require('path');

var INPUT_FILE_PATH = path.join(__dirname, 'data', 'api-cw750-details.dxf');
var OUTPUT_FILE_NAME = "out.dxf";

var file = fs.createReadStream(INPUT_FILE_PATH, { encoding: 'utf8' });

var parser = new DxfParser();
parser.parseStream(file, function(err, dxf) {
    if(err) return console.error(err.stack);
    fs.writeFileSync(OUTPUT_FILE_NAME, JSON.stringify(dxf, null, 3));
    console.log('Done writing output to ' + OUTPUT_FILE_NAME);
});
