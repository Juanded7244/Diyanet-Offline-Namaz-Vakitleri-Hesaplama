const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('/Users/zencefilefendi/Desktop/namaz/Diyanet_Offline_Motor_src.html', 'utf8');

const debugScript = `
  window.testEsenyurt = function() {
    let y = 2026, m = 1, d = 8;
    let city = "İstanbul", dist = "Esenyurt";
    
    // Let's do the manual check 
    const cData = IL_ILCE_DB[city];
    const co = cData[dist];
    let doy = getDayOfYear(y, m, d);
    let idx = Math.max(0, Math.min(364, doy - 1)) * 6;
    let deltas = [
      co.har.charCodeAt(idx) - 77,
      co.har.charCodeAt(idx+1) - 77,
      co.har.charCodeAt(idx+2) - 77,
      co.har.charCodeAt(idx+3) - 77,
      co.har.charCodeAt(idx+4) - 77,
      co.har.charCodeAt(idx+5) - 77
    ];
    let j = jd(y, m, d);
    let s = sunPos(j);
    let tz = 3;
    let transit = 12 + tz - (co.lng / 15.0) - s.eqt;
    let dip = 0.0347 * Math.sqrt(Math.max(0, co.alt));
    
    let sr_ang_new = (50/60.0) + dip;
    let hss_new = ha(sr_ang_new, co.lat, s.decl);
    let rawSunrise_new = transit - hss_new + (deltas[1]/60.0);
    let mins_new = Math.round((rawSunrise_new - Math.floor(rawSunrise_new)) * 60);

    let sr_ang_old = 0.833 + dip;
    let hss_old = ha(sr_ang_old, co.lat, s.decl);
    let rawSunrise_old = transit - hss_old + (deltas[1]/60.0);
    let mins_old = Math.round((rawSunrise_old - Math.floor(rawSunrise_old)) * 60);

    window.debugOut = {
      rawSunrise_new,
      raw_min_new: (rawSunrise_new - Math.floor(rawSunrise_new)) * 60,
      mins_new,
      rawSunrise_old,
      raw_min_old: (rawSunrise_old - Math.floor(rawSunrise_old)) * 60,
      mins_old,
      deltas
    };
  };
`;

const modifiedHtml = html.replace('// Init', debugScript + '\n// Init');

const dom = new JSDOM(modifiedHtml, { runScripts: "dangerously" });

setTimeout(() => {
  if (dom.window.testEsenyurt) {
    dom.window.testEsenyurt();
    console.log(dom.window.debugOut);
  } else {
    console.log("testEsenyurt not attached to window!");
  }
}, 1000);
