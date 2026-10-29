const fs=require('fs'),zlib=require('zlib');
const [,,src,out]=process.argv;const b=fs.readFileSync(src);const s=b.toString('latin1');
const re=/(\d+) 0 obj\s*<<([\s\S]*?)>>\s*stream\r?\n/g;let m,n=0;
while((m=re.exec(s))){const d=m[2];const start=m.index+m[0].length;const end=s.indexOf('endstream',start);
 const data=b.slice(start,end);
 if(/\/Subtype\s*\/Image/.test(d)){const w=(d.match(/\/Width (\d+)/)||[])[1],h=(d.match(/\/Height (\d+)/)||[])[1];
  const f=(d.match(/\/Filter\s*\/?(\[?[^\/]*\/?\w+)/)||[])[0];console.log(m[1],w,h,f,data.length);
  if(/DCT/.test(d)) fs.writeFileSync(`${out}/img${m[1]}.jpg`,data);}
 n++;}
console.log('objs',n);
