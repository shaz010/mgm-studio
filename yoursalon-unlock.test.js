/* Regression: the owner unlock still bypasses the paywall, including iOS IAP mode.
   Runs the real pgUnlocked / applyAccessGate functions from app.html. */
'use strict';

var assert = require('assert');
var fs = require('fs');
var vm = require('vm');

var app = fs.readFileSync(__dirname + '/app.html', 'utf8');
var salon = fs.readFileSync(__dirname + '/salon.html', 'utf8');

assert.ok(app.indexOf("localStorage.getItem('cp_unlocked')==='1'") >= 0, 'pgUnlocked still reads cp_unlocked');
assert.ok(app.indexOf('function applyAccessGate()') >= 0, 'applyAccessGate still exists');
assert.ok(app.indexOf('if(pgUnlocked())return;') >= 0, 'the gate still returns immediately when unlocked');
assert.ok(salon.indexOf('id="brandGlowIcon"') >= 0, 'brand icon is still the unlock control');
assert.ok(salon.indexOf("localStorage.setItem('cp_unlocked','1')") >= 0, 'five taps still set cp_unlocked');
assert.ok(app.indexOf("logAudit") < 0 || app.indexOf("type:'unlock'") < 0, 'unlock is not an audit event type');

function runGate(opts) {
  var store = Object.assign({}, opts.local || {});
  var session = Object.assign({}, opts.session || {});
  var payShown = 0;
  var context = {
    localStorage: {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
      setItem: function (k, v) { store[k] = String(v); }
    },
    sessionStorage: {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(session, k) ? session[k] : null; },
      setItem: function (k, v) { session[k] = String(v); }
    },
    location: { search: opts.search || '' },
    window: { IS_APPLE_IAP: !!opts.iap },
    document: { getElementById: function () { return { classList: { add: function () {} }, style: {} }; } },
    payShow: function () { payShown++; },
    pgTrialActive: function () { return false; },
    trialBarShow: function () {},
    showDayNudge: function () {},
    setTimeout: function () {},
    console: console
  };
  context.window = context;
  var src = [
    app.slice(app.indexOf('function pgUnlocked()'), app.indexOf('/* Trial is active')),
    app.slice(app.indexOf('function applyAccessGate()'), app.indexOf('/* Bug 2 fix:'))
  ].join('\n');
  vm.runInNewContext(src + '\nthis.__unlocked=pgUnlocked(); this.__ran=true; applyAccessGate();', context);
  return { unlocked: context.__unlocked, payShown: payShown, store: store };
}

var open = runGate({ local: {} });
assert.strictEqual(open.unlocked, false);
assert.strictEqual(open.payShown, 1, 'without the unlock, the paywall is shown');

var gift = runGate({ local: { cp_unlocked: '1' }, iap: true });
assert.strictEqual(gift.unlocked, true);
assert.strictEqual(gift.payShown, 0, 'cp_unlocked=1 bypasses the paywall in iOS IAP mode');

var sessionGift = runGate({ session: { cp_unlocked: '1' }, iap: true });
assert.strictEqual(sessionGift.unlocked, true);
assert.strictEqual(sessionGift.payShown, 0);

console.log('owner unlock regression passed');
