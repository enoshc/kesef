/**
 * הכסף שלי — סקריפט סנכרון לגוגל שיטס
 * מדביקים את כל הקוד הזה ב־Extensions > Apps Script של הגיליון, שומרים,
 * ופורסים כ־Web app (Execute as: Me, Who has access: Anyone).
 * הסקריפט ניגש רק לגיליון הזה ולתיקיית "הכסף שלי - קבלות" ב־Drive שלך.
 */
var TX = 'תנועות';
var CFG = 'הגדרות';
var FOLDER = 'הכסף שלי - קבלות';
var H = ['תאריך', 'סוג', 'סכום', 'קטגוריה', 'תיאור', 'קבלה', 'נמחק', 'id', 'catId', 'img', 'u', 's', 'הערה', 'תגיות'];
var C = {d: 0, t: 1, a: 2, cn: 3, n: 4, rc: 5, del: 6, id: 7, c: 8, img: 9, u: 10, s: 11, note: 12, tags: 13};
var TECH = C.s - C.id + 1;
var VERSION = 10;
var DEVS = 'מכשירים';
var DH = ['dev', 'name', 'endpoint', 'pub', 'prefs', 'tokens', 'queue', 'updated'];
var KINDS = {
  msg: {name: 'הודעות', H: ['תאריך', 'מאת', 'הודעה', 'נמחק', 'id', 'u', 's', 'data'], V: 4, D: 3,
    vis: function (it) { return [new Date(it.ts), safe_(it.by), safe_(it.text), it.del ? 'כן' : '']; }},
  pic: {name: 'תמונות', H: ['תאריך', 'מאת', 'כיתוב', 'תמונה', 'נמחק', 'id', 'u', 's', 'data'], V: 5, D: 4, L: 4,
    vis: function (it) { return [new Date(it.ts), safe_(it.by), safe_(it.text), '', it.del ? 'כן' : '']; }}
};

function doGet(e) {
  var q = (e && e.parameter) || {};
  if (q.tok) return ingestLocked_({tok: q.tok, text: q.text || q.message || '', src: q.src || ''});
  return out_({ok: true, app: 'kesef', v: VERSION});
}

function ingestLocked_(req) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(25000); } catch (err) { return out_({ok: false, err: 'busy'}); }
  try { return out_(ingest_(req)); } catch (err) { return out_({ok: false, err: 'server', msg: String(err && err.message || err)}); } finally { lock.releaseLock(); }
}

function doPost(e) {
  var req;
  try { req = JSON.parse(e.postData.contents); } catch (err) { return out_({ok: false, err: 'bad_json'}); }
  if (req && req.action === 'ingest') return ingestLocked_(req);
  var props = PropertiesService.getScriptProperties();
  var lock = LockService.getScriptLock();
  try { lock.waitLock(25000); } catch (err) { return out_({ok: false, err: 'busy'}); }
  try {
    var key = props.getProperty('KEY');
    if (req.action === 'pair') {
      if (!req.key || String(req.key).length < 16) return out_({ok: false, err: 'bad_key'});
      if (key && key !== req.key) return out_({ok: false, err: 'paired'});
      props.setProperty('KEY', String(req.key));
      setup_();
      return out_({ok: true, v: VERSION, now: Date.now(), sheet: SpreadsheetApp.getActive().getUrl()});
    }
    if (!key || req.key !== key) return out_({ok: false, err: 'key'});
    if (req.action === 'ping') return out_({ok: true, v: VERSION, now: Date.now(), sheet: SpreadsheetApp.getActive().getUrl()});
    if (req.action === 'sync') return out_(sync_(req));
    if (req.action === 'img') return out_(putImg_(req));
    if (req.action === 'getimg') return out_(getImg_(req));
    if (req.action === 'weekly') return out_(weekly_(req));
    if (req.action === 'push-reg') return out_(pushReg_(req));
    if (req.action === 'push-prefs') return out_(pushPrefs_(req));
    if (req.action === 'push-unreg') { removeDev_(String(req.dev || '')); return out_({ok: true, v: VERSION}); }
    if (req.action === 'push-test') return out_(pushTest_(req));
    if (req.action === 'notifs') return out_(notifs_(req));
    if (req.action === 'ing-token') return out_(ingToken_(req));
    if (req.action === 'ing-test') return out_(ingTest_(req));
    return out_({ok: false, err: 'action'});
  } catch (err) {
    return out_({ok: false, err: 'server', msg: String(err && err.message || err)});
  } finally {
    lock.releaseLock();
  }
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function tz_() {
  return Session.getScriptTimeZone() || 'Asia/Jerusalem';
}

function newId_() {
  return Utilities.getUuid().replace(/-/g, '').slice(0, 12);
}

function setup_() {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(TX);
  if (!sh) {
    var first = ss.getSheets()[0];
    sh = (ss.getSheets().length === 1 && first.getLastRow() === 0) ? first.setName(TX) : ss.insertSheet(TX);
  }
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, H.length).setValues([H]).setFontWeight('bold').setBackground('#00a862').setFontColor('#0b0b10');
    sh.setFrozenRows(1);
    sh.getRange('A2:A').setNumberFormat('dd/MM/yyyy');
    sh.getRange('C2:C').setNumberFormat('#,##0.00');
    try { sh.setRightToLeft(true); } catch (e) {}
    try {
      var rule = SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$G2="כן"')
        .setStrikethrough(true).setFontColor('#9aa39e').setRanges([sh.getRange('A2:G')]).build();
      sh.setConditionalFormatRules([rule]);
    } catch (e) {}
    sh.hideColumns(C.id + 1, TECH);
  }
  [[C.note, 'הערה'], [C.tags, 'תגיות']].forEach(function (x) {
    if (sh.getRange(1, x[0] + 1).getValue() !== x[1]) sh.getRange(1, x[0] + 1).setValue(x[1]).setFontWeight('bold').setBackground('#00a862').setFontColor('#0b0b10');
  });
  var cf = ss.getSheetByName(CFG);
  if (!cf) {
    cf = ss.insertSheet(CFG);
    try { cf.setRightToLeft(true); } catch (e) {}
    cf.getRange('A1:C1').setValues([['json', 'u', 's']]);
  }
  return sh;
}

function safe_(s) {
  s = String(s == null ? '' : s);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function link_(fileId) {
  return '=HYPERLINK("https://drive.google.com/file/d/' + fileId + '/view","קבלה")';
}

function imgMap_() {
  var p = PropertiesService.getScriptProperties().getProperties(), m = {};
  for (var k in p) if (k.indexOf('img_') === 0) m[k.slice(4)] = p[k];
  return m;
}

function toRow_(t, now, imgs) {
  var m = String(t.d || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  var date = m ? new Date(+m[1], +m[2] - 1, +m[3], 12) : '';
  var img = String(t.img || '');
  return {
    vals: [date, t.t === 'inc' ? 'הכנסה' : 'הוצאה', Math.abs(+t.a || 0), safe_(t.cn), safe_(t.n), '', t.del ? 'כן' : '',
      String(t.id), String(t.c || ''), img, +t.u || now, now, safe_(String(t.note || '').slice(0, 500)),
      safe_((Array.isArray(t.tags) ? t.tags : []).map(String).join(', ').slice(0, 300))],
    f: img && imgs[img] ? link_(imgs[img]) : ''
  };
}

function writeRow_(sh, r, row) {
  sh.getRange(r, 1, 1, H.length).setValues([row.vals]);
  if (row.f) sh.getRange(r, C.rc + 1).setFormula(row.f);
}

function pad_(n) { n = String(n); return n.length < 2 ? '0' + n : n; }

function normDate_(x) {
  var s = String(x || '').trim(), m;
  if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) return m[1] + '-' + pad_(m[2]) + '-' + pad_(m[3]);
  if ((m = s.match(/^(\d{1,2})[\/.](\d{1,2})[\/.](\d{2,4})/))) {
    var y = m[3].length === 2 ? '20' + m[3] : m[3];
    return y + '-' + pad_(m[2]) + '-' + pad_(m[1]);
  }
  return '';
}

function fromRow_(v, tz) {
  var d = v[C.d];
  var ds = (d instanceof Date) ? Utilities.formatDate(d, tz, 'yyyy-MM-dd') : normDate_(d);
  var del = v[C.del];
  var amt = typeof v[C.a] === 'number' ? v[C.a] : Number(String(v[C.a]).replace(/[^\d.\-]/g, ''));
  return {
    id: String(v[C.id]), d: ds, t: /הכנס|inc/i.test(String(v[C.t])) ? 'inc' : 'exp',
    a: Math.abs(amt || 0), cn: String(v[C.cn] || ''), n: String(v[C.n] || ''),
    c: String(v[C.c] || ''), img: String(v[C.img] || ''), u: +v[C.u] || 0, s: +v[C.s] || 0, note: String(v[C.note] || ''), tags: String(v[C.tags] || '').split(/\s*,\s*/).filter(String),
    del: del === true || /^(כן|v|x|1|true|yes)$/i.test(String(del).trim())
  };
}

function sync_(req) {
  var sh = setup_(), now = Date.now(), tz = tz_(), since = +req.since || 0;
  var n = Math.max(0, sh.getLastRow() - 1);
  var data = n ? sh.getRange(2, 1, n, H.length).getValues() : [];
  var idx = {};
  for (var r = 0; r < data.length; r++) {
    var id = String(data[r][C.id] || '');
    if (!id && (data[r][C.d] !== '' || data[r][C.a] !== '')) {
      id = newId_();
      data[r][C.id] = id; data[r][C.u] = now; data[r][C.s] = now;
      sh.getRange(r + 2, C.id + 1, 1, TECH).setValues([data[r].slice(C.id, C.s + 1)]);
    }
    if (id) idx[id] = r;
  }
  var imgs = imgMap_(), append = [], sent = {};
  (req.tx || []).forEach(function (t) {
    if (!t || !t.id) return;
    var row = toRow_(t, now, imgs), at = idx[t.id];
    if (at !== undefined) {
      if ((+t.u || 0) >= (+data[at][C.u] || 0)) { data[at] = row.vals; writeRow_(sh, at + 2, row); sent[t.id] = 1; }
    } else {
      row.t = t; idx[t.id] = data.length; data.push(row.vals); append.push(row); sent[t.id] = 1;
    }
  });
  if (append.length) {
    var start = sh.getLastRow() + 1;
    sh.getRange(start, 1, append.length, H.length).setValues(append.map(function (x) { return x.vals; }));
    append.forEach(function (x, i) { if (x.f) sh.getRange(start + i, C.rc + 1).setFormula(x.f); });
  }
  var out = [], ids = [];
  for (var i = 0; i < data.length; i++) {
    var v = data[i], vid = String(v[C.id] || '');
    if (!vid) continue;
    ids.push(vid);
    if ((since === 0 || (+v[C.s] || 0) > since) && !sent[vid]) out.push(fromRow_(v, tz));
  }
  var cf = SpreadsheetApp.getActive().getSheetByName(CFG);
  var cv = cf.getRange('A2:C2').getValues()[0], cu = +cv[1] || 0, cs = +cv[2] || 0, cfg = null;
  if (req.cfg && (+req.cfg.u || 0) >= cu) {
    cf.getRange('A2:C2').setValues([[JSON.stringify(req.cfg), +req.cfg.u || now, now]]);
    writeCats_(cf, req.cfg);
  } else if ((since === 0 || cs > since) && cv[0]) {
    try { cfg = JSON.parse(cv[0]); } catch (e) {}
  }
  var it = syncItems_(req, since, now, imgs);
  try {
    var curCfg = (req.cfg && (+req.cfg.u || 0) >= cu) ? req.cfg : JSON.parse(cv[0] || '{}');
    notify_(req, append, it.newMsgs, data, curCfg, tz, now);
  } catch (e) {}
  return {ok: true, v: VERSION, now: now, tx: out, ids: req.full ? ids : undefined, cfg: cfg,
    items: it.items, itemIds: req.full ? it.ids : undefined, sheet: SpreadsheetApp.getActive().getUrl()};
}

function kindSheet_(k) {
  var K = KINDS[k], ss = SpreadsheetApp.getActive(), sh = ss.getSheetByName(K.name);
  if (!sh) {
    sh = ss.insertSheet(K.name);
    sh.getRange(1, 1, 1, K.H.length).setValues([K.H]).setFontWeight('bold').setBackground('#00a862').setFontColor('#0b0b10');
    sh.setFrozenRows(1);
    try { sh.setRightToLeft(true); } catch (e) {}
    sh.getRange('A2:A').setNumberFormat('dd/MM/yyyy HH:mm');
    sh.hideColumns(K.V + 1, 4);
  }
  return sh;
}

function cleanItem_(it, k, now) {
  return {k: k, id: String(it.id).replace(/[^a-z0-9]/gi, '').slice(0, 40), u: +it.u || now, del: it.del ? 1 : 0,
    by: String(it.by || '').slice(0, 40), dv: String(it.dv || '').replace(/[^a-z0-9]/gi, '').slice(0, 20), ts: +it.ts || now, text: String(it.text || '').slice(0, 2000),
    img: String(it.img || '').replace(/[^a-z0-9]/gi, '').slice(0, 40)};
}

function linkPic_(sh, k, r, it, imgs) {
  var K = KINDS[k];
  if (K.L && it.img && imgs[it.img] && !it.del) sh.getRange(r, K.L).setFormula(link_(imgs[it.img]));
}

function syncItems_(req, since, now, imgs) {
  var incoming = {}, out = [], ids = [], newMsgs = [];
  (req.items || []).forEach(function (it) {
    if (it && it.id && KINDS[it.k]) (incoming[it.k] = incoming[it.k] || []).push(cleanItem_(it, it.k, now));
  });
  Object.keys(KINDS).forEach(function (k) {
    var K = KINDS[k], V = K.V;
    var sh = SpreadsheetApp.getActive().getSheetByName(K.name);
    if (!sh && !incoming[k]) return;
    sh = kindSheet_(k);
    var n = Math.max(0, sh.getLastRow() - 1);
    var data = n ? sh.getRange(2, 1, n, K.H.length).getValues() : [];
    var idx = {}, sent = {}, app = [];
    for (var r = 0; r < data.length; r++) { var id = String(data[r][V] || ''); if (id) idx[id] = r; }
    (incoming[k] || []).forEach(function (it) {
      if (!it.id) return;
      var row = K.vis(it).concat([it.id, it.u, now, JSON.stringify(it)]), at = idx[it.id];
      if (at !== undefined) {
        if (it.u >= (+data[at][V + 1] || 0)) {
          data[at] = row; sh.getRange(at + 2, 1, 1, row.length).setValues([row]); linkPic_(sh, k, at + 2, it, imgs); sent[it.id] = 1;
        }
      } else {
        idx[it.id] = data.length; data.push(row); app.push({row: row, it: it}); sent[it.id] = 1;
        if (k === 'msg' && !it.del) newMsgs.push(it);
      }
    });
    if (app.length) {
      var st = sh.getLastRow() + 1;
      sh.getRange(st, 1, app.length, K.H.length).setValues(app.map(function (x) { return x.row; }));
      app.forEach(function (x, i) { linkPic_(sh, k, st + i, x.it, imgs); });
    }
    for (var i = 0; i < data.length; i++) {
      var v = data[i], vid = String(v[V] || '');
      if (!vid) continue;
      ids.push(vid);
      if ((since === 0 || (+v[V + 2] || 0) > since) && !sent[vid]) {
        var o = null;
        try { o = JSON.parse(v[V + 3]); } catch (e) {}
        if (o) {
          if (/^(כן|v|x|1|true|yes)$/i.test(String(v[K.D]).trim())) o.del = 1;
          o.k = k; out.push(o);
        }
      }
    }
  });
  return {items: out, ids: ids, newMsgs: newMsgs};
}

function writeCats_(cf, cfg) {
  var cats = (cfg && cfg.cats) || [];
  cf.getRange(4, 1, Math.max(1, cf.getMaxRows() - 3), 4).clearContent();
  var rows = [['קטגוריה', 'סוג', '% מהמשכורת', 'נכנסת לחלוקה']];
  cats.forEach(function (c) {
    rows.push([safe_(c.name), c.k === 'inc' ? 'הכנסה' : 'הוצאה', c.k === 'exp' ? (+c.pct || 0) : '', c.k === 'inc' ? (c.sal ? 'כן' : 'לא') : '']);
  });
  rows.push(['יעד חיסכון חודשי', '', +cfg.goal || 0, '']);
  cf.getRange(4, 1, rows.length, 4).setValues(rows);
  cf.getRange(4, 1, 1, 4).setFontWeight('bold');
}

function folder_() {
  var it = DriveApp.getFoldersByName(FOLDER);
  return it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER);
}

function putImg_(req) {
  if (!req.id || !req.b64) return {ok: false, err: 'img'};
  var id = String(req.id).replace(/[^a-z0-9]/gi, '').slice(0, 40);
  var props = PropertiesService.getScriptProperties();
  var ex = props.getProperty('img_' + id);
  if (ex) return {ok: true, file: ex};
  var blob = Utilities.newBlob(Utilities.base64Decode(req.b64), req.mime || 'image/jpeg', id + '.jpg');
  var f = folder_().createFile(blob);
  props.setProperty('img_' + id, f.getId());
  var sh = setup_(), n = sh.getLastRow() - 1;
  if (n > 0) {
    var col = sh.getRange(2, C.img + 1, n, 1).getValues();
    for (var i = 0; i < n; i++) if (String(col[i][0]) === id) sh.getRange(i + 2, C.rc + 1).setFormula(link_(f.getId()));
  }
  var ps = SpreadsheetApp.getActive().getSheetByName(KINDS.pic.name);
  if (ps && ps.getLastRow() > 1) {
    var K = KINDS.pic, dcol = ps.getRange(2, K.V + 4, ps.getLastRow() - 1, 1).getValues();
    for (var j = 0; j < dcol.length; j++) if (String(dcol[j][0]).indexOf('"img":"' + id + '"') >= 0) ps.getRange(j + 2, K.L).setFormula(link_(f.getId()));
  }
  return {ok: true, file: f.getId()};
}

function getImg_(req) {
  var fid = PropertiesService.getScriptProperties().getProperty('img_' + String(req.id));
  if (!fid) return {ok: false, err: 'noimg'};
  var b = DriveApp.getFileById(fid).getBlob();
  return {ok: true, b64: Utilities.base64Encode(b.getBytes()), mime: b.getContentType()};
}

/** כשעורכים את הגיליון ביד, השינוי מסומן כדי שיגיע לאפליקציה. */
function onEdit(e) {
  try {
    var sh = e.range.getSheet();
    if (sh.getName() !== TX) return;
    var r0 = e.range.getRow(), nr = e.range.getNumRows();
    var c0 = e.range.getColumn(), c1 = c0 + e.range.getNumColumns() - 1;
    if (c0 > C.id && c1 <= C.s + 1) return;
    var start = Math.max(2, r0), cnt = r0 + nr - start;
    if (cnt <= 0) return;
    var now = Date.now();
    var tech = sh.getRange(start, C.id + 1, cnt, TECH).getValues();
    var vis = sh.getRange(start, 1, cnt, C.del + 1).getValues();
    for (var i = 0; i < cnt; i++) {
      var empty = vis[i].every(function (x) { return x === '' || x === null; });
      if (empty && !tech[i][0]) continue;
      if (!tech[i][0]) tech[i][0] = newId_();
      tech[i][C.u - C.id] = now;
      tech[i][C.s - C.id] = now;
    }
    sh.getRange(start, C.id + 1, cnt, TECH).setValues(tech);
  } catch (err) {}
}

/** מריצים את הפונקציה הזו פעם אחת מהעורך (Run) כדי לאשר שליחת מיילים ותזמון. */
function authorize() {
  MailApp.getRemainingDailyQuota();
  ScriptApp.getProjectTriggers();
  DriveApp.getRootFolder();
  UrlFetchApp.getRequest('https://web.push.apple.com/');
  return 'ok';
}

function weekly_(req) {
  var props = PropertiesService.getScriptProperties();
  var emails = (req.emails || []).map(String).map(function (e) { return e.trim(); })
    .filter(function (e) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e); }).slice(0, 5);
  var app = /^https:\/\//.test(String(req.app || '')) ? String(req.app) : '';
  var freq = ['week', 'month', 'both'].indexOf(req.freq) >= 0 ? req.freq : 'week';
  var mday = Math.min(28, Math.max(1, Math.round(+req.mday || 11)));
  props.setProperty('WEEKLY', JSON.stringify({emails: emails, on: !!req.on, app: app, freq: freq, mday: mday}));
  ScriptApp.getProjectTriggers().forEach(function (t) {
    var f = t.getHandlerFunction();
    if (f === 'weeklyEmail' || f === 'monthlyEmail') ScriptApp.deleteTrigger(t);
  });
  if (req.on && emails.length) {
    if (freq !== 'month') ScriptApp.newTrigger('weeklyEmail').timeBased().onWeekDay(ScriptApp.WeekDay.SUNDAY).atHour(8).inTimezone('Asia/Jerusalem').create();
    if (freq !== 'week') ScriptApp.newTrigger('monthlyEmail').timeBased().onMonthDay(mday).atHour(8).inTimezone('Asia/Jerusalem').create();
  }
  var sent = false;
  if (req.test && emails.length) {
    if (freq !== 'week') monthlyEmail(); else weeklyEmail();
    sent = true;
  }
  return {ok: true, v: VERSION, emails: emails, on: !!req.on && emails.length > 0, freq: freq, mday: mday, sent: sent};
}

function money_(x) {
  var n = Math.round(Math.abs(x)), s = String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (x < 0 ? '−' : '') + '₪' + s;
}
function h_(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]; }); }

function weeklyEmail() {
  var w = {};
  try { w = JSON.parse(PropertiesService.getScriptProperties().getProperty('WEEKLY') || '{}'); } catch (e) {}
  if (!w.emails || !w.emails.length) return;
  var ss = SpreadsheetApp.getActive(), sh = ss.getSheetByName(TX), tz = 'Asia/Jerusalem';
  var n = sh ? Math.max(0, sh.getLastRow() - 1) : 0;
  var data = n ? sh.getRange(2, 1, n, H.length).getValues() : [];
  var tx = data.filter(function (v) { return v[C.id]; }).map(function (v) { return fromRow_(v, tz); }).filter(function (t) { return t.d && !t.del; });
  var cfg = {};
  try { cfg = JSON.parse(ss.getSheetByName(CFG).getRange('A2').getValue() || '{}'); } catch (e) {}
  var cats = cfg.cats || [], byId = {};
  cats.forEach(function (c) { byId[c.id] = c; });
  var catOf = function (t) { return byId[t.c] || cats.filter(function (c) { return c.name === t.cn; })[0] || null; };
  var isSav = function (t) { var c = catOf(t); return !!(c && c.sav); };
  var now = new Date(), today = Utilities.formatDate(now, tz, 'yyyy-MM-dd'), ym = today.slice(0, 7);
  var from = Utilities.formatDate(new Date(now.getTime() - 7 * 864e5), tz, 'yyyy-MM-dd');
  var sum = function (arr, f) { return arr.filter(f).reduce(function (s, t) { return s + t.a; }, 0); };
  var week = tx.filter(function (t) { return t.d > from && t.d <= today; });
  var month = tx.filter(function (t) { return t.d.slice(0, 7) === ym && t.d <= today; });
  var wSpend = sum(week, function (t) { return t.t === 'exp' && !isSav(t); });
  var mInc = sum(month, function (t) { return t.t === 'inc'; });
  var mSpend = sum(month, function (t) { return t.t === 'exp' && !isSav(t); });
  var mSav = sum(month, function (t) { return t.t === 'exp' && isSav(t); });
  var sal = sum(month, function (t) { var c = catOf(t); return t.t === 'inc' && c && c.sal; });
  var byc = {};
  week.forEach(function (t) { if (t.t !== 'exp' || isSav(t)) return; var c = catOf(t), k = c ? c.name : (t.cn || 'שונות'); byc[k] = (byc[k] || 0) + t.a; });
  var top = Object.keys(byc).sort(function (a, b) { return byc[b] - byc[a]; }).slice(0, 5);
  var ap = (+cfg.alertPct || 80) / 100, alerts = [];
  cats.forEach(function (c) {
    if (c.k !== 'exp' || c.sav || !sal) return;
    var b = sal * (+c.pct || 0) / 100; if (!b) return;
    var s = sum(month, function (t) { var cc = catOf(t); return t.t === 'exp' && cc && cc.id === c.id; });
    if (s / b >= ap) alerts.push({name: c.name, s: s, b: b, r: s / b});
  });
  alerts.sort(function (a, b) { return b.r - a.r; });
  var name = cfg.name || 'הכסף שלי', goal = +cfg.goal || 0, net = mInc - mSpend - mSav;
  var row = function (a, b, col) { return '<tr><td style="padding:6px 0;border-bottom:1px solid #e3efe8">' + a + '</td><td style="padding:6px 0;border-bottom:1px solid #e3efe8;text-align:left;font-weight:bold;' + (col ? 'color:' + col : '') + '">' + b + '</td></tr>'; };
  var html = '<div dir="rtl" style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:auto;color:#0b0b10">' +
    '<div style="background:#00a862;padding:20px 22px;border-radius:14px 14px 0 0"><div style="font-size:15px">' + h_(name) + '</div>' +
    '<div style="font-size:28px;font-weight:bold;margin-top:6px">השבוע הוצאתם ' + money_(wSpend) + '</div>' +
    '<div style="font-size:15px;margin-top:4px">' + (week.length ? week.length + ' תנועות בשבעה הימים האחרונים' : 'לא נרשמו תנועות השבוע') + '</div></div>' +
    '<div style="border:1px solid #d5e4dc;border-top:0;border-radius:0 0 14px 14px;padding:18px 22px">' +
    '<h3 style="margin:0 0 6px">החודש עד היום</h3><table style="width:100%;border-collapse:collapse;font-size:15px">' +
    row('הכנסות', money_(mInc), '#00804f') + row('הוצאות', money_(mSpend)) + row('הופרש לחיסכון', money_(mSav) + (goal ? ' מתוך ' + money_(goal) : '')) +
    row(net >= 0 ? 'נשארו' : 'חריגה', money_(Math.abs(net)), net >= 0 ? '#00804f' : '#d1303a') + '</table>' +
    (top.length ? '<h3 style="margin:18px 0 6px">על מה הלך הכסף השבוע</h3><table style="width:100%;border-collapse:collapse;font-size:15px">' + top.map(function (k) { return row(h_(k), money_(byc[k])); }).join('') + '</table>' : '') +
    (alerts.length ? '<h3 style="margin:18px 0 6px">שימו לב</h3>' + alerts.map(function (a) {
      return '<div style="padding:6px 0;color:' + (a.r > 1 ? '#d1303a' : '#a15c00') + '">' + h_(a.name) + ': ' + (a.r > 1 ? 'חריגה של ' + money_(a.s - a.b) : 'ניצלתם ' + Math.round(a.r * 100) + '% מהתקציב') + '</div>';
    }).join('') : '') +
    (w.app ? '<p style="margin:20px 0 0"><a href="' + h_(w.app) + '" style="background:#0b0b10;color:#fff;text-decoration:none;padding:10px 18px;border-radius:999px;display:inline-block">לפתיחת האפליקציה</a></p>' : '') +
    '<p style="color:#56615b;font-size:12px;margin-top:18px">נשלח מהגיליון "' + h_(ss.getName()) + '" שלכם. כדי להפסיק: באפליקציה, סנכרון משותף, סיכום שבועי.</p></div></div>';
  MailApp.sendEmail({to: w.emails.join(','), subject: name + ': סיכום שבועי', htmlBody: html, name: name});
}

var MONTHS_ = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

/** סיכום של החודש הקודם, נשלח ביום שנבחר בכל חודש (ברירת מחדל: 11). */
function monthlyEmail() {
  var w = {};
  try { w = JSON.parse(PropertiesService.getScriptProperties().getProperty('WEEKLY') || '{}'); } catch (e) {}
  if (!w.emails || !w.emails.length) return;
  var ss = SpreadsheetApp.getActive(), sh = ss.getSheetByName(TX), tz = 'Asia/Jerusalem';
  var n = sh ? Math.max(0, sh.getLastRow() - 1) : 0;
  var data = n ? sh.getRange(2, 1, n, H.length).getValues() : [];
  var tx = data.filter(function (v) { return v[C.id]; }).map(function (v) { return fromRow_(v, tz); }).filter(function (t) { return t.d && !t.del; });
  var cfg = {};
  try { cfg = JSON.parse(ss.getSheetByName(CFG).getRange('A2').getValue() || '{}'); } catch (e) {}
  var cats = cfg.cats || [], byId = {};
  cats.forEach(function (c) { byId[c.id] = c; });
  var catOf = function (t) { return byId[t.c] || cats.filter(function (c) { return c.name === t.cn; })[0] || null; };
  var isSav = function (t) { var c = catOf(t); return !!(c && c.sav); };
  var now = new Date(), y = +Utilities.formatDate(now, tz, 'yyyy'), m = +Utilities.formatDate(now, tz, 'M') - 1;
  var py = m === 0 ? y - 1 : y, pm = m === 0 ? 11 : m - 1;
  var ym = py + '-' + pad_(pm + 1), py2 = pm === 0 ? py - 1 : py, pm2 = pm === 0 ? 11 : pm - 1, ym2 = py2 + '-' + pad_(pm2 + 1);
  var sum = function (arr, f) { return arr.filter(f).reduce(function (s, t) { return s + t.a; }, 0); };
  var month = tx.filter(function (t) { return t.d.slice(0, 7) === ym; });
  var prev = tx.filter(function (t) { return t.d.slice(0, 7) === ym2; });
  var inc = sum(month, function (t) { return t.t === 'inc'; });
  var spend = sum(month, function (t) { return t.t === 'exp' && !isSav(t); });
  var sav = sum(month, function (t) { return t.t === 'exp' && isSav(t); });
  var pSpend = sum(prev, function (t) { return t.t === 'exp' && !isSav(t); });
  var sal = sum(month, function (t) { var c = catOf(t); return t.t === 'inc' && c && c.sal; });
  var net = inc - spend - sav, goal = +cfg.goal || 0, name = cfg.name || 'הכסף שלי', mn = MONTHS_[pm];
  var byc = {};
  month.forEach(function (t) { if (t.t !== 'exp' || isSav(t)) return; var c = catOf(t), k = c ? c.id || c.name : (t.cn || 'שונות'); byc[k] = (byc[k] || 0) + t.a; });
  var rows = Object.keys(byc).sort(function (a, b) { return byc[b] - byc[a]; }).slice(0, 8).map(function (k) {
    var c = byId[k], b = c && sal ? sal * (+c.pct || 0) / 100 : 0, s = byc[k];
    return {name: c ? c.name : k, s: s, b: b, over: b && s > b};
  });
  var big = month.filter(function (t) { return t.t === 'exp' && !isSav(t); }).sort(function (a, b) { return b.a - a.a; }).slice(0, 5);
  var ch = pSpend ? Math.round((spend - pSpend) / pSpend * 100) : null;
  var td = 'padding:7px 0;border-bottom:1px solid #e3efe8';
  var row = function (a, b, col) { return '<tr><td style="' + td + '">' + a + '</td><td style="' + td + ';text-align:left;font-weight:bold;' + (col ? 'color:' + col : '') + '">' + b + '</td></tr>'; };
  var html = '<div dir="rtl" style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:auto;color:#0b0b10">' +
    '<div style="background:#00a862;padding:20px 22px;border-radius:14px 14px 0 0"><div style="font-size:15px">' + h_(name) + ', סיכום ' + mn + ' ' + py + '</div>' +
    '<div style="font-size:28px;font-weight:bold;margin-top:6px">' + (net >= 0 ? 'נשארו לכם ' + money_(net) : 'חרגתם ב־' + money_(-net)) + '</div>' +
    '<div style="font-size:15px;margin-top:4px">הוצאתם ' + money_(spend) + (ch === null ? '' : ', ' + Math.abs(ch) + '% ' + (ch > 0 ? 'יותר' : 'פחות') + ' מ' + MONTHS_[pm2]) + '</div></div>' +
    '<div style="border:1px solid #d5e4dc;border-top:0;border-radius:0 0 14px 14px;padding:18px 22px">' +
    '<table style="width:100%;border-collapse:collapse;font-size:15px">' +
    row('הכנסות', money_(inc), '#00804f') + row('הוצאות', money_(spend)) +
    row('הופרש לחיסכון', money_(sav) + (goal ? (sav >= goal ? ' (עמדתם ביעד)' : ' מתוך ' + money_(goal)) : ''), goal && sav >= goal ? '#00804f' : '') + '</table>' +
    (rows.length ? '<h3 style="margin:18px 0 6px">לפי קטגוריה</h3><table style="width:100%;border-collapse:collapse;font-size:15px">' + rows.map(function (r) {
      return row(h_(r.name) + (r.b ? ' <span style="color:#56615b;font-size:13px">מתוך ' + money_(r.b) + '</span>' : ''), money_(r.s), r.over ? '#d1303a' : '');
    }).join('') + '</table>' : '') +
    (big.length ? '<h3 style="margin:18px 0 6px">ההוצאות הגדולות</h3><table style="width:100%;border-collapse:collapse;font-size:15px">' + big.map(function (t) {
      return row(h_(t.n || t.cn) + ' <span style="color:#56615b;font-size:13px">' + t.d.slice(8) + '/' + t.d.slice(5, 7) + '</span>', money_(t.a));
    }).join('') + '</table>' : '') +
    (w.app ? '<p style="margin:20px 0 0"><a href="' + h_(w.app) + '" style="background:#0b0b10;color:#fff;text-decoration:none;padding:10px 18px;border-radius:999px;display:inline-block">לפתיחת האפליקציה</a></p>' : '') +
    '<p style="color:#56615b;font-size:12px;margin-top:18px">נשלח מהגיליון "' + h_(ss.getName()) + '" שלכם. כדי לשנות או להפסיק: באפליקציה, סנכרון משותף, סיכום במייל.</p></div></div>';
  MailApp.sendEmail({to: w.emails.join(','), subject: name + ': סיכום ' + mn, htmlBody: html, name: name});
}

/* ---------- התראות בטלפון ---------- */
function devSheet_() {
  var ss = SpreadsheetApp.getActive(), sh = ss.getSheetByName(DEVS);
  if (!sh) { sh = ss.insertSheet(DEVS); sh.getRange(1, 1, 1, DH.length).setValues([DH]); try { sh.hideSheet(); } catch (e) {} }
  return sh;
}
function devs_() {
  var sh = devSheet_(), n = Math.max(0, sh.getLastRow() - 1), v = n ? sh.getRange(2, 1, n, DH.length).getValues() : [];
  return v.map(function (r, i) {
    var o = {row: i + 2, dev: String(r[0] || ''), name: String(r[1] || ''), endpoint: String(r[2] || ''), pub: String(r[3] || '')};
    try { o.prefs = JSON.parse(r[4] || '{}'); } catch (e) { o.prefs = {}; }
    try { o.tokens = JSON.parse(r[5] || '[]'); } catch (e) { o.tokens = []; }
    try { o.queue = JSON.parse(r[6] || '[]'); } catch (e) { o.queue = []; }
    return o;
  }).filter(function (o) { return o.dev; });
}
function saveDev_(o) {
  var sh = devSheet_();
  var row = [o.dev, o.name || '', o.endpoint || '', o.pub || '', JSON.stringify(o.prefs || {}), JSON.stringify(o.tokens || []), JSON.stringify((o.queue || []).slice(-20)), Date.now()];
  if (o.row) sh.getRange(o.row, 1, 1, DH.length).setValues([row]);
  else { sh.getRange(sh.getLastRow() + 1, 1, 1, DH.length).setValues([row]); o.row = sh.getLastRow(); }
}
function removeDev_(dev) {
  var sh = devSheet_(), n = Math.max(0, sh.getLastRow() - 1);
  if (!n || !dev) return;
  var v = sh.getRange(2, 1, n, 1).getValues();
  for (var i = n - 1; i >= 0; i--) if (String(v[i][0]) === dev) sh.deleteRow(i + 2);
}
function findDev_(dev) { return devs_().filter(function (x) { return x.dev === dev; })[0] || null; }
function okEndpoint_(u) {
  return /^https:\/\/([a-z0-9-]+\.)*(push\.apple\.com|fcm\.googleapis\.com|push\.services\.mozilla\.com|notify\.windows\.com)\//i.test(String(u || ''));
}
function cleanPrefs_(p) { p = p || {}; return {tx: p.tx !== false, msg: p.msg !== false, budget: p.budget !== false, rec: p.rec !== false, bank: p.bank !== false}; }
function pushReg_(req) {
  var dev = String(req.dev || '').replace(/[^a-z0-9]/gi, '').slice(0, 20);
  if (!dev || !okEndpoint_(req.endpoint) || !/^[A-Za-z0-9_-]{80,100}$/.test(String(req.pub || ''))) return {ok: false, err: 'push'};
  var tokens = (req.tokens || []).filter(function (x) { return x && typeof x.e === 'number' && /^[A-Za-z0-9_.-]+$/.test(String(x.t)); })
    .slice(0, 120).map(function (x) { return {e: x.e, t: String(x.t)}; });
  var d = findDev_(dev) || {dev: dev, queue: []};
  d.name = String(req.name || '').slice(0, 30); d.endpoint = String(req.endpoint); d.pub = String(req.pub); d.tokens = tokens; d.prefs = cleanPrefs_(req.prefs);
  saveDev_(d);
  return {ok: true, v: VERSION};
}
function pushPrefs_(req) {
  var d = findDev_(String(req.dev || ''));
  if (!d) return {ok: false, err: 'nodev'};
  d.prefs = cleanPrefs_(req.prefs); saveDev_(d);
  return {ok: true, v: VERSION};
}
function notifs_(req) {
  var d = findDev_(String(req.dev || ''));
  if (!d) return {ok: true, items: []};
  var items = d.queue || []; d.queue = []; saveDev_(d);
  return {ok: true, items: items};
}
function pushTest_(req) {
  var d = findDev_(String(req.dev || ''));
  if (!d) return {ok: false, err: 'nodev'};
  d.queue = (d.queue || []).concat([{title: 'הכסף שלי', body: 'ההתראות פועלות. כך תיראה התראה מהאפליקציה.', type: 'test', ts: Date.now()}]);
  saveDev_(d);
  return {ok: true, v: VERSION, codes: deliver_([d])};
}
function pickTok_(tokens) {
  var now = Date.now() / 1000, best = null;
  (tokens || []).forEach(function (x) { if (x && x.e > now + 120 && x.e <= now + 86400 && (!best || x.e < best.e)) best = x; });
  return best ? best.t : '';
}
function deliver_(list) {
  var reqs = [], who = [];
  list.forEach(function (d) {
    var t = pickTok_(d.tokens);
    if (!t || !okEndpoint_(d.endpoint)) return;
    reqs.push({url: d.endpoint, method: 'post', headers: {TTL: '86400', Urgency: 'high', Authorization: 'vapid t=' + t + ', k=' + d.pub}, muteHttpExceptions: true});
    who.push(d);
  });
  if (!reqs.length) return [];
  var codes = [];
  UrlFetchApp.fetchAll(reqs).forEach(function (r, i) {
    var c = r.getResponseCode(); codes.push(c);
    if (c === 404 || c === 410) removeDev_(who[i].dev);
  });
  return codes;
}
function budgetEvents_(data, cfg, tz) {
  var cats = (cfg && cfg.cats) || [], ap = (+(cfg && cfg.alertPct) || 80) / 100;
  if (!cats.length) return [];
  var ym = Utilities.formatDate(new Date(), tz, 'yyyy-MM'), byId = {};
  cats.forEach(function (c) { byId[c.id] = c; });
  var catOf = function (t) { return byId[t.c] || cats.filter(function (c) { return c.name === t.cn; })[0]; };
  var sal = 0, sp = {};
  data.forEach(function (v) {
    if (!v[C.id]) return;
    var t = fromRow_(v, tz);
    if (t.del || t.d.slice(0, 7) !== ym) return;
    var c = catOf(t); if (!c) return;
    if (t.t === 'inc' && c.sal) sal += t.a;
    if (t.t === 'exp') sp[c.id] = (sp[c.id] || 0) + t.a;
  });
  var props = PropertiesService.getScriptProperties(), key = 'BL_' + ym, lv = {};
  try { lv = JSON.parse(props.getProperty(key) || '{}'); } catch (e) {}
  var ev = [], changed = false;
  cats.forEach(function (c) {
    if (c.k !== 'exp' || c.sav || !sal || !(+c.pct)) return;
    var b = sal * c.pct / 100, s = sp[c.id] || 0, l = s > b + 0.5 ? 2 : (s >= ap * b ? 1 : 0), old = lv[c.id] || 0;
    if (l > old) ev.push({type: 'budget', title: 'התראת תקציב', body: l === 2 ? c.name + ': חריגה של ' + money_(s - b) + ' מהתקציב' : c.name + ': ניצלתם ' + Math.round(s / b * 100) + '% מהתקציב, נשארו ' + money_(b - s)});
    if (l !== old) { lv[c.id] = l; changed = true; }
  });
  if (changed) props.setProperty(key, JSON.stringify(lv));
  return ev;
}
function notify_(req, appended, newMsgs, data, cfg, tz, now) {
  var devs = devs_();
  if (!devs.length) return;
  var me = String(req.me || '').slice(0, 30) || 'השותף', from = String(req.dev || ''), ev = [];
  var REC = /^r[a-z0-9]{8}\d{6}$/;
  var added = appended.map(function (x) { return x.t; }).filter(function (t) { return t && !t.del; });
  var man = added.filter(function (t) { return !REC.test(t.id); }), rec = added.filter(function (t) { return REC.test(t.id); });
  if (man.length > 3) ev.push({type: 'tx', title: me, body: 'נוספו ' + man.length + ' תנועות חדשות'});
  else man.forEach(function (t) { ev.push({type: 'tx', title: me, body: (t.t === 'inc' ? 'הכנסה חדשה של ' : 'הוצאה חדשה של ') + money_(+t.a || 0) + (t.n ? ': ' + t.n : (t.cn ? ': ' + t.cn : ''))}); });
  rec.forEach(function (t) { ev.push({type: 'rec', all: true, title: t.t === 'inc' ? 'הכנסה קבועה נכנסה' : 'הוצאה קבועה ירדה', body: (t.n || t.cn || '') + ': ' + money_(+t.a || 0)}); });
  (newMsgs || []).forEach(function (m) { ev.push({type: 'msg', title: 'הודעה מ' + (m.by || me), body: String(m.text || '').slice(0, 180)}); });
  if (added.length) budgetEvents_(data, cfg, tz).forEach(function (e) { e.all = true; ev.push(e); });
  pushAll_(ev, from, now, devs);
}
function pushAll_(ev, from, now, devs) {
  if (!ev.length) return;
  devs = devs || devs_();
  var hit = [];
  devs.forEach(function (d) {
    var p = cleanPrefs_(d.prefs);
    var mine = ev.filter(function (e) { return (e.all || d.dev !== from) && p[e.type]; });
    if (!mine.length) return;
    d.queue = (d.queue || []).concat(mine.map(function (e) { return {title: e.title, body: e.body, type: e.type, ts: now}; })).slice(-20);
    saveDev_(d); hit.push(d);
  });
  deliver_(hit);
}

/* ---------- קליטה אוטומטית של חיובים מ־SMS / התראות ----------
 * קיצור דרך באייפון (או MacroDroid באנדרואיד) שולח לכאן את הטקסט של הודעת הבנק או חברת האשראי.
 * ההודעה מפוענחת לסכום, בית עסק, כרטיס ותאריך, ונכנסת כתנועה עם התראה לכל המחוברים.
 * המפתח (ING) מאפשר רק להוסיף תנועות, לא לקרוא נתונים. אפשר להחליף אותו מהאפליקציה בכל רגע.
 */
var INBOX = 'הודעות בנק';
var IH = ['התקבל', 'מקור', 'הודעה', 'מצב', 'סכום', 'בית עסק', 'id'];
var ING_DAY_MAX = 300;

var SMS_RULES = [['סופר ואוכל', /שופרסל|רמי לוי|ויקטורי|יוחננוף|אושר עד|מגה|טיב טעם|חצי חינם|יינות ביתן|סופר|מכולת|קרפור|carrefour|פרש מרקט|מאפי|ירקות|קצביה/i],
  ['תחבורה ודלק', /פז |סונול|דור אלון|דלק|yellow|רב.?קו|רכבת|אגד|gett|מונית|חניון|פנגו|pango|cellopark|סלופארק|כביש 6|נתיבי/i],
  ['חשבונות ותקשורת', /סלקום|פרטנר|פלאפון|הוט |hot |בזק|גולן טלקום|we4g|חברת החשמל|חשמל|מקורות|תאגיד מים|ארנונה|סופרגז|אמישראגז|netflix|spotify|apple\.com|google/i],
  ['בילויים ומסעדות', /ארומה|קפה|מקדונלד|בורגר|פיצה|וולט|wolt|תן ביס|10bis|מסעד|סינמה|קולנוע|גלידה|שווארמה|פלאפל|בר /i],
  ['בריאות וביטוחים', /מכבי|כללית|מאוחדת|לאומית|סופר.?פארם|בי פארם|ביטוח|הראל|מגדל|הפניקס|מנורה|רופא|מרפאה/i],
  ['מגורים ושכירות', /שכירות|שכר דירה|ועד בית|משכנתא/i],
  ['חיסכון והשקעות', /חיסכון|השקע|גמל|קרן השתלמות|פיקדון|פקדון/i],
  ['ציוד ועבודה', /ksp|באג |איבורי|ivory|מחסני חשמל|צילום|canon|קנון|amazon|אמזון|aliexpress|עלי אקספרס/i]];
var SMS_IRULES = [['משכורת', /משכורת|שכר עבודה|salary|payroll/i]];

var SMS_NUM = '(\\d{1,3}(?:,\\d{3})+(?:\\.\\d{1,2})?|\\d+(?:[.,]\\d{1,2})?)';
var SMS_CUR = '(₪|ש"ח|שח|nis|ils|שקלים|שקל|\\$|usd|דולרים|דולר|€|eur|יורו|£|gbp|ליש"ט)';
var SMS_STOP = '(?=\\s+(?:בסך|על סך|בסכום|בתאריך|תאריך|בכרטיס|בכרטיסך|לכרטיס|בחשבון|בחשבונך|המסתיים|שמספרו|ב-?\\d|לפרטים|למידע|לבירור|היתרה|יתרת|יתרה|בשעה|ב-?\\d+\\s*תשלומים|לחשבונך|מחשבונך|אושרה|בוצעה|בוצע|בוטלה|on|for)(?=\\s|$|[,.;])|\\s+(?:בסך|לפרטים)|[,;\\n|]|\\.(?:\\s|$)|\\s-\\s|$)';

function smsNorm_(s) {
  return String(s || '').replace(/[‎‏‪-‮⁦-⁩﻿]/g, '')
    .replace(/[״”“]/g, '"').replace(/[׳’‘]/g, "'").replace(/[–—]/g, '-')
    .replace(/https?:\/\/\S+|www\.\S+/gi, ' ').replace(/\s+/g, ' ').trim();
}
function smsNum_(s) {
  s = String(s);
  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, ''); else s = s.replace(',', '.');
  return Math.round((parseFloat(s) || 0) * 100) / 100;
}
function smsCur_(c) {
  c = String(c || '').toLowerCase();
  if (/\$|usd|דולר/.test(c)) return 'USD';
  if (/€|eur|יורו/.test(c)) return 'EUR';
  if (/£|gbp|ליש"ט/.test(c)) return 'GBP';
  return 'ILS';
}
function smsCleanName_(s) {
  s = String(s || '').replace(/\s+/g, ' ')
    .replace(/\s+(?:חייב(?:ה)?|חויב(?:ה)?|גבה|גבתה|ביצע(?:ה)?|זיכה|זיכתה)(?:\s.*)?$/, '')
    .replace(/\s+(?:את\s+)?(?:כרטיס|חשבו)\S*(?:\s.*)?$/, '')
    .replace(/^[\s:'"\-]+|[\s:'"\-]+$/g, '');
  if (!s || s.length < 2 || /^\d+$/.test(s)) return '';
  if (/^(?:כרטיס|כרטיסך|חשבון|חשבונך|תאריך|סך|סכום|עסקה|יתרה|יתרת|לפרטים|שקל|ש"ח|הוראת קבע$)/.test(s)) return '';
  return s.slice(0, 60);
}

/** מפענח הודעת בנק/אשראי. מחזיר {skip:סיבה} או {a,cur,t,n,card,d,inst}. */
function parseSms_(raw, today) {
  var s = smsNorm_(raw);
  if (!s) return {skip: 'empty'};
  if (/(?:קוד|סיסמ[הא])\s*(?:ה?חד[\s-]?פעמי|ה?אימות|לאימות|זמני|הכניסה|לכניסה|הזדהות|לאישור)|קוד האימות|קוד אימות|verification code|one[\s-]?time|\bOTP\b|passcode/i.test(s)) return {skip: 'otp'};
  if (/לא אושרה|לא אושר|נדחתה|נדחה|סורבה|סירוב|לא בוצעה|לא בוצע|נכשלה|declined/i.test(s)) return {skip: 'declined'};
  if (/(?:חיוב|תשלום|חויב)\s+(?:חודשי\s+)?(?:של\s+)?(?:ל?כרטיס(?:י)?\s*(?:ה)?אשראי|כרטיס(?:י)?\s+(?:מקס|max|ויזה|כאל|cal|ישראכרט|אמריקן|דיינרס|לאומי קארד))|(?:חיוב|חויב)\s+(?:מקס איט|ישראכרט|כאל|לאומי קארד|אמריקן אקספרס|דיינרס)/i.test(s) && !/עסקה|רכישה/.test(s)) return {skip: 'cardbill'};

  var rxA = new RegExp(SMS_NUM + '\\s*' + SMS_CUR + '|' + SMS_CUR + '\\s*' + SMS_NUM, 'gi'), m, best = null;
  while ((m = rxA.exec(s))) {
    var before = s.slice(Math.max(0, m.index - 22), m.index);
    var cand = {a: smsNum_(m[1] || m[4]), cur: smsCur_(m[2] || m[3]), i: m.index, end: m.index + m[0].length};
    if (!(cand.a > 0)) continue;
    if (/(?:יתר[הת]|מסגרת|ניצול|נותר|זמין|ליתרה)[^\d]*$/.test(before)) { if (!best) cand.bal = 1; else continue; }
    if (!best || (best.bal && !cand.bal)) best = cand;
    if (!best.bal) break;
  }
  if (!best || best.bal) {
    var mf = s.match(new RegExp('(?:בסך|סכום|על סך|בסכום|ע"ס)(?:\\s+של)?:?\\s*' + SMS_NUM));
    if (mf) best = {a: smsNum_(mf[1]), cur: 'ILS', i: mf.index, end: mf.index + mf[0].length};
  }
  if (!best || !(best.a > 0)) return {skip: 'noamount'};

  var inc = /זיכוי|זוכה|זוכית|הופקד|הפקדת|הפקדה|העברה נכנסת|התקבלה העברה|קיבלת|החזר כספי|בוטלה|בוטל|ביטול עסקה|הועבר(?:ו)? לחשבונך|נכנס(?:ו|ה)? לחשבונך|refund|credited/i.test(s)
    && !/משיכ|חויב|חיוב בסך|העברה יוצאת|הועבר(?:ו)? מחשבונך/.test(s);

  var card = '', mc = s.match(/(?:כרטיס\S*|המסתיים|מסתיים|שמספרו|card|ending)[^\d]{0,22}(\d{4})(?!\d)/i);
  if (mc) card = mc[1];
  else { var ma = s.match(/חשבו(?:ן|נך)\S*\s*(?:מס'?\s*)?([\d\/-]{4,})/); if (ma) card = ma[1].replace(/\D/g, '').slice(-4); }

  var rest = s.slice(0, best.i) + ' ' + s.slice(best.end), d = '';
  var md = rest.match(/(?:בתאריך|תאריך:?|ביום|on|ב-?)\s*(\d{1,2})[\/.](\d{1,2})(?:[\/.](\d{2,4}))?/i) || rest.match(/(?:^|\s)(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?(?=\s|$|[,.])/);
  if (md) {
    var dd = +md[1], mm = +md[2], yy = md[3] ? +md[3] : +today.slice(0, 4);
    if (yy < 100) yy += 2000;
    if (dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12) {
      d = yy + '-' + pad_(mm) + '-' + pad_(dd);
      if (!md[3] && d > today) d = (yy - 1) + '-' + pad_(mm) + '-' + pad_(dd);
      if (d > today) d = today;
    }
  }

  var n = '', after = s.slice(best.end), mm2;
  var lines = String(raw || '').split(/\r?\n/).map(smsNorm_).filter(String);
  var pats = [
    function () {
      for (var li = 0; li < lines.length; li++) {
        var lm = lines[li].match(/^(?:בית ה?עסק:?\s*)?(.+?)\s*[-:]?\s*(?:סכום|בסך|על סך)\s*[-:]?\s*[\d₪]/);
        if (!lm) continue;
        var cand = smsCleanName_(lm[1].replace(/^[^:]{1,20}:\s*/, ''));
        if (cand && !/חרגת|יתר[הת]|כרטיס|חשבו|עסקה|רכישה|חיוב|זיכוי|העברה|בוצע|ביצעת|^(?:היי|שלום)/.test(cand)) return [0, cand];
      }
      return null;
    },
    function () {
      var src2 = lines.length ? lines : [s];
      for (var li = 0; li < src2.length; li++) {
        var vm = src2[li].match(/^(?:[^:]{1,20}:\s*)?(.{2,50}?)\s+(?:חייב(?:ה)?|חויב(?:ה)?|גבה|גבתה)\s+(?:את\s+)?(?:כרטיס|חשבו)/);
        if (vm) { var c2 = smsCleanName_(vm[1]); if (c2 && !/עסקה|רכישה|^(?:היי|שלום)/.test(c2)) return [0, c2]; }
      }
      return null;
    },
    function () { return s.match(new RegExp('(?:בבית העסק|בבית עסק|בית העסק|בית עסק|אצל|בעסק)[:\\s-]+(.+?)' + SMS_STOP)); },
    function () { return s.match(new RegExp('(?:בגין|עבור|מאת|לטובת|תיאור:?)\\s*:?\\s*([^,.;\\n\\d][^,.;\\n]{1,50}?)' + SMS_STOP)); },
    function () { return after.match(new RegExp('^\\s*(?:ב-|ב\\s|ב(?!גין|כרטיס|חשבו|תאריך|יום|שעה)(?=[א-תA-Za-z0-9"\'])|אצל\\s|at\\s|ל-|לטובת\\s)\\s*(.+?)' + SMS_STOP, 'i')); },
    function () { return s.match(new RegExp('(?:עסקה|רכישה|חיוב|תשלום)\\s+(?:ב-?|אצל\\s|ל-?)\\s*([^,.;\\n\\d][^,.;\\n]{1,40}?)\\s+(?:בסך|על סך|בסכום|ע"ס)')); },
    function () { return s.match(/\bat\s+([A-Za-z0-9 .&'*\/-]{2,40}?)(?=\s+on\s|\s+for\s|[,;]|\.(?:\s|$)|$)/i); },
    function () {
      var pre = s.slice(0, best.i).replace(/^[^:]{1,20}:\s*/, '').replace(/\s*(?:בסך|על סך|בסכום|של|ע"ס)\s*$/, '').trim();
      return pre && pre.length <= 40 && !/עסקה|רכישה|חיוב|חויב|כרטיס|חשבו|זיכוי|הועבר|בוצע|העברה|תשלום/.test(pre) ? [0, pre] : null;
    }
  ];
  for (var k = 0; k < pats.length && !n; k++) { mm2 = pats[k](); if (mm2) n = smsCleanName_(mm2[1]); }
  if (n && /^(?:כרטיס|כרטיסך|חשבון)/.test(n)) n = '';
  if (!n && inc && /משכורת|שכר עבודה|salary|payroll/i.test(s)) n = 'משכורת';
  if (!n && inc && /בוטל|ביטול/.test(s)) n = 'ביטול עסקה';

  var inst = '', mi = s.match(/(\d+)\s*תשלומים|תשלום\s*(\d+)\s*(?:מתוך|מ-)\s*(\d+)/);
  if (mi) inst = mi[1] ? mi[1] + ' תשלומים' : 'תשלום ' + mi[2] + ' מתוך ' + mi[3];

  return {a: best.a, cur: best.cur, t: inc ? 'inc' : 'exp', n: n, card: card, d: d || today, inst: inst};
}

function smsKey_(n) {
  return String(n || '').toLowerCase().replace(/\(.*?\)/g, ' ').replace(/[^a-zא-ת ]/g, ' ').trim().split(/\s+/)
    .filter(function (w) { return w.length > 1; }).slice(0, 2).join(' ');
}
function smsCat_(p, s, cfg) {
  var cats = (cfg && cfg.cats) || [], rules = (cfg && cfg.rules) || {};
  var byId = {}; cats.forEach(function (c) { byId[c.id] = c; });
  var lr = rules[smsKey_(p.n)];
  if (lr && byId[lr] && byId[lr].k === p.t) return byId[lr];
  var list = p.t === 'inc' ? SMS_IRULES : SMS_RULES;
  for (var pass = 0; pass < 2; pass++) {
    var txt = pass ? s : p.n;
    if (!txt) continue;
    for (var i = 0; i < list.length; i++) {
      if (!list[i][1].test(txt)) continue;
      var hit = cats.filter(function (c) { return c.k === p.t && c.name === list[i][0]; })[0];
      if (hit) return hit;
    }
  }
  return cats.filter(function (c) { return c.k === p.t && /שונות|אחרת/.test(c.name); })[0] || cats.filter(function (c) { return c.k === p.t; })[0] || null;
}
function fxRate_(cur) {
  var cache = CacheService.getScriptCache(), k = 'fx_' + cur, v = cache.get(k);
  if (v) return +v;
  try {
    var r = UrlFetchApp.fetch('https://boi.org.il/PublicApi/GetExchangeRate?key=' + cur, {muteHttpExceptions: true});
    var j = JSON.parse(r.getContentText()), rate = (+j.currentExchangeRate) / (+j.unit || 1);
    if (rate > 0) { cache.put(k, String(rate), 6 * 3600); return rate; }
  } catch (e) {}
  return 0;
}
function money2_(x) {
  var v = Math.round(Math.abs(x) * 100) / 100, s = (v % 1 ? v.toFixed(2) : String(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return '₪' + s;
}
function inboxSheet_() {
  var ss = SpreadsheetApp.getActive(), sh = ss.getSheetByName(INBOX);
  if (!sh) {
    sh = ss.insertSheet(INBOX);
    sh.getRange(1, 1, 1, IH.length).setValues([IH]).setFontWeight('bold').setBackground('#00a862').setFontColor('#0b0b10');
    sh.setFrozenRows(1);
    try { sh.setRightToLeft(true); } catch (e) {}
    sh.getRange('A2:A').setNumberFormat('dd/MM/yyyy HH:mm');
  }
  return sh;
}
function inboxLog_(src, text, state, p, id) {
  try {
    var sh = inboxSheet_();
    sh.appendRow([new Date(), safe_(src), safe_(String(text).slice(0, 500)), state, p && p.a ? (p.t === 'inc' ? p.a : -p.a) : '', safe_(p && p.n || ''), id || '']);
    var n = sh.getLastRow();
    if (n > 600) sh.deleteRows(2, n - 500);
  } catch (e) {}
}
var SKIP_TXT = {otp: 'קוד אימות, לא נשמר', declined: 'עסקה שלא אושרה', cardbill: 'חיוב חודשי של כרטיס אשראי (העסקאות עצמן כבר נקלטו)', noamount: 'לא נמצא סכום', empty: 'הודעה ריקה', dup: 'כפולה, כבר נקלטה'};

function ingTok_(props) {
  var t = props.getProperty('ING');
  if (!t) { t = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '').slice(0, 40); props.setProperty('ING', t); }
  return t;
}
function ingToken_(req) {
  var props = PropertiesService.getScriptProperties();
  if (req.rotate) props.deleteProperty('ING');
  return {ok: true, v: VERSION, tok: ingTok_(props)};
}
function ingTest_(req) {
  var tz = tz_(), today = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  var text = String(req.text || '').slice(0, 1000), p = parseSms_(text, today);
  if (p.skip) return {ok: true, v: VERSION, skip: p.skip, why: SKIP_TXT[p.skip] || ''};
  var cf = SpreadsheetApp.getActive().getSheetByName(CFG), cfg = {};
  try { cfg = JSON.parse(cf.getRange('A2').getValue() || '{}'); } catch (e) {}
  var c = smsCat_(p, smsNorm_(text), cfg);
  return {ok: true, v: VERSION, p: p, cat: c ? c.name : ''};
}

/** נקודת הכניסה של קיצור הדרך. req: {tok, text, src?} */
function ingest_(req) {
  var props = PropertiesService.getScriptProperties(), tok = props.getProperty('ING');
  if (!tok || String(req.tok || '') !== tok) return {ok: false, err: 'tok'};
  var text = String(req.text || req.message || '').slice(0, 1000), src = String(req.src || req.from || 'SMS').slice(0, 40);
  var tz = tz_(), nowD = new Date(), now = nowD.getTime(), today = Utilities.formatDate(nowD, tz, 'yyyy-MM-dd');

  var day = Utilities.formatDate(nowD, tz, 'yyyyMMdd'), cnt = props.getProperty('ING_N') || '';
  var cn = cnt.indexOf(day + ':') === 0 ? +cnt.split(':')[1] : 0;
  if (cn >= ING_DAY_MAX) return {ok: false, err: 'limit'};
  props.setProperty('ING_N', day + ':' + (cn + 1));

  var p = parseSms_(text, today);
  if (p.skip) {
    inboxLog_(src, p.skip === 'otp' ? '(קוד אימות הוסתר)' : text, 'דולג: ' + (SKIP_TXT[p.skip] || p.skip), null, '');
    return {ok: true, v: VERSION, skip: p.skip};
  }
  var s = smsNorm_(text), h = Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_1, s, Utilities.Charset.UTF_8)).slice(0, 16);
  var seen = [];
  try { seen = JSON.parse(props.getProperty('ING_SEEN') || '[]'); } catch (e) {}
  seen = seen.filter(function (x) { return now - x.ts < 3 * 86400000; });
  var dup = seen.filter(function (x) { return x.h === h || (x.a === p.a && x.t === p.t && (x.c === p.card || !x.c || !p.card) && Math.abs(now - x.ts) < 900000); })[0];
  if (dup) { inboxLog_(src, text, 'דולג: ' + SKIP_TXT.dup, p, dup.id); return {ok: true, v: VERSION, skip: 'dup', id: dup.id}; }

  var note = [], a = p.a;
  if (p.cur !== 'ILS') {
    var rate = fxRate_(p.cur);
    if (rate) { a = Math.round(p.a * rate * 100) / 100; note.push(p.a + ' ' + p.cur + ' לפי שער ' + (Math.round(rate * 1000) / 1000) + ' (הסכום הסופי בחיוב יכול להשתנות מעט)'); }
    else note.push('הסכום ב-' + p.cur + ' ולא הומר לשקלים, צריך לעדכן');
  }
  if (p.inst) note.push(p.inst);
  note.push('נקלט אוטומטית מ' + (src === 'SMS' ? 'הודעת SMS' : src) + (p.card ? ', כרטיס/חשבון ' + p.card : ''));

  var cf = SpreadsheetApp.getActive().getSheetByName(CFG), cfg = {};
  try { cfg = JSON.parse((cf && cf.getRange('A2').getValue()) || '{}'); } catch (e) {}
  var c = smsCat_(p, s, cfg);
  var name = p.n || (p.t === 'inc' ? 'זיכוי' : 'חיוב') + (p.card ? ' ' + p.card : '');
  var t = {id: 'b' + newId_().slice(0, 11), d: p.d, t: p.t, a: a, c: c ? c.id : '', cn: c ? c.name : '', n: name,
    note: note.join(' · '), tags: ['אוטומטי'], u: now};

  var sh = setup_(), row = toRow_(t, now, {});
  sh.getRange(sh.getLastRow() + 1, 1, 1, H.length).setValues([row.vals]);
  seen.push({h: h, a: p.a, c: p.card, t: p.t, ts: now, id: t.id});
  props.setProperty('ING_SEEN', JSON.stringify(seen.slice(-120)));
  inboxLog_(src, text, 'נקלט', {a: a, t: p.t, n: name}, t.id);

  try {
    var n = Math.max(0, sh.getLastRow() - 1), data = n ? sh.getRange(2, 1, n, H.length).getValues() : [];
    var ev = [{type: 'bank', all: true, title: p.t === 'inc' ? 'זיכוי' + (p.card ? ' ב-' + p.card : '') : 'חיוב' + (p.card ? ' בכרטיס ' + p.card : ''),
      body: money2_(a) + ' · ' + name + (c ? ' ← ' + c.name : '')}];
    budgetEvents_(data, cfg, tz).forEach(function (e) { e.all = true; ev.push(e); });
    pushAll_(ev, '', now);
  } catch (e) {}
  return {ok: true, v: VERSION, id: t.id, a: a, t: p.t, n: name, cat: c ? c.name : ''};
}
