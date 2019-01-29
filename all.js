(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (process){
const geoPattern = require('geopattern')

document.addEventListener('DOMContentLoaded', () => {
    Array.from(document.querySelectorAll('.geopattern')).forEach((element) => {
        const seed = element.dataset.seed || Math.random().toString(32).slice(2)

        if (process.env.NODE_ENV !== 'production') {
            console.log(`geopattern seed:`, seed)
        }

        const color = element.dataset.color || undefined
        const baseColor = element.dataset.baseColor || undefined

        element.style.backgroundImage = geoPattern.generate(seed, { color, baseColor }).toDataUrl()
    })
})

}).call(this,require('_process'))
},{"_process":12,"geopattern":4}],2:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  for (var i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],3:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

},{"base64-js":2,"ieee754":11}],4:[function(require,module,exports){
(function ($) {

'use strict';

var Pattern = require('./lib/pattern');

/*
 * Normalize arguments, if not given, to:
 * string: (new Date()).toString()
 * options: {}
 */
function optArgs(cb) {
	return function (string, options) {
		if (typeof string === 'object') {
			options = string;
			string = null;
		}
		if (string === null || string === undefined) {
			string = (new Date()).toString();
		}
		if (!options) {
			options = {};
		}

		return cb.call(this, string, options);
	};
}

var GeoPattern = module.exports = {
	generate: optArgs(function (string, options) {
		return new Pattern(string, options);
	})
};

if ($) {

	// If jQuery, add plugin
	$.fn.geopattern = optArgs(function (string, options) {
		return this.each(function () {
			var titleSha = $(this).attr('data-title-sha');
			if (titleSha) {
				options = $.extend({
					hash: titleSha
				}, options);
			}
			var pattern = GeoPattern.generate(string, options);
			$(this).css('background-image', pattern.toDataUrl());
		});
	});

}

}(typeof jQuery !== 'undefined' ? jQuery : null));

},{"./lib/pattern":6}],5:[function(require,module,exports){
/*eslint sort-vars:0, curly:0*/

'use strict';

/**
 * Converts a hex CSS color value to RGB.
 * Adapted from http://stackoverflow.com/a/5624139.
 *
 * @param	String	hex		The hexadecimal color value
 * @return	Object			The RGB representation
 */
function hex2rgb(hex) {
	// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
	var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
	hex = hex.replace(shorthandRegex, function (m, r, g, b) {
		return r + r + g + g + b + b;
	});

	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	} : null;
}

/**
 * Converts an RGB color value to a hex string.
 * @param  Object rgb RGB as r, g, and b keys
 * @return String     Hex color string
 */
function rgb2hex(rgb) {
	return '#' + ['r', 'g', 'b'].map(function (key) {
		return ('0' + rgb[key].toString(16)).slice(-2);
	}).join('');
}

/**
 * Converts an RGB color value to HSL. Conversion formula adapted from
 * http://en.wikipedia.org/wiki/HSL_color_space. This function adapted
 * from http://stackoverflow.com/a/9493060.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and l in the set [0, 1].
 *
 * @param   Object  rgb     RGB as r, g, and b keys
 * @return  Object          HSL as h, s, and l keys
 */
function rgb2hsl(rgb) {
	var r = rgb.r, g = rgb.g, b = rgb.b;
	r /= 255; g /= 255; b /= 255;
	var max = Math.max(r, g, b), min = Math.min(r, g, b);
	var h, s, l = (max + min) / 2;

	if (max === min) {
		h = s = 0; // achromatic
	} else {
		var d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case r: h = (g - b) / d + (g < b ? 6 : 0); break;
			case g: h = (b - r) / d + 2; break;
			case b: h = (r - g) / d + 4; break;
		}
		h /= 6;
	}

	return { h: h, s: s, l: l };
}

/**
 * Converts an HSL color value to RGB. Conversion formula adapted from
 * http://en.wikipedia.org/wiki/HSL_color_space. This function adapted
 * from http://stackoverflow.com/a/9493060.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Object  hsl     HSL as h, s, and l keys
 * @return  Object          RGB as r, g, and b values
 */
function hsl2rgb(hsl) {

	function hue2rgb(p, q, t) {
		if (t < 0) t += 1;
		if (t > 1) t -= 1;
		if (t < 1 / 6) return p + (q - p) * 6 * t;
		if (t < 1 / 2) return q;
		if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
		return p;
	}

	var h = hsl.h, s = hsl.s, l = hsl.l;
	var r, g, b;

	if(s === 0){
		r = g = b = l; // achromatic
	}else{

		var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		var p = 2 * l - q;
		r = hue2rgb(p, q, h + 1 / 3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1 / 3);
	}

	return {
		r: Math.round(r * 255),
		g: Math.round(g * 255),
		b: Math.round(b * 255)
	};
}

module.exports = {
	hex2rgb: hex2rgb,
	rgb2hex: rgb2hex,
	rgb2hsl: rgb2hsl,
	hsl2rgb: hsl2rgb,
	rgb2rgbString: function (rgb) {
		return 'rgb(' + [rgb.r, rgb.g, rgb.b].join(',') + ')';
	}
};

},{}],6:[function(require,module,exports){
(function (Buffer){
'use strict';

var extend = require('extend');
var color  = require('./color');
var SHA1   = require('./sha1');
var SVG    = require('./svg');



var DEFAULTS = {
	baseColor: '#933c3c'
};

var PATTERNS = [
	'octogons',
	'overlappingCircles',
	'plusSigns',
	'xes',
	'sineWaves',
	'hexagons',
	'overlappingRings',
	'plaid',
	'triangles',
	'squares',
	'concentricCircles',
	'diamonds',
	'tessellation',
	'nestedSquares',
	'mosaicSquares',
	'chevrons'
];

var FILL_COLOR_DARK  = '#222';
var FILL_COLOR_LIGHT = '#ddd';
var STROKE_COLOR     = '#000';
var STROKE_OPACITY   = 0.02;
var OPACITY_MIN      = 0.02;
var OPACITY_MAX      = 0.15;



// Helpers

/**
 * Extract a substring from a hex string and parse it as an integer
 * @param {string} hash - Source hex string
 * @param {number} index - Start index of substring
 * @param {number} [length] - Length of substring. Defaults to 1.
 */
function hexVal(hash, index, len) {
	return parseInt(hash.substr(index, len || 1), 16);
}

/*
 * Re-maps a number from one range to another
 * http://processing.org/reference/map_.html
 */
function map(value, vMin, vMax, dMin, dMax) {
	var vValue = parseFloat(value);
	var vRange = vMax - vMin;
	var dRange = dMax - dMin;

	return (vValue - vMin) * dRange / vRange + dMin;
}

function fillColor(val) {
	return (val % 2 === 0) ? FILL_COLOR_LIGHT : FILL_COLOR_DARK;
}

function fillOpacity(val) {
	return map(val, 0, 15, OPACITY_MIN, OPACITY_MAX);
}



var Pattern = module.exports = function (string, options) {
	this.opts = extend({}, DEFAULTS, options);
	this.hash = options.hash || SHA1(string);
	this.svg = new SVG();

	this.generateBackground();
	this.generatePattern();

	return this;
};

Pattern.prototype.toSvg = function () {
	return this.svg.toString();
};

Pattern.prototype.toString = function () {
	return this.toSvg();
};

Pattern.prototype.toBase64 = function () {
	var str = this.toSvg();
	var b64;

	// Use window.btoa if in the browser; otherwise fallback to node buffers
	if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
		b64 = window.btoa(str);
	} else {
		b64 = new Buffer(str).toString('base64');
	}

	return b64;
};

Pattern.prototype.toDataUri = function () {
	return 'data:image/svg+xml;base64,' + this.toBase64();
};

Pattern.prototype.toDataUrl = function () {
	return 'url("' + this.toDataUri() + '")';
};

Pattern.prototype.generateBackground = function () {
	var baseColor, hueOffset, rgb, satOffset;

	if (this.opts.color) {
		rgb = color.hex2rgb(this.opts.color);
	} else {
		hueOffset = map(hexVal(this.hash, 14, 3), 0, 4095, 0, 359);
		satOffset = hexVal(this.hash, 17);
		baseColor = color.rgb2hsl(color.hex2rgb(this.opts.baseColor));

		baseColor.h = (((baseColor.h * 360 - hueOffset) + 360) % 360) / 360;

		if (satOffset % 2 === 0) {
			baseColor.s = Math.min(1, ((baseColor.s * 100) + satOffset) / 100);
		} else {
			baseColor.s = Math.max(0, ((baseColor.s * 100) - satOffset) / 100);
		}
		rgb = color.hsl2rgb(baseColor);
	}

	this.color = color.rgb2hex(rgb);

	this.svg.rect(0, 0, '100%', '100%', {
		fill: color.rgb2rgbString(rgb)
	});
};

Pattern.prototype.generatePattern = function () {
	var generator = this.opts.generator;

	if (generator) {
		if (PATTERNS.indexOf(generator) < 0) {
			throw new Error('The generator '
				+ generator
				+ ' does not exist.');
		}
	} else {
		generator = PATTERNS[hexVal(this.hash, 20)];
	}

	return this['geo' + generator.slice(0, 1).toUpperCase() + generator.slice(1)]();
};

function buildHexagonShape(sideLength) {
	var c = sideLength;
	var a = c / 2;
	var b = Math.sin(60 * Math.PI / 180) * c;
	return [
		0, b,
		a, 0,
		a + c, 0,
		2 * c, b,
		a + c, 2 * b,
		a, 2 * b,
		0, b
	].join(',');
}

Pattern.prototype.geoHexagons = function () {
	var scale      = hexVal(this.hash, 0);
	var sideLength = map(scale, 0, 15, 8, 60);
	var hexHeight  = sideLength * Math.sqrt(3);
	var hexWidth   = sideLength * 2;
	var hex        = buildHexagonShape(sideLength);
	var dy, fill, i, opacity, styles, val, x, y;

	this.svg.setWidth(hexWidth * 3 + sideLength * 3);
	this.svg.setHeight(hexHeight * 6);

	i = 0;
	for (y = 0; y < 6; y++) {
		for (x = 0; x < 6; x++) {
			val     = hexVal(this.hash, i);
			dy      = x % 2 === 0 ? y * hexHeight : y * hexHeight + hexHeight / 2;
			opacity = fillOpacity(val);
			fill    = fillColor(val);

			styles = {
				fill: fill,
				'fill-opacity': opacity,
				stroke: STROKE_COLOR,
				'stroke-opacity': STROKE_OPACITY
			};

			this.svg.polyline(hex, styles).transform({
				translate: [
					x * sideLength * 1.5 - hexWidth / 2,
					dy - hexHeight / 2
				]
			});

			// Add an extra one at top-right, for tiling.
			if (x === 0) {
				this.svg.polyline(hex, styles).transform({
					translate: [
						6 * sideLength * 1.5 - hexWidth / 2,
						dy - hexHeight / 2
					]
				});
			}

			// Add an extra row at the end that matches the first row, for tiling.
			if (y === 0) {
				dy = x % 2 === 0 ? 6 * hexHeight : 6 * hexHeight + hexHeight / 2;
				this.svg.polyline(hex, styles).transform({
					translate: [
						x * sideLength * 1.5 - hexWidth / 2,
						dy - hexHeight / 2
					]
				});
			}

			// Add an extra one at bottom-right, for tiling.
			if (x === 0 && y === 0) {
				this.svg.polyline(hex, styles).transform({
					translate: [
						6 * sideLength * 1.5 - hexWidth / 2,
						5 * hexHeight + hexHeight / 2
					]
				});
			}

			i++;
		}
	}
};

Pattern.prototype.geoSineWaves = function () {
	var period    = Math.floor(map(hexVal(this.hash, 0), 0, 15, 100, 400));
	var amplitude = Math.floor(map(hexVal(this.hash, 1), 0, 15, 30, 100));
	var waveWidth = Math.floor(map(hexVal(this.hash, 2), 0, 15, 3, 30));
	var fill, i, opacity, str, styles, val, xOffset;

	this.svg.setWidth(period);
	this.svg.setHeight(waveWidth * 36);

	for (i = 0; i < 36; i++) {
		val     = hexVal(this.hash, i);
		opacity = fillOpacity(val);
		fill    = fillColor(val);
		xOffset = period / 4 * 0.7;

		styles = {
			fill: 'none',
			stroke: fill,
			opacity: opacity,
			'stroke-width': '' + waveWidth + 'px'
		};

		str = 'M0 ' + amplitude +
			' C ' + xOffset + ' 0, ' + (period / 2 - xOffset) + ' 0, ' + (period / 2) + ' ' + amplitude +
			' S ' + (period - xOffset) + ' ' + (amplitude * 2) + ', ' + period + ' ' + amplitude +
			' S ' + (period * 1.5 - xOffset) + ' 0, ' + (period * 1.5) + ', ' + amplitude;

		this.svg.path(str, styles).transform({
			translate: [
				-period / 4,
				waveWidth * i - amplitude * 1.5
			]
		});
		this.svg.path(str, styles).transform({
			translate: [
				-period / 4,
				waveWidth * i - amplitude * 1.5 + waveWidth * 36
			]
		});
	}
};

function buildChevronShape(width, height) {
	var e = height * 0.66;
	return [
		[
			0, 0,
			width / 2, height - e,
			width / 2, height,
			0, e,
			0, 0
		],
		[
			width / 2, height - e,
			width, 0,
			width, e,
			width / 2, height,
			width / 2, height - e
		]
	].map(function (x) { return x.join(','); });
}

Pattern.prototype.geoChevrons = function () {
	var chevronWidth  = map(hexVal(this.hash, 0), 0, 15, 30, 80);
	var chevronHeight = map(hexVal(this.hash, 0), 0, 15, 30, 80);
	var chevron       = buildChevronShape(chevronWidth, chevronHeight);
	var fill, i, opacity, styles, val, x, y;

	this.svg.setWidth(chevronWidth * 6);
	this.svg.setHeight(chevronHeight * 6 * 0.66);

	i = 0;
	for (y = 0; y < 6; y++) {
		for (x = 0; x < 6; x++) {
			val     = hexVal(this.hash, i);
			opacity = fillOpacity(val);
			fill    = fillColor(val);

			styles = {
				stroke: STROKE_COLOR,
				'stroke-opacity': STROKE_OPACITY,
				fill: fill,
				'fill-opacity': opacity,
				'stroke-width': 1
			};

			this.svg.group(styles).transform({
				translate: [
					x * chevronWidth,
					y * chevronHeight * 0.66 - chevronHeight / 2
				]
			}).polyline(chevron).end();

			// Add an extra row at the end that matches the first row, for tiling.
			if (y === 0) {
				this.svg.group(styles).transform({
					translate: [
						x * chevronWidth,
						6 * chevronHeight * 0.66 - chevronHeight / 2
					]
				}).polyline(chevron).end();
			}

			i += 1;
		}
	}
};

function buildPlusShape(squareSize) {
	return [
		[squareSize, 0, squareSize, squareSize * 3],
		[0, squareSize, squareSize * 3, squareSize]
	];
}

Pattern.prototype.geoPlusSigns = function () {
	var squareSize = map(hexVal(this.hash, 0), 0, 15, 10, 25);
	var plusSize   = squareSize * 3;
	var plusShape  = buildPlusShape(squareSize);
	var dx, fill, i, opacity, styles, val, x, y;

	this.svg.setWidth(squareSize * 12);
	this.svg.setHeight(squareSize * 12);

	i = 0;
	for (y = 0; y < 6; y++) {
		for (x = 0; x < 6; x++) {
			val     = hexVal(this.hash, i);
			opacity = fillOpacity(val);
			fill    = fillColor(val);
			dx      = (y % 2 === 0) ? 0 : 1;

			styles = {
				fill: fill,
				stroke: STROKE_COLOR,
				'stroke-opacity': STROKE_OPACITY,
				'fill-opacity': opacity
			};

			this.svg.group(styles).transform({
				translate: [
					x * plusSize - x * squareSize + dx * squareSize - squareSize,
					y * plusSize - y * squareSize - plusSize / 2
				]
			}).rect(plusShape).end();

			// Add an extra column on the right for tiling.
			if (x === 0) {
				this.svg.group(styles).transform({
					translate: [
						4 * plusSize - x * squareSize + dx * squareSize - squareSize,
						y * plusSize - y * squareSize - plusSize / 2
					]
				}).rect(plusShape).end();
			}

			// Add an extra row on the bottom that matches the first row, for tiling
			if (y === 0) {
				this.svg.group(styles).transform({
					translate: [
						x * plusSize - x * squareSize + dx * squareSize - squareSize,
						4 * plusSize - y * squareSize - plusSize / 2
					]
				}).rect(plusShape).end();
			}

			// Add an extra one at top-right and bottom-right, for tiling
			if (x === 0 && y === 0) {
				this.svg.group(styles).transform({
					translate: [
						4 * plusSize - x * squareSize + dx * squareSize - squareSize,
						4 * plusSize - y * squareSize - plusSize / 2
					]
				}).rect(plusShape).end();
			}

			i++;
		}
	}
};

Pattern.prototype.geoXes = function () {
	var squareSize = map(hexVal(this.hash, 0), 0, 15, 10, 25);
	var xShape     = buildPlusShape(squareSize);
	var xSize      = squareSize * 3 * 0.943;
	var dy, fill, i, opacity, styles, val, x, y;

	this.svg.setWidth(xSize * 3);
	this.svg.setHeight(xSize * 3);

	i = 0;
	for (y = 0; y < 6; y++) {
		for (x = 0; x < 6; x++) {
			val     = hexVal(this.hash, i);
			opacity = fillOpacity(val);
			dy      = x % 2 === 0 ? y * xSize - xSize * 0.5 : y * xSize - xSize * 0.5 + xSize / 4;
			fill    = fillColor(val);

			styles = {
				fill: fill,
				opacity: opacity
			};

			this.svg.group(styles).transform({
				translate: [
					x * xSize / 2 - xSize / 2,
					dy - y * xSize / 2
				],
				rotate: [
					45,
					xSize / 2,
					xSize / 2
				]
			}).rect(xShape).end();

			// Add an extra column on the right for tiling.
			if (x === 0) {
				this.svg.group(styles).transform({
					translate: [
						6 * xSize / 2 - xSize / 2,
						dy - y * xSize / 2
					],
					rotate: [
						45,
						xSize / 2,
						xSize / 2
					]
				}).rect(xShape).end();
			}

			// // Add an extra row on the bottom that matches the first row, for tiling.
			if (y === 0) {
				dy = x % 2 === 0 ? 6 * xSize - xSize / 2 : 6 * xSize - xSize / 2 + xSize / 4;
				this.svg.group(styles).transform({
					translate: [
						x * xSize / 2 - xSize / 2,
						dy - 6 * xSize / 2
					],
					rotate: [
						45,
						xSize / 2,
						xSize / 2
					]
				}).rect(xShape).end();
			}

			// These can hang off the bottom, so put a row at the top for tiling.
			if (y === 5) {
				this.svg.group(styles).transform({
					translate: [
						x * xSize / 2 - xSize / 2,
						dy - 11 * xSize / 2
					],
					rotate: [
						45,
						xSize / 2,
						xSize / 2
					]
				}).rect(xShape).end();
			}

			// Add an extra one at top-right and bottom-right, for tiling
			if (x === 0 && y === 0) {
				this.svg.group(styles).transform({
					translate: [
						6 * xSize / 2 - xSize / 2,
						dy - 6 * xSize / 2
					],
					rotate: [
						45,
						xSize / 2,
						xSize / 2
					]
				}).rect(xShape).end();
			}
			i++;
		}
	}
};

Pattern.prototype.geoOverlappingCircles = function () {
	var scale    = hexVal(this.hash, 0);
	var diameter = map(scale, 0, 15, 25, 200);
	var radius   = diameter / 2;
	var circle, fill, i, opacity, styles, val, x, y;

	this.svg.setWidth(radius * 6);
	this.svg.setHeight(radius * 6);

	i = 0;
	for (y = 0; y < 6; y++) {
		for (x = 0; x < 6; x++) {
			val     = hexVal(this.hash, i);
			opacity = fillOpacity(val);
			fill    = fillColor(val);

			styles = {
				fill: fill,
				opacity: opacity
			};

			this.svg.circle(x * radius, y * radius, radius, styles);

			// Add an extra one at top-right, for tiling.
			if (x === 0) {
				this.svg.circle(6 * radius, y * radius, radius, styles);
			}

			// // Add an extra row at the end that matches the first row, for tiling.
			if (y === 0) {
				this.svg.circle(x * radius, 6 * radius, radius, styles);
			}

			// // Add an extra one at bottom-right, for tiling.
			if (x === 0 && y === 0) {
				this.svg.circle(6 * radius, 6 * radius, radius, styles);
			}

			i++;
		}
	}
};

function buildOctogonShape(squareSize) {
	var s = squareSize;
	var c = s * 0.33;
	return [
		c, 0,
		s - c, 0,
		s, c,
		s, s - c,
		s - c, s,
		c, s,
		0, s - c,
		0, c,
		c, 0
	].join(',');
}

Pattern.prototype.geoOctogons = function () {
	var squareSize = map(hexVal(this.hash, 0), 0, 15, 10, 60);
	var tile       = buildOctogonShape(squareSize);
	var fill, i, opacity, val, x, y;

	this.svg.setWidth(squareSize * 6);
	this.svg.setHeight(squareSize * 6);

	i = 0;
	for (y = 0; y < 6; y++) {
		for (x = 0; x < 6; x++) {
			val     = hexVal(this.hash, i);
			opacity = fillOpacity(val);
			fill    = fillColor(val);

			this.svg.polyline(tile, {
				fill: fill,
				'fill-opacity': opacity,
				stroke: STROKE_COLOR,
				'stroke-opacity': STROKE_OPACITY
			}).transform({
				translate: [
					x * squareSize,
					y * squareSize
				]
			});

			i += 1;
		}
	}
};

Pattern.prototype.geoSquares = function () {
	var squareSize = map(hexVal(this.hash, 0), 0, 15, 10, 60);
	var fill, i, opacity, val, x, y;

	this.svg.setWidth(squareSize * 6);
	this.svg.setHeight(squareSize * 6);

	i = 0;
	for (y = 0; y < 6; y++) {
		for (x = 0; x < 6; x++) {
			val     = hexVal(this.hash, i);
			opacity = fillOpacity(val);
			fill    = fillColor(val);

			this.svg.rect(x * squareSize, y * squareSize, squareSize, squareSize, {
				fill: fill,
				'fill-opacity': opacity,
				stroke: STROKE_COLOR,
				'stroke-opacity': STROKE_OPACITY
			});

			i += 1;
		}
	}
};

Pattern.prototype.geoConcentricCircles = function () {
	var scale       = hexVal(this.hash, 0);
	var ringSize    = map(scale, 0, 15, 10, 60);
	var strokeWidth = ringSize / 5;
	var fill, i, opacity, val, x, y;

	this.svg.setWidth((ringSize + strokeWidth) * 6);
	this.svg.setHeight((ringSize + strokeWidth) * 6);

	i = 0;
	for (y = 0; y < 6; y++) {
		for (x = 0; x < 6; x++) {
			val     = hexVal(this.hash, i);
			opacity = fillOpacity(val);
			fill    = fillColor(val);

			this.svg.circle(
				x * ringSize + x * strokeWidth + (ringSize + strokeWidth) / 2,
				y * ringSize + y * strokeWidth + (ringSize + strokeWidth) / 2,
				ringSize / 2,
				{
					fill: 'none',
					stroke: fill,
					opacity: opacity,
					'stroke-width': strokeWidth + 'px'
				}
			);

			val     = hexVal(this.hash, 39 - i);
			opacity = fillOpacity(val);
			fill    = fillColor(val);

			this.svg.circle(
				x * ringSize + x * strokeWidth + (ringSize + strokeWidth) / 2,
				y * ringSize + y * strokeWidth + (ringSize + strokeWidth) / 2,
				ringSize / 4,
				{
					fill: fill,
					'fill-opacity': opacity
				}
			);

			i += 1;
		}
	}
};

Pattern.prototype.geoOverlappingRings = function () {
	var scale       = hexVal(this.hash, 0);
	var ringSize    = map(scale, 0, 15, 10, 60);
	var strokeWidth = ringSize / 4;
	var fill, i, opacity, styles, val, x, y;

	this.svg.setWidth(ringSize * 6);
	this.svg.setHeight(ringSize * 6);

	i = 0;
	for (y = 0; y < 6; y++) {
		for (x = 0; x < 6; x++) {
			val     = hexVal(this.hash, i);
			opacity = fillOpacity(val);
			fill    = fillColor(val);

			styles = {
				fill: 'none',
				stroke: fill,
				opacity: opacity,
				'stroke-width': strokeWidth + 'px'
			};

			this.svg.circle(x * ringSize, y * ringSize, ringSize - strokeWidth / 2, styles);

			// Add an extra one at top-right, for tiling.
			if (x === 0) {
				this.svg.circle(6 * ringSize, y * ringSize, ringSize - strokeWidth / 2, styles);
			}

			if (y === 0) {
				this.svg.circle(x * ringSize, 6 * ringSize, ringSize - strokeWidth / 2, styles);
			}

			if (x === 0 && y === 0) {
				this.svg.circle(6 * ringSize, 6 * ringSize, ringSize - strokeWidth / 2, styles);
			}

			i += 1;
		}
	}
};

function buildTriangleShape(sideLength, height) {
	var halfWidth = sideLength / 2;
	return [
		halfWidth, 0,
		sideLength, height,
		0, height,
		halfWidth, 0
	].join(',');
}

Pattern.prototype.geoTriangles = function () {
	var scale          = hexVal(this.hash, 0);
	var sideLength     = map(scale, 0, 15, 15, 80);
	var triangleHeight = sideLength / 2 * Math.sqrt(3);
	var triangle       = buildTriangleShape(sideLength, triangleHeight);
	var fill, i, opacity, rotation, styles, val, x, y;

	this.svg.setWidth(sideLength * 3);
	this.svg.setHeight(triangleHeight * 6);

	i = 0;
	for (y = 0; y < 6; y++) {
		for (x = 0; x < 6; x++) {
			val     = hexVal(this.hash, i);
			opacity = fillOpacity(val);
			fill    = fillColor(val);

			styles = {
				fill: fill,
				'fill-opacity': opacity,
				stroke: STROKE_COLOR,
				'stroke-opacity': STROKE_OPACITY
			};

			if (y % 2 === 0) {
				rotation = x % 2 === 0 ? 180 : 0;
			} else {
				rotation = x % 2 !== 0 ? 180 : 0;
			}

			this.svg.polyline(triangle, styles).transform({
				translate: [
					x * sideLength * 0.5 - sideLength / 2,
					triangleHeight * y
				],
				rotate: [
					rotation,
					sideLength / 2,
					triangleHeight / 2
				]
			});

			// Add an extra one at top-right, for tiling.
			if (x === 0) {
				this.svg.polyline(triangle, styles).transform({
					translate: [
						6 * sideLength * 0.5 - sideLength / 2,
						triangleHeight * y
					],
					rotate: [
						rotation,
						sideLength / 2,
						triangleHeight / 2
					]
				});
			}

			i += 1;
		}
	}
};

function buildDiamondShape(width, height) {
	return [
		width / 2, 0,
		width, height / 2,
		width / 2, height,
		0, height / 2
	].join(',');
}

Pattern.prototype.geoDiamonds = function () {
	var diamondWidth  = map(hexVal(this.hash, 0), 0, 15, 10, 50);
	var diamondHeight = map(hexVal(this.hash, 1), 0, 15, 10, 50);
	var diamond       = buildDiamondShape(diamondWidth, diamondHeight);
	var dx, fill, i, opacity, styles, val, x, y;

	this.svg.setWidth(diamondWidth * 6);
	this.svg.setHeight(diamondHeight * 3);

	i = 0;
	for (y = 0; y < 6; y++) {
		for (x = 0; x < 6; x++) {
			val     = hexVal(this.hash, i);
			opacity = fillOpacity(val);
			fill    = fillColor(val);

			styles = {
				fill: fill,
				'fill-opacity': opacity,
				stroke: STROKE_COLOR,
				'stroke-opacity': STROKE_OPACITY
			};

			dx = (y % 2 === 0) ? 0 : diamondWidth / 2;

			this.svg.polyline(diamond, styles).transform({
				translate: [
					x * diamondWidth - diamondWidth / 2 + dx,
					diamondHeight / 2 * y - diamondHeight / 2
				]
			});

			// Add an extra one at top-right, for tiling.
			if (x === 0) {
				this.svg.polyline(diamond, styles).transform({
					translate: [
						6 * diamondWidth - diamondWidth / 2 + dx,
						diamondHeight / 2 * y - diamondHeight / 2
					]
				});
			}

			// Add an extra row at the end that matches the first row, for tiling.
			if (y === 0) {
				this.svg.polyline(diamond, styles).transform({
					translate: [
						x * diamondWidth - diamondWidth / 2 + dx,
						diamondHeight / 2 * 6 - diamondHeight / 2
					]
				});
			}

			// Add an extra one at bottom-right, for tiling.
			if (x === 0 && y === 0) {
				this.svg.polyline(diamond, styles).transform({
					translate: [
						6 * diamondWidth - diamondWidth / 2 + dx,
						diamondHeight / 2 * 6 - diamondHeight / 2
					]
				});
			}

			i += 1;
		}
	}
};

Pattern.prototype.geoNestedSquares = function () {
	var blockSize  = map(hexVal(this.hash, 0), 0, 15, 4, 12);
	var squareSize = blockSize * 7;
	var fill, i, opacity, styles, val, x, y;

	this.svg.setWidth((squareSize + blockSize) * 6 + blockSize * 6);
	this.svg.setHeight((squareSize + blockSize) * 6 + blockSize * 6);

	i = 0;
	for (y = 0; y < 6; y++) {
		for (x = 0; x < 6; x++) {
			val     = hexVal(this.hash, i);
			opacity = fillOpacity(val);
			fill    = fillColor(val);

			styles = {
				fill: 'none',
				stroke: fill,
				opacity: opacity,
				'stroke-width': blockSize + 'px'
			};

			this.svg.rect(x * squareSize + x * blockSize * 2 + blockSize / 2,
			              y * squareSize + y * blockSize * 2 + blockSize / 2,
			              squareSize, squareSize, styles);

			val     = hexVal(this.hash, 39 - i);
			opacity = fillOpacity(val);
			fill    = fillColor(val);

			styles = {
				fill: 'none',
				stroke: fill,
				opacity: opacity,
				'stroke-width': blockSize + 'px'
			};

			this.svg.rect(x * squareSize + x * blockSize * 2 + blockSize / 2 + blockSize * 2,
			              y * squareSize + y * blockSize * 2 + blockSize / 2 + blockSize * 2,
			              blockSize * 3, blockSize * 3, styles);

			i += 1;
		}
	}
};

function buildRightTriangleShape(sideLength) {
	return [
		0, 0,
		sideLength, sideLength,
		0, sideLength,
		0, 0
	].join(',');
}

function drawInnerMosaicTile(svg, x, y, triangleSize, vals) {
	var triangle = buildRightTriangleShape(triangleSize);
	var opacity  = fillOpacity(vals[0]);
	var fill     = fillColor(vals[0]);
	var styles   = {
		stroke: STROKE_COLOR,
		'stroke-opacity': STROKE_OPACITY,
		'fill-opacity': opacity,
		fill: fill
	};

	svg.polyline(triangle, styles).transform({
		translate: [
			x + triangleSize,
			y
		],
		scale: [-1, 1]
	});
	svg.polyline(triangle, styles).transform({
		translate: [
			x + triangleSize,
			y + triangleSize * 2
		],
		scale: [1, -1]
	});

	opacity = fillOpacity(vals[1]);
	fill    = fillColor(vals[1]);
	styles  = {
		stroke: STROKE_COLOR,
		'stroke-opacity': STROKE_OPACITY,
		'fill-opacity': opacity,
		fill: fill
	};

	svg.polyline(triangle, styles).transform({
		translate: [
			x + triangleSize,
			y + triangleSize * 2
		],
		scale: [-1, -1]
	});
	svg.polyline(triangle, styles).transform({
		translate: [
			x + triangleSize,
			y
		],
		scale: [1, 1]
	});
}

function drawOuterMosaicTile(svg, x, y, triangleSize, val) {
	var opacity  = fillOpacity(val);
	var fill     = fillColor(val);
	var triangle = buildRightTriangleShape(triangleSize);
	var styles   = {
		stroke: STROKE_COLOR,
		'stroke-opacity': STROKE_OPACITY,
		'fill-opacity': opacity,
		fill: fill
	};

	svg.polyline(triangle, styles).transform({
		translate: [
			x,
			y + triangleSize
		],
		scale: [1, -1]
	});
	svg.polyline(triangle, styles).transform({
		translate: [
			x + triangleSize * 2,
			y + triangleSize
		],
		scale: [-1, -1]
	});
	svg.polyline(triangle, styles).transform({
		translate: [
			x,
			y + triangleSize
		],
		scale: [1, 1]
	});
	svg.polyline(triangle, styles).transform({
		translate: [
			x + triangleSize * 2,
			y + triangleSize
		],
		scale: [-1, 1]
	});
}

Pattern.prototype.geoMosaicSquares = function () {
	var triangleSize = map(hexVal(this.hash, 0), 0, 15, 15, 50);
	var i, x, y;

	this.svg.setWidth(triangleSize * 8);
	this.svg.setHeight(triangleSize * 8);

	i = 0;
	for (y = 0; y < 4; y++) {
		for (x = 0; x < 4; x++) {
			if (x % 2 === 0) {
				if (y % 2 === 0) {
					drawOuterMosaicTile(this.svg,
						x * triangleSize * 2,
						y * triangleSize * 2,
						triangleSize,
						hexVal(this.hash, i)
					);
				} else {
					drawInnerMosaicTile(this.svg,
						x * triangleSize * 2,
						y * triangleSize * 2,
						triangleSize,
						[hexVal(this.hash, i), hexVal(this.hash, i + 1)]
					);
				}
			} else {
				if (y % 2 === 0) {
					drawInnerMosaicTile(this.svg,
						x * triangleSize * 2,
						y * triangleSize * 2,
						triangleSize,
						[hexVal(this.hash, i), hexVal(this.hash, i + 1)]
					);
				} else {
					drawOuterMosaicTile(this.svg,
						x * triangleSize * 2,
						y * triangleSize * 2,
						triangleSize,
						hexVal(this.hash, i)
					);
				}
			}

			i += 1;
		}
	}
};

Pattern.prototype.geoPlaid = function () {
	var height = 0;
	var width  = 0;
	var fill, i, opacity, space, stripeHeight, stripeWidth, val;

	// Horizontal stripes
	i = 0;
	while (i < 36) {
		space   = hexVal(this.hash, i);
		height += space + 5;

		val          = hexVal(this.hash, i + 1);
		opacity      = fillOpacity(val);
		fill         = fillColor(val);
		stripeHeight = val + 5;

		this.svg.rect(0, height, '100%', stripeHeight, {
			opacity: opacity,
			fill: fill
		});

		height += stripeHeight;
		i += 2;
	}

	// Vertical stripes
	i = 0;
	while (i < 36) {
		space  = hexVal(this.hash, i);
		width += space + 5;

		val         = hexVal(this.hash, i + 1);
		opacity     = fillOpacity(val);
		fill        = fillColor(val);
		stripeWidth = val + 5;

		this.svg.rect(width, 0, stripeWidth, '100%', {
			opacity: opacity,
			fill: fill
		});

		width += stripeWidth;
		i += 2;
	}

	this.svg.setWidth(width);
	this.svg.setHeight(height);
};

function buildRotatedTriangleShape(sideLength, triangleWidth) {
	var halfHeight = sideLength / 2;
	return [
		0, 0,
		triangleWidth, halfHeight,
		0, sideLength,
		0, 0
	].join(',');
}

Pattern.prototype.geoTessellation = function () {
	// 3.4.6.4 semi-regular tessellation
	var sideLength     = map(hexVal(this.hash, 0), 0, 15, 5, 40);
	var hexHeight      = sideLength * Math.sqrt(3);
	var hexWidth       = sideLength * 2;
	var triangleHeight = sideLength / 2 * Math.sqrt(3);
	var triangle       = buildRotatedTriangleShape(sideLength, triangleHeight);
	var tileWidth      = sideLength * 3 + triangleHeight * 2;
	var tileHeight     = (hexHeight * 2) + (sideLength * 2);
	var fill, i, opacity, styles, val;

	this.svg.setWidth(tileWidth);
	this.svg.setHeight(tileHeight);

	for (i = 0; i < 20; i++) {
		val     = hexVal(this.hash, i);
		opacity = fillOpacity(val);
		fill    = fillColor(val);

		styles  = {
			stroke: STROKE_COLOR,
			'stroke-opacity': STROKE_OPACITY,
			fill: fill,
			'fill-opacity': opacity,
			'stroke-width': 1
		};

		switch (i) {
			case 0: // All 4 corners
				this.svg.rect(-sideLength / 2, -sideLength / 2, sideLength, sideLength, styles);
				this.svg.rect(tileWidth - sideLength / 2, -sideLength / 2, sideLength, sideLength, styles);
				this.svg.rect(-sideLength / 2, tileHeight - sideLength / 2, sideLength, sideLength, styles);
				this.svg.rect(tileWidth - sideLength / 2, tileHeight - sideLength / 2, sideLength, sideLength, styles);
				break;
			case 1: // Center / top square
				this.svg.rect(hexWidth / 2 + triangleHeight, hexHeight / 2, sideLength, sideLength, styles);
				break;
			case 2: // Side squares
				this.svg.rect(-sideLength / 2, tileHeight / 2 - sideLength / 2, sideLength, sideLength, styles);
				this.svg.rect(tileWidth - sideLength / 2, tileHeight / 2 - sideLength / 2, sideLength, sideLength, styles);
				break;
			case 3: // Center / bottom square
				this.svg.rect(hexWidth / 2 + triangleHeight, hexHeight * 1.5 + sideLength, sideLength, sideLength, styles);
				break;
			case 4: // Left top / bottom triangle
				this.svg.polyline(triangle, styles).transform({
					translate: [
						sideLength / 2,
						-sideLength / 2
					],
					rotate: [
						0,
						sideLength / 2,
						triangleHeight / 2
					]
				});
				this.svg.polyline(triangle, styles).transform({
					translate: [
						sideLength / 2,
						tileHeight - -sideLength / 2
					],
					rotate: [
						0,
						sideLength / 2,
						triangleHeight / 2
					],
					scale: [1, -1]
				});
				break;
			case 5: // Right top / bottom triangle
				this.svg.polyline(triangle, styles).transform({
					translate: [
						tileWidth - sideLength / 2,
						-sideLength / 2
					],
					rotate: [
						0,
						sideLength / 2,
						triangleHeight / 2
					],
					scale: [-1, 1]
				});
				this.svg.polyline(triangle, styles).transform({
					translate: [
						tileWidth - sideLength / 2,
						tileHeight + sideLength / 2
					],
					rotate: [
						0,
						sideLength / 2,
						triangleHeight / 2
					],
					scale: [-1, -1]
				});
				break;
			case 6: // Center / top / right triangle
				this.svg.polyline(triangle, styles).transform({
					translate: [
						tileWidth / 2 + sideLength / 2,
						hexHeight / 2
					]});
				break;
			case 7: // Center / top / left triangle
				this.svg.polyline(triangle, styles).transform({
					translate: [
						tileWidth - tileWidth / 2 - sideLength / 2,
						hexHeight / 2
					],
					scale: [-1, 1]
				});
				break;
			case 8: // Center / bottom / right triangle
				this.svg.polyline(triangle, styles).transform({
					translate: [
						tileWidth / 2 + sideLength / 2,
						tileHeight - hexHeight / 2
					],
					scale: [1, -1]
				});
				break;
			case 9: // Center / bottom / left triangle
				this.svg.polyline(triangle, styles).transform({
					translate: [
						tileWidth - tileWidth / 2 - sideLength / 2,
						tileHeight - hexHeight / 2
					],
					scale: [-1, -1]
				});
				break;
			case 10: // Left / middle triangle
				this.svg.polyline(triangle, styles).transform({
					translate: [
						sideLength / 2,
						tileHeight / 2 - sideLength / 2
					]
				});
				break;
			case 11: // Right // middle triangle
				this.svg.polyline(triangle, styles).transform({
					translate: [
						tileWidth - sideLength / 2,
						tileHeight / 2 - sideLength / 2
					],
					scale: [-1, 1]
				});
				break;
			case 12: // Left / top square
				this.svg.rect(0, 0, sideLength, sideLength, styles).transform({
					translate: [sideLength / 2, sideLength / 2],
					rotate: [-30, 0, 0]
				});
				break;
			case 13: // Right / top square
				this.svg.rect(0, 0, sideLength, sideLength, styles).transform({
					scale: [-1, 1],
					translate: [-tileWidth + sideLength / 2, sideLength / 2],
					rotate: [-30, 0, 0]
				});
				break;
			case 14: // Left / center-top square
				this.svg.rect(0, 0, sideLength, sideLength, styles).transform({
					translate: [
						sideLength / 2,
						tileHeight / 2 - sideLength / 2 - sideLength
					],
					rotate: [30, 0, sideLength]
				});
				break;
			case 15: // Right / center-top square
				this.svg.rect(0, 0, sideLength, sideLength, styles).transform({
					scale: [-1, 1],
					translate: [
						-tileWidth + sideLength / 2,
						tileHeight / 2 - sideLength / 2  - sideLength
					],
					rotate: [30, 0, sideLength]
				});
				break;
			case 16: // Left / center-top square
				this.svg.rect(0, 0, sideLength, sideLength, styles).transform({
					scale: [1, -1],
					translate: [
						sideLength / 2,
						-tileHeight + tileHeight / 2 - sideLength / 2 - sideLength
					],
					rotate: [30, 0, sideLength]
				});
				break;
			case 17: // Right / center-bottom square
				this.svg.rect(0, 0, sideLength, sideLength, styles).transform({
					scale: [-1, -1],
					translate: [
						-tileWidth + sideLength / 2,
						-tileHeight + tileHeight / 2 - sideLength / 2 - sideLength
					],
					rotate: [30, 0, sideLength]
				});
				break;
			case 18: // Left / bottom square
				this.svg.rect(0, 0, sideLength, sideLength, styles).transform({
					scale: [1, -1],
					translate: [
						sideLength / 2,
						-tileHeight + sideLength / 2
					],
					rotate: [-30, 0, 0]
				});
				break;
			case 19: // Right / bottom square
				this.svg.rect(0, 0, sideLength, sideLength, styles).transform({
					scale: [-1, -1],
					translate: [
						-tileWidth + sideLength / 2,
						-tileHeight + sideLength / 2
					],
					rotate: [-30, 0, 0]
				});
				break;
		}
	}
};

}).call(this,require("buffer").Buffer)
},{"./color":5,"./sha1":7,"./svg":8,"buffer":3,"extend":10}],7:[function(require,module,exports){
/*
https://github.com/creationix/git-sha1/blob/master/git-sha1.js

The MIT License (MIT)

Copyright (c) 2013 Tim Caswell

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

'use strict';

// A streaming interface for when nothing is passed in.
function create() {

	var h0 = 0x67452301;
	var h1 = 0xEFCDAB89;
	var h2 = 0x98BADCFE;
	var h3 = 0x10325476;
	var h4 = 0xC3D2E1F0;
	// The first 64 bytes (16 words) is the data chunk
	var block = new Uint32Array(80), offset = 0, shift = 24;
	var totalLength = 0;

	// We have a full block to process.  Let's do it!
	function processBlock() {
		// Extend the sixteen 32-bit words into eighty 32-bit words:
		for (var i = 16; i < 80; i++) {
			var w = block[i - 3] ^ block[i - 8] ^ block[i - 14] ^ block[i - 16];
			block[i] = (w << 1) | (w >>> 31);
		}

		// log(block);

		// Initialize hash value for this chunk:
		var a = h0;
		var b = h1;
		var c = h2;
		var d = h3;
		var e = h4;
		var f, k;

		// Main loop:
		for (i = 0; i < 80; i++) {
			if (i < 20) {
				f = d ^ (b & (c ^ d));
				k = 0x5A827999;
			}
			else if (i < 40) {
				f = b ^ c ^ d;
				k = 0x6ED9EBA1;
			}
			else if (i < 60) {
				f = (b & c) | (d & (b | c));
				k = 0x8F1BBCDC;
			}
			else {
				f = b ^ c ^ d;
				k = 0xCA62C1D6;
			}
			var temp = (a << 5 | a >>> 27) + f + e + k + (block[i] | 0);
			e = d;
			d = c;
			c = (b << 30 | b >>> 2);
			b = a;
			a = temp;
		}

		// Add this chunk's hash to result so far:
		h0 = (h0 + a) | 0;
		h1 = (h1 + b) | 0;
		h2 = (h2 + c) | 0;
		h3 = (h3 + d) | 0;
		h4 = (h4 + e) | 0;

		// The block is now reusable.
		offset = 0;
		for (i = 0; i < 16; i++) {
			block[i] = 0;
		}
	}

	function write(byte) {
		block[offset] |= (byte & 0xff) << shift;
		if (shift) {
			shift -= 8;
		}
		else {
			offset++;
			shift = 24;
		}
		if (offset === 16) {
			processBlock();
		}
	}

	function updateString(string) {
		var length = string.length;
		totalLength += length * 8;
		for (var i = 0; i < length; i++) {
			write(string.charCodeAt(i));
		}
	}

	// The user gave us more data.  Store it!
	function update(chunk) {
		if (typeof chunk === 'string') {
			return updateString(chunk);
		}
		var length = chunk.length;
		totalLength += length * 8;
		for (var i = 0; i < length; i++) {
			write(chunk[i]);
		}
	}

	function toHex(word) {
		var hex = '';
		for (var i = 28; i >= 0; i -= 4) {
			hex += ((word >> i) & 0xf).toString(16);
		}
		return hex;
	}

	// No more data will come, pad the block, process and return the result.
	function digest() {
		// Pad
		write(0x80);
		if (offset > 14 || (offset === 14 && shift < 24)) {
			processBlock();
		}
		offset = 14;
		shift = 24;

		// 64-bit length big-endian
		write(0x00); // numbers this big aren't accurate in javascript anyway
		write(0x00); // ..So just hard-code to zero.
		write(totalLength > 0xffffffffff ? totalLength / 0x10000000000 : 0x00);
		write(totalLength > 0xffffffff ? totalLength / 0x100000000 : 0x00);
		for (var s = 24; s >= 0; s -= 8) {
			write(totalLength >> s);
		}

		// At this point one last processBlock() should trigger and we can pull out the result.
		return toHex(h0) +
		toHex(h1) +
		toHex(h2) +
		toHex(h3) +
		toHex(h4);
	}

	return { update: update, digest: digest };
}

// Input chunks must be either arrays of bytes or "raw" encoded strings
module.exports = function sha1(buffer) {
	if (buffer === undefined) {
		return create();
	}
	var shasum = create();
	shasum.update(buffer);
	return shasum.digest();
};

},{}],8:[function(require,module,exports){
'use strict';

var extend = require('extend');
var XMLNode = require('./xml');

function SVG() {
	this.width = 100;
	this.height = 100;
	this.svg = XMLNode('svg');
	this.context = []; // Track nested nodes
	this.setAttributes(this.svg, {
		xmlns: 'http://www.w3.org/2000/svg',
		width: this.width,
		height: this.height
	});

	return this;
}

module.exports = SVG;

// This is a hack so groups work.
SVG.prototype.currentContext = function () {
	return this.context[this.context.length - 1] || this.svg;
};

// This is a hack so groups work.
SVG.prototype.end = function () {
	this.context.pop();
	return this;
};

SVG.prototype.currentNode = function () {
	var context = this.currentContext();
	return context.lastChild || context;
};

SVG.prototype.transform = function (transformations) {
	this.currentNode().setAttribute('transform',
		Object.keys(transformations).map(function (transformation) {
			return transformation + '(' + transformations[transformation].join(',') + ')';
		}).join(' ')
	);
	return this;
};

SVG.prototype.setAttributes = function (el, attrs) {
	Object.keys(attrs).forEach(function (attr) {
		el.setAttribute(attr, attrs[attr]);
	});
};

SVG.prototype.setWidth = function (width) {
	this.svg.setAttribute('width', Math.floor(width));
};

SVG.prototype.setHeight = function (height) {
	this.svg.setAttribute('height', Math.floor(height));
};

SVG.prototype.toString = function () {
	return this.svg.toString();
};

SVG.prototype.rect = function (x, y, width, height, args) {
	// Accept array first argument
	var self = this;
	if (Array.isArray(x)) {
		x.forEach(function (a) {
			self.rect.apply(self, a.concat(args));
		});
		return this;
	}

	var rect = XMLNode('rect');
	this.currentContext().appendChild(rect);
	this.setAttributes(rect, extend({
		x: x,
		y: y,
		width: width,
		height: height
	}, args));

	return this;
};

SVG.prototype.circle = function (cx, cy, r, args) {
	var circle = XMLNode('circle');
	this.currentContext().appendChild(circle);
	this.setAttributes(circle, extend({
		cx: cx,
		cy: cy,
		r: r
	}, args));

	return this;
};

SVG.prototype.path = function (str, args) {
	var path = XMLNode('path');
	this.currentContext().appendChild(path);
	this.setAttributes(path, extend({
		d: str
	}, args));

	return this;
};

SVG.prototype.polyline = function (str, args) {
	// Accept array first argument
	var self = this;
	if (Array.isArray(str)) {
		str.forEach(function (s) {
			self.polyline(s, args);
		});
		return this;
	}

	var polyline = XMLNode('polyline');
	this.currentContext().appendChild(polyline);
	this.setAttributes(polyline, extend({
		points: str
	}, args));

	return this;
};

// group and context are hacks
SVG.prototype.group = function (args) {
	var group = XMLNode('g');
	this.currentContext().appendChild(group);
	this.context.push(group);
	this.setAttributes(group, extend({}, args));
	return this;
};

},{"./xml":9,"extend":10}],9:[function(require,module,exports){
'use strict';

var XMLNode = module.exports = function (tagName) {
	if (!(this instanceof XMLNode)) {
		return new XMLNode(tagName);
	}

	this.tagName = tagName;
	this.attributes = Object.create(null);
	this.children = [];
	this.lastChild = null;

	return this;
};

XMLNode.prototype.appendChild = function (child) {
	this.children.push(child);
	this.lastChild = child;

	return this;
};

XMLNode.prototype.setAttribute = function (name, value) {
	this.attributes[name] = value;

	return this;
};

XMLNode.prototype.toString = function () {
	var self = this;

	return [
		'<',
		self.tagName,
		Object.keys(self.attributes).map(function (attr) {
			return [
				' ',
				attr,
				'="',
				self.attributes[attr],
				'"'
			].join('');
		}).join(''),
		'>',
		self.children.map(function (child) {
			return child.toString();
		}).join(''),
		'</',
		self.tagName,
		'>'
	].join('');
};

},{}],10:[function(require,module,exports){
var hasOwn = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;

function isPlainObject(obj) {
	if (!obj || toString.call(obj) !== '[object Object]' || obj.nodeType || obj.setInterval)
		return false;

	var has_own_constructor = hasOwn.call(obj, 'constructor');
	var has_is_property_of_method = hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
	// Not own constructor property must be Object
	if (obj.constructor && !has_own_constructor && !has_is_property_of_method)
		return false;

	// Own properties are enumerated firstly, so to speed up,
	// if last one is own, then all properties are own.
	var key;
	for ( key in obj ) {}

	return key === undefined || hasOwn.call( obj, key );
};

module.exports = function extend() {
	var options, name, src, copy, copyIsArray, clone,
	    target = arguments[0] || {},
	    i = 1,
	    length = arguments.length,
	    deep = false;

	// Handle a deep copy situation
	if ( typeof target === "boolean" ) {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	}

	// Handle case when target is a string or something (possible in deep copy)
	if ( typeof target !== "object" && typeof target !== "function") {
		target = {};
	}

	for ( ; i < length; i++ ) {
		// Only deal with non-null/undefined values
		if ( (options = arguments[ i ]) != null ) {
			// Extend the base object
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];

				// Prevent never-ending loop
				if ( target === copy ) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if ( deep && copy && ( isPlainObject(copy) || (copyIsArray = Array.isArray(copy)) ) ) {
					if ( copyIsArray ) {
						copyIsArray = false;
						clone = src && Array.isArray(src) ? src : [];

					} else {
						clone = src && isPlainObject(src) ? src : {};
					}

					// Never move original objects, clone them
					target[ name ] = extend( deep, clone, copy );

				// Don't bring in undefined values
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};

},{}],11:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],12:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[1]);
