/**
 * הכסף שלי — קוד טעינה עם עדכונים אוטומטיים
 *
 * מדביקים את הקוד הקצר הזה במקום כל הסקריפט, פעם אחת, ופורסים גרסה חדשה.
 * מכאן והלאה הסקריפט מושך לבד את הגרסה העדכנית מ־GitHub (בדיקה פעם בשעה),
 * ואין צורך להעתיק ולפרסם מחדש בכל עדכון.
 *
 * חשוב לדעת: מי שיכול לשנות את הקובץ במאגר (enoshc/kesef) יכול להריץ קוד בחשבון
 * הגוגל שלכם, עם אותן הרשאות שנתתם לסקריפט (הגיליון, תיקיית הקבלות, שליחת מיילים).
 * השתמשו בזה רק אם אתם סומכים על מי שמנהל את המאגר. אפשר לחזור בכל רגע לקוד המלא.
 */
var KESEF_SRC = 'https://raw.githubusercontent.com/enoshc/kesef/main/apps-script.gs';
var KESEF_AUTO = true;
var KESEF_TTL = 3600;
var KESEF_CHUNK = 4000;

function KESEF_RELOAD() {
  try { CacheService.getScriptCache().remove('ks_n'); } catch (e) {}
  K_.m = null;
}

function ksFromCache_() {
  var cache = CacheService.getScriptCache(), n = +cache.get('ks_n');
  if (!n) return null;
  var keys = [];
  for (var i = 0; i < n; i++) keys.push('ks_' + i);
  var got = cache.getAll(keys), out = '';
  for (var j = 0; j < n; j++) { if (got['ks_' + j] == null) return null; out += got['ks_' + j]; }
  return out;
}

function ksToCache_(src) {
  var cache = CacheService.getScriptCache(), parts = {}, n = 0;
  for (var i = 0; i < src.length; i += 90000) parts['ks_' + (n++)] = src.slice(i, i + 90000);
  cache.putAll(parts, KESEF_TTL);
  cache.put('ks_n', String(n), KESEF_TTL);
}

function ksHash_(src) {
  return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, src, Utilities.Charset.UTF_8));
}

/** עותק אחרון שעבד, למקרה ש־GitHub לא זמין. */
function ksFromProps_() {
  var p = PropertiesService.getScriptProperties(), n = +p.getProperty('ksp_n');
  if (!n) return null;
  var out = '';
  for (var i = 0; i < n; i++) { var v = p.getProperty('ksp_' + i); if (v == null) return null; out += v; }
  return out;
}

function ksToProps_(src) {
  var p = PropertiesService.getScriptProperties(), h = ksHash_(src);
  if (p.getProperty('ksp_h') === h) return;
  var old = +p.getProperty('ksp_n') || 0, n = 0, all = {};
  for (var i = 0; i < src.length; i += KESEF_CHUNK) all['ksp_' + (n++)] = src.slice(i, i + KESEF_CHUNK);
  all.ksp_n = String(n);
  all.ksp_h = h;
  p.setProperties(all);
  for (var j = n; j < old; j++) p.deleteProperty('ksp_' + j);
}

function ksValid_(t) {
  return typeof t === 'string' && /var VERSION = \d+/.test(t) && /function doPost\(/.test(t) && /function doGet\(/.test(t);
}

function K_(noFetch) {
  if (K_.m) return K_.m;
  var src = null;
  try { src = ksFromCache_(); } catch (e) {}
  if (!src && !noFetch) {
    try {
      var r = UrlFetchApp.fetch(KESEF_SRC + '?t=' + Date.now(), {muteHttpExceptions: true, followRedirects: true});
      var t = r.getResponseCode() === 200 ? r.getContentText() : '';
      if (ksValid_(t)) {
        src = t;
        try { ksToCache_(t); } catch (e) {}
        try { ksToProps_(t); } catch (e) {}
      }
    } catch (e) {}
  }
  if (!src) src = ksFromProps_();
  if (!ksValid_(src)) throw new Error('kesef: לא הצלחתי לטעון את הקוד מ־GitHub ואין עותק שמור');
  K_.m = new Function(src + '\n;return {doGet: doGet, doPost: doPost, onEdit: onEdit, weeklyEmail: weeklyEmail, monthlyEmail: monthlyEmail, authorize: authorize};')();
  return K_.m;
}

function doGet(e) { return K_().doGet(e); }
function doPost(e) { return K_().doPost(e); }
function onEdit(e) { try { return K_(true).onEdit(e); } catch (err) {} }
function weeklyEmail() { return K_().weeklyEmail(); }
function monthlyEmail() { return K_().monthlyEmail(); }

/** מריצים פעם אחת מהעורך (Run) כדי לאשר את כל ההרשאות שהסקריפט צריך. */
function authorize() {
  SpreadsheetApp.getActive();
  DriveApp.getRootFolder();
  MailApp.getRemainingDailyQuota();
  ScriptApp.getProjectTriggers();
  CacheService.getScriptCache();
  PropertiesService.getScriptProperties();
  LockService.getScriptLock();
  UrlFetchApp.fetch(KESEF_SRC, {muteHttpExceptions: true});
  KESEF_RELOAD();
  K_();
  return 'ok';
}
