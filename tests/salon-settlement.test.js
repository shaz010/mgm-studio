#!/usr/bin/env node
/**
 * Settlement checks for Your Salon (Earnings + Appointments).
 *
 *   node tests/salon-settlement.test.js
 *
 * The logic tests run with TZ=America/Los_Angeles so "after 4 PM Pacific"
 * is a real UTC day/month boundary. A headless Chrome pass then loads
 * app.html and appt.html and checks the live screens.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const vm = require('vm');
const {spawn, spawnSync} = require('child_process');

const ROOT = path.resolve(__dirname, '..');

if (process.env.TZ !== 'America/Los_Angeles') {
  const r = spawnSync(process.execPath, [__filename], {
    env: Object.assign({}, process.env, {TZ: 'America/Los_Angeles'}),
    stdio: 'inherit'
  });
  process.exit(r.status == null ? 1 : r.status);
}

let failed = 0;
function assert(cond, msg) {
  if (cond) return;
  failed++;
  console.error('FAIL:', msg);
}
function eq(actual, expected, msg) {
  if (actual === expected) return;
  failed++;
  console.error('FAIL:', msg, '\n  expected:', expected, '\n  actual:  ', actual);
}

function read(name) {
  return fs.readFileSync(path.join(ROOT, name), 'utf8');
}
function extractBlock(html, file) {
  const m = html.match(/\/\* === salon-settle:start ===[\s\S]*?\*\/([\s\S]*?)\/\* === salon-settle:end === \*\//);
  if (!m) throw new Error('missing salon-settle block in ' + file);
  return m[1];
}
function loadApp(code) {
  return new Function(code + '\nreturn {_splitCents: _splitCents, moneyParts: moneyParts, countsTowardOwed: countsTowardOwed, localYMD: localYMD, localYM: localYM, startOfLocalWeekYMD: startOfLocalWeekYMD};')();
}
function loadAppt(code) {
  return new Function(code + '\nreturn {_splitCents: _splitCents, ymd: ymd};')();
}
function inlineScripts(html) {
  const out = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    if (/\bsrc\s*=/i.test(m[1])) continue;
    if (m[2].trim()) out.push(m[2]);
  }
  return out;
}

function logicTests() {
  const appHtml = read('app.html');
  const apptHtml = read('appt.html');
  const salonHtml = read('salon.html');
  const sw = read('sw.js');

  const app = loadApp(extractBlock(appHtml, 'app.html'));
  const appt = loadAppt(extractBlock(apptHtml, 'appt.html'));

  // --- versions the service worker and shell actually ship ---
  assert(appHtml.includes("var VERSION='app v2.62"), 'app.html version bumped from v2.61');
  assert(apptHtml.includes("var VERSION='v6.23"), 'appt.html version bumped from v6.22');
  assert(salonHtml.includes('salon v0.51'), 'salon.html visible version bumped');
  assert(salonHtml.includes("var SHELL_V='v0.51'"), 'SHELL_V matches the page (was stuck at v0.38)');
  assert(!salonHtml.includes("SHELL_V='v0.38'"), 'stale SHELL_V removed');
  assert(sw.includes("const CACHE = 'yoursalon-v76'"), 'service worker cache bumped to v76');
  assert(appHtml.includes("askConfirm('Change your commission rate"), 'saveSettings uses askConfirm');
  assert(!appHtml.includes("confirm('Change your commission"), 'native confirm() removed from the rate change');

  ['app.html', 'appt.html', 'salon.html'].forEach(function(name) {
    inlineScripts(read(name)).forEach(function(code, i) {
      try { new vm.Script(code, {filename: name + '#script' + i}); }
      catch (e) { assert(false, name + ' script ' + i + ' syntax: ' + e.message); }
    });
  });

  // --- only Done work settles; legacy Earnings logs with no status still count ---
  eq(app.countsTowardOwed({_src: 'appt', status: 'done'}), true, 'done appointment counts');
  eq(app.countsTowardOwed({_src: 'appt', status: 'cancelled'}), false, 'cancelled appointment does not count');
  eq(app.countsTowardOwed({_src: 'appt', status: 'noshow'}), false, 'no-show does not count');
  eq(app.countsTowardOwed({_src: 'appt', status: 'confirmed'}), false, 'confirmed (not done) does not count');
  eq(app.countsTowardOwed({_src: 'appt', status: ''}), false, 'appointments-room row with a blank status does not count');
  eq(app.countsTowardOwed({_src: 'appt'}), false, 'appointments-room row with no status does not count');
  eq(app.countsTowardOwed({name: 'Manual'}), true, 'Earnings log with no status still counts');
  eq(app.countsTowardOwed({status: ''}), true, 'blank status on an Earnings log still counts');
  eq(app.countsTowardOwed({status: 'done'}), true, 'Earnings log marked done counts');
  eq(app.countsTowardOwed({status: 'cancelled'}), false, 'Earnings log explicitly cancelled does not count');
  eq(app.countsTowardOwed({status: 'noshow'}), false, 'Earnings log explicitly no-show does not count');
  eq(app.countsTowardOwed({status: 'confirmed'}), false, 'Earnings log explicitly not-done does not count');
  eq(app.countsTowardOwed(null), false, 'missing row does not count');

  // --- cent split: halves add up to the charge, including the old 50% penny bug ---
  function checkSplit(fns, price, pct, label) {
    const s = fns._splitCents(price, pct);
    eq(s.me + s.salon, s.charge, label + ' shares sum to charge (' + price + ' @ ' + pct + '%)');
    eq(s.charge, Math.round((+price || 0) * 100), label + ' charge cents ' + price);
  }
  [0, 0.01, 0.29, 1.13, 2.05, 10, 10.01, 10.03, 10.05, 19.99, 33.33, 100, 285.4].forEach(function(price) {
    [0, 33, 40, 50, 60, 60.5, 100].forEach(function(pct) {
      checkSplit(app, price, pct, 'earnings');
      checkSplit(appt, price, pct, 'appointments');
      const a = app._splitCents(price, pct);
      const b = appt._splitCents(price, pct);
      eq(a.me, b.me, 'rooms agree on stylist cents ' + price + ' @ ' + pct);
      eq(a.salon, b.salon, 'rooms agree on salon cents ' + price + ' @ ' + pct);
    });
  });
  const odd = app._splitCents(10.05, 50);
  eq(odd.me, 503, '$10.05 at 50% stylist gets the half-up penny ($5.03)');
  eq(odd.salon, 502, '$10.05 at 50% salon gets the remainder ($5.02)');
  // The old formula rounded each half on its own and produced $5.03 + $5.03.
  const oldMe = +(10.05 * 0.5).toFixed(2);
  const oldSalon = +(10.05 * 0.5).toFixed(2);
  assert(Math.round((oldMe + oldSalon) * 100) !== 1005, 'old separate rounding really did miss the charge');
  const parts = app.moneyParts(10.05, 1.25, 50);
  eq(Math.round(parts.me * 100) + Math.round(parts.salon * 100), 1005, 'moneyParts salon + me = charge');
  eq(Math.round(parts.mytotal * 100), 503 + 125, 'take-home is stylist share plus tip, in cents');

  // --- local calendar, not UTC. Nov 2026 is PST (UTC-8); 4:00 PM is midnight UTC. ---
  const after4 = new Date('2026-11-17T00:30:00Z'); // 4:30 PM Pacific on Nov 16
  eq(app.localYMD(after4), '2026-11-16', 'after 4 PM Pacific, today is still the 16th');
  eq(appt.ymd(after4), '2026-11-16', 'Appointments ymd agrees');
  eq(after4.toISOString().slice(0, 10), '2026-11-17', 'UTC date really is the next day (the bug)');
  const monthEdge = new Date('2026-12-01T00:30:00Z'); // 4:30 PM Pacific on Nov 30
  eq(app.localYM(monthEdge), '2026-11', 'Mark this month paid stays in November after 4 PM Pacific on the 30th');
  eq(app.localYMD(monthEdge), '2026-11-30', 'local day on the month boundary');
  eq(monthEdge.toISOString().slice(0, 7), '2026-12', 'UTC month really is December (the bug)');

  // Week filter starts at local Sunday 00:00, not at the current clock time.
  // Nov 15 2026 is a Sunday; Nov 16 is the Monday this change was made.
  const sundayEvening = new Date(2026, 10, 15, 16, 30, 0);
  eq(sundayEvening.getDay(), 0, 'fixture Sunday is Sunday');
  eq(app.startOfLocalWeekYMD(sundayEvening), '2026-11-15', 'Sunday evening still starts the week on Sunday');
  const sowOld = new Date(sundayEvening);
  sowOld.setDate(sundayEvening.getDate() - sundayEvening.getDay());
  const sundayNoon = new Date(2026, 10, 15, 12, 0, 0);
  assert(sundayNoon < sowOld, 'old week filter (clock time, not start of day) dropped a Sunday noon booking');
  assert('2026-11-15' >= app.startOfLocalWeekYMD(sundayEvening), 'new week filter keeps Sunday');
  assert('2026-11-14' < app.startOfLocalWeekYMD(sundayEvening), 'Saturday is the previous week');
  const wednesday = new Date(2026, 10, 18, 15, 0, 0);
  eq(app.startOfLocalWeekYMD(wednesday), '2026-11-15', 'Wednesday belongs to the Sunday that started the week');

  // Round-trip a calendar day through local components. The old toISOString path
  // shifted the day in time zones where local noon is a different UTC date.
  eq(app.localYMD(new Date(2026, 10, 16, 12, 0, 0)), '2026-11-16', 'local noon stays on that calendar day');
  eq(appt.ymd(new Date(2026, 10, 16, 12, 0, 0)), '2026-11-16', 'appt ymd round-trips local noon');
}

function staticServer(root) {
  return new Promise(function(resolve) {
    const srv = http.createServer(function(req, res) {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      const rel = urlPath === '/' ? '/app.html' : urlPath;
      const file = path.normalize(path.join(root, rel));
      if (!file.startsWith(root)) { res.writeHead(403); res.end('no'); return; }
      fs.readFile(file, function(err, buf) {
        if (err) { res.writeHead(404); res.end('missing'); return; }
        const ext = path.extname(file);
        const type = ext === '.html' ? 'text/html' : ext === '.js' ? 'text/javascript' : 'application/octet-stream';
        res.writeHead(200, {'Content-Type': type, 'Cache-Control': 'no-store'});
        res.end(buf);
      });
    });
    srv.listen(0, '127.0.0.1', function() { resolve(srv); });
  });
}

function cdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let seq = 0;
  const pending = new Map();
  const api = {
    send: function(method, params) {
      const id = ++seq;
      return new Promise(function(resolve2, reject2) {
        pending.set(id, {resolve: resolve2, reject: reject2});
        ws.send(JSON.stringify({id: id, method: method, params: params || {}}));
      });
    },
    close: function() { try { ws.close(); } catch (e) {} }
  };
  return new Promise(function(resolve, reject) {
    const timer = setTimeout(function() { reject(new Error('CDP websocket timeout')); }, 10000);
    ws.addEventListener('open', function() { clearTimeout(timer); resolve(api); });
    ws.addEventListener('error', function() { clearTimeout(timer); reject(new Error('CDP websocket error')); });
    ws.addEventListener('message', function(ev) {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        const p = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) p.reject(new Error(JSON.stringify(msg.error)));
        else p.resolve(msg.result);
        return;
      }
      if (msg.method === 'Page.javascriptDialogOpening') {
        api.send('Page.handleJavaScriptDialog', {accept: true}).catch(function() {});
      }
    });
  });
}

async function evalJson(api, expression) {
  const res = await api.send('Runtime.evaluate', {
    expression: expression,
    returnByValue: true,
    awaitPromise: true
  });
  if (res.exceptionDetails) {
    const desc = res.exceptionDetails.exception && res.exceptionDetails.exception.description;
    throw new Error(desc || res.exceptionDetails.text || 'evaluate failed');
  }
  return res.result && res.result.value;
}

async function waitForFn(api, name, ms) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const t = await evalJson(api, 'typeof ' + name);
    if (t === 'function') return;
    await new Promise(function(r) { setTimeout(r, 200); });
  }
  throw new Error(name + ' was not defined after ' + ms + 'ms');
}

async function browserTests(port, httpPort) {
  const chrome = process.env.CHROME || 'google-chrome';
  const profile = fs.mkdtempSync('/tmp/ys-chrome-');
  const proc = spawn(chrome, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--remote-debugging-port=' + port,
    '--user-data-dir=' + profile,
    'about:blank'
  ], {env: Object.assign({}, process.env, {TZ: 'America/Los_Angeles'}), stdio: 'ignore'});
  try {
    let list = null;
    for (let i = 0; i < 40; i++) {
      try {
        const r = await fetch('http://127.0.0.1:' + port + '/json/list');
        const rows = await r.json();
        list = rows.find(function(x) { return x.type === 'page'; }) || rows[0];
        if (list && list.webSocketDebuggerUrl) break;
      } catch (e) {}
      await new Promise(function(r) { setTimeout(r, 250); });
    }
    if (!list || !list.webSocketDebuggerUrl) throw new Error('Chrome DevTools endpoint did not come up');
    const api = await cdp(list.webSocketDebuggerUrl);
    await api.send('Page.enable');
    await api.send('Runtime.enable');

    await api.send('Page.navigate', {url: 'http://127.0.0.1:' + httpPort + '/app.html'});
    await waitForFn(api, 'renderMgm', 20000);
    await waitForFn(api, 'saveSettings', 5000);

    const earned = await evalJson(api, `(function(){
      localStorage.clear();
      localStorage.setItem('ap_prefs', JSON.stringify({splitPct:50}));
      localStorage.setItem('cp_prefs', JSON.stringify({rate:50, name:'Ari'}));
      localStorage.setItem('cp_paid', '{}');
      localStorage.setItem('ap_appts', JSON.stringify([
        {id:'c1', name:'Cancelled Client', date:'2026-11-01', time:'10:00', price:200, tip:20, status:'cancelled', service:'Cut'},
        {id:'n1', name:'No Show Client', date:'2026-11-02', time:'10:00', price:80, tip:10, status:'noshow', service:'Cut'},
        {id:'u1', name:'Upcoming Client', date:'2026-11-20', time:'11:00', price:50, tip:0, status:'confirmed', service:'Cut'},
        {id:'d1', name:'Done Client', date:'2026-11-03', time:'12:00', price:10.05, tip:1.25, status:'done', service:'Cut'},
        {id:'x1', name:'December Cancel', date:'2026-12-02', time:'12:00', price:500, tip:0, status:'cancelled', service:'Cut'}
      ]));
      localStorage.setItem('cp_appts', JSON.stringify([
        {id:'m1', name:'Manual Log', date:'2026-11-04', time:'09:00', charge:20, tip:0, cat:'Cut'},
        {id:'m2', name:'Manual Cancel', date:'2026-11-05', time:'09:00', charge:99, tip:0, cat:'Cut', status:'cancelled'}
      ]));
      loadAll();
      renderMgm();
      openExport('2026-11');
      if (typeof buildTaxYear === 'function') buildTaxYear();
      var taxSel = document.getElementById('taxYearSel');
      if (taxSel) { taxSel.value = '2026'; if (typeof renderTaxYear === 'function') renderTaxYear(); }
      _inPeriod = 'all';
      if (typeof renderInsightsBoard === 'function') renderInsightsBoard();
      var rows = loadAppts();
      var owedRows = rows.filter(countsTowardOwed);
      var boundary = new Date('2026-12-01T00:30:00Z');
      var after4 = new Date('2026-11-17T00:30:00Z');
      resetForm();
      return {
        owed: document.getElementById('mgmOwed').textContent,
        salon: document.getElementById('oSalon').textContent,
        me: document.getElementById('oMe').textContent,
        tip: document.getElementById('oTip').textContent,
        total: document.getElementById('oTotal').textContent,
        months: document.getElementById('monthRows').innerText,
        invoice: document.getElementById('invoicePreview').innerText,
        table: document.getElementById('tBody').innerText,
        names: owedRows.map(function(a){return a.name;}).sort(),
        sumsOk: owedRows.every(function(a){return Math.round((a.me+a.salon)*100)===Math.round(a.charge*100);}),
        weekSrc: getFiltered.toString(),
        markSrc: markThisMonthPaid.toString(),
        cDate: document.getElementById('cDate').value,
        localToday: localYMD(new Date()),
        utcToday: new Date().toISOString().slice(0,10),
        boundaryYM: localYM(boundary),
        after4YMD: localYMD(after4),
        statuses: rows.map(function(a){return a.name+':'+(a.status==null?'':a.status);}),
        tax: document.getElementById('taxYearOut') ? document.getElementById('taxYearOut').innerText : '',
        insights: document.getElementById('inBody') ? document.getElementById('inBody').innerText : ''
      };
    })()`);
    eq(earned.owed, '$16.28', 'Salon owes me shows cents and skips cancelled / no-show / not-done');
    eq(earned.salon, '$15.02', 'unpaid salon share shows cents');
    eq(earned.me, '$15.03', 'unpaid stylist share shows cents');
    eq(earned.tip, '$1.25', 'unpaid tips show cents');
    eq(earned.total, '$16.28', 'owed total matches the headline');
    eq(earned.names.join(','), 'Done Client,Manual Log', 'only the Done appointment and the legacy manual log settle');
    assert(earned.sumsOk, 'every settled row has salon + stylist = charge');
    assert(earned.months.indexOf('November') !== -1, 'November (the month with Done work) is listed');
    assert(earned.months.indexOf('December') === -1, 'a month with only a cancellation is not listed');
    assert(earned.months.indexOf('16.28') !== -1, 'November row shows the $16.28 owed');
    assert(earned.invoice.indexOf('Done Client') !== -1, 'invoice includes the Done appointment');
    assert(earned.invoice.indexOf('Manual Log') !== -1, 'invoice includes the legacy manual log');
    assert(earned.invoice.indexOf('Cancelled Client') === -1, 'invoice skips the cancellation');
    assert(earned.invoice.indexOf('No Show Client') === -1, 'invoice skips the no-show');
    assert(earned.invoice.indexOf('Upcoming Client') === -1, 'invoice skips the not-yet-done booking');
    assert(earned.invoice.indexOf('December Cancel') === -1, 'invoice skips a later cancellation');
    assert(earned.invoice.indexOf('Manual Cancel') === -1, 'invoice skips a manual log explicitly cancelled');
    assert(earned.invoice.indexOf('$16.28') !== -1, 'invoice amount owed shows cents');
    assert(earned.table.indexOf('Cancelled Client') !== -1, 'appointments list still shows the cancellation');
    assert(earned.table.indexOf('Upcoming Client') !== -1, 'appointments list still shows the upcoming booking');
    assert(earned.table.indexOf('Not done') !== -1, 'upcoming booking is labeled not done');
    assert(earned.table.indexOf('Cancelled') !== -1, 'cancellation is labeled on the list');
    assert(earned.weekSrc.indexOf('startOfLocalWeekYMD') !== -1, 'week filter uses local start of week');
    assert(earned.weekSrc.indexOf('toISOString') === -1, 'week/today filter does not use UTC');
    assert(earned.markSrc.indexOf('localYM') !== -1, 'Mark this month paid uses the local month');
    assert(earned.markSrc.indexOf('toISOString') === -1, 'Mark this month paid does not use UTC');
    eq(earned.cDate, earned.localToday, 'default date field is the local today');
    eq(earned.boundaryYM, '2026-11', 'live page: month boundary after 4 PM Pacific stays November');
    eq(earned.after4YMD, '2026-11-16', 'live page: 4:30 PM Pacific is still the 16th');
    if (earned.utcToday !== earned.localToday) {
      assert(earned.cDate !== earned.utcToday, 'default date is not the UTC date when they differ');
    }
    assert(earned.tax.indexOf('Appointments2') !== -1, 'tax year counts two settled appointments, not the cancelled ones');
    assert(earned.tax.indexOf('15.03') !== -1, 'taxable commission is the Done work only');
    assert(earned.tax.indexOf('16.28') !== -1, 'taxable total includes the Done tip');
    assert(earned.insights.indexOf('Income$16') !== -1, 'insights income is the settled $16, not cancelled charges');
    assert(earned.insights.indexOf('Visits2') !== -1, 'insights visits count completed work only');
    assert(earned.insights.indexOf('Cancelled Client') === -1, 'insights review list skips cancelled bookings');
    assert(earned.insights.indexOf('Done Client') !== -1, 'insights still include the completed visit');

    const rateDialog = await evalJson(api, `(function(){
      var called = false;
      window.confirm = function(){ called = true; return false; };
      document.getElementById('settingName').value = 'Ari';
      document.getElementById('settingSalon').value = 'Main Street';
      document.getElementById('settingRate').value = '70';
      saveSettings();
      var open = document.getElementById('cpConfirm').classList.contains('open');
      var msg = document.getElementById('cpCfMsg').textContent;
      _closeCPConfirm();
      var kept = JSON.parse(localStorage.getItem('ap_prefs')||'{}').splitPct;
      document.getElementById('settingRate').value = '70';
      saveSettings();
      _fireCPConfirm();
      var changed = JSON.parse(localStorage.getItem('ap_prefs')||'{}').splitPct;
      return {called:called, open:open, msg:msg, kept:kept, changed:changed};
    })()`);
    eq(rateDialog.called, false, 'saving a new rate does not call native confirm()');
    eq(rateDialog.open, true, 'the in-app confirm opens for a rate change');
    assert(rateDialog.msg.indexOf('50%') !== -1 && rateDialog.msg.indexOf('70%') !== -1, 'rate dialog names both percents');
    eq(rateDialog.kept, 50, 'cancel keeps the old rate');
    eq(rateDialog.changed, 70, 'confirm applies the new rate');

    await api.send('Page.navigate', {url: 'http://127.0.0.1:' + httpPort + '/appt.html'});
    await waitForFn(api, 'takeHome', 20000);
    await waitForFn(api, 'ymd', 5000);
    const apptRes = await evalJson(api, `(function(){
      localStorage.setItem('ap_prefs', JSON.stringify({splitPct:50, svcMode:'hair'}));
      var boundary = new Date('2026-12-01T00:30:00Z');
      var after4 = new Date('2026-11-17T00:30:00Z');
      var price = 10.05;
      var me = takeHome(price);
      var salon = _splitCents(price, getSplit()).salon/100;
      if (document.getElementById('fPrice')) document.getElementById('fPrice').value = '10.05';
      if (document.getElementById('fTip')) document.getElementById('fTip').value = '1.25';
      if (typeof apCalc === 'function') apCalc();
      return {
        me: me,
        salon: salon,
        sum: Math.round((me+salon)*100),
        you: document.getElementById('apYou') ? document.getElementById('apYou').textContent : '',
        salonTxt: document.getElementById('apSalon') ? document.getElementById('apSalon').textContent : '',
        ymdAfter4: ymd(after4),
        ymdMonth: ymd(boundary),
        today: todayStr(),
        utc: new Date().toISOString().slice(0,10),
        roundTrip: ymd(parseDate('2026-11-16'))
      };
    })()`);
    eq(apptRes.me, 5.03, 'Appointments takeHome($10.05) at 50% is $5.03');
    eq(apptRes.salon, 5.02, 'Appointments salon remainder is $5.02');
    eq(apptRes.sum, 1005, 'Appointments shares sum to $10.05');
    eq(apptRes.you, '$5.03', 'appointment form shows stylist cents');
    eq(apptRes.salonTxt, '$5.02', 'appointment form shows salon cents');
    eq(apptRes.ymdAfter4, '2026-11-16', 'Appointments ymd stays on the local day after 4 PM Pacific');
    eq(apptRes.ymdMonth, '2026-11-30', 'Appointments ymd stays in November on the month boundary');
    eq(apptRes.roundTrip, '2026-11-16', 'parseDate/ymd round-trips a calendar day');
    const localNow = await evalJson(api, 'ymd(new Date())');
    eq(apptRes.today, localNow, 'Appointments todayStr is the local calendar day');

    api.close();
  } finally {
    proc.kill('SIGKILL');
    try { fs.rmSync(profile, {recursive: true, force: true}); } catch (e) {}
  }
}

(async function main() {
  logicTests();
  if (failed) {
    console.error(failed + ' logic check(s) failed');
    process.exit(1);
  }
  console.log('Logic checks passed.');
  const srv = await staticServer(ROOT);
  const httpPort = srv.address().port;
  try {
    await browserTests(9333, httpPort);
  } finally {
    srv.close();
  }
  if (failed) {
    console.error(failed + ' check(s) failed');
    process.exit(1);
  }
  console.log('All salon settlement checks passed.');
})().catch(function(err) {
  console.error(err && err.stack || err);
  process.exit(1);
});
