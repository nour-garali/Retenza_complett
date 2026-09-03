'use strict';
require('../config/db')().then(async db=>{const rows=await db.collection('job_runs').find({job_name:{$in:['rfm_automation','shop_anniversary','low_traffic','low_traffic_snapshot']}}).sort({started_at:-1}).limit(12).project({job_name:1,commerce_id:1,status:1,result_summary:1}).toArray();console.log(JSON.stringify(rows));process.exit(0);});
