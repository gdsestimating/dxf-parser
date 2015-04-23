var DxfParser = require('../');
var fs = require('fs');
var path = require('path');

var INPUT_FILE_PATH = path.join(__dirname, 'data', 'api-cw750-details.dxf');
var OUTPUT_FILE_NAME = "out.dxf";

var parser = new DxfParser();
try {
    var dxf = parser.parseSync(fs.readFileSync(INPUT_FILE_PATH, 'utf8'));
    fs.writeFileSync(OUTPUT_FILE_NAME, JSON.stringify(dxf, null, 3));
    console.log('Done writing output to ' + OUTPUT_FILE_NAME);
}catch(err) {
    console.error(err.stack);
}
