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
    needsClosing: needsClosing
  };

  root.YS = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
