hdkey
=====

[![NPM Package](https://img.shields.io/npm/v/hdkey-wasm.svg?style=flat-square)](https://www.npmjs.org/package/hdkey-wasm)

A stripped down version of [BIP32](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki)(hierarchical deterministic keys). This version only derives pure, non-extended private keys. Intended to be used with [bitcoin-ts](https://github.com/bitjson/bitcoin-ts) as its base. Forked from [hdkey](https://github.com/cryptocoinjs/hdkey) 



Installation
------------

    npm i --save hdkey-wasm


Usage
-----

**example:**

```js
const bitcoinTs = require('bitcoin-ts');
const {instantiatePbkdf2} = require('pbkdf2-wasm');
const {HDKey, initializeHDKey} = require('hdkey-wasm');
await initializeHDKey(bitcoinTs.instantiateSecp256k1(), instantiatePbkdf2(bitcoinTs.instantiateSha512()));

const seed = 'a0c42a9c3ac6abf2ba6a9946ae83af18f51bf1c9fa7dacc4c92513cc4dd015834341c775dcd4c0fac73547c5662d81a9e9361a0aac604a73a321bd9103bce8af'
let hdkey = HDKey.fromMasterSeed(Buffer.from(seed, 'hex'));
console.log(hdkey.privateKey)
// => <Uint8Array 15 49 3c 2b e2 a4 15 9c d9 82 b9 3c af 3d 70 5f d2 9b 9b ac 77 80 31 ca ea 21 6e fb eb fe 24 78>
console.log(hdkey.publicKey)
// => <Uint8Array 02 2a ec b9 22 ae 00 1d 9d 0c b9 69 27 e5 50 ee 6c fd 60 74 1a c6 27 f1 02 89 fe 2c 29 3b 3c 73 41>
```


### `HDKey.fromMasterSeed(seedBuffer[, versions])`

Creates an `hdkey` object from a master seed buffer. Accepts an optional `versions` object.

```js
var seed = 'a0c42a9c3ac6abf2ba6a9946ae83af18f51bf1c9fa7dacc4c92513cc4dd015834341c775dcd4c0fac73547c5662d81a9e9361a0aac604a73a321bd9103bce8af'
var hdkey = HDKey.fromMasterSeed(Buffer.from(seed, 'hex'))
```

---

### `hdkey.derive(path)`

Derives the `hdkey` at `path` from the current `hdkey`.

```js
var seed = 'fffcf9f6f3f0edeae7e4e1dedbd8d5d2cfccc9c6c3c0bdbab7b4b1aeaba8a5a29f9c999693908d8a8784817e7b7875726f6c696663605d5a5754514e4b484542'
var hdkey = HDKey.fromMasterSeed(Buffer.from(seed, 'hex'))
var childkey = hdkey.derive("m/0/2147483647'/1")

console.log(childkey.privateKey)
// -> <Uint8Array 70 4a dd f5 44 a0 6e 5e e4 be a3 70 98 46 3c 23 61 3d a3 20 20 d6 04 50 6d a8 c0 51 8e 1d a4 b7>
console.log(childkey.publicKey)
// -> <Uint8Array 03 a7 d1 d8 56 de b7 4c 50 8e 05 03 1f 98 95 da b5 46 26 25 1b 38 06 e1 6b 4b d1 2e 78 1a 7d f5 b9>
```

### `hdkey.sign(hash)`

Signs the buffer `hash` with the private key using `secp256k1` and returns the signature as a buffer.

### `hdkey.verify(hash, signature)`

Verifies that the `signature` is valid for `hash` and the `hdkey`'s public key using `secp256k1`. Returns `true` for valid, `false` for invalid. Throws if the `hash` or `signature` is the wrong length.

### `hdkey.wipePrivateData()`

Wipes all record of the private key from the `hdkey` instance.

### `hdkey.privateKey`

Getter/Setter of the `hdkey`'s private key, stored as a Uint8Array.

### `hdkey.publicKey`

Getter/Setter of the `hdkey`'s public key, stored as a Uint8Array.

References
----------
- https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/src/hdnode.js
- http://bip32.org/
- http://blog.richardkiss.com/?p=313
- https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki
- http://bitcoinmagazine.com/8396/deterministic-wallets-advantages-flaw/


License
-------

MIT
