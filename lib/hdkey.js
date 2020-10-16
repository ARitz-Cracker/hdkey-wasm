let assert = function(b,s){
  if (!b){
    throw new Error(s);
  }
}

if(typeof Buffer === "undefined"){
  require("buffer-lite");
}
var secp256k1 = null;
var pbkdf2 = null;

var MASTER_SECRET = Buffer.from('Bitcoin seed');
var HARDENED_OFFSET = 0x80000000
var LEN = 78

// Bitcoin hardcoded by default, can use package `coininfo` for others
var BITCOIN_VERSIONS = {private: 0x0488ADE4, public: 0x0488B21E}

function HDKey (versions) {
  this.versions = versions || BITCOIN_VERSIONS
  this.depth = 0
  this.index = 0
  this._privateKey = null
  this._publicKey = null
  this.chainCode = null
  if (secp256k1 == null){
    throw new Error("Library isn't initialized yet.");
  }
}

Object.defineProperty(HDKey.prototype, 'privateKey', {
  get: function () {
    return this._privateKey
  },
  set: function (value) {
    assert(value.length === 32, 'Private key must be 32 bytes.')
    assert(secp256k1.validatePrivateKey(value), 'Invalid private key')

    this._privateKey = value
    this._publicKey = secp256k1.derivePublicKeyCompressed(value)
  }
})

Object.defineProperty(HDKey.prototype, 'publicKey', {
  get: function () {
    return this._publicKey
  },
  set: function (value) {
    assert(value.length === 33 || value.length === 65, 'Public key must be 33 or 65 bytes.')

    this._publicKey = secp256k1.compressPublicKey(value) // force compressed point
    this._privateKey = null
  }
})

HDKey.prototype.derive = function (path) {
  if (path === 'm' || path === 'M' || path === "m'" || path === "M'") {
    return this
  }

  var entries = path.split('/')
  var hdkey = this
  entries.forEach(function (c, i) {
    if (i === 0) {
      assert(/^[mM]{1}/.test(c), 'Path must start with "m" or "M"')
      return
    }

    var hardened = (c.length > 1) && (c[c.length - 1] === "'")
    var childIndex = parseInt(c, 10) // & (HARDENED_OFFSET - 1)
    assert(childIndex < HARDENED_OFFSET, 'Invalid index')
    if (hardened) childIndex += HARDENED_OFFSET

    hdkey = hdkey.deriveChild(childIndex)
  })

  return hdkey
}

HDKey.prototype.deriveChild = function (index) {
  var isHardened = index >= HARDENED_OFFSET
  var indexBuffer = Buffer.alloc(4);
  (new Uint32Array(indexBuffer.buffer))[0] = index;
  indexBuffer.reverse(); // I'm assuming that the system does things in LE, so here I'm converting to BE

  var data

  if (isHardened) { // Hardened child
    assert(this._privateKey, 'Could not derive hardened child key')

    var pk = this._privateKey
    var zb = Buffer.alloc(1);
    pk = Buffer.concat([zb, pk])

    // data = 0x00 || ser256(kpar) || ser32(index)
    data = Buffer.concat([pk, indexBuffer])
  } else { // Normal child
    // data = serP(point(kpar)) || ser32(index)
    //      = serP(Kpar) || ser32(index)
    data = Buffer.concat([this._publicKey, indexBuffer])
  }

  var I = pbkdf2.hmacSha512(this.chainCode, data)
  var IL = I.subarray(0, 32)
  var IR = I.subarray(32)

  var hd = new HDKey(this.versions)

  // Private parent key -> private child key
  if (this._privateKey) {
    // ki = parse256(IL) + kpar (mod n)
    try {
      hd.privateKey = secp256k1.addTweakPrivateKey(this.privateKey, IL)
      // throw if IL >= n || (privateKey + IL) === 0
    } catch (err) {
      // In case parse256(IL) >= n or ki == 0, one should proceed with the next value for i
      return this.derive(index + 1)
    }
  // Public parent key -> public child key
  } else {
    // Ki = point(parse256(IL)) + Kpar
    //    = G*IL + Kpar
    try {
      hd.publicKey = secp256k1.addTweakPublicKeyCompressed(this.publicKey, IL)
      // throw if IL >= n || (g**IL + publicKey) is infinity
    } catch (err) {
      // In case parse256(IL) >= n or Ki is the point at infinity, one should proceed with the next value for i
      return this.derive(index + 1, isHardened)
    }
  }

  hd.chainCode = IR
  hd.depth = this.depth + 1
  hd.index = index

  return hd
}

HDKey.prototype.sign = function (hash) {
  return secp256k1.signMessageHashCompact(this.privateKey, hash)
}

HDKey.prototype.signRecoverable = function(hash) {
  return secp256k1.signMessageHashRecoverableCompact(this.privateKey, hash);
}

HDKey.prototype.recover = function(hash, sig, recovery){
  return secp256k1.recoverPublicKeyCompressed(sig, recovery, hash);
}

HDKey.prototype.verify = function (hash, signature) {
  return secp256k1.verifySignatureCompact(signature, this.publicKey, hash)
}

HDKey.prototype.wipePrivateData = function () {
  if (this._privateKey) this._privateKey.fill(0)
  this._privateKey = null
  return this
}

HDKey.fromMasterSeed = function (seedBuffer, versions) {
  var I = pbkdf2.hmacSha512(MASTER_SECRET, seedBuffer);
  var IL = I.slice(0, 32)
  var IR = I.slice(32)

  var hdkey = new HDKey(versions)
  hdkey.chainCode = IR
  hdkey.privateKey = IL

  return hdkey
}

HDKey.HARDENED_OFFSET = HARDENED_OFFSET
module.exports = {
  HDKey,
	initializeHDKey: async (s, p) => {
    pbkdf2 = await p;
    secp256k1 = await s;
	}
}
