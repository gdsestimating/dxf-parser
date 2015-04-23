
# Dxf-Parser

**Dxf Parser** is a javascript parser for dxf files. It reads dxf files into one large javascript object with readable properties and a more logical structure.

#### Install
```
npm install dxf-parser
```

#### Run Samples
```
node samples/parseSync
node samples/parseStream
```

#### Current Version v0.0.1
* Support
 * Headers
 * Most 2D entities
 * Layers
 * LType table
 * Blocks Tables (not inserts)
 * Some Text
* Does not yet support
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