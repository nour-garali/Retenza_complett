'use strict';
const crypto=require('crypto'); const connectDB=require('../config/db');
async function audit(req, action, target={}, metadata={}) { const db=await connectDB(); const previous=await db.collection('audit_logs').find().sort({occurred_at:-1,_id:-1}).limit(1).next(); const entry={occurred_at:new Date(),actor:req.auth?{user_id:req.auth.userId,email:req.auth.email,role:req.auth.role}:null,action,target,ip:req.ip,user_agent:req.get?.('user-agent')||null,metadata,previous_hash:previous?.entry_hash||null}; entry.entry_hash=crypto.createHash('sha256').update(JSON.stringify(entry)).digest('hex'); await db.collection('audit_logs').insertOne(entry); }
module.exports={audit};
