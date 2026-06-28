const p=require('path');const A='/var/www/wonju-dental/app';
const s=require(p.join(A,'.next/standalone/node_modules/sqlite3'));
const db=new s.Database(p.join(A,'wonjudental.db'),s.OPEN_READONLY);
db.get("SELECT id,hospital_id,common_meta_tags,common_header,common_body,common_footer FROM global_snippets WHERE hospital_id=11",[],(e,r)=>{
  if(!r){console.log('(global_snippets h11 없음)');db.close();return;}
  ['common_meta_tags','common_header','common_body','common_footer'].forEach(k=>{
    const v=r[k]||''; const has=/naver-site-verification/.test(v);
    console.log(k+' len='+v.length+' naver포함='+has+(has?' | '+v.match(/<meta[^>]*naver-site-verification[^>]*>/)[0]:''));
  });
  db.close();
});
