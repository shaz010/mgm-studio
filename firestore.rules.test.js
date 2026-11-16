'use strict';

const fs = require('fs');
const { readFileSync } = fs;
const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} = require('@firebase/rules-unit-testing');
const {
  doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc,
  collection, query, where, getDocs, Timestamp, deleteField,
} = require('firebase/firestore');

const OWNER = 'owner-uid';
const OTHER = 'other-uid';

function validRequest(extra) {
  return Object.assign({
    salon: 'mgm-studio',
    name: 'Ada',
    phone: '555-0101',
    service: 'Cut',
    date: '2026-11-16',
    time: '10:00',
    dur: 60,
    price: 0,
    notes: '',
    hair: '',
    hairData: null,
    custom: false,
    customTime: '',
    customSvc: false,
    status: 'pending',
    createdAt: Date.now(),
    consent: { agreed: true, agreedAt: Date.now(), conditions: [], notes: '' },
  }, extra || {});
}

let env;

async function setup() {
  env = await initializeTestEnvironment({
    projectId: 'demo-yoursalon',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
}

function db(uid) {
  return (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).firestore();
}

const checks = [];
function check(name, fn) {
  checks.push({ name, fn });
}

check('owner reads and writes only their users document', async () => {
  const mine = doc(db(OWNER), 'users', OWNER);
  await assertSucceeds(setDoc(mine, { keys: { cp_appts: { v: '[]', t: 1 } }, updatedAt: 1 }));
  await assertSucceeds(getDoc(mine));
  await assertFails(getDoc(doc(db(OWNER), 'users', OTHER)));
  await assertFails(setDoc(doc(db(OWNER), 'users', OTHER), { keys: {} }));
  await assertFails(getDoc(doc(db(null), 'users', OWNER)));
  await assertFails(deleteDoc(doc(db(null), 'users', OWNER)));
  await assertSucceeds(deleteDoc(mine));
});

check('anonymous visitor can read a public salon profile and cannot write it', async () => {
  await assertSucceeds(setDoc(doc(db(OWNER), 'public', 'mgm-studio'), {
    salonName: 'Your Salon', bookingOpen: true, hours: [], services: ['Cut'], updatedAt: 1,
  }));
  await assertSucceeds(getDoc(doc(db(null), 'public', 'mgm-studio')));
  await assertFails(setDoc(doc(db(null), 'public', 'mgm-studio'), { salonName: 'Hijack' }));
  await assertFails(updateDoc(doc(db(null), 'public', 'mgm-studio'), { bookingOpen: false }));
});

check('an existing secret left in place does not block the owner from publishing', async () => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'public', 'mgm-studio'), {
      salonName: 'Old', bookingOpen: true, stripeSk: 'sk_live_already_there',
    });
  });
  await assertSucceeds(updateDoc(doc(db(OWNER), 'public', 'mgm-studio'), {
    salonName: 'Your Salon', bookingOpen: true, updatedAt: 3,
  }));
  const snap = await getDoc(doc(db(null), 'public', 'mgm-studio'));
  if (snap.data().stripeSk !== 'sk_live_already_there') throw new Error('secret field was rewritten');
});

check('owner can clear stored Stripe fields and cannot write them back', async () => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'public', 'mgm-studio'), {
      salonName: 'Old', bookingOpen: true, stripeSk: 'sk_live_already_there', stripePk: 'pk_live_already',
    });
  });
  await assertSucceeds(updateDoc(doc(db(OWNER), 'public', 'mgm-studio'), {
    salonName: 'Your Salon',
    bookingOpen: true,
    updatedAt: 4,
    stripeSk: deleteField(),
    stripePk: deleteField(),
  }));
  const snap = await getDoc(doc(db(null), 'public', 'mgm-studio'));
  if (snap.data().stripeSk) throw new Error('stripeSk still present');
  if (snap.data().stripePk) throw new Error('stripePk still present');
  await assertFails(updateDoc(doc(db(OWNER), 'public', 'mgm-studio'), { stripeSk: 'sk_live_new' }));
  await assertFails(updateDoc(doc(db(OWNER), 'public', 'mgm-studio'), { stripePk: 'pk_live_new' }));
});

check('nobody can write a Stripe secret onto a public salon doc', async () => {
  await assertFails(setDoc(doc(db(OWNER), 'public', 'mgm-studio'), {
    salonName: 'Your Salon', stripeSk: 'sk_live_should_not_be_stored',
  }));
  await assertSucceeds(setDoc(doc(db(OWNER), 'public', 'mgm-studio'), {
    salonName: 'Your Salon', bookingOpen: true, updatedAt: 2,
  }));
  await assertFails(updateDoc(doc(db(OWNER), 'public', 'mgm-studio'), { stripeSk: 'sk_test_nope' }));
  await assertFails(setDoc(doc(db(null), 'public', 'mgm-studio'), { stripeSk: 'sk_live_nope' }));
});

check('visitor can create a valid booking request and cannot create a privileged one', async () => {
  const ref = await assertSucceeds(addDoc(collection(db(null), 'requests'), validRequest()));
  await assertFails(addDoc(collection(db(null), 'requests'), validRequest({ status: 'approved' })));
  await assertFails(addDoc(collection(db(null), 'requests'), validRequest({ stripeSk: 'sk_live_nope' })));
  await assertFails(addDoc(collection(db(null), 'requests'), validRequest({ extra: true })));
  await assertFails(addDoc(collection(db(null), 'requests'), validRequest({ name: '' })));
  await assertFails(updateDoc(ref, { status: 'approved' }));
  await assertFails(deleteDoc(ref));
  await assertSucceeds(getDoc(ref));
});

check('visitor can list only pending requests; the owner can list and close them', async () => {
  const pending = await addDoc(collection(db(null), 'requests'), validRequest());
  await assertSucceeds(setDoc(doc(db(OWNER), 'requests', 'old-one'), validRequest({ status: 'pending' })));
  await updateAsOwnerApproved('old-one');
  const pendingQ = query(collection(db(null), 'requests'), where('salon', '==', 'mgm-studio'), where('status', '==', 'pending'));
  await assertSucceeds(getDocs(pendingQ));
  const allQ = query(collection(db(null), 'requests'), where('salon', '==', 'mgm-studio'));
  await assertFails(getDocs(allQ));
  await assertSucceeds(getDocs(query(collection(db(OWNER), 'requests'), where('salon', '==', 'mgm-studio'))));
  await assertSucceeds(updateDoc(doc(db(OWNER), 'requests', pending.id), { status: 'approved' }));
  await assertSucceeds(updateDoc(doc(db(OWNER), 'requests', pending.id), { status: 'declined', declinedAt: Date.now() }));
  await assertSucceeds(updateDoc(doc(db(OWNER), 'requests', pending.id), { status: 'dismissed', dismissedAt: Date.now() }));
  await assertFails(updateDoc(doc(db(OWNER), 'requests', pending.id), { phone: '555-0199' }));
});

async function updateAsOwnerApproved(id) {
  await updateDoc(doc(db(OWNER), 'requests', id), { status: 'approved' });
}

check('paywall logs can be created and cannot be read back', async () => {
  const now = Timestamp.now();
  await assertSucceeds(addDoc(collection(db(null), 'trial_requests'), {
    requestedAt: now, app: 'CommissionPro', ua: 'test',
  }));
  await assertFails(getDocs(collection(db(null), 'trial_requests')));
  await assertSucceeds(addDoc(collection(db(null), 'founder_unlocks'), {
    code: 'hash', at: now, app: 'CommissionPro',
  }));
  await assertFails(getDocs(collection(db(null), 'founder_unlocks')));
  await assertSucceeds(addDoc(collection(db(null), 'trial_activations'), {
    code: 'hash', at: now, app: 'CommissionPro',
  }));
  await assertFails(getDoc(doc(db(null), 'trial_activations', 'nope')));
});

check('everything else is denied', async () => {
  await assertFails(getDoc(doc(db(null), 'telemetry', 'x')));
  await assertFails(setDoc(doc(db(OWNER), 'telemetry', 'x'), { a: 1 }));
  await assertFails(getDocs(collection(db(null), 'public')));
});

(async () => {
  await setup();
  let failed = 0;
  for (const c of checks) {
    await env.clearFirestore();
    try {
      await c.fn();
      console.log('ok  ' + c.name);
    } catch (e) {
      failed++;
      console.error('FAIL ' + c.name);
      console.error(e && e.stack || e);
    }
  }
  await env.cleanup();
  if (failed) {
    console.error('\n' + failed + ' failed');
    process.exit(1);
  }
  console.log('\nall rules checks passed');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
