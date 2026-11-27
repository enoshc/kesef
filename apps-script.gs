/**
 * הכסף שלי — סקריפט סנכרון לגוגל שיטס
 * מדביקים את כל הקוד הזה ב־Extensions > Apps Script של הגיליון, שומרים,
 * ופורסים כ־Web app (Execute as: Me, Who has access: Anyone).
 * הסקריפט ניגש רק לגיליון הזה ולתיקיית "הכסף שלי - קבלות" ב־Drive שלך.
 */
var TX = 'תנועות';
var CFG = 'הגדרות';
var FOLDER = 'הכסף שלי - קבלות';
var H = ['תאריך', 'סוג', 'סכום', 'קטגוריה', 'תיאור', 'קבלה', 'נמחק', 'id', 'catId', 'img', 'u', 's', 'הערה'];
var C = {d: 0, t: 1, a: 2, cn: 3, n: 4, rc: 5, del: 6, id: 7, c: 8, img: 9, u: 10, s: 11, note: 12};
var TECH = C.s - C.id + 1;
var VERSION = 4;
var KINDS = {
  msg: {name: 'הודעות', H: ['תאריך', 'מאת', 'הודעה', 'נמחק', 'id', 'u', 's', 'data'], V: 4, D: 3,
    vis: function (it) { return [new Date(it.ts), safe_(it.by), safe_(it.text), it.del ? 'כן' : '']; }},
  pic: {name: 'תמונות', H: ['תאריך', 'מאת', 'כיתוב', 'תמונה', 'נמחק', 'id', 'u', 's', 'data'], V: 5, D: 4, L: 4,
    vis: function (it) { return [new Date(it.ts), safe_(it.by), safe_(it.text), '', it.del ? 'כן' : '']; }}
};

function doGet() {
  return out_({ok: true, app: 'kesef', v: VERSION});
}

function doPost(e) {
  var req;
  try { req = JSON.parse(e.postData.contents); } catch (err) { return out_({ok: false, err: 'bad_json'}); }
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
  if (sh.getRange(1, C.note + 1).getValue() !== 'הערה') sh.getRange(1, C.note + 1).setValue('הערה').setFontWeight('bold').setBackground('#00a862').setFontColor('#0b0b10');
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
      String(t.id), String(t.c || ''), img, +t.u || now, now, safe_(String(t.note || '').slice(0, 500))],
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
    c: String(v[C.c] || ''), img: String(v[C.img] || ''), u: +v[C.u] || 0, s: +v[C.s] || 0, note: String(v[C.note] || ''),
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
      idx[t.id] = data.length; data.push(row.vals); append.push(row); sent[t.id] = 1;
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
  var incoming = {}, out = [], ids = [];
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
  return {items: out, ids: ids};
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
