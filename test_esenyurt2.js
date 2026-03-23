const fs = require('fs');
const html = fs.readFileSync('/Users/zencefilefendi/Desktop/namaz/Diyanet_Offline_Motor_src.html', 'utf8');

let codeMatch = html.match(/<script>\s*const IL_ILCE_DB = \{[\s\S]*?<\/script>/);
let src = codeMatch[0]
  .replace(/<script>/, '')
  .replace(/<\/script>/, '')
  .replace(/window\.addEventListener[\s\S]*/, '')
  .replace(/document\.getElementById[\s\S]*/, '')
  .replace(/updateDistricts[\s\S]*/, '');

let testScript = src + `
let esenyurt = null;
for(let il in IL_ILCE_DB) {
  for(let ilce in IL_ILCE_DB[il]) {
    if(ilce === 'Esenyurt') {
      esenyurt = IL_ILCE_DB[il][ilce];
    }
  }
}

let date = new Date('2026-01-08T00:00:00');
let year = date.getFullYear();
let ms = date.getTime();
let mYear = new Date(year,0,1).getTime();
let doy = Math.floor((ms-mYear)/86400000)+1; 
let o = esenyurt.off;
if(!o && esenyurt.har) {
  let arr = dc(esenyurt.har);
  o = arr[doy-1] || [0,0,0,0,0,0];
}

let refD = new Date(Date.UTC(2026,0,1));
let testD = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
let d = Math.floor((testD.getTime() - refD.getTime())/86400000) + 9496;

let s = sP(d);
let co = esenyurt;
let tz = 3;
let transit = 12 + tz - (co.lng / 15.0) - s.eqt;
let dip = 0.0347 * Math.sqrt(Math.max(0, co.alt));

let sr_ang_new = (50/60.0) + dip;
let sr_ang_old = 0.833 + dip;

let hf = ha(18.0, co.lat, s.decl);
let hss_new = ha(sr_ang_new, co.lat, s.decl);
let hss_old = ha(sr_ang_old, co.lat, s.decl);

let baseSunriseNew = transit - hss_new;
let baseSunriseOld = transit - hss_old;

let hr_new = baseSunriseNew + (o[1]/60.0);
let hr_old = baseSunriseOld + (o[1]/60.0);

let m_new = Math.round(hr_new * 60.0);
let m_old = Math.round(hr_old * 60.0);

console.log('--- DOY:', doy, '---');
console.log('sun.eqt:', s.eqt);
console.log('Offset[1]:', o[1]);
console.log('hss_new (50/60):', hss_new);
console.log('hss_old (0.833):', hss_old);
console.log('transit:', transit);
console.log('Sunrise base new:', baseSunriseNew, '->', baseSunriseNew * 60);
console.log('Sunrise base old:', baseSunriseOld, '->', baseSunriseOld * 60);

function fmt(mm) {
   let h = Math.floor(mm/60)%24;
   let m = mm%60;
   return (h<10?'0':'')+h+':'+(m<10?'0':'')+m;
}
console.log('Final sunrise 50/60:', fmt(m_new), 'minutes:', m_new);
console.log('Final sunrise 0.833:', fmt(m_old), 'minutes:', m_old);

// Also check surrounding days just in case
for(let di=7; di<=9; di++) {
  let d_off = o = dc(esenyurt.har)[di-1];
  console.log("Day", di, "offset:", d_off[1]);
}
`;
fs.writeFileSync('test_es_eval.js', testScript);
