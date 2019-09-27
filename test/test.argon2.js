const argon2 = require("../lib/argon2");
const assert = require("assert");

let _salt = Buffer.from("5E844EE4D2E26920F8B0C4B7846929057CFCE48BF40BA269B173648999630053", "hex");

let option = {
    pass: 'password',
    salt: _salt,

    type: argon2.argon2d,
    time: 1,
    mem: 16 * 1024,
    parallelism: 1,
    hashLen: 32,
    //raw : true,
    // version: 0x13
};

let encode;

describe("argon2Test", async () => {
    it("argon2_hash", async () => {
        let hash = await argon2.hash(option)
        encode = hash.encoded;
        assert.equal("76C577F94E0F1C8724BE6494B89E80AABF7855AC5AB6D4F142B0528D7086FBFB", hash.hashHex.toUpperCase())

    })

    it("argon2_verify", async () => {
        let verOpt = {
            pass: option.pass,
            encoded: '$argon2d$v=19$m=16384,t=1,p=1$XoRO5NLiaSD4sMS3hGkpBXz85Iv0C6JpsXNkiZljAFM$dsV3+U4PHIckvmSUuJ6Aqr94VaxattTxQrBSjXCG+/s'
        }
        let resule = await argon2.verify(verOpt)
    })
})
