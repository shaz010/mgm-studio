/* Shared settlement rules for Your Salon (Earnings + Appointments).
   No secrets, no network. Loaded by app.html and appt.html; tested by yoursalon-settle.test.js.

   Data compatibility:
   - Appointments (ap_appts, tagged _src:'appt' once Earnings merges them) count toward
     what the salon owes only when status is exactly 'done'. Confirmed, cancelled,
     no-show, and a missing status (the Appointments room treats that as confirmed)
     do not count.
   - Earnings' own log (cp_appts) has no scheduling status. Those rows were typed in
     as finished charges, so a blank status still counts. An explicit status, if one
     is ever stored, is honored the same way.
*/
(function (root) {
  'use strict';

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function localYMD(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function localYM(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1);
  }

  /* Sunday 00:00:00 local. Earnings' week filter used to keep the current clock time,
     so Sunday bookings fell out of "this week" after noon. */
  function startOfLocalWeek(d) {
    d = d || new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay(), 0, 0, 0, 0);
  }

  function centsOf(dollars) {
    var n = +dollars;
    if (!isFinite(n)) n = 0;
    return Math.round(n * 100);
  }

  function addMoney(a, b) {
    return (centsOf(a) + centsOf(b)) / 100;
  }

  /* Stylist share is rounded to the cent. Salon share is the remainder,
     so the two always add up to the charge. mePct is 0–100 (60 means 60%). */
  function splitCharge(chargeDollars, mePct) {
    var chargeC = centsOf(chargeDollars);
    var pct = +mePct;
    if (!isFinite(pct)) pct = 60;
    if (pct < 0) pct = 0;
    if (pct > 100) pct = 100;
    var meC = Math.round(chargeC * pct / 100);
    var salonC = chargeC - meC;
    return {
      chargeC: chargeC,
      meC: meC,
      salonC: salonC,
      charge: chargeC / 100,
      me: meC / 100,
      salon: salonC / 100
    };
  }

  function isSchedulingRecord(rec) {
    if (!rec || typeof rec !== 'object') return false;
    if (rec._src === 'appt') return true;
    if (rec._src) return false;
    var st = rec.status == null ? '' : String(rec.status);
    var hasCharge = rec.charge != null && rec.charge !== '';
    var hasPrice = rec.price != null && rec.price !== '';
    if (!st && hasCharge && !hasPrice) return false;
    if (st) return true;
    if (hasPrice && !hasCharge) return true;
    return false;
  }

  function countsTowardOwed(rec) {
    if (!rec) return false;
    var st = rec.status == null ? '' : String(rec.status).toLowerCase();
    if (isSchedulingRecord(rec)) return st === 'done';
    if (!st) return true;
    return st === 'done';
  }

  /* Local instant when a booking is "over".
     No clock time: the calendar day has to finish.
     A duration: the booked window has to finish, so a client still in the chair
     is not listed as forgotten. No duration: the start time is enough. */
  function visitEndMs(rec) {
    if (!rec || !rec.date) return null;
    var p = String(rec.date).split('-');
    if (p.length < 3) return null;
    var y = +p[0], mo = +p[1], da = +p[2];
    if (!isFinite(y) || !isFinite(mo) || !isFinite(da) || mo < 1 || mo > 12 || da < 1 || da > 31) return null;
    var hm = String(rec.time || '').match(/^(\d{1,2}):(\d{2})/);
    if (!hm) return new Date(y, mo - 1, da + 1, 0, 0, 0, 0).getTime();
    var hh = +hm[1], mm = +hm[2];
    if (hh > 23 || mm > 59) return null;
    var start = new Date(y, mo - 1, da, hh, mm, 0, 0).getTime();
    var dur = +rec.dur;
    if (isFinite(dur) && dur > 0) return start + Math.round(dur) * 60000;
    return start;
  }

  function needsClosing(rec, now) {
    if (!isSchedulingRecord(rec)) return false;
    var st = rec.status == null || rec.status === '' ? 'confirmed' : String(rec.status).toLowerCase();
    if (st !== 'confirmed') return false;
    var endMs = visitEndMs(rec);
    if (endMs == null) return false;
    now = now || new Date();
    return now.getTime() >= endMs;
  }

  /* Freeze the split that applies to this charge. A record that already has
     splitFrozen keeps that percent; the cents are refreshed from the current
     charge so a price correction stays on the old rate. */
  function applyFrozenSplit(rec, currentPct, chargeKey) {
    if (!rec || typeof rec !== 'object') return rec;
    var charge = chargeKey ? +rec[chargeKey] : NaN;
    if (!isFinite(charge)) charge = +rec.charge;
    if (!isFinite(charge)) charge = +rec.price;
    if (!isFinite(charge)) charge = 0;
    var sticky = rec.splitFrozen && rec.splitPct != null && isFinite(+rec.splitPct);
    var pct = sticky ? +rec.splitPct : +currentPct;
    if (!isFinite(pct)) pct = 60;
    var parts = splitCharge(charge, pct);
    var out = {};
    var k;
    for (k in rec) if (Object.prototype.hasOwnProperty.call(rec, k)) out[k] = rec[k];
    out.splitPct = pct;
    out.splitFrozen = true;
    out.chargeCents = parts.chargeC;
    out.meCents = parts.meC;
    out.salonCents = parts.salonC;
    out.tipCents = centsOf(rec.tip);
    return out;
  }

  function owedCentsForRows(rows) {
    var c = 0;
    (rows || []).forEach(function (a) {
      if (!countsTowardOwed(a)) return;
      c += centsOf(a.me) + centsOf(a.tip);
    });
    return c;
  }

  function sumPaymentCents(payments, opts) {
    opts = opts || {};
    var c = 0;
    (payments || []).forEach(function (p) {
      if (!p) return;
      if (!opts.includeVoid && p.voided) return;
      var ds = String(p.date || '');
      if (opts.from && ds < opts.from) return;
      if (opts.to && ds > opts.to) return;
      var n = Math.round(+p.amountCents);
      if (!isFinite(n)) return;
      c += n;
    });
    return c;
  }

  function runningBalance(owedC, payments) {
    var owed = Math.round(+owedC);
    if (!isFinite(owed)) owed = 0;
    var paid = sumPaymentCents(payments);
    return { owedCents: owed, paidCents: paid, dueCents: owed - paid };
  }

  /* Settlements group finished work so an old unpaid balance is not mixed
     with new visits. Membership is the id list saved at close. Appointments
     and payments are not rewritten. Allocation is recomputed from those lists. */
  function activeSettlements(settlements) {
    return (settlements || []).filter(function (s) { return s && !s.undone; }).slice().sort(function (a, b) {
      var d = String(a.endDate || '').localeCompare(String(b.endDate || ''));
      if (d) return d;
      var c = (+a.closedAt || 0) - (+b.closedAt || 0);
      if (c) return c;
      return String(a.id || '').localeCompare(String(b.id || ''));
    });
  }

  function claimedSettlementIds(settlements) {
    var map = {};
    activeSettlements(settlements).forEach(function (s) {
      (s.ids || []).forEach(function (id) { map[String(id)] = String(s.id); });
    });
    return map;
  }

  function planCloseSettlement(rows, settlements, endDate, now) {
    now = now || Date.now();
    endDate = endDate || localYMD(new Date(now));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(endDate))) return { ok: false, reason: 'date' };
    var claimed = claimedSettlementIds(settlements);
    var picked = [];
    (rows || []).forEach(function (a) {
      if (!countsTowardOwed(a) || a.id == null || a.id === '') return;
      if (claimed[String(a.id)]) return;
      var ds = String(a.date || '');
      if (ds && ds > endDate) return;
      picked.push(a);
    });
    if (!picked.length) return { ok: false, reason: 'empty' };
    var dates = picked.map(function (a) { return String(a.date || ''); }).filter(Boolean).sort();
    var owed = owedCentsForRows(picked);
    return {
      ok: true,
      settlement: {
        id: 'set-' + String(endDate).replace(/-/g, '') + '-' + now.toString(36),
        startDate: dates.length ? dates[0] : endDate,
        endDate: endDate,
        owedCents: owed,
        closedAt: now,
        createdAt: now,
        updatedAt: now,
        undone: false,
        undoneAt: null,
        ids: picked.map(function (a) { return String(a.id); })
      }
    };
  }

  function latestSettlement(settlements) {
    var list = activeSettlements(settlements);
    return list.length ? list[list.length - 1] : null;
  }

  function paymentBlocksUndo(payment, settlement) {
    if (!payment || payment.voided || !settlement) return false;
    var closed = +settlement.closedAt || 0;
    var created = +payment.createdAt;
    if (isFinite(created) && created > 0) return created > closed;
    return String(payment.date || '') > localYMD(new Date(closed));
  }

  function canUndoSettlement(settlements, payments) {
    var last = latestSettlement(settlements);
    if (!last) return { ok: false, reason: 'none', settlement: null };
    var blocked = (payments || []).some(function (p) { return paymentBlocksUndo(p, last); });
    if (blocked) return { ok: false, reason: 'payment', settlement: last };
    return { ok: true, reason: '', settlement: last };
  }

  function undoSettlementRecord(settlement, now) {
    now = now || Date.now();
    var out = {};
    var k;
    for (k in settlement) if (Object.prototype.hasOwnProperty.call(settlement, k)) out[k] = settlement[k];
    out.undone = true;
    out.undoneAt = now;
    out.updatedAt = now;
    return out;
  }

  function settlementStatus(paid, remaining) {
    if (remaining <= 0) return 'Paid';
    if (paid > 0) return 'Partly paid';
    return 'Unpaid';
  }

  /* Oldest settlement is filled first. Leftover pays the open period.
     Anything beyond that is credit. Nothing is written back onto payments. */
  function allocateSettlements(rows, settlements, payments) {
    var claimed = claimedSettlementIds(settlements);
    var pool = sumPaymentCents(payments);
    var lines = activeSettlements(settlements).map(function (s) {
      var members = (rows || []).filter(function (a) {
        return countsTowardOwed(a) && a.id != null && claimed[String(a.id)] === String(s.id);
      });
      var owed = owedCentsForRows(members);
      return {
        id: s.id,
        startDate: s.startDate || '',
        endDate: s.endDate || '',
        closedAt: s.closedAt || 0,
        owedCents: owed,
        snapshotCents: Math.round(+s.owedCents) || 0,
        paidCents: 0,
        remainingCents: owed,
        status: 'Unpaid'
      };
    });
    lines.forEach(function (line) {
      var take = Math.min(Math.max(pool, 0), line.owedCents);
      line.paidCents = take;
      line.remainingCents = line.owedCents - take;
      line.status = settlementStatus(line.paidCents, line.remainingCents);
      pool -= take;
    });
    var currentRows = (rows || []).filter(function (a) {
      return countsTowardOwed(a) && (a.id == null || a.id === '' || !claimed[String(a.id)]);
    });
    var currentOwed = owedCentsForRows(currentRows);
    if (pool < 0) pool = 0;
    var applied = Math.min(pool, currentOwed);
    var credit = pool - currentOwed;
    if (credit < 0) credit = 0;
    var pastRemaining = 0;
    var pastOwed = 0;
    lines.forEach(function (line) {
      pastRemaining += line.remainingCents;
      pastOwed += line.owedCents;
    });
    var totalOwed = pastOwed + currentOwed;
    var paid = sumPaymentCents(payments);
    return {
      settlements: lines,
      pastRemainingCents: pastRemaining,
      current: {
        owedCents: currentOwed,
        paidCents: applied,
        remainingCents: currentOwed - applied
      },
      creditCents: credit,
      dueCents: totalOwed - paid,
      owedCents: totalOwed,
      paidCents: paid
    };
  }

  function mergeSettlementLists(a, b) {
    var byId = {};
    function take(list) {
      (list || []).forEach(function (r) {
        if (!r || r.id == null) return;
        var id = String(r.id);
        var prev = byId[id];
        if (!prev) { byId[id] = r; return; }
        var pt = +prev.updatedAt || +prev.closedAt || 0;
        var rt = +r.updatedAt || +r.closedAt || 0;
        if (rt > pt) byId[id] = r;
        else if (rt === pt && r.undone && !prev.undone) byId[id] = r;
      });
    }
    take(a);
    take(b);
    return Object.keys(byId).map(function (id) { return byId[id]; }).sort(function (x, y) {
      var d = String(x.endDate || '').localeCompare(String(y.endDate || ''));
      if (d) return d;
      return (+x.closedAt || 0) - (+y.closedAt || 0);
    });
  }

  /* Latest payment the salon actually made. Voided rows do not count.
     A payment with no clock time sorts as the end of its calendar day. */
  function paymentMoment(p) {
    if (!p) return 0;
    var created = +p.createdAt;
    if (isFinite(created) && created > 0) return created;
    var pds = String(p.date || '').split('-');
    if (pds.length >= 3 && +pds[0] && +pds[1] && +pds[2]) {
      return new Date(+pds[0], +pds[1] - 1, +pds[2], 23, 59, 59).getTime();
    }
    return 0;
  }

  function latestLivePayment(payments) {
    var best = null;
    (payments || []).forEach(function (p) {
      if (!p || p.voided) return;
      if (!best || paymentMoment(p) > paymentMoment(best) || (paymentMoment(p) === paymentMoment(best) && String(p.id || '') > String(best.id || ''))) best = p;
    });
    return best;
  }

  /* Latest time a visit was marked Done, from status-change events. */
  function doneMillisFromEvents(events) {
    var map = {};
    (events || []).forEach(function (e) {
      if (!e || e.entityId == null || e.entityId === '') return;
      if (e.type !== 'status.change' || !e.after || String(e.after.status || '').toLowerCase() !== 'done') return;
      var at = +e.at;
      if (!isFinite(at) || at <= 0) return;
      var id = String(e.entityId);
      if (!map[id] || at >= map[id]) map[id] = at;
    });
    return map;
  }

  function doneMillisForRow(row, map) {
    if (row && row.doneAt != null && isFinite(+row.doneAt) && +row.doneAt > 0) return +row.doneAt;
    if (row && row.id != null && map && map[String(row.id)]) return map[String(row.id)];
    return null;
  }

  /* A visit is new work when it was marked Done after the latest payment.
     No clock time: compare calendar dates, and the payment's own day counts as before.
     Visits already inside a closed settlement stay in the before pile. */
  function isNewSinceLastPayment(row, payment, doneMs, inSettlement) {
    if (inSettlement || !payment) return false;
    var payAt = +payment.createdAt;
    var payDate = String(payment.date || '');
    if (doneMs != null) {
      if (isFinite(payAt) && payAt > 0) return doneMs > payAt;
      return localYMD(new Date(doneMs)) > payDate;
    }
    var ds = String(row && row.date || '');
    if (!ds || !payDate) return false;
    return ds > payDate;
  }

  function splitAtLastPayment(rows, payments, opts) {
    opts = opts || {};
    var doneMap = doneMillisFromEvents(opts.events);
    var latest = latestLivePayment(payments);
    var claimed = claimedSettlementIds(opts.settlements || []);
    var beforeOwed = 0;
    var newOwed = 0;
    (rows || []).forEach(function (a) {
      if (!countsTowardOwed(a)) return;
      var cents = centsOf(a.me) + centsOf(a.tip);
      var inSettlement = a && a.id != null && !!claimed[String(a.id)];
      var doneMs = doneMillisForRow(a, doneMap);
      if (isNewSinceLastPayment(a, latest, doneMs, inSettlement)) newOwed += cents;
      else beforeOwed += cents;
    });
    var paid = sumPaymentCents(payments);
    var beforeRem = Math.max(0, beforeOwed - paid);
    var over = Math.max(0, paid - beforeOwed);
    var newRem = newOwed - over;
    return {
      hasPayments: !!latest,
      beforeCents: beforeRem,
      newCents: newRem,
      beforeOwedCents: beforeOwed,
      newOwedCents: newOwed,
      totalCents: beforeRem + newRem,
      paidCents: paid
    };
  }

  function migratedPaymentId(ym) { return 'mig-cp_paid-' + ym; }

  /* Each old "this month is paid" flag becomes one payment. The id is the
     month, so a second run or another device does not add a copy. */
  function migratePaidMonths(paidMap, rows, payments) {
    var out = [];
    var have = {};
    (payments || []).forEach(function (p) {
      if (!p || p.id == null) return;
      out.push(p);
      have[String(p.id)] = 1;
    });
    var added = [];
    if (!paidMap || typeof paidMap !== 'object') return { payments: out, added: added };
    Object.keys(paidMap).sort().forEach(function (ym) {
      if (!/^\d{4}-\d{2}$/.test(ym)) return;
      var id = migratedPaymentId(ym);
      if (have[id]) return;
      var ts = +paidMap[ym];
      if (!isFinite(ts) || ts <= 0) return;
      var amount = owedCentsForRows((rows || []).filter(function (a) {
        return String(a && a.date || '').slice(0, 7) === ym;
      }));
      var rec = {
        id: id,
        amountCents: amount,
        date: localYMD(new Date(ts)),
        method: 'other',
        note: 'Migrated from Mark paid',
        createdAt: ts,
        updatedAt: ts,
        voided: false,
        voidReason: '',
        voidedAt: null
      };
      out.push(rec);
      added.push(rec);
      have[id] = 1;
    });
    return { payments: out, added: added };
  }

  /* Union by id. The record with the later updatedAt wins, including a void. */
  function mergePaymentLists(a, b) {
    var byId = {};
    function take(list) {
      (list || []).forEach(function (r) {
        if (!r || r.id == null) return;
        var id = String(r.id);
        var prev = byId[id];
        if (!prev) { byId[id] = r; return; }
        var pt = +prev.updatedAt || +prev.createdAt || 0;
        var rt = +r.updatedAt || +r.createdAt || 0;
        if (rt > pt) byId[id] = r;
        else if (rt === pt && r.voided && !prev.voided) byId[id] = r;
      });
    }
    take(a);
    take(b);
    return Object.keys(byId).map(function (id) { return byId[id]; }).sort(function (x, y) {
      var d = String(y.date || '').localeCompare(String(x.date || ''));
      if (d) return d;
      return String(x.id).localeCompare(String(y.id));
    });
  }

  function periodBounds(period, now) {
    now = now || new Date();
    var today = localYMD(now);
    if (period === 'today') return { from: today, to: today, label: 'Today' };
    if (period === 'week') {
      var sow = startOfLocalWeek(now);
      var eow = new Date(sow.getFullYear(), sow.getMonth(), sow.getDate() + 6);
      return { from: localYMD(sow), to: localYMD(eow), label: 'This week' };
    }
    if (period === 'month') {
      var start = new Date(now.getFullYear(), now.getMonth(), 1);
      var end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { from: localYMD(start), to: localYMD(end), label: 'This month' };
    }
    return { from: '', to: '', label: 'All' };
  }

  function auditMonthKey(localDate) { return 'ys_audit_' + String(localDate || '').slice(0, 7); }

  function makeAuditEvent(partial) {
    partial = partial || {};
    var at = +partial.at;
    if (!isFinite(at) || at <= 0) at = Date.now();
    var d = new Date(at);
    var localDate = partial.localDate || localYMD(d);
    var localTime = partial.localTime || (pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds()));
    return {
      id: partial.id || ('aud-' + at.toString(36) + '-' + Math.random().toString(36).slice(2, 8)),
      at: at,
      localDate: localDate,
      localTime: localTime,
      type: partial.type || 'note',
      entityType: partial.entityType || '',
      entityId: partial.entityId == null ? '' : String(partial.entityId),
      summary: partial.summary || '',
      before: partial.before == null ? null : partial.before,
      after: partial.after == null ? null : partial.after,
      source: partial.source || 'earn',
      actor: partial.actor || 'this device'
    };
  }

  /* Append only. An id that already exists is left untouched. */
  function appendAudit(list, event) {
    var id = String(event && event.id);
    var src = Array.isArray(list) ? list : [];
    for (var i = 0; i < src.length; i++) if (src[i] && String(src[i].id) === id) return src;
    var copy = src.slice();
    copy.push(event);
    return copy;
  }

  /* Union by id. The earlier event wins whole, so a later sync cannot rewrite history. */
  function mergeAuditLists(a, b) {
    var byId = {};
    var order = [];
    function take(list) {
      (list || []).forEach(function (r) {
        if (!r || r.id == null) return;
        var id = String(r.id);
        var prev = byId[id];
        if (!prev) { byId[id] = r; order.push(id); return; }
        var pt = +prev.at || 0;
        var rt = +r.at || 0;
        if (rt < pt) byId[id] = r;
      });
    }
    take(a);
    take(b);
    return order.map(function (id) { return byId[id]; }).sort(function (x, y) { return (+x.at || 0) - (+y.at || 0); });
  }

  function mergeMonthIndex(a, b) {
    var set = {};
    function take(list) {
      (list || []).forEach(function (m) { if (/^\d{4}-\d{2}$/.test(String(m))) set[String(m)] = 1; });
    }
    take(a);
    take(b);
    return Object.keys(set).sort();
  }

  function storeAudit(getItem, setItem, partial) {
    var event = makeAuditEvent(partial);
    var key = auditMonthKey(event.localDate);
    var list = [];
    try { list = JSON.parse(getItem(key) || '[]'); } catch (e) { list = []; }
    if (!Array.isArray(list)) list = [];
    var next = appendAudit(list, event);
    if (next !== list) setItem(key, JSON.stringify(next));
    var months = [];
    try { months = JSON.parse(getItem('ys_audit_months') || '[]'); } catch (e) { months = []; }
    if (!Array.isArray(months)) months = [];
    var ym = String(event.localDate).slice(0, 7);
    if (/^\d{4}-\d{2}$/.test(ym) && months.indexOf(ym) < 0) {
      months.push(ym);
      months.sort();
      setItem('ys_audit_months', JSON.stringify(months));
    }
    return { event: event, stored: next !== list };
  }

  function readAudit(getItem, from, to) {
    var months = [];
    try { months = JSON.parse(getItem('ys_audit_months') || '[]'); } catch (e) { months = []; }
    if (!Array.isArray(months)) months = [];
    var all = [];
    months.forEach(function (m) {
      if (from && m < String(from).slice(0, 7)) return;
      if (to && m > String(to).slice(0, 7)) return;
      var chunk = [];
      try { chunk = JSON.parse(getItem(auditMonthKey(m + '-01')) || '[]'); } catch (e) { chunk = []; }
      if (Array.isArray(chunk)) all = all.concat(chunk);
    });
    return all.filter(function (e) {
      var ds = e && e.localDate || '';
      if (from && ds < from) return false;
      if (to && ds > to) return false;
      return true;
    }).sort(function (x, y) { return (+x.at || 0) - (+y.at || 0); });
  }

  function moneySnap(rec) {
    if (!rec) return null;
    var charge = rec.charge != null ? +rec.charge : +rec.price || 0;
    var pct = rec.splitPct != null && isFinite(+rec.splitPct) ? +rec.splitPct : null;
    var parts = pct == null ? null : splitCharge(charge, pct);
    return {
      name: rec.name || '',
      date: rec.date || '',
      status: rec.status || '',
      chargeCents: rec.chargeCents != null ? rec.chargeCents : (parts ? parts.chargeC : centsOf(charge)),
      meCents: rec.meCents != null ? rec.meCents : (parts ? parts.meC : centsOf(rec.me)),
      salonCents: rec.salonCents != null ? rec.salonCents : (parts ? parts.salonC : null),
      tipCents: rec.tipCents != null ? rec.tipCents : centsOf(rec.tip),
      splitPct: pct
    };
  }

  function planSaveEvents(before, after) {
    var events = [];
    if (!after) return events;
    var kind = after._src === 'appt' ? 'ap_appt' : 'cp_appt';
    var name = after.name || 'Appointment';
    if (!before) {
      var snap = moneySnap(after);
      events.push({
        type: 'appointment.create',
        entityType: kind,
        entityId: after.id,
        summary: 'Added ' + name + (after.date ? (' on ' + after.date) : ''),
        before: null,
        after: snap
      });
      return events;
    }
    var b = moneySnap(before), a = moneySnap(after);
    if (b.chargeCents !== a.chargeCents) {
      events.push({
        type: 'price.change',
        entityType: kind,
        entityId: after.id,
        summary: name + ' price changed',
        before: { chargeCents: b.chargeCents, meCents: b.meCents, salonCents: b.salonCents, splitPct: b.splitPct },
        after: { chargeCents: a.chargeCents, meCents: a.meCents, salonCents: a.salonCents, splitPct: a.splitPct }
      });
    }
    if (b.tipCents !== a.tipCents) {
      events.push({
        type: 'tip.change',
        entityType: kind,
        entityId: after.id,
        summary: name + ' tip changed',
        before: { tipCents: b.tipCents },
        after: { tipCents: a.tipCents }
      });
    }
    var bits = [];
    if ((before.name || '') !== (after.name || '')) bits.push('name');
    if ((before.date || '') !== (after.date || '')) bits.push('date');
    if ((before.time || '') !== (after.time || '')) bits.push('time');
    var bs = before.service || before.cat || '';
    var as = after.service || after.cat || '';
    if (bs !== as) bits.push('service');
    if (bits.length) {
      events.push({
        type: 'appointment.edit',
        entityType: kind,
        entityId: after.id,
        summary: 'Edited ' + name + ' (' + bits.join(', ') + ')',
        before: { name: before.name || '', date: before.date || '', time: before.time || '', service: bs },
        after: { name: after.name || '', date: after.date || '', time: after.time || '', service: as }
      });
    }
    return events;
  }

  function planStatusEvent(rec, fromStatus, toStatus) {
    var name = (rec && rec.name) || 'Appointment';
    return {
      type: 'status.change',
      entityType: rec && rec._src === 'appt' ? 'ap_appt' : (rec && rec.price != null && rec.charge == null ? 'ap_appt' : 'ap_appt'),
      entityId: rec && rec.id,
      summary: name + ' ' + (fromStatus || 'confirmed') + ' → ' + toStatus,
      before: { status: fromStatus || 'confirmed' },
      after: { status: toStatus, splitPct: rec && rec.splitPct != null ? rec.splitPct : null, meCents: rec && rec.meCents != null ? rec.meCents : null, tipCents: rec && rec.tipCents != null ? rec.tipCents : centsOf(rec && rec.tip) }
    };
  }

  function prevYMD(ymd) {
    var p = String(ymd || '').split('-');
    if (p.length < 3) return '';
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    d.setDate(d.getDate() - 1);
    return localYMD(d);
  }

  function nextYMD(ymd) {
    var p = String(ymd || '').split('-');
    if (p.length < 3) return '';
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    d.setDate(d.getDate() + 1);
    return localYMD(d);
  }

  function followMoney(rows, payments, from, to, settlements) {
    if (!from) return { beforeCents: 0, afterCents: 0, days: [] };
    if (!to || to < from) to = from;
    function owedAsOf(date, inclusive) {
      var list = (rows || []).filter(function (a) {
        if (!countsTowardOwed(a)) return false;
        var ds = String(a.date || '');
        if (!ds) return false;
        return inclusive ? ds <= date : ds < date;
      });
      return owedCentsForRows(list);
    }
    var beforeDate = prevYMD(from);
    var beforeCents = owedAsOf(from, false) - sumPaymentCents(payments, { to: beforeDate });
    var afterCents = owedAsOf(to, true) - sumPaymentCents(payments, { to: to });
    var days = [];
    var cursor = from;
    var guard = 0;
    while (cursor && cursor <= to && guard < 400) {
      var earned = 0, tips = 0, lines = [];
      (rows || []).forEach(function (a) {
        if (!countsTowardOwed(a) || String(a.date || '') !== cursor) return;
        var me = centsOf(a.me), tip = centsOf(a.tip);
        earned += me;
        tips += tip;
        lines.push({ kind: 'work', name: a.name || '', meCents: me, tipCents: tip, splitPct: a.splitPct != null ? a.splitPct : null });
      });
      var paid = 0;
      (payments || []).forEach(function (p) {
        if (!p || p.voided || String(p.date || '') !== cursor) return;
        var n = Math.round(+p.amountCents);
        if (!isFinite(n)) n = 0;
        paid += n;
        lines.push({ kind: 'payment', method: p.method || '', amountCents: n, note: p.note || '' });
      });
      (settlements || []).forEach(function (s) {
        if (!s || s.undone || !s.closedAt) return;
        if (localYMD(new Date(+s.closedAt)) !== cursor) return;
        lines.push({ kind: 'settlement', endDate: s.endDate || '', owedCents: Math.round(+s.owedCents) || 0, id: s.id || '' });
      });
      var due = owedAsOf(cursor, true) - sumPaymentCents(payments, { to: cursor });
      if (lines.length || cursor === from || cursor === to) {
        days.push({ date: cursor, earnedCents: earned, tipCents: tips, paidCents: paid, dueCents: due, lines: lines });
      }
      cursor = nextYMD(cursor);
      guard++;
    }
    return { beforeCents: beforeCents, afterCents: afterCents, days: days };
  }

  function csvEscape(v) {
    var s = v == null ? '' : String(v);
    if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function toCsv(headers, rows) {
    var lines = [headers.map(csvEscape).join(',')];
    (rows || []).forEach(function (r) { lines.push((r || []).map(csvEscape).join(',')); });
    return lines.join('\r\n');
  }

  function inDateRange(ds, from, to) {
    ds = String(ds || '');
    if (!ds) return !from && !to;
    if (from && ds < from) return false;
    if (to && ds > to) return false;
    return true;
  }

  function csvPayments(payments, from, to) {
    var headers = ['date', 'amountCents', 'method', 'note', 'voided', 'voidReason', 'id'];
    var rows = (payments || []).filter(function (p) { return p && inDateRange(p.date, from, to); }).map(function (p) {
      return [p.date || '', Math.round(+p.amountCents) || 0, p.method || '', p.note || '', p.voided ? 'yes' : 'no', p.voidReason || '', p.id || ''];
    });
    return toCsv(headers, rows);
  }

  function csvAppointments(rows, from, to) {
    var headers = ['date', 'name', 'status', 'chargeCents', 'meCents', 'salonCents', 'tipCents', 'splitPct', 'splitFrozen', 'id'];
    var out = (rows || []).filter(function (a) { return a && inDateRange(a.date, from, to); }).map(function (a) {
      var snap = moneySnap(a);
      return [a.date || '', a.name || '', a.status || '', snap.chargeCents, snap.meCents, snap.salonCents == null ? '' : snap.salonCents, snap.tipCents, snap.splitPct == null ? '' : snap.splitPct, a.splitFrozen ? 'yes' : 'no', a.id || ''];
    });
    return toCsv(headers, out);
  }

  function csvSettlements(settlements, rows, payments, from, to) {
    var alloc = allocateSettlements(rows || [], settlements || [], payments || []);
    var byId = {};
    (alloc.settlements || []).forEach(function (line) { byId[String(line.id)] = line; });
    var headers = ['id', 'startDate', 'endDate', 'closedAt', 'owedCents', 'paidCents', 'remainingCents', 'status', 'undone'];
    var out = (settlements || []).filter(function (s) {
      if (!s) return false;
      var ds = s.closedAt ? localYMD(new Date(+s.closedAt)) : (s.endDate || '');
      return inDateRange(ds, from, to);
    }).map(function (s) {
      var line = byId[String(s.id)];
      return [
        s.id || '',
        s.startDate || '',
        s.endDate || '',
        s.closedAt || '',
        line ? line.owedCents : (Math.round(+s.owedCents) || 0),
        line ? line.paidCents : '',
        line ? line.remainingCents : '',
        line ? line.status : (s.undone ? 'Undone' : ''),
        s.undone ? 'yes' : 'no'
      ];
    });
    return toCsv(headers, out);
  }

  function csvAudit(events, from, to) {
    var headers = ['localDate', 'localTime', 'type', 'summary', 'entityType', 'entityId', 'actor', 'source', 'before', 'after'];
    var rows = (events || []).filter(function (e) { return e && inDateRange(e.localDate, from, to); }).map(function (e) {
      return [e.localDate || '', e.localTime || '', e.type || '', e.summary || '', e.entityType || '', e.entityId || '', e.actor || '', e.source || '', e.before ? JSON.stringify(e.before) : '', e.after ? JSON.stringify(e.after) : ''];
    });
    return toCsv(headers, rows);
  }

  function tombstoneId(entityType, entityId) { return 'tomb-' + entityType + '-' + String(entityId); }

  function makeTombstone(entityType, entityId, at, summary) {
    return { id: tombstoneId(entityType, entityId), entityType: entityType, entityId: String(entityId), at: at || Date.now(), summary: summary || '' };
  }

  function isTombstoned(list, entityType, entityId) {
    var id = tombstoneId(entityType, entityId);
    return (list || []).some(function (t) { return t && String(t.id) === id; });
  }

  function filterTombstones(records, tombs, entityType) {
    return (records || []).filter(function (r) { return r && !isTombstoned(tombs, entityType, r.id); });
  }

  var api = {
    localYMD: localYMD,
    localYM: localYM,
    startOfLocalWeek: startOfLocalWeek,
    centsOf: centsOf,
    addMoney: addMoney,
    splitCharge: splitCharge,
    isSchedulingRecord: isSchedulingRecord,
    countsTowardOwed: countsTowardOwed,
    visitEndMs: visitEndMs,
    needsClosing: needsClosing,
    applyFrozenSplit: applyFrozenSplit,
    owedCentsForRows: owedCentsForRows,
    sumPaymentCents: sumPaymentCents,
    runningBalance: runningBalance,
    activeSettlements: activeSettlements,
    planCloseSettlement: planCloseSettlement,
    canUndoSettlement: canUndoSettlement,
    undoSettlementRecord: undoSettlementRecord,
    allocateSettlements: allocateSettlements,
    mergeSettlementLists: mergeSettlementLists,
    latestLivePayment: latestLivePayment,
    doneMillisFromEvents: doneMillisFromEvents,
    splitAtLastPayment: splitAtLastPayment,
    migratedPaymentId: migratedPaymentId,
    migratePaidMonths: migratePaidMonths,
    mergePaymentLists: mergePaymentLists,
    periodBounds: periodBounds,
    auditMonthKey: auditMonthKey,
    makeAuditEvent: makeAuditEvent,
    appendAudit: appendAudit,
    mergeAuditLists: mergeAuditLists,
    mergeMonthIndex: mergeMonthIndex,
    storeAudit: storeAudit,
    readAudit: readAudit,
    moneySnap: moneySnap,
    planSaveEvents: planSaveEvents,
    planStatusEvent: planStatusEvent,
    followMoney: followMoney,
    csvEscape: csvEscape,
    toCsv: toCsv,
    csvPayments: csvPayments,
    csvSettlements: csvSettlements,
    csvAppointments: csvAppointments,
    csvAudit: csvAudit,
    tombstoneId: tombstoneId,
    makeTombstone: makeTombstone,
    isTombstoned: isTombstoned,
    filterTombstones: filterTombstones
  };

  root.YS = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
