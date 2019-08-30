const argon2 = require("../lib/argon2");
const assert = require("assert");

let _salt = Buffer.from("5E844EE4D2E26920F8B0C4B7846929057CFCE48BF40BA269B173648999630053","hex");

let option = {
    pass:'password',
    salt: _salt,

    type: argon2.ArgonType.Argon2d,
    time:1,
    mem: 16 * 1024,
    parallelism:1,
    hashLen: 32,
    //raw : true,
    // version: 0x13
};

describe("argon2",async () => {
    it("argon2_hash",async ()=>{
        let hash=await argon2.hash(option)
        assert.equal("76C577F94E0F1C8724BE6494B89E80AABF7855AC5AB6D4F142B0528D7086FBFB",hash.hashHex.toUpperCase())
    })
})
