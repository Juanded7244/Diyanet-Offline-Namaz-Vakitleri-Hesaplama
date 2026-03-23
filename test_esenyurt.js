const fs = require('fs');
const html = fs.readFileSync('/Users/zencefilefendi/Desktop/namaz/Diyanet_Offline_Motor_src.html', 'utf8');

// Find the IL_ILCE_DB
let dbMatch = html.match(/const IL_ILCE_DB = (\{.*?\});/);
if (!dbMatch) { console.log('DB not found'); process.exit(1); }
const IL_ILCE_DB = JSON.parse(dbMatch[1]);

// Find Esenyurt
let esenyurt = null;
for(let il in IL_ILCE_DB) {
  for(let ilce in IL_ILCE_DB[il]) {
    if(ilce === 'Esenyurt') {
      esenyurt = IL_ILCE_DB[il][ilce];
    }
  }
}
if(!esenyurt) { console.log('Esenyurt not found'); process.exit(1); }

console.log('Esenyurt DB Entry:', esenyurt);

// Harmonic Decoder
function pC(c){return c.charCodeAt(0)-77;}
function dc(s){
  let a=[], v=[0,0,0,0,0,0];
  for(let i=0; i<s.length; i++){
    v[i%6]+=pC(s[i]);
    if(i%6===5) a.push([...v]);
  }
  return a;
}

const RAD = Math.PI / 180.0;
const DEG = 180.0 / Math.PI;
function SIN(d){return Math.sin(d * RAD);}
function COS(d){return Math.cos(d * RAD);}
function TAN(d){return Math.tan(d * RAD);}
function ASIN(x){return Math.asin(x) * DEG;}
function ACOS(x){return Math.acos(x) * DEG;}
function ACOT(x){return Math.atan(1/x) * DEG;}

function sP(d){
  let g=(357.529+0.98560028*d)%360;
  let q=(280.459+0.98564736*d)%360;
  let l=(q+1.915*SIN(g)+0.020*SIN(2*g))%360;
  let e=23.439-0.00000036*d;
  let eqt=(q/15.0)-(ACOT(COS(e)*TAN(l))/15.0);
  if(Math.abs(eqt)>0.5){
    let eq1=eqt-1.0;
    let eq2=eqt+1.0;
    let a_eqt=Math.abs(eqt), a1=Math.abs(eq1), a2=Math.abs(eq2);
    if(a1<a_eqt && a1<a2) eqt=eq1;
    else if(a2<a_eqt && a2<a1) eqt=eq2;
  }
  return { decl: ASIN(SIN(e)*SIN(l)), eqt: eqt };
}

function ha(ang, lat, decl){
  let num=-SIN(ang)-SIN(lat)*SIN(decl);
  let den=COS(lat)*COS(decl);
  let v=num/den;
  if(v>1.0) v=1.0; if(v<-1.0) v=-1.0;
  return ACOS(v)/15.0;
}

function calc(dateStr, co) {
  let date = new Date(dateStr);
  let year = date.getFullYear();
  let ms = date.getTime();
  let mYear = new Date(year,0,1).getTime();
  let doy = Math.floor((ms-mYear)/86400000)+1; 
  
  let o = co.off;
  if(!o && co.har) {
    let arr = dc(co.har);
    o = arr[doy-1] || [0,0,0,0,0,0];
  }
  
  let refD = new Date(Date.UTC(2026,0,1));
  let testD = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  let d = Math.floor((testD.getTime() - refD.getTime())/86400000) + 9496;

  let s = sP(d);
  let tz = 3;
  let transit = 12 + tz - (co.lng / 15.0) - s.eqt;
  let dip = 0.0347 * Math.sqrt(Math.max(0, co.alt));
  
  let sr_ang_new = (50/60.0) + dip;
  let sr_ang_old = 0.833 + dip;
  
  let hf = ha(18.0, co.lat, s.decl);
  let hss_new = ha(sr_ang_new, co.lat, s.decl);
  let hss_old = ha(sr_ang_old, co.lat, s.decl);
  let hi = ha(17.0, co.lat, s.decl);
  
  let an = SIN(ACOT(1+TAN(Math.abs(s.decl-co.lat)))) - SIN(co.lat)*SIN(s.decl);
  let hasr = ACOS(an/(COS(co.lat)*COS(s.decl)))/15.0;
  
  let baseSunriseNew = transit - hss_new;
  let baseSunriseOld = transit - hss_old;

  console.log(`--- DEBUG FOR DOY ${doy} ---`);
  console.log('sun.eqt:', s.eqt);
  console.log('sun.decl:', s.decl);
  console.log('transit:', transit);
  console.log('dip:', dip);
  console.log('sr_ang (new):', sr_ang_new, 'hss_new:', hss_new, 'sunrise base (new):', baseSunriseNew);
  console.log('sr_ang (old):', sr_ang_old, 'hss_old:', hss_old, 'sunrise base (old):', baseSunriseOld);
  
  let hr_new = baseSunriseNew + (o[1]/60.0);
  let hr_old = baseSunriseOld + (o[1]/60.0);
  
  let m_new = Math.round(hr_new * 60.0);
  let m_old = Math.round(hr_old * 60.0);
  
  console.log('Har Offset[1]:', o[1]);
  console.log(`With Offset: new=${hr_new} old=${hr_old}`);
  console.log(`Rounded minute: new=${m_new} old=${m_old}`);
  
  function fmt(mm) {
     let h = Math.floor(mm/60)%24;
     let m = mm%60;
     return (h<10?'0':'')+h+':'+(m<10?'0':'')+m;
  }
  console.log(`Final string: new=${fmt(m_new)} old=${fmt(m_old)}`);
}

calc('2026-01-08', esenyurt);
