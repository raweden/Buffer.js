# Buffer

The Buffer class is a implementation of a node like Binary Buffer. 

A Buffer object offers a interface that is similar to the browser-side's `DataView`, but it does however focus on 
efficient reading and writting in the sense of ease, code structure to minimize bugs. This by providing "progressive"
writing and reading operation by having a internaly incremented file pointer, which is exposed by the `buffer.byteOffset`
property, a default value for endianes can also be specified on each buffer as `buffer.littleEndian`. This is rater than
specifying `byteOffset` and `littleEndian` for each read and write call which is the `DataView` provides.

## Documentation

`new Buffer(String data)`  
`new Buffer(Uint8Array data)`  
`new Buffer(ArrayBuffer data)`  
`new Buffer(Array data)`  
`new Buffer(long length)`  

### Attributes

`.byteOffset`  
Determines the offset for the next read or write operation. The pointer is always placed in the begining of the buffer when created.


`.littleEndian`  
Determines the default value for the littleEndian in methods that declares it.  
Default value is `false`.


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


## Example

Simple example that demonstrates the usage of the `Buffer` class for reading the header of a `*.bmp` image file.

    var buffer = new Buffer(xhr.response);
    // ensures the buffer signature
    if(buffer.getUint8() !== 0x42 && buffer.getUint8() !== 0x4D){
        throw new Error('invalid bmp signature');
    }
    // bmp uses little endian format.
    buffer.littleEndian = true;
    var fileSize = buffer.getUint32();
    // skips 4 reserved bytes.
    buffer.byteOffset += 4;
    // reads the header.
    var offset = buffer.getUint32();        // offset to pixel data.
    var headerLength = buffer.getUint32();
    // ensures core header (OS/2 bitmap header).
    if(headerLength !== 12){
        throw new Error('not core header');
        // a switch could be implemented here, but that to much for this example.
    }
    var width = buffer.getInt16();
    var height = buffer.getInt16();
    var colorPlaneCount = buffer.getInt16(); // 1 is the only legal value
    var bitsPerPixel = buffer.getInt16();    // 1, 4, 8 and 24
    
    console.log('bytes read: ' + buffer.byteOffset);

### Comparison to using the DataView.
    
    var data = new DataView(xhr.response);
    var le = true;    // references the little endian used.
    var offset = 0;   // references the current reading offset.
    // ensures the buffer signature
    if(data.getUint8(offset++) !== 0x42 && data.getUint8(offset++) !== 0x4D){
        throw new Error('invalid bmp signature');
    }
    
    var fileSize = buffer.getUint32(offset, le);
    // increments for the 32-bit integer and skips 4 reserved bytes.
    offset += 8;
    // reads the header.
    var offset = buffer.getUint32(offset, le);    // offset to pixel data.
    offset += 4;
    var headerLength = buffer.getUint32(offset, le);
    offset += 4;
    // ensures core header (OS/2 bitmap header).
    if(headerLength !== 12){
        throw new Error('not core header'); 
        // a switch could be implemented here, but that to much for this example.
    }
    var width = buffer.getInt16(offset, le);
    offset += 2;
    var height = buffer.getInt16(offset, le);
    offset += 2;
    var colorPlaneCount = buffer.getInt16(offset, le);
    offset += 2;
    var bitsPerPixel = buffer.getInt16(offset, le);    // 1, 4, 8 and 24
    offset += 2;
    
    console.log('bytes read: ' + offset);

The way `DataView` class forces the reading offset to be referenced introduces alot of room for developer
misstakes and also becomes painfull when delegating the reading into modules, when each module must somehow 
reference the amout of bytes they used/read back to main loop.