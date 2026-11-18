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

check('audit log only appends and will not rewrite an existing event', function () {
  var mem = {};
  var get = function (k) { return mem[k] == null ? null : mem[k]; };
  var set = function (k, v) { mem[k] = v; };
  var first = YS.storeAudit(get, set, { id: 'e1', at: new Date(2026, 10, 16, 9, 5, 0).getTime(), type: 'payment.record', summary: 'Paid $10', source: 'earn', actor: 'this device', entityType: 'payment', entityId: 'p1' });
  assert.strictEqual(first.stored, true);
  assert.strictEqual(first.event.localDate, '2026-11-16');
  assert.strictEqual(first.event.localTime, '09:05:00');
  var second = YS.storeAudit(get, set, { id: 'e1', at: new Date(2026, 10, 16, 18, 0, 0).getTime(), type: 'payment.void', summary: 'changed', source: 'earn' });
  assert.strictEqual(second.stored, false);
  var saved = JSON.parse(mem['ys_audit_2026-11']);
  assert.strictEqual(saved.length, 1);
  assert.strictEqual(saved[0].summary, 'Paid $10');
  assert.strictEqual(saved[0].type, 'payment.record');
  var merged = YS.mergeAuditLists(saved, [{ id: 'e1', at: saved[0].at + 10, type: 'payment.void', summary: 'nope' }, { id: 'e2', at: saved[0].at + 20, type: 'note', summary: 'later', localDate: '2026-11-16' }]);
  assert.strictEqual(merged.length, 2);
  assert.strictEqual(merged[0].summary, 'Paid $10');
});

check('saving, status, price, and tip each plan an audit event', function () {
  var created = YS.planSaveEvents(null, { id: 'a1', name: 'Ada', date: '2026-11-16', charge: 100, tip: 5, splitPct: 60, splitFrozen: true, meCents: 6000, salonCents: 4000, chargeCents: 10000, tipCents: 500 });
  assert.strictEqual(created.length, 1);
  assert.strictEqual(created[0].type, 'appointment.create');
  var priced = YS.planSaveEvents(
    { id: 'a1', name: 'Ada', date: '2026-11-16', charge: 100, tip: 5, splitPct: 60, chargeCents: 10000, meCents: 6000, tipCents: 500 },
    { id: 'a1', name: 'Ada', date: '2026-11-16', charge: 120, tip: 8, splitPct: 60, chargeCents: 12000, meCents: 7200, tipCents: 800 }
  );
  var types = priced.map(function (e) { return e.type; }).sort();
  assert.deepStrictEqual(types, ['price.change', 'tip.change']);
  var st = YS.planStatusEvent({ id: 'a1', name: 'Ada', _src: 'appt', splitPct: 60 }, 'confirmed', 'done');
  assert.strictEqual(st.type, 'status.change');
  assert.strictEqual(st.summary, 'Ada confirmed → done');
});

check('day follow-through shows frozen work, tips, payments, and the balance before and after', function () {
  var rows = [
    { _src: 'appt', status: 'done', name: 'Ada', date: '2026-11-15', me: 30, tip: 0, splitPct: 60 },
    { _src: 'appt', status: 'done', name: 'Bea', date: '2026-11-16', me: 60, tip: 15, splitPct: 60 },
    { _src: 'appt', status: 'cancelled', name: 'No', date: '2026-11-16', me: 40, tip: 10 }
  ];
  var pays = [{ id: 'p', date: '2026-11-16', amountCents: 2000, voided: false, method: 'cash' }];
  var day = YS.followMoney(rows, pays, '2026-11-16', '2026-11-16');
  assert.strictEqual(day.beforeCents, 3000);
  assert.strictEqual(day.days[0].earnedCents, 6000);
  assert.strictEqual(day.days[0].tipCents, 1500);
  assert.strictEqual(day.days[0].paidCents, 2000);
  assert.strictEqual(day.afterCents, 3000 + 6000 + 1500 - 2000);
  assert.strictEqual(day.days[0].lines.filter(function (l) { return l.kind === 'work'; }).length, 1);
});

check('csv export quotes commas and includes frozen cents', function () {
  var pay = YS.csvPayments([{ id: 'p1', date: '2026-11-16', amountCents: 1050, method: 'check', note: 'Nov, final', voided: false }], '2026-11-01', '2026-11-30');
  assert.ok(pay.indexOf('"Nov, final"') >= 0);
  assert.ok(pay.indexOf('1050') >= 0);
  var ap = YS.csvAppointments([{ id: 'a', date: '2026-11-16', name: 'Ada', status: 'done', charge: 33.33, splitPct: 50, splitFrozen: true, chargeCents: 3333, meCents: 1667, salonCents: 1666, tipCents: 0 }], '2026-11-16', '2026-11-16');
  assert.ok(ap.indexOf('1667') >= 0);
  assert.ok(ap.indexOf('1666') >= 0);
  assert.ok(ap.indexOf(',50,') >= 0);
  var outside = YS.csvPayments([{ id: 'p2', date: '2026-12-01', amountCents: 1, voided: false }], '2026-11-01', '2026-11-30');
  assert.strictEqual(outside.split('\r\n').length, 1);
});

check('a tombstone hides a deleted appointment and does not duplicate', function () {
  var tombs = [];
  var t = YS.makeTombstone('ap_appt', 'a9', 100, 'Deleted Ada');
  tombs = YS.appendAudit(tombs, t);
  tombs = YS.appendAudit(tombs, YS.makeTombstone('ap_appt', 'a9', 200, 'again'));
  assert.strictEqual(tombs.length, 1);
  assert.strictEqual(tombs[0].summary, 'Deleted Ada');
  var left = YS.filterTombstones([{ id: 'a9', name: 'Ada' }, { id: 'b', name: 'Bea' }], tombs, 'ap_appt');
  assert.strictEqual(left.length, 1);
  assert.strictEqual(left[0].id, 'b');
});

function doneRow(id, meCents, date) {
  return { id: id, name: 'Client ' + id, date: date, status: 'done', _src: 'appt', me: meCents / 100, tip: 0, charge: meCents / 50 };
}
function pay(id, cents, createdAt) {
  return { id: id, amountCents: cents, date: '2026-11-16', method: 'transfer', voided: false, createdAt: createdAt, updatedAt: createdAt };
}

check('with no settlements everything stays in the current period', function () {
  var rows = [];
  for (var i = 0; i < 10; i++) rows.push(doneRow('d' + i, 3510, '2026-11-0' + (i < 9 ? i + 1 : 9)));
  rows[9].date = '2026-11-10';
  assert.strictEqual(YS.owedCentsForRows(rows), 35100);
  var pays = [pay('old', 26800, 1000)];
  var open = YS.allocateSettlements(rows, [], pays);
  assert.strictEqual(open.settlements.length, 0);
  assert.strictEqual(open.current.owedCents, 35100);
  assert.strictEqual(open.current.paidCents, 26800);
  assert.strictEqual(open.pastRemainingCents, 0);
  assert.strictEqual(open.dueCents, 8300);
  assert.strictEqual(open.dueCents, YS.runningBalance(35100, pays).dueCents);
});

check('closing $351 with $268 paid leaves $83, then new work and a payment stay FIFO', function () {
  var rows = [];
  for (var i = 0; i < 10; i++) rows.push(doneRow('d' + i, 3510, '2026-11-' + (i < 9 ? '0' + (i + 1) : '10')));
  var pays = [pay('old', 26800, 1000)];
  var plan = YS.planCloseSettlement(rows, [], '2026-11-16', 5000);
  assert.strictEqual(plan.ok, true);
  assert.strictEqual(plan.settlement.owedCents, 35100);
  assert.strictEqual(plan.settlement.ids.length, 10);
  var closed = YS.allocateSettlements(rows, [plan.settlement], pays);
  assert.strictEqual(closed.pastRemainingCents, 8300);
  assert.strictEqual(closed.settlements[0].status, 'Partly paid');
  assert.strictEqual(closed.current.owedCents, 0);
  assert.strictEqual(closed.dueCents, 8300);

  rows.push(doneRow('new', 4000, '2026-11-20'));
  var withJob = YS.allocateSettlements(rows, [plan.settlement], pays);
  assert.strictEqual(withJob.pastRemainingCents, 8300);
  assert.strictEqual(withJob.current.owedCents, 4000);
  assert.strictEqual(withJob.current.paidCents, 0);
  assert.strictEqual(withJob.dueCents, 12300);
  assert.strictEqual(withJob.dueCents, YS.runningBalance(39100, pays).dueCents);

  pays = pays.concat([pay('next', 10000, 9000)]);
  var afterPay = YS.allocateSettlements(rows, [plan.settlement], pays);
  assert.strictEqual(afterPay.settlements[0].status, 'Paid');
  assert.strictEqual(afterPay.settlements[0].remainingCents, 0);
  assert.strictEqual(afterPay.current.owedCents, 4000);
  assert.strictEqual(afterPay.current.paidCents, 1700);
  assert.strictEqual(afterPay.current.remainingCents, 2300);
  assert.strictEqual(afterPay.pastRemainingCents, 0);
  assert.strictEqual(afterPay.dueCents, 2300);
  assert.strictEqual(YS.canUndoSettlement([plan.settlement], pays).ok, false);

  var dropped = pays.filter(function (p) { return p.id !== 'next'; });
  var back = YS.allocateSettlements(rows, [plan.settlement], dropped);
  assert.strictEqual(back.pastRemainingCents, 8300);
  assert.strictEqual(back.current.remainingCents, 4000);
  assert.strictEqual(back.dueCents, 12300);
  assert.strictEqual(YS.canUndoSettlement([plan.settlement], dropped).ok, true);
});

check('undo, overpayment, and a voided later payment', function () {
  var rows = [doneRow('a', 35100, '2026-11-10'), doneRow('b', 4000, '2026-11-20')];
  var plan = YS.planCloseSettlement([rows[0]], [], '2026-11-16', 5000);
  var undone = YS.undoSettlementRecord(plan.settlement, 6000);
  assert.strictEqual(undone.undone, true);
  var open = YS.allocateSettlements(rows, [undone], [pay('old', 26800, 1000)]);
  assert.strictEqual(open.settlements.length, 0);
  assert.strictEqual(open.current.owedCents, 39100);
  assert.strictEqual(open.dueCents, 12300);

  var again = YS.planCloseSettlement(rows, [], '2026-11-20', 7000);
  assert.strictEqual(again.settlement.ids.length, 2);
  assert.strictEqual(again.settlement.owedCents, 39100);
  var over = YS.allocateSettlements(rows, [again.settlement], [pay('old', 26800, 1000), pay('big', 20000, 8000)]);
  assert.strictEqual(over.settlements[0].status, 'Paid');
  assert.strictEqual(over.current.owedCents, 0);
  assert.strictEqual(over.creditCents, 7700);
  assert.strictEqual(over.dueCents, -7700);
  assert.strictEqual(over.dueCents, YS.runningBalance(39100, [pay('old', 26800, 1000), pay('big', 20000, 8000)]).dueCents);

  var later = pay('later', 100, 9000);
  later.voided = true;
  assert.strictEqual(YS.canUndoSettlement([again.settlement], [pay('old', 1000, 1000), later]).ok, true);
  var merged = YS.mergeSettlementLists([plan.settlement], [undone]);
  assert.strictEqual(merged.length, 1);
  assert.strictEqual(merged[0].undone, true);
});

check('a settlement close shows up in the day view and the csv', function () {
  var settlement = { id: 'set-1', startDate: '2026-11-01', endDate: '2026-11-16', owedCents: 35100, closedAt: new Date(2026, 10, 16, 15, 0, 0).getTime(), undone: false, ids: ['d0'] };
  var day = YS.followMoney([], [], '2026-11-16', '2026-11-16', [settlement]);
  assert.strictEqual(day.days[0].lines.filter(function (l) { return l.kind === 'settlement'; }).length, 1);
  var csv = YS.csvSettlements([settlement], [doneRow('d0', 35100, '2026-11-10')], [], '2026-11-01', '2026-11-30');
  assert.ok(csv.indexOf('set-1') >= 0);
  assert.ok(csv.indexOf('35100') >= 0);
  assert.ok(csv.indexOf('Partly paid') >= 0 || csv.indexOf('Unpaid') >= 0);
});

function doneAt(id, at) {
  return { id: 'e-' + id, type: 'status.change', entityId: id, at: at, after: { status: 'done' } };
}

check('before and new work split around the latest payment', function () {
  var rows = [];
  var events = [];
  for (var i = 0; i < 10; i++) {
    rows.push(doneRow('old' + i, 3510, '2026-11-16'));
    events.push(doneAt('old' + i, 1000 + i));
  }
  rows.push(doneRow('n1', 4000, '2026-11-16'));
  rows.push(doneRow('n2', 4000, '2026-11-16'));
  rows.push(doneRow('n3', 4000, '2026-11-16'));
  events.push(doneAt('n1', 8000));
  events.push(doneAt('n2', 8001));
  events.push(doneAt('n3', 8002));
  var pays = [pay('salon', 26800, 5000)];
  pays[0].date = '2026-11-16';
  var split = YS.splitAtLastPayment(rows, pays, { events: events });
  assert.strictEqual(split.beforeOwedCents, 35100);
  assert.strictEqual(split.newOwedCents, 12000);
  assert.strictEqual(split.beforeCents, 8300);
  assert.strictEqual(split.newCents, 12000);
  assert.strictEqual(Math.max(0, split.paidCents - split.beforeOwedCents), 0);
  assert.strictEqual(split.beforeCents + split.newCents, split.totalCents);
  assert.strictEqual(split.totalCents, 20300);
  assert.strictEqual(split.totalCents, YS.runningBalance(47100, pays).dueCents);
});

check('same calendar day without a done time counts as before', function () {
  var rows = [
    doneRow('same', 5000, '2026-11-16'),
    doneRow('later', 2000, '2026-11-17')
  ];
  var pays = [pay('p', 1000, 0)];
  pays[0].createdAt = null;
  pays[0].date = '2026-11-16';
  var split = YS.splitAtLastPayment(rows, pays, { events: [] });
  assert.strictEqual(split.beforeOwedCents, 5000);
  assert.strictEqual(split.newOwedCents, 2000);
  assert.strictEqual(split.beforeCents, 4000);
  assert.strictEqual(split.newCents, 2000);
});

check('no payments yet is a single balance', function () {
  var rows = [doneRow('a', 35100, '2026-11-10')];
  var split = YS.splitAtLastPayment(rows, [], { events: [] });
  assert.strictEqual(split.hasPayments, false);
  assert.strictEqual(split.beforeCents, 35100);
  assert.strictEqual(split.newCents, 0);
  assert.strictEqual(split.totalCents, 35100);
});

check('overpayment past the old work becomes credit on the new work', function () {
  var rows = [doneRow('old', 10000, '2026-11-01'), doneRow('neu', 4000, '2026-11-20')];
  var events = [doneAt('old', 1000), doneAt('neu', 9000)];
  var pays = [pay('p', 15000, 5000)];
  var split = YS.splitAtLastPayment(rows, pays, { events: events });
  assert.strictEqual(split.beforeCents, 0);
  assert.strictEqual(split.newCents, -1000);
  assert.strictEqual(split.totalCents, -1000);
  assert.strictEqual(split.totalCents, YS.runningBalance(14000, pays).dueCents);
});

check('a voided latest payment is ignored and closed settlements stay before', function () {
  var rows = [doneRow('old', 10000, '2026-11-01'), doneRow('held', 3000, '2026-11-20'), doneRow('neu', 4000, '2026-11-20')];
  var events = [doneAt('old', 1000), doneAt('held', 9000), doneAt('neu', 9001)];
  var pays = [pay('first', 4000, 2000), pay('voided', 9000, 8000)];
  pays[1].voided = true;
  var plan = YS.planCloseSettlement([rows[1]], [], '2026-11-20', 8500);
  var split = YS.splitAtLastPayment(rows, pays, { events: events, settlements: [plan.settlement] });
  assert.strictEqual(YS.latestLivePayment(pays).id, 'first');
  assert.strictEqual(split.beforeOwedCents, 13000);
  assert.strictEqual(split.newOwedCents, 4000);
  assert.strictEqual(split.beforeCents, 9000);
  assert.strictEqual(split.newCents, 4000);
  assert.strictEqual(split.totalCents, YS.runningBalance(17000, pays).dueCents);
});

check('each finished visit is paid, partly paid, or still owed, oldest first', function () {
  var rows = [];
  var events = [];
  for (var i = 0; i < 10; i++) {
    rows.push(doneRow('old' + i, 3510, '2026-11-16'));
    events.push(doneAt('old' + i, 1000 + i));
  }
  rows.push(doneRow('n1', 4000, '2026-11-16'));
  rows.push(doneRow('n2', 4000, '2026-11-16'));
  rows.push(doneRow('n3', 4000, '2026-11-16'));
  events.push(doneAt('n1', 8000));
  events.push(doneAt('n2', 8001));
  events.push(doneAt('n3', 8002));
  rows.push({ id: 'soon', name: 'Upcoming', date: '2026-11-20', status: 'confirmed', _src: 'appt', me: 50, tip: 0, charge: 50 });
  var pays = [pay('salon', 26800, 5000)];
  var jobs = YS.allocateJobs(rows, pays, { events: events });
  var split = YS.splitAtLastPayment(rows, pays, { events: events });
  var paid = 0, partial = null, beforeLeft = 0, newLeft = 0;
  Object.keys(jobs.byId).forEach(function (id) {
    var j = jobs.byId[id];
    if (j.state === 'paid') paid++;
    if (j.state === 'partial') partial = j;
    if (j.leftCents > 0 && j.bucket === 'before') beforeLeft += j.leftCents;
    if (j.leftCents > 0 && j.bucket === 'new') newLeft += j.leftCents;
  });
  assert.strictEqual(paid, 7);
  assert.strictEqual(partial.id, 'old7');
  assert.strictEqual(partial.leftCents, 1280);
  assert.strictEqual(beforeLeft, 8300);
  assert.strictEqual(newLeft, 12000);
  assert.strictEqual(jobs.unpaidBeforeCents, split.beforeCents);
  assert.strictEqual(jobs.unpaidNewCents, split.newCents);
  assert.strictEqual(jobs.unpaidCents, split.totalCents);
  assert.ok(!jobs.byId.soon);
});

check('payments cover the oldest job date first, even if it was marked done later', function () {
  var payAt = new Date(2026, 10, 10, 12).getTime();
  var early = new Date(2026, 10, 1, 9).getTime();
  var late = new Date(2026, 10, 9, 18).getTime();
  function job(id, name, date, meCents, doneMs, time) {
    return { id: id, name: name, date: date, time: time || '10:00', status: 'done', _src: 'appt', me: meCents / 100, tip: 0, charge: meCents / 100, doneAt: doneMs };
  }
  var rows = [
    job('kori', 'Kori', '2026-10-02', 4000, late),
    job('sam', 'Sam', '2026-10-06', 3000, late),
    job('leila', 'Leila', '2026-10-09', 4500, late),
    job('omar', 'Omar', '2026-10-14', 3500, late),
    job('priya', 'Priya', '2026-10-18', 5000, late),
    job('noah', 'Noah', '2026-10-22', 2000, late),
    job('abbas', 'Abbas', '2026-10-27', 4000, late),
    job('ronak', 'Ronak', '2026-10-30', 2100, late, '11:00'),
    job('nick', 'Nick Webb', '2026-11-03', 1500, early, '10:00'),
    job('hidi', 'Hidi', '2026-11-03', 5500, early + 60000, '15:00'),
    job('june', 'June', '2026-11-12', 8000, payAt + 86400000),
    job('camille', 'Camille', '2026-11-14', 6400, payAt + 2 * 86400000),
    job('reese', 'Reese', '2026-11-16', 6000, payAt + 3 * 86400000)
  ];
  var pays = [pay('salon', 26800, payAt)];
  var jobs = YS.allocateJobs(rows, pays);
  var split = YS.splitAtLastPayment(rows, pays);
  ['kori', 'sam', 'leila', 'omar', 'priya', 'noah', 'abbas'].forEach(function (id) {
    assert.strictEqual(jobs.byId[id].state, 'paid', id);
    assert.strictEqual(jobs.byId[id].bucket, 'before', id);
  });
  assert.strictEqual(jobs.byId.ronak.state, 'partial');
  assert.strictEqual(jobs.byId.ronak.leftCents, 1300);
  assert.strictEqual(jobs.byId.ronak.paidCents, 800);
  assert.strictEqual(jobs.byId.ronak.bucket, 'before');
  assert.strictEqual(jobs.byId.nick.state, 'unpaid');
  assert.strictEqual(jobs.byId.nick.leftCents, 1500);
  assert.strictEqual(jobs.byId.hidi.state, 'unpaid');
  assert.strictEqual(jobs.byId.hidi.leftCents, 5500);
  assert.strictEqual(jobs.byId.hidi.bucket, 'before');
  assert.strictEqual(jobs.byId.june.bucket, 'new');
  assert.strictEqual(jobs.byId.june.state, 'unpaid');
  assert.strictEqual(jobs.unpaidBeforeCents, 8300);
  assert.strictEqual(jobs.unpaidNewCents, 20400);
  assert.strictEqual(split.beforeCents, 8300);
  assert.strictEqual(split.newCents, 20400);
  assert.strictEqual(jobs.unpaidBeforeCents, split.beforeCents);
  assert.strictEqual(jobs.unpaidNewCents, split.newCents);
  var tie = [
    job('later', 'Later', '2026-10-01', 1000, early, '15:00'),
    job('sooner', 'Sooner', '2026-10-01', 1000, late, '09:00')
  ];
  var tieJobs = YS.allocateJobs(tie, [pay('tie', 1000, payAt)]);
  assert.strictEqual(tieJobs.byId.sooner.state, 'paid');
  assert.strictEqual(tieJobs.byId.later.state, 'unpaid');
  var idTie = [
    job('b', 'B', '2026-10-01', 500, early, '09:00'),
    job('a', 'A', '2026-10-01', 500, early, '09:00')
  ];
  var idJobs = YS.allocateJobs(idTie, [pay('id', 500, payAt)]);
  assert.strictEqual(idJobs.byId.a.state, 'paid');
  assert.strictEqual(idJobs.byId.b.state, 'unpaid');
});

check('the main Add button uses today, and a day cell keeps its day', function () {
  assert.strictEqual(YS.defaultAddDate(false, '2026-10-30', '2026-11-03'), '2026-11-03');
  assert.strictEqual(YS.defaultAddDate(true, '2026-10-30', '2026-11-03'), '2026-10-30');
  var wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(2026, 9, 30, 12).getDay()];
  assert.strictEqual(YS.dateSpoken('2026-10-30'), wd + ' 30 Oct');
  assert.strictEqual(YS.daysBeforeToday('2026-10-30', '2026-11-03'), 4);
  assert.strictEqual(YS.needsPastDateConfirm(true, '2026-10-30', '2026-11-03'), true);
  assert.strictEqual(YS.needsPastDateConfirm(true, '2026-11-02', '2026-11-03'), false);
  assert.strictEqual(YS.needsPastDateConfirm(false, '2026-10-30', '2026-11-03'), false);
  var appt = require('fs').readFileSync(__dirname + '/appt.html', 'utf8');
  var open = appt.slice(appt.indexOf('function openAdd()'), appt.indexOf('function fillClientList'));
  assert.ok(open.indexOf('defaultAddDate(false') >= 0, 'main Add uses today');
  assert.ok(open.indexOf('ymd(viewDate)') < 0, 'main Add does not copy the day on screen');
  var at = appt.slice(appt.indexOf('function openAddAt'), appt.indexOf('function renderWeekGrid'));
  assert.ok(at.indexOf('defaultAddDate(true') >= 0, 'a day cell still prefills that day');
  assert.ok(appt.indexOf('id="fDateNotice"') >= 0);
  assert.ok(appt.indexOf('needsPastDateConfirm') >= 0);
});

check('a done visit keeps its date change in the audit, and the date can move a day', function () {
  assert.strictEqual(YS.dateSpoken('2026-11-03', true), 'Tue 3 Nov 2026');
  assert.strictEqual(YS.nextYMD('2026-11-03'), '2026-11-04');
  assert.strictEqual(YS.prevYMD('2026-11-03'), '2026-11-02');
  var before = { id: 'hidi', name: 'Hidi', date: '2026-11-03', time: '10:00', status: 'done', service: 'Cut', price: 80, doneAt: 1, splitFrozen: true, splitPct: 60, chargeCents: 8000, meCents: 4800, tipCents: 0 };
  var after = Object.assign({}, before, { date: '2026-11-04' });
  var ev = YS.planSaveEvents(before, after);
  var edit = ev.filter(function (e) { return e.type === 'appointment.edit'; })[0];
  assert.ok(edit, 'date change plans an edit');
  assert.strictEqual(edit.before.date, '2026-11-03');
  assert.strictEqual(edit.after.date, '2026-11-04');
  assert.strictEqual(after.status, 'done');
  assert.strictEqual(after.doneAt, 1);
  var appt = require('fs').readFileSync(__dirname + '/appt.html', 'utf8');
  var app = require('fs').readFileSync(__dirname + '/app.html', 'utf8');
  var dateAt = appt.indexOf('id="whenBlock"');
  var picksAt = appt.indexOf('id="favRow"');
  assert.ok(dateAt > 0 && dateAt < picksAt, 'date sits above Quick picks');
  assert.ok(appt.indexOf('function openDatePicker') >= 0);
  assert.ok(appt.indexOf('el.showPicker') >= 0);
  assert.ok(appt.indexOf('shiftFormDate(1)') >= 0);
  assert.ok(appt.indexOf('input[type=date],input[type=time]{-webkit-appearance:auto') >= 0);
  assert.ok(appt.indexOf('Object.assign({},prevRec||{}') >= 0);
  var auditAt = app.indexOf('id="auditCard"');
  var settleAt = app.indexOf('id="settleCard"');
  assert.ok(auditAt > 0 && auditAt < settleAt, 'What happened sits above settlements');
});

check('a client booking sheet edits in place, and a row opens the status sheet', function () {
  var appt = require('fs').readFileSync(__dirname + '/appt.html', 'utf8');
  assert.ok(appt.indexOf('id="cbEdit"') >= 0);
  var edit = appt.slice(appt.indexOf('function editClientFromBookings'), appt.indexOf('function cancelClientBookingsEdit'));
  assert.ok(edit.indexOf('_cbEditing=true') >= 0, 'Edit stays on this sheet');
  assert.ok(edit.indexOf("closeSheet('clientBookingsModal')") < 0);
  assert.ok(appt.indexOf('openBookingStatus(') >= 0);
  assert.ok(appt.indexOf('function openBookingStatus') >= 0);
  var status = appt.slice(appt.indexOf('function openBookingStatus'), appt.indexOf('function editClientFromList'));
  assert.ok(status.indexOf('openSheet(id)') >= 0, 'a booking row opens the quick status sheet');
  assert.ok(status.indexOf('editFromSheet') < 0);
  assert.ok(appt.indexOf('editClientFromList(') >= 0);
  assert.ok(appt.indexOf('Jessica Miller') < 0, 'sample clients are not seeded');
  assert.ok(appt.indexOf('clearDemoData') < 0);
  var save = appt.slice(appt.indexOf('function saveClientBookings'), appt.indexOf('function openClientBookings'));
  assert.ok(save.indexOf('if(invalid.length)') >= 0);
  assert.ok(save.indexOf('persistAppt(prev,next)') > save.indexOf('if(invalid.length)'));
  assert.ok(save.indexOf('Cancelled</div>') >= 0 || appt.indexOf('>Cancelled</div>') >= 0);
});

check('only exact sample rows are removed', function () {
  var rows = [
    { id: 'da5', name: 'Lisa Park', phone: '555-0105', price: 175 },
    { id: 'da1', name: 'Jessica Miller', phone: '555-0101' },
    { id: 'real', name: 'Lisa Park', phone: '555-2222', price: 80 },
    { id: 'da5', name: 'Lisa Park', phone: '555-9999' },
    { id: 'mine', name: 'Ronak', phone: '555-1111', price: 35 }
  ];
  assert.strictEqual(YS.isSampleAppt(rows[0]), true);
  assert.strictEqual(YS.isSampleAppt(rows[2]), false);
  assert.strictEqual(YS.isSampleAppt(rows[3]), false);
  var kept = YS.dropSampleRows(rows, 'appt');
  assert.deepStrictEqual(kept.map(function (r) { return r.id; }), ['real', 'da5', 'mine']);
  var clients = [
    { id: 'dc5', name: 'Lisa Park', phone: '555-0105' },
    { id: 'c9', name: 'Lisa Park', phone: '416-555-0199' }
  ];
  assert.deepStrictEqual(YS.dropSampleRows(clients, 'client').map(function (r) { return r.id; }), ['c9']);
  var mem = {
    ap_appts: JSON.stringify(rows),
    ap_clients: JSON.stringify(clients)
  };
  var first = YS.purgeSamples(function (k) { return mem[k] == null ? null : mem[k]; }, function (k, v) { mem[k] = v; });
  assert.strictEqual(first.removedAppts, 2);
  assert.strictEqual(first.removedClients, 1);
  var left = JSON.parse(mem.ap_appts);
  assert.deepStrictEqual(left.map(function (r) { return r.id; }), ['real', 'da5', 'mine']);
  assert.strictEqual(left.filter(function (r) { return r.id === 'da5'; })[0].phone, '555-9999');
  assert.strictEqual(left.filter(function (r) { return r.id === 'real'; })[0].name, 'Lisa Park');
  var tombs = JSON.parse(mem.ys_tombstones);
  assert.ok(tombs.some(function (t) { return t.entityId === 'da1' && t.entityType === 'ap_appt'; }));
  assert.ok(tombs.some(function (t) { return t.entityId === 'dc5' && t.entityType === 'ap_client'; }));
  assert.strictEqual(mem.ys_sample_audited, '1');
  var audits = JSON.parse(mem['ys_audit_' + YS.localYMD(new Date()).slice(0, 7)]);
  assert.ok(audits.some(function (e) { return e.summary === 'Removed sample bookings'; }));
  var second = YS.purgeSamples(function (k) { return mem[k] == null ? null : mem[k]; }, function (k, v) { mem[k] = v; });
  assert.strictEqual(second.removedAppts, 0);
  var audits2 = JSON.parse(mem['ys_audit_' + YS.localYMD(new Date()).slice(0, 7)]);
  assert.strictEqual(audits2.filter(function (e) { return e.summary === 'Removed sample bookings'; }).length, 1);
});

if (failed) {
  console.error('\n' + failed + ' failed');
  process.exit(1);
}
console.log('\nall checks passed' + (process.env.TZ ? ' (TZ=' + process.env.TZ + ')' : ''));
