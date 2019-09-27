(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.argon2 = factory();
    }
})(typeof self !== 'undefined' ? self : this, function () {
    const global = typeof self !== 'undefined' ? self : this;

    /**
     * @enum
     */
    const ArgonType = {
        argon2d: 0,
        argon2i: 1,
        argon2id: 2
    };

    // 加载Module
    function loadModule(mem) {
        if (loadModule._promise) {
            return loadModule._promise;
        }
        if (loadModule._module) {
            return Promise.resolve(loadModule._module);
        }
        let promise = loadWasmModule().then(
            Module =>
                new Promise(resolve => {
                    Module.postRun.push(() => resolve(Module));
                })
        );
        loadModule._promise = promise;
        return promise.then(Module => {
            loadModule._module = Module;
            delete loadModule._promise;
            return Module;
        });
    }

    function loadWasmModule() {
        if (global.loadArgon2WasmModule) {
            return global.loadArgon2WasmModule();
        }
        return Promise.resolve(require('./dist/argon2.js'));
    }

    //分配数组
    function allocateArray(Module, strOrArr) {
        const arr =
            strOrArr instanceof Uint8Array || strOrArr instanceof Array
                ? strOrArr
                : encodeUtf8(strOrArr);
        const nullTerminatedArray = new Uint8Array([...arr, 0]);
        return Module.allocate(nullTerminatedArray, 'i8', Module.ALLOC_NORMAL);
    }

    function encodeUtf8(str) {
        if (typeof TextEncoder === 'function') {
            return new TextEncoder().encode(str);
        } else if (typeof Buffer === 'function') {
            return Buffer.from(str);
        } else {
            throw new Error("Don't know how to decode UTF8");
        }
    }

    /**
     * Argon2 hash
     * @param {string|Uint8Array} params.pass - password string
     * @param {string|Uint8Array} params.salt - salt string
     * @param {number} [params.time=1] - the number of iterations
     * @param {number} [params.mem=1024] - used memory, in KiB
     * @param {number} [params.hashLen=24] - desired hash length
     * @param {number} [params.parallelism=1] - desired parallelism
     * @param {number} [params.type=argon2.argon2d] - hash type:
     *      argon2.argon2d
     *      argon2.argon2i
     *      argon2.argon2id
     *
     * @return Promise
     *
     * @example
     *  argon2.hash({ pass: 'password', salt: 'somesalt' })
     *      .then(h => console.log(h.hash, h.hashHex, h.encoded))
     *      .catch(e => console.error(e.message, e.code))
     */
    function argon2Hash(params) {
        const mCost = params.mem || 1024;
        return loadModule(mCost).then(Module => {
            const tCost = params.time || 1;
            const parallelism = params.parallelism || 1;
            const pwd = allocateArray(Module, params.pass);
            const pwdlen = params.pass.length;
            const salt = allocateArray(Module, params.salt);
            const saltlen = params.salt.length;
            const hash = Module.allocate(
                new Array(params.hashLen || 24),
                'i8',
                Module.ALLOC_NORMAL
            );
            const hashlen = params.hashLen || 24;
            const encoded = Module.allocate(
                new Array(512),
                'i8',
                Module.ALLOC_NORMAL
            );
            const encodedlen = 512;
            const argon2Type = params.type || ArgonType.argon2d;
            const version = 0x13;
            let err;
            let res;
            try {
                res = Module._argon2_hash(
                    tCost,
                    mCost,
                    parallelism,
                    pwd,
                    pwdlen,
                    salt,
                    saltlen,
                    hash,
                    hashlen,
                    encoded,
                    encodedlen,
                    argon2Type,
                    version
                );
            } catch (e) {
                err = e;
            }
            let result;
            if (res === 0 && !err) {
                let hashStr = '';
                const hashArr = new Uint8Array(hashlen);
                for (let i = 0; i < hashlen; i++) {
                    const byte = Module.HEAP8[hash + i];
                    hashArr[i] = byte;
                    hashStr += ('0' + (0xff & byte).toString(16)).slice(-2);
                }
                const encodedStr = Module.UTF8ToString(encoded);
                result = {
                    hash: hashArr,
                    hashHex: hashStr,
                    encoded: encodedStr
                };
            } else {
                try {
                    if (!err) {
                        err = Module.UTF8ToString(
                            Module._argon2_error_message(res)
                        );
                    }
                } catch (e) { }
                result = { message: err, code: res };
            }
            try {
                Module._free(pwd);
                Module._free(salt);
                Module._free(hash);
                Module._free(encoded);
            } catch (e) { }
            if (err) {
                throw result;
            } else {
                return result;
            }
        });
    }

    /**
     * Argon2 verify function
     * @param {string} params.pass - password string
     * @param {string|Uint8Array} params.encoded - encoded hash
     * @param {number} [params.type=argon2.argon2d] - hash type:
     *      argon2.argon2d
     *      argon2.argon2i
     *      argon2.argon2id
     *
     * @returns Promise
     *
     * @example
     *  argon2.verify({ pass: 'password', encoded: 'encoded-hash' })
     *      .then(() => console.log('OK'))
     *      .catch(e => console.error(e.message, e.code))
     */
    function argon2Verify(params) {
        return loadModule().then(Module => {
            const pwd = allocateArray(Module, params.pass);
            const pwdlen = params.pass.length;
            const enc = allocateArray(Module, params.encoded);
            let argon2Type = params.type;
            if (argon2Type === undefined) {
                let typeStr = params.encoded.split('$')[1];
                if (typeStr) {
                    typeStr = typeStr.replace('a', 'A');
                    argon2Type = ArgonType[typeStr] || ArgonType.argon2d;
                }
            }
            let err;
            let res;
            try {
                res = Module._argon2_verify(enc, pwd, pwdlen, argon2Type);
            } catch (e) {
                err = e;
            }
            let result;
            if (res || err) {
                try {
                    if (!err) {
                        err = Module.UTF8ToString(
                            Module._argon2_error_message(res)
                        );
                    }
                } catch (e) { }
                result = { message: err, code: res };
            }
            try {
                Module._free(pwd);
                Module._free(enc);
            } catch (e) { }
            if (err) {
                throw result;
            } else {
                return result;
            }
        });
    }

    return {
        ...ArgonType,
        hash: argon2Hash,
        verify: argon2Verify
    };
});
