# Buffer

The Buffer class is a implementation of a node like Binary Buffer.


## Documentation

`new Buffer(String data)`  
`new Buffer(Uint8Array data)`  
`new Buffer(ArrayBuffer data)`  
`new Buffer(Array data)`  
`new Buffer(long length)`  

### Attributes

` .byteOffset`  
Determines the offset for the next read or write operation.


`.littleEndian`  
Determines the default value for the littleEndian in methods that declares it.


`.length`  
Indicates the length of the buffer in bytes (Read-only).

### Reading Data

`.getInt8()`  
Reads a signed byte from the buffer. The returned value is between -128 and 127.


`.getUint8()`  
Reads an unsigned byte from the buffer. The returned value is  between 0 and 255.


`.getInt16([littleEndian])`  
Reads a signed 16-bit integer from the buffer. The returned value is between -32768 and 32767.


`.getUint16([littleEndian])`  
Reads an unsigned 16-bit integer from the buffer. The returned value is between 0 and 65535.


`.getInt32([littleEndian])`    
Reads a signed 32-bit integer from the buffer. The returned value is between -2147483648 and 2147483647.


`.getUint32([littleEndian])`  
Reads an unsigned 32-bit integer from the buffer. The returned value is between 0 and 4294967295.


`.getFloat32([littleEndian])`  
Reads an IEEE 754 single-precision (32-bit) floating-point number from the buffer.


`.getFloat64([littleEndian])`  
Reads an IEEE 754 double-precision (64-bit) floating-point number from the buffer.

### Writting Data

`.setInt8(value)`  
Writes a signed byte to the buffer. Only the low 8 bits are written.


`.setUint8(value)`  
Writes an unsigned byte to the buffer. Only the low 8 bits are written.

`.setInt16(value, [littleEndian])`  
Writes a 16-bit integer to the buffer. Only the low 16 bits are written.

`.setUint16(value, [littleEndian])`  
Writes a 16-bit integer to the buffer. Only the low 16 bits are written.


`.setInt32(value, [littleEndian])`  
Writes a 32-bit signed integer to the buffer.


`.setUint32(value, [littleEndian])`  
Writes a 32-bit unsigned integer to the buffer.


`.setFloat32(value, [littleEndian])`  
Writes an IEEE 754 single-precision (32-bit) floating-point number to the buffer.


`.setFloat64(value, [littleEndian])`  
Writes an IEEE 754 double-precision (64-bit) floating-point number to the buffer.

### Utility Methods

`.toJSON()`  
Returns a Object that can be serialized.  
The returned object preserves the binary data by encoding it in base64. 

`.toString([encoding], [start], [end])`  
Returns a sequence of the buffer as a String. Supported encodings are: 
`'hex'`, `'utf8'`, `'utf-8'`, `'ascii'`, `'binary'` and `'base64'`


`.inspect()`  
The inspect function is used to print the buffer to console output.

### Class Methods

`Buffer.byteLength(string)`  
Determines the actual byte length of a string.
This is not the same as `str.length`, as each characters may use more than one byte.


`Buffer.isBuffer(buffer)`  
Determines whether the argument is a Buffer object.