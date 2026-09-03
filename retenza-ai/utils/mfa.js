'use strict';
const crypto = require('crypto');
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const base32 = (buffer) => { let bits=0,val=0,out=''; for(const b of buffer){val=(val<<8)|b;bits+=8;while(bits>=5){out+=ALPHABET[(val>>(bits-=5))&31];}} return out; };
const decode = (text) => { let bits=0,val=0,out=[]; for(const c of text.replace(/[^A-Z2-7]/gi,'').toUpperCase()){val=(val<<5)|ALPHABET.indexOf(c);bits+=5;if(bits>=8)out.push((val>>(bits-=8))&255);} return Buffer.from(out); };
const generateSecret = () => base32(crypto.randomBytes(20));
const code = (secret, step) => { const b=Buffer.alloc(8); b.writeBigUInt64BE(BigInt(step)); const h=crypto.createHmac('sha1',decode(secret)).update(b).digest(); const o=h[h.length-1]&15; return String(((h[o]&127)<<24|(h[o+1]<<16)|(h[o+2]<<8)|h[o+3])%1000000).padStart(6,'0'); };
const verify = (secret, token) => { const now=Math.floor(Date.now()/30000); return [-1,0,1].some(d=>crypto.timingSafeEqual(Buffer.from(code(secret,now+d)),Buffer.from(String(token||'').padStart(6,'0')))); };
module.exports={generateSecret,verify,code};
