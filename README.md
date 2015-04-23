
# Dxf-Parser

**Dxf Parser** is a javascript parser for dxf files. It reads dxf files into one large javascript object with readable properties and a more logical structure.

Also, keep an eye on [three-dxf](https://github.com/gdsestimating/three-dxf), a browser module for rendering the output of Dxf-Parser in the browser.

#### Install
```
npm install dxf-parser
```

#### Usage
```
var parser = new DxfParser();
try {
    var dxf = parser.parseSync(fs.readFileSync(INPUT_FILE_PATH, 'utf8'));
}catch(err) {
    return console.error(err.stack);
}
```

#### Run Samples
```
node samples/parseSync
node samples/parseStream
```

#### Current Version v0.1.1
Support
* Header
* Most 2D entities
* Layers
* LType table
* Blocks Tables (not inserts)
* Some Text

Does not yet support
* Attributes
* 3DSolids
* All types of Leaders
* MText
* other less common objects and entities.

#### Run Tests
```
npm install -g mocha
//Then
npm test
//OR
mocha test
```

#### Contributors
bzuillsmith@gdsestimating.com
