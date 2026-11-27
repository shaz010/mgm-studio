const { test, expect } = require('@playwright/test');

const SAMPLE_NAMES = ['Jessica Miller', 'Sarah Thompson', 'Amanda Chen', 'Rachel Torres', 'Emma Wilson'];

function watchErrors(page) {
  const errors = [];
  page.on('pageerror', function (err) { errors.push(String(err && err.message || err)); });
  return errors;
}

function sampleAppts() {
  return [
    { id: 'da1', name: 'Jessica Miller', phone: '555-0101', service: 'Colour', date: '2026-10-01', time: '10:00', price: 285, tip: 40, status: 'done', cid: 'dc1' },
    { id: 'da2', name: 'Sarah Thompson', phone: '555-0102', service: 'Cut', date: '2026-10-02', time: '11:00', price: 95, tip: 15, status: 'done', cid: 'dc2' },
    { id: 'da3', name: 'Amanda Chen', phone: '555-0103', service: 'Highlights', date: '2026-10-03', time: '09:00', price: 220, tip: 30, status: 'done', cid: 'dc3' },
    { id: 'da4', name: 'Rachel Torres', phone: '555-0104', service: 'Blowout', date: '2026-10-04', time: '14:00', price: 75, tip: 10, status: 'done', cid: 'dc4' },
    { id: 'da5', name: 'Lisa Park', phone: '555-0105', service: 'Cut & Colour', date: '2026-10-05', time: '10:30', price: 175, tip: 0, status: 'confirmed', cid: 'dc5' },
    { id: 'da6', name: 'Emma Wilson', phone: '555-0106', service: 'Roots', date: '2026-10-06', time: '13:00', price: 120, tip: 0, status: 'confirmed', cid: 'dc6' }
  ];
}

function sampleClients() {
  return [
    { id: 'dc1', name: 'Jessica Miller', phone: '555-0101' },
    { id: 'dc2', name: 'Sarah Thompson', phone: '555-0102' },
    { id: 'dc3', name: 'Amanda Chen', phone: '555-0103' },
    { id: 'dc4', name: 'Rachel Torres', phone: '555-0104' },
    { id: 'dc5', name: 'Lisa Park', phone: '555-0105' },
    { id: 'dc6', name: 'Emma Wilson', phone: '555-0106' }
  ];
}

test('a fresh device never writes sample bookings', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/appt.html');
  await page.waitForTimeout(400);
  const text = await page.locator('body').innerText();
  SAMPLE_NAMES.forEach(function (name) { expect(text).not.toContain(name); });
  const stored = await page.evaluate(function () { return localStorage.getItem('ap_appts'); });
  expect(stored == null || stored === 'null' || !/Jessica Miller/.test(stored)).toBeTruthy();
  expect(errors).toEqual([]);
});

test('sample rows are removed and Earnings keeps the real total', async ({ page }) => {
  const errors = watchErrors(page);
  const payAt = new Date(2026, 10, 10, 12).getTime();
  const late = new Date(2026, 10, 9, 18).getTime();
  const early = new Date(2026, 10, 1, 9).getTime();
  function row(id, name, date, dollars, doneAt, time) {
    return { id: id, name: name, date: date, time: time || '10:00', charge: dollars, tip: 0, status: 'done', splitPct: 100, splitFrozen: true, doneAt: doneAt, cat: 'Hair' };
  }
  const real = [
    row('kori', 'Kori', '2026-10-02', 40, late),
    row('sam', 'Sam', '2026-10-06', 30, late),
    row('leila', 'Leila', '2026-10-09', 45, late),
    row('omar', 'Omar', '2026-10-14', 35, late),
    row('priya', 'Priya', '2026-10-18', 50, late),
    row('noah', 'Noah', '2026-10-22', 20, late),
    row('abbas', 'Abbas', '2026-10-27', 40, late),
    row('ronak', 'Ronak', '2026-10-30', 21, late, '11:00'),
    row('nick', 'Nick Webb', '2026-11-03', 15, early, '10:00'),
    row('hidi', 'Hidi', '2026-11-03', 55, early + 60000, '15:00'),
    row('june', 'June', '2026-11-12', 80, payAt + 86400000),
    row('camille', 'Camille', '2026-11-14', 64, payAt + 2 * 86400000),
    row('reese', 'Reese', '2026-11-16', 60, payAt + 3 * 86400000)
  ];
  await page.addInitScript(function (seed) {
    localStorage.setItem('ap_prefs', JSON.stringify({ svcMode: 'hair', splitPct: 60 }));
    localStorage.setItem('cp_unlocked', '1');
    localStorage.setItem('cp_prefs', JSON.stringify({ trade: 'hair', tourDone: true, name: 'Shahbaz', rate: 100 }));
    localStorage.setItem('cp_appts', JSON.stringify(seed.real));
    localStorage.setItem('cp_payments', JSON.stringify([seed.payment]));
    localStorage.setItem('ap_appts', JSON.stringify(seed.samples.concat([{ id: 'keep', name: 'Lisa Park', phone: '555-2222', service: 'Cut', date: '2026-11-01', time: '09:00', price: 40, tip: 0, status: 'confirmed' }])));
    localStorage.setItem('ap_clients', JSON.stringify(seed.clients.concat([{ id: 'c-real', name: 'Lisa Park', phone: '555-2222' }])));
  }, { real: real, samples: sampleAppts(), clients: sampleClients(), payment: { id: 'p1', amountCents: 26800, date: '2026-11-10', method: 'transfer', voided: false, createdAt: payAt, updatedAt: payAt } });
  await page.goto('/appt.html');
  await page.waitForTimeout(400);
  const cleaned = await page.evaluate(function () {
    var appts = JSON.parse(localStorage.getItem('ap_appts') || '[]');
    var clients = JSON.parse(localStorage.getItem('ap_clients') || '[]');
    return {
      ids: appts.map(function (a) { return a.id; }),
      names: appts.map(function (a) { return a.name; }),
      clients: clients.map(function (c) { return c.id; })
    };
  });
  expect(cleaned.ids).not.toContain('da1');
  expect(cleaned.ids).toContain('keep');
  expect(cleaned.names).toContain('Lisa Park');
  expect(cleaned.clients).toEqual(['c-real']);
  await page.goto('/app.html');
  await page.evaluate(function () { if (typeof showTab === 'function') showTab('hist'); });
  await page.waitForTimeout(400);
  const text = await page.locator('#tableView').innerText();
  expect(text).toContain('Ronak');
  expect(text).toContain('Partly paid');
  expect(text).toContain('$287.00');
  expect(text).not.toContain('Jessica Miller');
  expect(errors).toEqual([]);
});

test('Add opens on today, a booking tap opens status, and both edit paths save one date', async ({ page }) => {
  const errors = watchErrors(page);
  await page.addInitScript(function () {
    localStorage.setItem('ap_prefs', JSON.stringify({ svcMode: 'hair', splitPct: 60 }));
    localStorage.setItem('combo_trade', 'hair');
    localStorage.setItem('ap_clients', JSON.stringify([{ id: 'c1', name: 'Hidi', phone: '555-0188', email: 'hidi@example.com' }]));
    localStorage.setItem('ap_appts', JSON.stringify([
      { id: 'a1', name: 'Hidi', phone: '555-0188', cid: 'c1', service: 'Cut', date: '2026-11-03', time: '10:00', dur: 60, price: 80, tip: 0, status: 'confirmed' },
      { id: 'a2', name: 'Hidi', phone: '555-0188', cid: 'c1', service: 'Color', date: '2026-11-04', time: '12:00', dur: 60, price: 90, tip: 0, status: 'confirmed' }
    ]));
  });
  await page.goto('/appt.html');
  await page.waitForTimeout(300);
  const today = await page.evaluate(function () {
    var sc = document.getElementById('tradeScreen');
    if (sc) sc.style.display = 'none';
    openAdd();
    return { value: document.getElementById('fDate').value, today: todayStr() };
  });
  expect(today.value).toBe(today.today);

  await page.evaluate(function () { openClientBookings('c1'); });
  await page.locator('.cb-appt[data-aid="a1"]').click();
  await expect(page.locator('#apptModal')).toHaveClass(/show/);
  await expect(page.locator('#statusGrid')).toBeVisible();
  await page.locator('#statusGrid .status-opt[data-s="done"]').click();
  const done = await page.evaluate(function () {
    var row = JSON.parse(localStorage.getItem('ap_appts') || '[]').filter(function (a) { return a.id === 'a1'; })[0];
    return row && row.status;
  });
  expect(done).toBe('done');

  await page.evaluate(function () {
    closeSheet('apptModal');
    editClientFromList('c1');
  });
  await expect(page.locator('#cbName')).toHaveValue('Hidi');
  const beforeCount = await page.locator('.cb-edit-card').count();
  await page.locator('.cb-edit-card[data-aid="a2"] [data-step="1"]').click();
  await page.locator('#cbSave').click();
  await page.waitForTimeout(200);
  const afterPencil = await page.evaluate(function () {
    var rows = JSON.parse(localStorage.getItem('ap_appts') || '[]');
    var audits = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf('ys_audit_') === 0 && k !== 'ys_audit_months') audits = audits.concat(JSON.parse(localStorage.getItem(k) || '[]'));
    }
    return {
      count: rows.length,
      date: rows.filter(function (a) { return a.id === 'a2'; })[0].date,
      edits: audits.filter(function (e) { return e.type === 'appointment.edit' && e.entityId === 'a2'; }).length
    };
  });
  expect(beforeCount).toBeGreaterThan(0);
  expect(afterPencil.count).toBe(2);
  expect(afterPencil.date).toBe('2026-11-05');
  expect(afterPencil.edits).toBe(1);

  await page.evaluate(function () { editClientFromBookings(); });
  await page.locator('.cb-edit-card[data-aid="a2"] [data-step="1"]').click();
  await page.locator('#cbSave').click();
  await page.waitForTimeout(200);
  const afterEdit = await page.evaluate(function () {
    var rows = JSON.parse(localStorage.getItem('ap_appts') || '[]');
    return { count: rows.length, date: rows.filter(function (a) { return a.id === 'a2'; })[0].date };
  });
  expect(afterEdit.count).toBe(2);
  expect(afterEdit.date).toBe('2026-11-06');
  expect(errors).toEqual([]);
});

test('the service pill reveals name and phone above the date, and a new booking saves', async ({ page }) => {
  const errors = watchErrors(page);
  await page.addInitScript(function () {
    localStorage.setItem('ap_prefs', JSON.stringify({ svcMode: 'hair', splitPct: 60 }));
    localStorage.setItem('combo_trade', 'hair');
    localStorage.setItem('ap_clients', JSON.stringify([{ id: 'c1', name: 'Hidi', phone: '555-0188', email: 'hidi@example.com' }]));
    localStorage.setItem('ap_appts', JSON.stringify([
      { id: 'a1', name: 'Hidi', phone: '555-0188', cid: 'c1', service: 'Cut', date: '2026-11-03', time: '10:00', dur: 60, price: 80, tip: 0, status: 'done' }
    ]));
  });
  await page.goto('/appt.html');
  await page.waitForTimeout(300);
  const hidden = await page.evaluate(function () {
    var sc = document.getElementById('tradeScreen');
    if (sc) sc.style.display = 'none';
    openAdd();
    var wrap = document.getElementById('clientFieldsWrap');
    return {
      shown: wrap.classList.contains('cfw-show'),
      height: wrap.getBoundingClientRect().height,
      pill: document.getElementById('chooseSvcHint').textContent
    };
  });
  expect(hidden.shown).toBe(false);
  expect(hidden.height).toBeLessThan(2);
  expect(hidden.pill).toContain('CHOOSE SERVICE');

  await page.locator('#chooseSvcHint').click();
  await page.waitForTimeout(900);
  const shown = await page.evaluate(function () {
    var wrap = document.getElementById('clientFieldsWrap');
    var name = document.getElementById('fName');
    var phone = document.getElementById('fPhone');
    var date = document.getElementById('fDate');
    return {
      open: wrap.classList.contains('cfw-show'),
      height: wrap.getBoundingClientRect().height,
      nameSeen: name.getBoundingClientRect().height > 0,
      phoneSeen: phone.getBoundingClientRect().height > 0,
      nameAbove: name.getBoundingClientRect().top < date.getBoundingClientRect().top
    };
  });
  expect(shown.open).toBe(true);
  expect(shown.height).toBeGreaterThan(40);
  expect(shown.nameSeen).toBe(true);
  expect(shown.phoneSeen).toBe(true);
  expect(shown.nameAbove).toBe(true);

  await page.evaluate(function () { clientId = 'c1'; bookAgain(); });
  await page.waitForTimeout(900);
  const filled = await page.evaluate(function () {
    var wrap = document.getElementById('clientFieldsWrap');
    return {
      name: document.getElementById('fName').value,
      phone: document.getElementById('fPhone').value,
      seen: wrap.classList.contains('cfw-show') && wrap.getBoundingClientRect().height > 40
    };
  });
  expect(filled.name).toBe('Hidi');
  expect(filled.phone).toBe('555-0188');
  expect(filled.seen).toBe(true);

  const saved = await page.evaluate(function () {
    openAdd();
    _revealClientFields();
    document.getElementById('fName').value = 'Nia Cole';
    document.getElementById('fPhone').value = '555-0144';
    document.getElementById('fService').value = 'Cut';
    document.getElementById('fTime').value = '11:00';
    document.getElementById('fPrice').value = '40';
    commitSave();
    var rows = JSON.parse(localStorage.getItem('ap_appts') || '[]');
    return rows.filter(function (a) { return a.name === 'Nia Cole'; }).map(function (a) {
      return { phone: a.phone, service: a.service, date: a.date };
    });
  });
  expect(saved.length).toBe(1);
  expect(saved[0].phone).toBe('555-0144');
  expect(saved[0].service).toBe('Cut');
  expect(saved[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(errors).toEqual([]);
});

test('editing a phone does not duplicate the client, and delete keeps Done work', async ({ page }) => {
  const errors = watchErrors(page);
  await page.addInitScript(function () {
    localStorage.setItem('ap_prefs', JSON.stringify({ svcMode: 'hair', splitPct: 60 }));
    localStorage.setItem('combo_trade', 'hair');
    localStorage.setItem('ap_clients', JSON.stringify([{ id: 'c1', name: 'Hidi', phone: '555-0188' }]));
    localStorage.setItem('ap_appts', JSON.stringify([
      { id: 'done1', name: 'Hidi', phone: '555-0188', cid: 'c1', service: 'Cut', date: '2026-11-03', time: '10:00', price: 80, tip: 0, status: 'done' },
      { id: 'soon1', name: 'Hidi', phone: '555-0188', cid: 'c1', service: 'Color', date: '2026-11-21', time: '15:00', price: 90, tip: 0, status: 'confirmed' }
    ]));
  });
  await page.goto('/appt.html');
  await page.evaluate(function () {
    var sc = document.getElementById('tradeScreen');
    if (sc) sc.style.display = 'none';
    editClientFromList('c1');
  });
  await expect(page.locator('#cbDelete')).toBeVisible();
  await page.locator('#cbPhone').fill('555-0199');
  await page.locator('#cbSave').click();
  await page.waitForTimeout(300);
  const edited = await page.evaluate(function () {
    var clients = JSON.parse(localStorage.getItem('ap_clients') || '[]');
    var appts = JSON.parse(localStorage.getItem('ap_appts') || '[]');
    var audits = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf('ys_audit_') === 0 && k !== 'ys_audit_months') audits = audits.concat(JSON.parse(localStorage.getItem(k) || '[]'));
    }
    return {
      clients: clients.length,
      phones: appts.map(function (a) { return a.phone; }),
      audit: audits.some(function (e) { return e.type === 'client.edit' && e.after && e.after.phone === '555-0199' && e.before && e.before.phone === '555-0188'; })
    };
  });
  expect(edited.clients).toBe(1);
  expect(edited.phones).toEqual(['555-0199', '555-0199']);
  expect(edited.audit).toBe(true);

  await page.evaluate(function () { openClientBookings('c1'); });
  await page.locator('#cbDelete').click();
  await expect(page.locator('#cfCheck')).toBeVisible();
  await page.locator('#cfYes').click();
  await page.waitForTimeout(200);
  const kept = await page.evaluate(function () {
    return {
      clients: JSON.parse(localStorage.getItem('ap_clients') || '[]').length,
      ids: JSON.parse(localStorage.getItem('ap_appts') || '[]').map(function (a) { return a.id; })
    };
  });
  expect(kept.clients).toBe(0);
  expect(kept.ids).toContain('done1');
  expect(kept.ids).toContain('soon1');

  await page.evaluate(function () {
    var clients = JSON.parse(localStorage.getItem('ap_clients') || '[]');
    clients.push({ id: 'c1', name: 'Hidi', phone: '555-0199' });
    localStorage.setItem('ap_clients', JSON.stringify(clients));
  });
  await page.reload();
  await page.waitForTimeout(400);
  const afterMerge = await page.evaluate(function () {
    showView('clients');
    return JSON.parse(localStorage.getItem('ap_clients') || '[]').length;
  });
  expect(afterMerge).toBe(0);
  expect(errors).toEqual([]);
});

test('the client repair leaves one of each person and $287 owed', async ({ page }) => {
  const errors = watchErrors(page);
  const payAt = new Date(2026, 10, 10, 12).getTime();
  const beforeDone = new Date(2026, 10, 9, 12).getTime();
  await page.addInitScript(function (seed) {
    if (localStorage.getItem('ys_smoke_repair_seed') === '1') return;
    localStorage.setItem('ap_prefs', JSON.stringify({ svcMode: 'hair', splitPct: 60 }));
    localStorage.setItem('cp_unlocked', '1');
    localStorage.setItem('cp_prefs', JSON.stringify({ trade: 'hair', tourDone: true, rate: 100 }));
    localStorage.setItem('cp_payments', JSON.stringify([{ id: 'p', amountCents: 26800, date: '2026-11-10', createdAt: seed.payAt, voided: false }]));
    localStorage.setItem('cp_appts', JSON.stringify(seed.money));
    localStorage.setItem('ap_clients', JSON.stringify(seed.clients));
    localStorage.setItem('ap_appts', JSON.stringify(seed.appts));
    localStorage.setItem('ys_tombstones', JSON.stringify(seed.tombs));
    localStorage.setItem('ys_smoke_repair_seed', '1');
  }, {
    payAt: payAt,
    money: [
      // $236 of other finished work, minus Kori's done cut ($24) and Azita's cut plus tip ($55), which are real rows in ap_appts. Abbas's restored $24 is not in this stand-in. With Ronak, Nick, and Hidi that is $351 before the $268 payment.
      { id: 'older', name: 'Older', date: '2026-10-01', time: '09:00', charge: 157, tip: 0, status: 'done', splitPct: 100, splitFrozen: true, doneAt: beforeDone, cat: 'Hair' },
      { id: 'ronak', name: 'Ronak', date: '2026-10-30', time: '11:00', charge: 21, tip: 0, status: 'done', splitPct: 100, splitFrozen: true, doneAt: beforeDone, cat: 'Hair' },
      { id: 'nick', name: 'Nick Webb', date: '2026-11-03', time: '10:00', charge: 15, tip: 0, status: 'done', splitPct: 100, splitFrozen: true, doneAt: beforeDone, cat: 'Hair' },
      { id: 'hidi', name: 'Hidi', date: '2026-11-03', time: '15:00', charge: 55, tip: 0, status: 'done', splitPct: 100, splitFrozen: true, doneAt: beforeDone, cat: 'Hair' },
      { id: 'june', name: 'June', date: '2026-11-12', time: '10:00', charge: 204, tip: 0, status: 'done', splitPct: 100, splitFrozen: true, doneAt: payAt + 86400000, cat: 'Hair' }
    ],
    clients: [
      { id: 'mw15tezlauq7', name: 'Abbas', phone: '111' },
      { id: 'c179528581047886446', name: 'Abbas', phone: '2531425214' },
      { id: 'mw15ae9n8a7d', name: 'Kori', phone: '111' },
      { id: 'c179528576482889101', name: 'Kori', phone: '9495004779' },
      { id: 'mw15f85ogbl4', name: 'Joni', phone: '000' },
      { id: 'mwjvyy5qxjqo', name: 'Joni', phone: '999' },
      { id: 'c179503812995115368', name: 'Joni V', phone: '2213218523' },
      { id: 'mw15hleoew7i', name: 'Azita Mokhtari', phone: '111' },
      { id: 'c179528685177351426', name: 'Azita Mokhtari', phone: '0854561258' }
    ],
    appts: [
      { id: 'mw15ae9mlkxt', name: 'Kori', phone: '111', cid: 'mw15ae9n8a7d', status: 'done', date: '2026-10-02', time: '10:00', price: 40, tip: 0 },
      { id: 'mwqqpgzv7f6j', name: 'Kori', phone: '111', status: 'confirmed', date: '2026-11-21', time: '15:00', price: 40, tip: 0, service: 'Cut' },
      { id: 'mw15hleo4kf8', name: 'Azita Mokhtari', phone: '0854561258', cid: 'mw15hleoew7i', service: "Women's Haircut", date: '2026-10-17', time: '10:30', price: 75, tip: 10, status: 'done' }
    ],
    tombs: [{ id: 'tomb-ap_appt-mw15tezltj5a', entityType: 'ap_appt', entityId: 'mw15tezltj5a', at: 1000 }]
  });
  await page.goto('/appt.html');
  await page.waitForTimeout(400);
  const repaired = await page.evaluate(function () {
    var clients = JSON.parse(localStorage.getItem('ap_clients') || '[]');
    var appts = JSON.parse(localStorage.getItem('ap_appts') || '[]');
    function one(name) {
      return clients.filter(function (c) { return c.name === name && String(c.id).indexOf('c1795') !== 0 && c.id !== 'mwjvyy5qxjqo'; }).length;
    }
    return {
      abbas: one('Abbas'),
      kori: one('Kori'),
      joni: one('Joni V'),
      azita: one('Azita Mokhtari'),
      otherJoni: clients.filter(function (c) { return c.id === 'mwjvyy5qxjqo'; })[0].name,
      koriBooking: appts.filter(function (a) { return a.id === 'mwqqpgzv7f6j'; })[0].status,
      azitaPhone: appts.filter(function (a) { return a.id === 'mw15hleo4kf8'; })[0].phone,
      restored: appts.some(function (a) { return a.id === 'mw15tezltj5a' && a.meCents === 2400; }),
      repairAudit: (function () {
        var audits = [];
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && k.indexOf('ys_audit_') === 0 && k !== 'ys_audit_months') audits = audits.concat(JSON.parse(localStorage.getItem(k) || '[]'));
        }
        return audits.filter(function (e) { return e.summary === 'Repaired duplicate clients'; }).length;
      })()
    };
  });
  expect(repaired.abbas).toBe(1);
  expect(repaired.kori).toBe(1);
  expect(repaired.joni).toBe(1);
  expect(repaired.azita).toBe(1);
  expect(repaired.otherJoni).toBe('Joni');
  expect(repaired.koriBooking).toBe('confirmed');
  expect(repaired.azitaPhone).toBe('9492467660');
  expect(repaired.restored).toBe(true);
  expect(repaired.repairAudit).toBe(1);
  await page.goto('/app.html');
  await page.evaluate(function () { showTab('mgm'); });
  await page.waitForTimeout(400);
  const owed = await page.locator('#mgmOwed, #mgmSplitTotal, #rowDue, body').first().innerText();
  const body = await page.locator('body').innerText();
  expect(body).toContain('$83.00');
  expect(body).toContain('$204.00');
  expect(body).toContain('$287.00');
  expect(errors).toEqual([]);
});

async function fillNewBooking(page, person) {
  await page.evaluate(function (p) {
    var sc = document.getElementById('tradeScreen');
    if (sc) sc.style.display = 'none';
    openAdd();
    _revealClientFields();
    document.getElementById('fName').value = p.name;
    document.getElementById('fPhone').value = p.phone;
    document.getElementById('fService').value = p.service;
    document.getElementById('fDate').value = YS.nextYMD(todayStr());
    document.getElementById('fTime').value = p.time;
    document.getElementById('fPrice').value = p.price;
  }, person);
  await page.locator('button[onclick="saveAppt()"]').click();
}

async function expectQuickStatus(page, name) {
  await expect(page.locator('#apptModal')).toHaveClass(/show/);
  await expect(page.locator('#dName')).toHaveText(name);
  await expect(page.locator('#statusGrid .status-opt[data-s="done"]')).toHaveText('Done');
  await expect(page.locator('#statusGrid .status-opt[data-s="noshow"]')).toHaveText('No-show');
  await expect(page.locator('#statusGrid .status-opt[data-s="cancelled"]')).toHaveText('Cancelled');
}

test('a new booking on a fresh device opens the status sheet, and dismissing leaves it Confirmed', async ({ page }) => {
  const errors = watchErrors(page);
  await page.addInitScript(function () {
    localStorage.setItem('ap_prefs', JSON.stringify({ svcMode: 'hair', splitPct: 60 }));
    localStorage.setItem('combo_trade', 'hair');
  });
  await page.goto('/appt.html');
  await page.waitForTimeout(300);
  await fillNewBooking(page, { name: 'Nia Cole', phone: '555-0144', service: 'Cut', time: '11:00', price: '40' });
  await expectQuickStatus(page, 'Nia Cole');
  await page.locator('#apptModal button[onclick="closeSheet(\'apptModal\')"]').click();
  await expect(page.locator('#apptModal')).not.toHaveClass(/show/);
  await expect(page.locator('.appt-tap')).toHaveText('Tap to mark Done');
  const kept = await page.evaluate(function () {
    return JSON.parse(localStorage.getItem('ap_appts') || '[]').filter(function (a) { return a.name === 'Nia Cole'; }).map(function (a) { return a.status; });
  });
  expect(kept).toEqual(['confirmed']);

  await page.locator('.appt.confirmed').click();
  await page.locator('#apptModal button[onclick="editFromSheet()"]').click();
  await page.locator('button[onclick="saveAppt()"]').click();
  await expect(page.locator('#apptModal')).not.toHaveClass(/show/);
  const afterEdit = await page.evaluate(function () {
    var rows = JSON.parse(localStorage.getItem('ap_appts') || '[]').filter(function (a) { return a.name === 'Nia Cole'; });
    return { count: rows.length, status: rows[0] && rows[0].status };
  });
  expect(afterEdit.count).toBe(1);
  expect(afterEdit.status).toBe('confirmed');
  expect(errors).toEqual([]);
});

test('a new booking on a device that already has data opens the status sheet, and Done shows in Earnings', async ({ page }) => {
  const errors = watchErrors(page);
  await page.addInitScript(function () {
    if (localStorage.getItem('ys_smoke_status_seed') === '1') return;
    localStorage.setItem('ap_prefs', JSON.stringify({ svcMode: 'hair', splitPct: 60 }));
    localStorage.setItem('combo_trade', 'hair');
    localStorage.setItem('cp_unlocked', '1');
    localStorage.setItem('cp_prefs', JSON.stringify({ trade: 'hair', tourDone: true, rate: 60 }));
    localStorage.setItem('ap_clients', JSON.stringify([{ id: 'c1', name: 'Hidi', phone: '555-0188' }]));
    localStorage.setItem('ap_appts', JSON.stringify([
      { id: 'a1', name: 'Hidi', phone: '555-0188', cid: 'c1', service: 'Color', date: '2026-12-01', time: '10:00', price: 90, tip: 0, status: 'confirmed' }
    ]));
    localStorage.setItem('ys_smoke_status_seed', '1');
  });
  await page.goto('/appt.html');
  await page.waitForTimeout(300);
  await fillNewBooking(page, { name: 'June Park', phone: '555-0177', service: 'Cut', time: '15:00', price: '40' });
  await expectQuickStatus(page, 'June Park');
  await page.locator('#statusGrid .status-opt[data-s="done"]').click();
  const marked = await page.evaluate(function () {
    var rows = JSON.parse(localStorage.getItem('ap_appts') || '[]');
    return {
      june: rows.filter(function (a) { return a.name === 'June Park'; })[0].status,
      hidi: rows.filter(function (a) { return a.id === 'a1'; })[0].status,
      count: rows.length
    };
  });
  expect(marked.june).toBe('done');
  expect(marked.hidi).toBe('confirmed');
  expect(marked.count).toBe(2);
  await page.goto('/app.html');
  await page.evaluate(function () { showTab('hist'); });
  await expect(page.locator('#pHist')).toContainText('June Park');
  await page.evaluate(function () { showTab('mgm'); });
  await expect(page.locator('#pMgm')).toContainText('$24.00');
  expect(errors).toEqual([]);
});

test('editing a self-booked price sticks on the pending list, the booking, and Earnings', async ({ page }) => {
  const errors = watchErrors(page);
  await page.addInitScript(function () {
    if (localStorage.getItem('ys_smoke_price_seed') === '1') return;
    localStorage.setItem('ys_smoke_price_seed', '1');
    localStorage.setItem('cp_unlocked', '1');
    localStorage.setItem('ap_prefs', JSON.stringify({ svcMode: 'hair', splitPct: 60, bookingOpen: true }));
    localStorage.setItem('cp_prefs', JSON.stringify({ trade: 'hair', tourDone: true, rate: 60, prices: { "Men's Haircut": 55 } }));
    localStorage.setItem('ap_appts', JSON.stringify([
      { id: 'hidi1', name: 'Hidi', phone: '555-0188', service: 'Color', date: '2026-11-03', time: '11:00', dur: 60, price: 80, tip: 0, status: 'done' }
    ]));
  });
  await page.goto('/appt.html');
  await page.waitForTimeout(300);
  const saved = await page.evaluate(function () {
    var req = { _id: 'req-ronak', name: 'Ronak', phone: '555-1111', service: "Men's Haircut", date: '2026-11-29', time: '10:00', dur: 60, price: 0, status: 'pending' };
    _apR = req;
    var inp = document.getElementById('apPriceInput');
    inp.value = '35';
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    inp.value = '55';
    confirmApprovePrice();
    _approved = {};
    commitApproved({ _id: 'req-ronak', name: 'Ronak', phone: '555-1111', service: "Men's Haircut", date: '2026-11-29', time: '10:00', dur: 60, price: 0, status: 'pending' }, true);
    var rows = JSON.parse(localStorage.getItem('ap_appts') || '[]');
    var ronak = rows.filter(function (a) { return a.name === 'Ronak'; });
    var hidi = rows.filter(function (a) { return a.id === 'hidi1'; })[0];
    fbUser = { uid: 'owner' };
    fbReady = true;
    pendingReqs = [req];
    renderRequests();
    var card = document.getElementById('reqList').innerText;
    if (ronak[0]) setApptStatusById(ronak[0].id, 'done');
    rows = JSON.parse(localStorage.getItem('ap_appts') || '[]');
    ronak = rows.filter(function (a) { return a.name === 'Ronak'; });
    hidi = rows.filter(function (a) { return a.id === 'hidi1'; })[0];
    return {
      count: ronak.length,
      price: ronak[0] && ronak[0].price,
      status: ronak[0] && ronak[0].status,
      hidiPrice: hidi && hidi.price,
      hidiStatus: hidi && hidi.status,
      card: card
    };
  });
  expect(saved.count).toBe(1);
  expect(saved.price).toBe(35);
  expect(saved.status).toBe('done');
  expect(saved.hidiPrice).toBe(80);
  expect(saved.hidiStatus).toBe('done');
  expect(saved.card).toContain('Ronak');
  expect(saved.card).toContain('$35');
  expect(saved.card).not.toContain('$55');
  await page.goto('/app.html');
  await page.evaluate(function () { showTab('hist'); });
  const hist = await page.locator('#tableView').innerText();
  expect(hist).toContain('Ronak');
  expect(hist).toContain('$35.00');
  expect(hist).toContain('Hidi');
  expect(hist).toContain('$80.00');
  expect(hist).not.toContain('$55.00');
  expect(errors).toEqual([]);
});
