const fs=require('fs'),jpeg=require('jpeg-js'),{PNG}=require('pngjs');
const [,,src,outdir,specJson]=process.argv;
const img=jpeg.decode(fs.readFileSync(src),{useTArray:true});
const spec=JSON.parse(specJson);
for(const s of spec){
  const {name,x,y,w,h,circle,key}=s;
  const png=new PNG({width:w,height:h});
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){
    const si=((y+j)*img.width+(x+i))*4, di=(j*w+i)*4;
    let r=img.data[si],g=img.data[si+1],b=img.data[si+2],a=255;
    if(circle){const cx=w/2,cy=h/2,R=Math.min(w,h)/2;const d=Math.hypot(i+.5-cx,j+.5-cy);a=Math.round(255*Math.max(0,Math.min(1,R-d)));}
    if(key){ // knock out white background, un-premultiply against white
      const m=Math.min(r,g,b);let al=Math.min(1,(255-m)/key);
      if(al<0.04)al=0;
      if(al>0){r=Math.max(0,Math.min(255,(r-(1-al)*255)/al));g=Math.max(0,Math.min(255,(g-(1-al)*255)/al));b=Math.max(0,Math.min(255,(b-(1-al)*255)/al));}
      a=Math.round(al*255);
    }
    png.data[di]=r;png.data[di+1]=g;png.data[di+2]=b;png.data[di+3]=a;
  }
  fs.writeFileSync(`${outdir}/${name}.png`,PNG.sync.write(png));console.log('wrote',name,w,h);
}
