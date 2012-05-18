
/**
 * The Buffer class is a implementation of a node like Binary Buffer.
 */
Buffer = (function(){
    
    var INSPECT_MAX_BYTES = 256;
    
    // Handling Hex
    
    /**
     * Returns a sequence of a buffer as hex dump.
     */
    var hexSlice = function(buffer, start, end) {
        var len = buffer.length;
        
        if (!start || start < 0){
            start = 0;
        }
        if (!end || end < 0 || end > len){
            end = len;
        }
        
        var out = '';
        for (var i = start; i < end; i++) {
            out += toHex(buffer[i]);
        }
        
        return out;
    };
    
    /**
     * Returns the Hex Decimal value of a byte as string.
     */
    function toHex(n) {
      if (n < 16) return '0' + n.toString(16);
      return n.toString(16);
    }
    
    
    // Handling Base64 

    var BASE64_PADCHAR = "=";
    var BASE64_ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    
    
    var getbyte64 = function(s, i){
        // This is oddly fast, except on Chrome/V8.
        // Minimal or no improvement in performance by using a
        // object with properties mapping chars to value (eg. 'A': 0)
        var idx = BASE64_ALPHA.indexOf(s.charAt(i));
        
        if (idx === -1) {
            throw "Cannot decode base64";
        }
        
        return idx;
    }
    
    
    var base64CharAt = function(n){
        return BASE64_ALPHA.charAt(n)
    }
    
    
    var decodeBase64 = function(str){
        var pads = 0;
        var i;
        var b10;
        var imax = str.length;
        var x = [];

        str = String(str);

        if (imax === 0) {
            return str;
        }

        if (imax % 4 !== 0) {
            throw "Cannot decode base64";
        }

        if (str.charAt(imax - 1) === BASE64_PADCHAR){
            pads = 1;

            if (str.charAt(imax - 2) === BASE64_PADCHAR){
                pads = 2;
            }

            // either way, we want to ignore this last block
            imax -= 4;
        }

        for (i = 0; i < imax; i += 4) {
            b10 = (getbyte64(str, i) << 18) | (getbyte64(str, i + 1) << 12) | (getbyte64(str, i + 2) << 6) | getbyte64(str, i + 3);
            x.push(String.fromCharCode(b10 >> 16, (b10 >> 8) & 0xff, b10 & 0xff));
        }

        switch(pads){
            case 1:
                b10 = (getbyte64(str, i) << 18) | (getbyte64(str, i + 1) << 12) | (getbyte64(str, i + 2) << 6);
                x.push(String.fromCharCode(b10 >> 16, (b10 >> 8) & 0xff));
            break;
            case 2:
                b10 = (getbyte64(str, i) << 18) | (getbyte64(str, i + 1) << 12);
                x.push(String.fromCharCode(b10 >> 16));
            break;
        }

        return x.join("");
    }
    
    /**
     * Encodes a sequence of a buffer with base64
     */
    var encodeBase64 = function(buffer, start, end){
        
        var i;
        var b10;
        var x = [];
        var len = buffer.length;
        var imax = len - len % 3;
        

        if (len === 0){
            // throw error here.
            return '';
        }

        for (i = 0; i < imax; i += 3) {
            b10 = (buffer[i] << 16) | (buffer[i + 1] << 8) | buffer[i + 2];
            x.push(base64CharAt(b10 >> 18));
            x.push(base64CharAt((b10 >> 12) & 0x3F));
            x.push(base64CharAt((b10 >> 6) & 0x3f));
            x.push(base64CharAt(b10 & 0x3f));
        }

        switch(len - imax) {
        case 1:
            b10 = buffer[i] << 16;
            x.push(base64CharAt(b10 >> 18) + base64CharAt((b10 >> 12) & 0x3F) + BASE64_PADCHAR + BASE64_PADCHAR);
            break;

        case 2:
            b10 = (buffer[i] << 16) | (buffer[i + 1] << 8);
            x.push(base64CharAt(b10 >> 18) + base64CharAt((b10 >> 12) & 0x3F) + base64CharAt((b10 >> 6) & 0x3f) + BASE64_PADCHAR);
            break;
        }

        return x.join("");
    }
    
    
    // Handling Strings
    
    /**
     * Converts a utf-8 string into a binary buffer.
     */
    var toArray = function(str){
    
        var buffer = [];
        var len = str.length;
        var i = 0;
        var n;
            
        while(i < len){
            n = str.charCodeAt(i);
            expandChar(n, buffer);
            i++;
        }
        
        return buffer;
    }
    
    /**
     * Expands the character code into a sequence of bytes.
     */
    var expandChar = function(n, buffer){
        // 7 bit ASCII character - transparent to Unicode
        if(n < 0x80){
            buffer.push(n);
            return;
        }
        // compile 1-4 byte string depending on size of code point.
        // this could be more compact but shows the algorithms nicely ;)
        var b1 = null;
        var b2 = null;
        var b3 = null;
        var b4 = null;
        if( n < 0x800 ){
            // Double byte sequence (00000yyy yyzzzzzz ==> 110yyyyy 10zzzzzz)
            
            b4 = n & 63; // get b4 bits
            b3 = n >> 6; // get b3 bits
            b3 |= 192; // "110yyyyy"
            b4 |= 128; // "10zzzzzz"
        }else if( n < 0x10000 ){
            // Triple byte sequence (xxxxyyyy yyzzzzzz ==> 1110xxxx 10yyyyyy 10zzzzzz)
            
            b4 = n & 63; // get b4 bits
            b3 = ( n >>= 6 ) & 63; // get b3 bits
            b2 = ( n >>= 6 ) & 15; // get b2 bits
            b4 |= 128; // prefix "10zzzzzz"
            b3 |= 128; // prefix "10yyyyyy"
            b2 |= 224; // prefix "1110xxxx"
        }
        else if( n <= 0x10FFFF ){
            // Four byte sequence (000wwwxx xxxxyyyy yyzzzzzz ==>    11110www 10xxxxxx 10yyyyyy 10zzzzzz)
            
            b4 = n & 63; // get b4 bits
            b3 = ( n >>= 6 ) & 63; // get b3 bits
            b2 = ( n >>= 6 ) & 63; // get b2 bits
            b1 = ( n >>= 6 ) & 7;  // get b1 bits
            b4 |= 128; // prefix "10zzzzzz"
            b3 |= 128; // prefix "10yyyyyy"
            b2 |= 128; // prefix "10xxxxxx"
            b1 |= 240; // prefix "11110www"
        }else{
            // UTF allows up to 1114111
            console.log('UTF8 code points cannot be greater than 0x10FFFF [0x'+n.toString(16)+']');
            return;
        }
        // compile multi byte sequence 
        console.log('b1: '+b1);
        console.log('b2: '+b2);
        console.log('b3: '+b3);
        console.log('b4: '+b4);
        
        // pushing bytes.
        if(b1){
            buffer.push(b1);
        }
        if(b2){
            buffer.push(b2);
        }
        if(b3){
            buffer.push(b3);
        }
        if(b4){
            buffer.push(b4);
        }
    }
    
    // Buffer Implementation
    
    /**
     * 
     */
    var exports = function Buffer(data){
        
        var _data;
        var _byteOffset = 0;
        var _littleEndian = false;
        
        if(typeof data == 'string'){
            
            _data = toArray(data);
        }else if(typeof Uint8Array !== 'undefined' && data instanceof Uint8Array){
            
            _data = data;
        }else if(typeof ArrayBuffer !== 'undefined' && data instanceof ArrayBuffer){
            
            _data = new Uint8Array(data);
        }else if(Array.isArray(data)){
            
            _data = data;
        }else if(typeof data == 'number'){
            
            _data = new Uint8Array(new ArrayBuffer(data));
        }
        
        // Array Like setter and getter (does not work).
        
        this.set = function(byteOffset, value){
            _data[byteOffset] = value;
        };
        
        this.get = function(byteOffset){
            return _data[byteOffset];
        };
        
        
        // Buffer Attributes
        
        
        /**
         * Indicates the position in the buffer where the pointer is.
         */
        Object.defineProperty(this, "byteOffset", {
            get: function () {
                return _byteOffset;
            },
            set: function (value) {
                if(typeof value != 'number'){
                    throw new TypeError(".byteOffset expected int");
                }
                _byteOffset = value;
            }
        });
        
        
        /**
         * Provides a default value for the littleEndian, it provides fallback for
         * methods that has such argument.
         */
        Object.defineProperty(this, "littleEndian", {
            get: function () {
                return _littleEndian;
            },
            set: function (value) {
                if(typeof value != 'boolean'){
                    throw new TypeError(".littleEndian expected boolean");
                }
                _littleEndian = value;
            }
        });
        
        
        /**
         * Indicates the length of the buffer
         */
        Object.defineProperty(this, "length", {
            get: function () {
                return _data.length;
            }
        });
        
        
        // Reading
        
        
        /**
         * Reads a signed byte from the buffer.
         * 
         * @return A integer between -128 and 127.
         */
        this.getInt8 = function(){
            var x = _data[_byteOffset++] & 0xFF;
            return (x >= 128) ? x - 256 : x;
        };
        
        
        /**
         * Reads an unsigned byte from the buffer.
         * 
         * @return A integer between 0 and 255.
         */
        this.getUint8 = function(){
            return _data[_byteOffset++] & 0xFF;
        };
        
        
        /**
         * Reads a signed 16-bit integer from the buffer.
         * 
         * @return A integer between -32768 and 32767.
         */
        this.getInt16 = function(littleEndian){
            var x = this.getUint16(littleEndian);
            return (x >= 32768) ? x - 65536 : x;
        };
        
        
        /**
         * Reads an unsigned 16-bit integer from the buffer.
         * 
         * @return A integer between 0 and 65535.
         */
        this.getUint16 = function(littleEndian){
            
            if(typeof littleEndian == 'undefined'){
                littleEndian = _littleEndian;
            }
            
            var b1;
            var b2;
                
            if(littleEndian || false){
                b2 = (_data[_byteOffset++] & 0xFF);
                b1 = (_data[_byteOffset++] & 0xFF);
            }else{
                b1 = (_data[_byteOffset++] & 0xFF);
                b2 = (_data[_byteOffset++] & 0xFF);
            }
                
            return (b1 << 8) | (b2);
        };
        
        
        /**
         * Reads a signed 32-bit integer from the buffer.
         * 
         * @return A integer between -2147483648 and 2147483647.
         */
        this.getInt32 = function(littleEndian){
            var x = this.getUint32(littleEndian);
            return (x >= 2147483648) ? x - 4294967296 : x;
        };
        
        
        /**
         * Reads an unsigned 32-bit integer from the buffer.
         * 
         * @return A integer between 0 and 4294967295.
         */
        this.getUint32 = function(littleEndian){
            
            if(typeof littleEndian == 'undefined'){
                littleEndian = _littleEndian;
            }
            
            var b1, b2, b3, b4;
            
            if(littleEndian){
                b4 = (_data[_byteOffset++] & 0xFF);
                b3 = (_data[_byteOffset++] & 0xFF);
                b2 = (_data[_byteOffset++] & 0xFF);
                b1 = (_data[_byteOffset++] & 0xFF);
            }else{
                b1 = (_data[_byteOffset++] & 0xFF);
                b2 = (_data[_byteOffset++] & 0xFF);
                b3 = (_data[_byteOffset++] & 0xFF);
                b4 = (_data[_byteOffset++] & 0xFF);
            }
            
            return (b1 << 24) | (b2 << 16) | (b3 << 8) | b4;
        };
        
        
        /**
         * Reads an IEEE 754 single-precision (32-bit) floating-point number from the buffer.
         * 
         * @param littleEndian Optional. 
         */
        this.getFloat32 = function(littleEndian){
            
            if(typeof littleEndian == 'undefined'){
                littleEndian = _littleEndian;
            }
            
            var b0 = this._getUint8(this._endianness(byteOffset, 0, 4, littleEndian));
            var b1 = this._getUint8(this._endianness(byteOffset, 1, 4, littleEndian));
            var b2 = this._getUint8(this._endianness(byteOffset, 2, 4, littleEndian));
            var b3 = this._getUint8(this._endianness(byteOffset, 3, 4, littleEndian));
                
            var sign = 1 - (2 * (b0 >> 7));
            var exponent = (((b0 << 1) & 0xff) | (b1 >> 7)) - 127;
            var mantissa = ((b1 & 0x7f) << 16) | (b2 << 8) | b3;
        
            if (exponent === 128) {
                if (mantissa !== 0) {
                    return NaN;
                }else{
                    return sign * Infinity;
                }
            }
                
            if (exponent === -127) { // Denormalized
                return sign * mantissa * Math.pow(2, -126 - 23);
            }
        
            return sign * (1 + mantissa * Math.pow(2, -23)) * Math.pow(2, exponent);
        };
        
        
        /**
         * Reads an IEEE 754 double-precision (64-bit) floating-point number from the buffer.
         * 
         * @param littleEndian Optional. 
         */
        this.getFloat64 = function(littleEndian){
            if(typeof littleEndian == 'undefined'){
                littleEndian = _littleEndian;
            }
            /*
            var b0 = this._getUint8(this._endianness(byteOffset, 0, 8, littleEndian));
            var b1 = this._getUint8(this._endianness(byteOffset, 1, 8, littleEndian));
            var b2 = this._getUint8(this._endianness(byteOffset, 2, 8, littleEndian));
            var b3 = this._getUint8(this._endianness(byteOffset, 3, 8, littleEndian));
            var b4 = this._getUint8(this._endianness(byteOffset, 4, 8, littleEndian));
            var b5 = this._getUint8(this._endianness(byteOffset, 5, 8, littleEndian));
            var b6 = this._getUint8(this._endianness(byteOffset, 6, 8, littleEndian));
            var b7 = this._getUint8(this._endianness(byteOffset, 7, 8, littleEndian));
            */
        
            var b0 = (_data[_byteOffset++] & 0xFF);
            var b1 = (_data[_byteOffset++] & 0xFF);
            var b2 = (_data[_byteOffset++] & 0xFF);
            var b3 = (_data[_byteOffset++] & 0xFF);
            var b4 = (_data[_byteOffset++] & 0xFF);
            var b5 = (_data[_byteOffset++] & 0xFF);
            var b6 = (_data[_byteOffset++] & 0xFF);
            var b7 = (_data[_byteOffset++] & 0xFF);
        
            var sign = 1 - (2 * (b0 >> 7));
            var exponent = ((((b0 << 1) & 0xff) << 3) | (b1 >> 4)) - (Math.pow(2, 10) - 1);
        
            // Binary operators such as | and << operate on 32 bit values, using + and Math.pow(2) instead
            var mantissa = ((b1 & 0x0f) * Math.pow(2, 48)) + (b2 * Math.pow(2, 40)) + (b3 * Math.pow(2, 32)) +
                            (b4 * Math.pow(2, 24)) + (b5 * Math.pow(2, 16)) + (b6 * Math.pow(2, 8)) + b7;
        
            if (exponent === 1024) {
                if (mantissa !== 0) {
                    return NaN;
                }else{
                    return sign * Infinity;
                }
            }
                
            if (exponent === -1023) { // Denormalized
                return sign * mantissa * Math.pow(2, -1022 - 52);
            }
            
            return sign * (1 + mantissa * Math.pow(2, -52)) * Math.pow(2, exponent);
        };
        
        
        /**
         *
         */
        this.getUTF8 = function(length){
            var len = _byteOffset + length;
            var str = "";
            for(_byteOffset;_byteOffset < len;_byteOffset++){
                var b = _data[_byteOffset];
                str += String.fromCharCode(b);
            }
            return str;
        }
        
        
        // Writting
        
        
        /**
         * Writes a signed byte to the buffer.
         * 
         * @param value A integer, only the low 8 bits are written to the buffer.
         */
        this.setInt8 = function(value){
            if(typeof value != 'number'){
                throw new TypeError(".setInt8() unexpected value");
            }
            
            this.setUint8(value - 128);
        };
        
        
        /**
         * Writes a unsigned byte to the buffer.
         * 
         * @param value A integer, only the low 8 bits are written to the buffer.
         */
        this.setUint8 = function(value){
            if(typeof value != 'number'){
                throw new TypeError(".setUint8() unexpected value");
            }
        
            _data[_byteOffset++] = (value & 0xFF);
        };
        
        
        /**
         * Writes a 16-bit integer to the buffer.
         * 
         * @param value A integer, whose low 16 bits are written to the buffer.
         * @param littleEndian Optional. 
         */
        this.setInt16 = function(value, littleEndian){
            if(typeof value != 'number'){
                throw new TypeError(".setInt16() unexpected value");
            }
            
            this.setUint16(value - 32768, littleEndian);
        };
        
        
        /**
         * Writes a 16-bit integer to the buffer.
         * 
         * @param value A integer, whose low 16 bits are written to the buffer.
         * @param littleEndian Optional. 
         */
        this.setUint16 = function(value, littleEndian){
            if(typeof value != 'number'){
                throw new TypeError(".setUint16() unexpected value");
            }
            
            if(typeof littleEndian == 'undefined'){
                littleEndian = _littleEndian;
            }
            
            if(littleEndian || false){
                _data[_byteOffset++] = value & 0xFF;
                _data[_byteOffset++] = value >>> 8 & 0xFF;
            }else{
                _data[_byteOffset++] = value >>> 8 & 0xFF;
                _data[_byteOffset++] = value & 0xFF;
            }
        };
        
        
        /**
         * Writes a 32-bit signed integer to the buffer.
         * 
         * @param value A integer.
         * @param littleEndian Optional. 
         */
        this.setInt32 = function(value, littleEndian){
            if(typeof value != 'number'){
                throw new TypeError(".setInt32() unexpected value");
            }
                
            this.setUint32(value - 2147483648, littleEndian);
        };
        
        
        /**
         * Writes a 32-bit signed integer to the buffer.
         * 
         * @param value A integer.
         * @param littleEndian Optional. 
         */
        this.setUint32 = function(value, littleEndian){
            if(typeof value != 'number'){
                throw new TypeError(".setUint32() unexpected value");
            }
            
            if(typeof littleEndian == 'undefined'){
                littleEndian = _littleEndian;
            }
            
            if(littleEndian){
                // writing the 32-bit int value in the order of their least significant byte first.
                _data[_byteOffset++] = value & 0xFF;
                _data[_byteOffset++] = value >>>  8 & 0xFF;
                _data[_byteOffset++] = value >>> 16 & 0xFF;
                _data[_byteOffset++] = value >>> 24;
            }else{
                _data[_byteOffset++] = value >>> 24;
                _data[_byteOffset++] = value >>> 16 & 0xFF;
                _data[_byteOffset++] = value >>>  8 & 0xFF;
                _data[_byteOffset++] = value & 0xFF;
            }
        };
        
        
        /**
         * Writes an IEEE 754 single-precision (32-bit) floating-point number to the buffer.
         */
        this.setFloat32 = function(value, littleEndian){
            if(typeof value != 'number'){
                throw new TypeError(".setFloat32() unexpected value");
            }
            
            if(typeof littleEndian == 'undefined'){
                littleEndian = _littleEndian;
            }
        };
        
        
        /**
         * Writes an IEEE 754 double-precision (64-bit) floating-point number to the buffer.
         */
        this.setFloat64 = function(value, littleEndian){
            if(typeof value != 'number'){
                throw new TypeError(".setFloat64() unexpected value");
            }
            
            if(typeof littleEndian == 'undefined'){
                littleEndian = _littleEndian;
            }
        };
        
        
        /**
         * 
         */
        this.setUTF8 = function(str){
            var len = str.length;
            var i = 0;
            while(i < len){
                var b = str.charCodeAt(i);
                _data[_byteOffset++] = b;
                i++;
            }
        }
        
        
        // Utility Methods
        
        this.toArrayBuffer = function(){
            return _data;
        };
        
        /**
         * Returns a Object that can be serialized.
         * The returned object preserves the binary data by encoding it in base64. 
         */
        this.toJSON = function(){
            var obj = {};
            obj.__type = 'public.data';
            obj.data = this.toString('base64');
            
            return obj;
        }
        
        /**
         * 
         * @param encoding Default 'utf8'
         * @param start Optional.
         * @param end Optional.
         */
        this.toString = function(encoding, start, end){
            encoding = String(encoding || 'utf8').toLowerCase();
            start = +start || 0;
            if (typeof end == 'undefined'){
                end = this.length;
            }
            
            if (+end == start) {
                return '';
            }
            
            switch (encoding) {
                case 'hex':
                    return hexSlice(_data, start, end);
                case 'utf8':
                case 'utf-8':
                    
                    return;
                case 'ascii':
                    
                    return;
                case 'binary':
                    return;
                case 'base64':
                    return encodeBase64(_data, start, end);
                case 'ucs2':
                case 'ucs-2':
                    return;
                default:
                    throw new Error('Unknown encoding');
            }
        };
        
        this.inspect = function(){
            var out = [];
            var len = _data.length;
            for(var i = 0;i < len;i++){
                out[i] = toHex(_data[i]);
                if(i == INSPECT_MAX_BYTES){
                    out[i + 1] = '...';
                    break;
                }
            }
            return '<Buffer ' + out.join(' ') + '>';
        };
        
    };
    
    // Buffer Utilities
    
    /**
     * Determines the actual byte length of a string.
     * 
     * This is not the same as str.length, as each characters may use more than one byte.
     */
    exports.byteLength = function(string){
        var len = string.length;
        var l = 0;
        var n;
        
        for( var i = 0; i < len; i++ ){
            n = string.charCodeAt(i);
            if( n < 0x80 ){
                l += 1;
            }else if( n < 0x800 ){
                l += 2;
            }else if( n < 0x10000 ){
                l += 3;
            }else if( n <= 0x10FFFF ){
                l += 4;
            }
        }
        
        return l;
    };
    
    /**
     * Determines whether the argument is a Buffer object.
     */
    exports.isBuffer = function(buffer){
        return buffer instanceof Buffer;
    }
    
    return exports;
    
}());
