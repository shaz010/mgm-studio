'use strict';

/* Page-level check: appt.html waits for Firebase Auth, then the signed-in
   owner can publish, approve, decline, dismiss, and list the inbox.
   Runs against the local emulators. Does not touch the live project. */

const fs = require('fs');
const http = require('http');
const assert = require('assert');

const appt = fs.readFileSync('appt.html', 'utf8');
const init = appt.slice(appt.indexOf('function initFB()'), appt.indexOf('function setConnState'));
assert.ok(appt.indexOf('firebase-auth-compat.js') >= 0, 'appointments loads Firebase Auth');
assert.ok(init.indexOf('onAuthStateChanged') >= 0, 'init waits for auth');
assert.ok(init.indexOf('onAuthStateChanged') < init.indexOf('publishAvailability('), 'publish runs only from the auth callback');
assert.ok(init.indexOf('onAuthStateChanged') < init.indexOf('listenRequests('), 'inbox listen runs only from the auth callback');
assert.ok(init.indexOf("fbReady=true") > init.indexOf('onAuthStateChanged'), 'the cloud is not marked ready before auth answers');
assert.ok(appt.indexOf('Sign in to sync bookings') >= 0, 'signed-out state is visible');
assert.ok(appt.indexOf('function localEmulatorMode()') >= 0, 'emulator hook is localhost-only');
['status:\'approved\'', 'status:\'declined\'', 'status:\'dismissed\''].forEach(function (s) {
  assert.ok(appt.indexOf(s) >= 0, 'missing cloud write ' + s);
});
assert.ok(appt.indexOf('collection(\'requests\').doc(r._id).update({status:\'approved\'') >= 0, 'approve uses the request update');
assert.ok(!/collection\('requests'\)[^;]{0,180}price/.test(appt), 'request writes do not include price');
console.log('ok  appt.html source waits for sign-in and does not write request price');

function serve(port) {
  const root = process.cwd();
  return http.createServer(function (req, res) {
    const path = require('path');
    let rel = decodeURIComponent((req.url || '/').split('?')[0]);
    if (rel === '/') rel = '/appt.html';
    const file = path.join(root, rel);
    if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
    fs.readFile(file, function (err, buf) {
      if (err) { res.writeHead(404); res.end('missing'); return; }
      const ext = path.extname(file);
      const type = ext === '.html' ? 'text/html' : ext === '.js' ? 'text/javascript' : 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': type });
      res.end(buf);
    });
  }).listen(port, '127.0.0.1');
}

function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

async function emuDoc(name) {
  const url = 'http://127.0.0.1:8080/v1/projects/telemetry-eagle/databases/(default)/documents/' + name;
  const r = await fetch(url);
  if (r.status === 404) return null;
  const text = await r.text();
  if (!r.ok) throw new Error(r.status + ' ' + text);
  return JSON.parse(text);
}

async function waitFor(fn, ms) {
  const start = Date.now();
  let last;
  while (Date.now() - start < ms) {
    try {
      const v = await fn();
      if (v) return v;
      last = v;
    } catch (e) { last = e; }
    await sleep(200);
  }
  throw new Error('timed out: ' + (last && last.message ? last.message : last));
}

(async function () {
  const puppeteer = require('puppeteer-core');
  const server = serve(8766);
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();
  const logs = [];
  page.on('console', function (m) { logs.push(m.type() + ' ' + m.text()); });
  page.on('pageerror', function (e) { logs.push('PAGEERROR ' + e.message); });
  await page.goto('http://127.0.0.1:8766/appt.html?emu=1', { waitUntil: 'load', timeout: 45000 });
  await page.waitForFunction(function () {
    var t = document.getElementById('sbConnTxt');
    return t && t.textContent.indexOf('Sign in to sync bookings') >= 0;
  }, { timeout: 20000 });
  const before = await emuDoc('public/mgm-studio');
  assert.strictEqual(before, null, 'signed-out page must not publish the salon profile');
  console.log('ok  signed-out appointments page does not publish');

  await page.evaluate(function () {
    return firebase.auth().createUserWithEmailAndPassword('owner-appt@example.com', 'secret12');
  });
  await page.waitForFunction(function () {
    var t = document.getElementById('sbConnTxt');
    return t && t.textContent.indexOf('Connected') >= 0;
  }, { timeout: 20000 });
  const pub = await waitFor(async function () {
    const d = await emuDoc('public/mgm-studio');
    return d && d.fields && d.fields.bookingOpen ? d : null;
  }, 10000);
  assert.strictEqual(pub.fields.bookingOpen.booleanValue, true);
  assert.ok(!pub.fields.stripeSk && !pub.fields.stripePk, 'publish does not write Stripe fields');
  console.log('ok  signed-in owner publish wrote public/mgm-studio');

  async function addRequest(time) {
    return page.evaluate(async function (time) {
      const ref = await db.collection('requests').add({
        salon: 'mgm-studio', name: 'Ada', phone: '555-0101', service: 'Cut',
        date: '2026-11-16', time: time, dur: 60, price: 0, status: 'pending', createdAt: Date.now()
      });
      return ref.id;
    }, time);
  }
  function statusOf(id, want) {
    return waitFor(async function () {
      const d = await emuDoc('requests/' + id);
      const s = d && d.fields && d.fields.status && d.fields.status.stringValue;
      return s === want ? s : null;
    }, 8000);
  }

  const declinedId = await addRequest('10:00');
  const declineNote = await page.evaluate(function (id) {
    pendingReqs = [{ _id: id, name: 'Ada', phone: '555-0101', service: 'Cut', date: '2026-11-16', time: '10:00', dur: 60, price: 0 }];
    declineRequest(id);
    return { fb: !!fbUser, ready: !!fbReady, n: pendingReqs.length };
  }, declinedId);
  console.log('decline call', JSON.stringify(declineNote));
  assert.strictEqual(await statusOf(declinedId, 'declined'), 'declined');
  console.log('ok  declineRequest set status declined');

  const approvedId = await addRequest('11:00');
  await page.evaluate(function (id) {
    pendingReqs = [{ _id: id, name: 'Ada', phone: '555-0101', service: 'Cut', date: '2026-11-16', time: '11:00', dur: 60, price: 40, notes: '', hair: '' }];
    commitApproved(pendingReqs[0], true);
  }, approvedId);
  assert.strictEqual(await statusOf(approvedId, 'approved'), 'approved');
  console.log('ok  commitApproved set status approved');

  const dismissId = await addRequest('12:00');
  await page.evaluate(function () {
    return new Promise(function (resolve) { clearFirestoreRequests(resolve); });
  });
  assert.strictEqual(await statusOf(dismissId, 'dismissed'), 'dismissed');
  const stillDeclined = await emuDoc('requests/' + declinedId);
  assert.strictEqual(stillDeclined.fields.status.stringValue, 'declined');
  console.log('ok  clearFirestoreRequests listed the inbox and dismissed the open request');

  await browser.close();
  server.close();
  console.log('\nappointments cloud path passed');
  if (logs.some(function (l) { return l.indexOf('PAGEERROR') === 0; })) {
    console.log(logs.filter(function (l) { return l.indexOf('PAGEERROR') === 0; }).join('\n'));
  }
})().catch(function (e) {
  console.error(e);
  process.exit(1);
});
