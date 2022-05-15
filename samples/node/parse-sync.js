import DxfParser from '../../esm/index.js'
import fs from 'fs'
import path from 'path'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

var DXF_FILE_PATH = path.join(__dirname, '..', 'data', 'api-cw750-details.dxf');
var OUTPUT_FILE_NAME = "out.json";

var fileText = fs.readFileSync(DXF_FILE_PATH, 'utf8');

var parser = new DxfParser();
try {
    var dxf = parser.parseSync(fileText);
    fs.writeFileSync(OUTPUT_FILE_NAME, JSON.stringify(dxf, null, 3));
    console.log('Done writing output to ' + OUTPUT_FILE_NAME);
}catch(err) {
    console.error(err.stack);
}
