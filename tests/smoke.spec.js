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
