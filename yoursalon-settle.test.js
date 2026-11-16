/* Plain node checks for Your Salon settlement rules. No dependencies.
   Run: node yoursalon-settle.test.js
   Also run with TZ=America/Los_Angeles so the Pacific evening / month-boundary case is real. */
'use strict';

var assert = require('assert');
var YS = require('./yoursalon-settle.js');

var failed = 0;
function check(name, fn) {
  try { fn(); console.log('ok  ' + name); }
  catch (e) { failed++; console.error('FAIL ' + name + '\n     ' + (e && e.stack || e)); }
}

check('60/40 of $100 splits evenly', function () {
  var s = YS.splitCharge(100, 60);
  assert.strictEqual(s.meC, 6000);
  assert.strictEqual(s.salonC, 4000);
  assert.strictEqual(s.meC + s.salonC, s.chargeC);
});

check('50/50 of an odd cent does not create an extra cent', function () {
  var s = YS.splitCharge(10.01, 50);
  assert.strictEqual(s.chargeC, 1001);
  assert.strictEqual(s.meC + s.salonC, 1001);
  assert.strictEqual(s.meC, 501);
  assert.strictEqual(s.salonC, 500);
});

check('half-dollar at 50% used to round both sides up', function () {
  var s = YS.splitCharge(33.33, 50);
  assert.strictEqual(s.chargeC, 3333);
  assert.strictEqual(s.meC + s.salonC, 3333);
  assert.strictEqual(s.me, 16.67);
  assert.strictEqual(s.salon, 16.66);
});

check('booth renter keeps the whole charge', function () {
  var s = YS.splitCharge(85.5, 100);
  assert.strictEqual(s.meC, 8550);
  assert.strictEqual(s.salonC, 0);
});

check('addMoney stays on integer cents', function () {
  assert.strictEqual(YS.addMoney(0.1, 0.2), 0.3);
});

check('only Done appointments count toward owed', function () {
  assert.strictEqual(YS.countsTowardOwed({ _src: 'appt', status: 'done', price: 80 }), true);
  assert.strictEqual(YS.countsTowardOwed({ _src: 'appt', status: 'confirmed', price: 80 }), false);
  assert.strictEqual(YS.countsTowardOwed({ _src: 'appt', status: 'cancelled', price: 80 }), false);
  assert.strictEqual(YS.countsTowardOwed({ _src: 'appt', status: 'noshow', price: 80 }), false);
  assert.strictEqual(YS.countsTowardOwed({ _src: 'appt', price: 80 }), false);
  assert.strictEqual(YS.countsTowardOwed({ price: 80, status: 'confirmed' }), false);
  assert.strictEqual(YS.countsTowardOwed({ price: 80, status: 'done' }), true);
});

check('Earnings log rows with no status still count', function () {
  assert.strictEqual(YS.countsTowardOwed({ id: 1, charge: 120, tip: 20, name: 'Ada' }), true);
  assert.strictEqual(YS.countsTowardOwed({ charge: 120, status: 'done' }), true);
  assert.strictEqual(YS.countsTowardOwed({ charge: 120, status: 'cancelled' }), false);
  assert.strictEqual(YS.countsTowardOwed({ charge: 120, status: 'confirmed' }), false);
  assert.strictEqual(YS.needsClosing({ charge: 120, date: '2020-01-01', time: '09:00' }, new Date(2026, 0, 2)), false);
});

check('past confirmed appointments need closing; closed ones do not', function () {
  var now = new Date(2026, 10, 16, 18, 0, 0);
  assert.strictEqual(YS.needsClosing({ _src: 'appt', status: 'confirmed', date: '2026-11-15', time: '10:00' }, now), true);
  assert.strictEqual(YS.needsClosing({ status: 'confirmed', price: 40, date: '2026-11-15', time: '10:00' }, now), true);
  assert.strictEqual(YS.needsClosing({ _src: 'appt', status: 'done', date: '2026-11-15', time: '10:00' }, now), false);
  assert.strictEqual(YS.needsClosing({ _src: 'appt', status: 'cancelled', date: '2026-11-15', time: '10:00' }, now), false);
  assert.strictEqual(YS.needsClosing({ _src: 'appt', status: 'noshow', date: '2026-11-15', time: '10:00' }, now), false);
  assert.strictEqual(YS.needsClosing({ _src: 'appt', status: 'confirmed', date: '2026-11-17', time: '10:00' }, now), false);
  assert.strictEqual(YS.needsClosing({ _src: 'appt', status: 'confirmed', date: '2026-11-16', time: '19:00' }, now), false);
});

check('a booking still inside its duration is not flagged', function () {
  var now = new Date(2026, 10, 16, 18, 0, 0);
  assert.strictEqual(YS.needsClosing({ _src: 'appt', status: 'confirmed', date: '2026-11-16', time: '17:00', dur: 90 }, now), false);
  assert.strictEqual(YS.needsClosing({ _src: 'appt', status: 'confirmed', date: '2026-11-16', time: '16:00', dur: 60 }, now), true);
  assert.strictEqual(YS.needsClosing({ _src: 'appt', status: 'confirmed', date: '2026-11-16', time: '17:30' }, now), true);
});

check('a date-only confirmed booking flags only after that local day', function () {
  var evening = new Date(2026, 10, 16, 21, 0, 0);
  var nextMorning = new Date(2026, 10, 17, 0, 5, 0);
  assert.strictEqual(YS.needsClosing({ status: 'confirmed', price: 10, date: '2026-11-16' }, evening), false);
  assert.strictEqual(YS.needsClosing({ status: 'confirmed', price: 10, date: '2026-11-16' }, nextMorning), true);
});

check('local calendar day ignores UTC', function () {
  var d = new Date(2026, 10, 30, 17, 30, 0);
  assert.strictEqual(YS.localYMD(d), '2026-11-30');
  assert.strictEqual(YS.localYM(d), '2026-11');
  assert.strictEqual(d.getDate(), 30);
});

check('week filter starts at local Sunday midnight', function () {
  var wed = new Date(2026, 10, 18, 15, 30, 0);
  var sow = YS.startOfLocalWeek(wed);
  assert.strictEqual(sow.getDay(), 0);
  assert.strictEqual(sow.getHours(), 0);
  assert.strictEqual(sow.getMinutes(), 0);
  assert.strictEqual(YS.localYMD(sow), '2026-11-15');
  var sundayNoon = new Date(2026, 10, 15, 12, 0, 0);
  assert.ok(sundayNoon >= sow);
});

if (process.env.TZ === 'America/Los_Angeles') {
  check('after 4pm Pacific on the last day of the month, the calendar month stays put', function () {
    var d = new Date(2026, 10, 30, 17, 0, 0);
    assert.strictEqual(d.toISOString().slice(0, 10), '2026-12-01', 'UTC date rolled forward, which is the bug');
    assert.strictEqual(YS.localYMD(d), '2026-11-30');
    assert.strictEqual(YS.localYM(d), '2026-11');
    assert.notStrictEqual(d.toISOString().slice(0, 7), YS.localYM(d));
  });
}

check('running balance subtracts only live payments', function () {
  var rows = [
    { _src: 'appt', status: 'done', me: 60, tip: 15 },
    { _src: 'appt', status: 'cancelled', me: 40, tip: 10 },
    { charge: 33.33, me: 20, tip: 0 }
  ];
  var owed = YS.owedCentsForRows(rows);
  assert.strictEqual(owed, 60 * 100 + 15 * 100 + 20 * 100);
  var pays = [
    { id: 'a', amountCents: 5000, voided: false, date: '2026-11-16' },
    { id: 'b', amountCents: 1000, voided: true, date: '2026-11-16' }
  ];
  var bal = YS.runningBalance(owed, pays);
  assert.strictEqual(bal.paidCents, 5000);
  assert.strictEqual(bal.dueCents, owed - 5000);
});

check('overpayment is a credit', function () {
  var bal = YS.runningBalance(1000, [{ id: 'a', amountCents: 2500, voided: false }]);
  assert.strictEqual(bal.dueCents, -1500);
});

check('mark-paid migration is idempotent and dated from the old timestamp', function () {
  var rows = [
    { _src: 'appt', status: 'done', date: '2026-11-10', me: 60, tip: 15 },
    { _src: 'appt', status: 'done', date: '2026-12-02', me: 30, tip: 0 }
  ];
  var ts = new Date(2026, 10, 30, 17, 0, 0).getTime();
  var first = YS.migratePaidMonths({ '2026-11': ts }, rows, []);
  assert.strictEqual(first.added.length, 1);
  assert.strictEqual(first.added[0].id, 'mig-cp_paid-2026-11');
  assert.strictEqual(first.added[0].amountCents, 7500);
  assert.strictEqual(first.added[0].date, '2026-11-30');
  assert.strictEqual(first.added[0].note, 'Migrated from Mark paid');
  var second = YS.migratePaidMonths({ '2026-11': ts }, rows, first.payments);
  assert.strictEqual(second.added.length, 0);
  assert.strictEqual(second.payments.length, 1);
  var again = YS.migratePaidMonths({ '2026-11': ts + 99999 }, rows, second.payments);
  assert.strictEqual(again.payments.length, 1);
  assert.strictEqual(again.payments[0].amountCents, 7500);
});

check('a later void wins over an older copy of the same payment', function () {
  var older = { id: 'p1', amountCents: 4000, voided: false, updatedAt: 100, date: '2026-11-01' };
  var newer = { id: 'p1', amountCents: 4000, voided: true, voidReason: 'wrong amount', updatedAt: 200, date: '2026-11-01' };
  var other = { id: 'p2', amountCents: 100, voided: false, updatedAt: 50, date: '2026-11-02' };
  var merged = YS.mergePaymentLists([older, other], [newer]);
  assert.strictEqual(merged.length, 2);
  var p1 = merged.filter(function (p) { return p.id === 'p1'; })[0];
  assert.strictEqual(p1.voided, true);
  assert.strictEqual(p1.voidReason, 'wrong amount');
  var back = YS.mergePaymentLists([newer], [older]);
  assert.strictEqual(back.filter(function (p) { return p.id === 'p1'; })[0].voided, true);
});

check('freezing a split keeps the old percent when the rate changes', function () {
  var saved = YS.applyFrozenSplit({ price: 33.33, tip: 1 }, 50, 'price');
  assert.strictEqual(saved.splitPct, 50);
  assert.strictEqual(saved.splitFrozen, true);
  assert.strictEqual(saved.meCents + saved.salonCents, saved.chargeCents);
  assert.strictEqual(saved.meCents, 1667);
  var later = YS.applyFrozenSplit(saved, 70, 'price');
  assert.strictEqual(later.splitPct, 50);
  assert.strictEqual(later.meCents, 1667);
  var repriced = YS.applyFrozenSplit(Object.assign({}, saved, { price: 10 }), 70, 'price');
  assert.strictEqual(repriced.splitPct, 50);
  assert.strictEqual(repriced.meCents, 500);
});

check('week and month period bounds are local calendar ranges', function () {
  var wed = new Date(2026, 10, 18, 15, 30, 0);
  var week = YS.periodBounds('week', wed);
  assert.strictEqual(week.from, '2026-11-15');
  assert.strictEqual(week.to, '2026-11-21');
  var month = YS.periodBounds('month', new Date(2026, 10, 30, 17, 0, 0));
  assert.strictEqual(month.from, '2026-11-01');
  assert.strictEqual(month.to, '2026-11-30');
});

if (failed) {
  console.error('\n' + failed + ' failed');
  process.exit(1);
}
console.log('\nall checks passed' + (process.env.TZ ? ' (TZ=' + process.env.TZ + ')' : ''));
