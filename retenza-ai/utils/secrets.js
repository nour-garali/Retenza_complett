'use strict';
const crypto=require('crypto');
function key(){const raw=process.env.MFA_ENCRYPTION_KEY;if(!raw)throw new Error('MFA_ENCRYPTION_KEY est obligatoire.');const k=Buffer.from(raw,'base64');if(k.length!==32)throw new Error('MFA_ENCRYPTION_KEY doit être une clé base64 de 32 octets.');return k;}
function encrypt(value){const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',key(),iv);const data=Buffer.concat([cipher.update(value,'utf8'),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),data]).toString('base64');}
function decrypt(value){const raw=Buffer.from(value,'base64'),iv=raw.subarray(0,12),tag=raw.subarray(12,28),data=raw.subarray(28);const decipher=crypto.createDecipheriv('aes-256-gcm',key(),iv);decipher.setAuthTag(tag);return Buffer.concat([decipher.update(data),decipher.final()]).toString('utf8');}
module.exports={encrypt,decrypt};
