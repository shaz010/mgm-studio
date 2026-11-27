/* Permanent: a self-booking still creates the pending request that texts
   the owner before he opens the app, and the in-app wording stays put.
   Run: node yoursalon-request-text.test.js */
'use strict';

var assert = require('assert');
var fs = require('fs');

var book = fs.readFileSync(__dirname + '/book.html', 'utf8');
var appt = fs.readFileSync(__dirname + '/appt.html', 'utf8');
var salon = fs.readFileSync(__dirname + '/salon.html', 'utf8');

var sendAt = book.indexOf('function _sendRec(rec)');
assert.ok(sendAt > 0, '_sendRec still creates the booking request');
var sendFn = book.slice(sendAt, book.indexOf('function submitBooking()'));
assert.ok(sendFn.indexOf("db.collection('requests').doc()") > 0, 'the request document is still created');
assert.ok(sendFn.indexOf('batch.set(ref, rec)') > 0, 'the request body is still written');
assert.ok(book.indexOf("status:'pending'") > 0, 'a new self-booking is still pending');
assert.ok(book.indexOf('name:name,phone:phone,service:svcStr') > 0, 'name, phone, and service stay on the request');
assert.ok(book.indexOf('date:selDate,time:time') > 0, 'date and time stay on the request');
assert.ok(book.indexOf('PERMANENT:') > 0, 'the permanent request-notice marker stays above the write');

var banner = 'New booking request — tap to review';
var plural = 'booking requests waiting — tap to review';
assert.ok(appt.indexOf(banner) > 0, 'appointments keeps the request banner wording');
assert.ok(appt.indexOf(plural) > 0, 'appointments keeps the plural banner wording');
assert.ok(salon.indexOf(banner) > 0, 'the shell keeps the request banner wording');
assert.ok(salon.indexOf(plural) > 0, 'the shell keeps the plural banner wording');
assert.ok(appt.indexOf("salon:'newRequest'") > 0, 'a new request is still reported to the shell');
assert.ok(appt.indexOf('function listenRequests()') > 0, 'the pending-request listener stays');
assert.ok(appt.indexOf(".where('status','==','pending')") > 0, 'the listener still watches pending requests');
assert.ok(salon.indexOf("localStorage.setItem('cp_unlocked','1')") > 0, 'the five-tap owner unlock stays');

console.log('ok  self-booking request text stays');
