import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { coverageMessage } from '../flow.js';

const root = new URL('../', import.meta.url);
const endpoint = 'https://script.google.com/macros/s/fixture-deployment/exec';
const savedId = '2847ddf4-6dde-45d8-94f7-7e3fe25bf888';
const offer = { amountMinor: 12345, currency: 'USD', title: 'Sample package', checkoutUrl: 'https://payments-na1.hubspot.com/payments/sample-link' };
let moduleId = 0;

// This fixture exercises the application listeners without a browser or network.
// Read actual initial attributes so hidden/disabled/progress markup is tested too.
async function application(t, { fetcher, savedRequest } = {}) {
  const html = await fs.readFile(new URL('index.html', root), 'utf8');
  const source = await fs.readFile(new URL('app.js', root), 'utf8');
  const globals = ['document', 'window', 'localStorage', 'sessionStorage', 'FormData', 'fetch', 'CustomEvent'];
  const previous = new Map(globals.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  t.after(() => {
    for (const [name, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  });

  let activeElement;
  class Element {
    constructor(attributes = '') {
      this.attributes = new Map();
      for (const match of attributes.matchAll(/([^\s=]+)(?:="([^"]*)")?/g)) this.attributes.set(match[1], match[2] ?? '');
      this.hidden = this.attributes.has('hidden');
      this.disabled = this.attributes.has('disabled');
      this.checked = this.attributes.has('checked');
      this.value = this.attributes.get('value') || '';
      this.textContent = '';
      this.listeners = new Map();
    }
    addEventListener(type, callback) { this.listeners.set(type, [...this.listeners.get(type) || [], callback]); }
    async emit(type) {
      const event = { target: this, preventDefault() {} };
      for (const callback of this.listeners.get(type) || []) await callback(event);
    }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    getAttribute(name) { return this.attributes.get(name) ?? null; }
    removeAttribute(name) { this.attributes.delete(name); }
    hasAttribute(name) { return this.attributes.has(name); }
    toggleAttribute(name, force) { if (force) this.attributes.set(name, ''); else this.attributes.delete(name); }
    set href(value) { this.attributes.set('href', value); }
    get href() { return this.attributes.get('href') || ''; }
    focus() { activeElement = this; }
    scrollIntoView() {}
  }
  const elements = new Map();
  for (const match of html.matchAll(/<[a-z][a-z0-9-]*\b([^>]*\bid="([^"]+)"[^>]*)>/gi)) elements.set(match[2], new Element(match[1]));
  const radios = [...html.matchAll(/<input\b([^>]*\bname="medicare-coverage"[^>]*)>/g)].map(match => new Element(match[1]));
  const get = id => {
    assert.ok(elements.has(id), `Missing application element: ${id}`);
    return elements.get(id);
  };
  get('submit-label').textContent = 'See Your Exclusive Price';
  get('request-form').reset = () => {
    for (const id of ['name', 'phone', 'email', 'state', 'website']) get(id).value = '';
    get('consent').checked = false;
  };
  const storage = initial => {
    const values = new Map(initial);
    return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) };
  };
  const local = storage(savedRequest ? [['rove6:private-offer:v1', savedRequest]] : []);
  const session = storage([]);
  const requests = [], events = [];
  Object.assign(globalThis, {
    document: { documentElement: { dataset: {} }, getElementById: get, querySelectorAll: selector => {
      assert.equal(selector, 'input[name="medicare-coverage"]');
      return radios;
    } },
    window: { dispatchEvent: event => events.push(event) },
    localStorage: local,
    sessionStorage: session,
    FormData: class {
      constructor() { this.values = ['name', 'phone', 'email', 'state', 'website'].map(id => [id, get(id).value]); }
      [Symbol.iterator]() { return this.values[Symbol.iterator](); }
    },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
    fetch: async (url, options) => {
      const payload = JSON.parse(options.body);
      requests.push({ url, payload });
      const result = fetcher ? await fetcher(payload) : { ok: true, requestId: payload.requestId, offer };
      return { ok: true, json: async () => result };
    }
  });
  const executable = source
    .replace(/import\s*\{\s*config\s*\}\s*from\s*'\.\/config\.js';/, `const config = ${JSON.stringify({ requestEndpoint: endpoint })};`)
    .replace(/from '(\.\/[^']+)'/g, (_match, path) => `from '${new URL(path, root).href}'`);
  await import(`data:text/javascript;base64,${Buffer.from(executable + `\n// fixture ${++moduleId}`).toString('base64')}`);
  const settle = () => new Promise(resolve => setImmediate(resolve));
  await settle();
  return {
    get, radios, requests, events, local, session, settle,
    get activeElement() { return activeElement; },
    async choose(answer) {
      const selected = radios.find(input => input.value === answer);
      assert.ok(selected, `Missing coverage option: ${answer}`);
      for (const input of radios) input.checked = input === selected;
      await selected.emit('change');
    },
    fillContact() {
      for (const [id, value] of Object.entries({ name: 'Sample Request', phone: '(202) 555-0123', email: 'sample+offer@example.com', state: 'FL' })) get(id).value = value;
      get('consent').checked = true;
    }
  };
}

function currentStep(app, step) {
  for (const [index, name] of ['coverage', 'price', 'order'].entries()) {
    assert.equal(app.get('progress-' + name).getAttribute('aria-current'), index === step ? 'step' : null);
    assert.equal(app.get('progress-' + name).hasAttribute('data-complete'), index < step);
  }
}

test('each Medicare answer shows its guidance before contact details and supports changing the answer', async t => {
  const app = await application(t);
  currentStep(app, 0);
  assert.equal(app.get('coverage-next').disabled, true);
  await app.get('coverage-next').emit('click');
  assert.equal(app.get('form-content').hidden, true);
  for (const answer of ['yes', 'no', 'unsure']) {
    await app.choose(answer);
    assert.equal(app.get('coverage-guidance').hidden, false);
    assert.equal(app.get('coverage-guidance-title').textContent, coverageMessage(answer).heading);
    assert.equal(app.get('coverage-guidance-copy').textContent, coverageMessage(answer).body);
    assert.equal(app.get('coverage-next').disabled, false);
    await app.get('coverage-next').emit('click');
    assert.equal(app.get('coverage-step').hidden, true);
    assert.equal(app.get('form-content').hidden, false);
    assert.equal(app.activeElement, app.get('name'));
    currentStep(app, 1);
    await app.get('back-to-coverage').emit('click');
    assert.equal(app.get('coverage-step').hidden, false);
    assert.equal(app.radios.find(input => input.value === answer).checked, true);
    currentStep(app, 0);
  }
  assert.equal(app.requests.length, 0);
});

test('contact submission cannot bypass the coverage question', async t => {
  const app = await application(t);
  app.fillContact();
  await app.get('request-form').emit('submit');
  assert.equal(app.requests.length, 0);
  assert.equal(app.get('form-success').hidden, true);
  assert.equal(app.get('private-offer').hidden, true);
  currentStep(app, 0);
});

test('an in-flight or failed save preserves the details step and never reveals an offer', async t => {
  let finishSave;
  const response = new Promise(resolve => { finishSave = resolve; });
  const app = await application(t, { fetcher: () => response });
  await app.choose('yes');
  await app.get('coverage-next').emit('click');
  app.fillContact();
  const saving = app.get('request-form').emit('submit');
  assert.equal(app.requests.length, 1);
  assert.equal(app.get('back-to-coverage').disabled, true);
  assert.equal(app.get('submit-button').disabled, true);
  await app.get('back-to-coverage').emit('click');
  assert.equal(app.get('coverage-step').hidden, true);
  await app.get('request-form').emit('submit');
  assert.equal(app.requests.length, 1);
  finishSave({ ok: false, message: 'Unable to save your request.' });
  await saving;
  assert.equal(app.get('back-to-coverage').disabled, false);
  assert.equal(app.get('submission-error').hidden, false);
  assert.match(app.get('submission-error').textContent, /Unable to save/);
  assert.equal(app.get('form-success').hidden, true);
  assert.equal(app.get('private-offer').hidden, true);
  assert.equal(app.get('offer-checkout').href, '');
  assert.equal(app.events.length, 0);
  assert.equal(app.local.values.size, 0);
  currentStep(app, 1);
});

test('a confirmed save reveals the offer without transmitting or storing the coverage answer', async t => {
  const app = await application(t);
  await app.choose('yes');
  await app.get('coverage-next').emit('click');
  app.fillContact();
  await app.get('request-form').emit('submit');
  const [{ url, payload }] = app.requests;
  assert.equal(url, endpoint);
  assert.deepEqual(Object.keys(payload).sort(), ['requestId', 'name', 'phone', 'email', 'state', 'consent', 'consentText', 'contactPreference', 'market', 'variant', 'website', 'startedAt'].sort());
  assert.equal(payload.market, 'florida');
  assert.equal(payload.variant, 'florida');
  assert.equal(app.get('form-success').hidden, false);
  assert.equal(app.get('private-offer').hidden, false);
  assert.equal(app.get('offer-price').textContent, '$123.45');
  assert.equal(app.get('confirmation-coverage-copy').textContent, coverageMessage('yes').body);
  const checkout = new URL(app.get('offer-checkout').href);
  assert.deepEqual([...checkout.searchParams], [['email', 'sample+offer@example.com']]);
  assert.deepEqual([...app.local.values], [['rove6:private-offer:v1', payload.requestId]]);
  assert.deepEqual(JSON.parse(app.session.getItem('rove6:checkout-email:v1')), { requestId: payload.requestId, email: payload.email });
  assert.deepEqual(app.events.map(event => event.detail), [{ event: 'rove6_request_saved', market: 'florida', variant: 'florida' }]);
  currentStep(app, 2);
});

test('reset clears the answer, guidance, contact fields, and saved checkout state', async t => {
  const app = await application(t);
  await app.choose('no');
  await app.get('coverage-next').emit('click');
  app.fillContact();
  await app.get('request-form').emit('submit');
  app.fillContact(); // Reset must also clear any subsequently restored form values.
  await app.get('reset-form').emit('click');
  assert.equal(app.get('coverage-step').hidden, false);
  assert.equal(app.get('form-content').hidden, true);
  assert.equal(app.get('form-success').hidden, true);
  assert.equal(app.get('coverage-guidance').hidden, true);
  assert.equal(app.get('confirmation-coverage').hidden, true);
  assert.equal(app.get('coverage-next').disabled, true);
  assert.ok(app.radios.every(input => !input.checked));
  for (const id of ['name', 'phone', 'email', 'state']) assert.equal(app.get(id).value, '');
  assert.equal(app.get('consent').checked, false);
  assert.equal(app.local.values.size, 0);
  assert.equal(app.session.values.size, 0);
  assert.equal(app.get('offer-checkout').href, '');
  currentStep(app, 0);
});

test('resuming a saved offer uses neutral coverage information and creates no second lead event', async t => {
  const app = await application(t, { savedRequest: savedId });
  assert.deepEqual(app.requests.map(request => request.payload), [{ action: 'resume', requestId: savedId }]);
  assert.equal(app.get('form-success').hidden, false);
  assert.equal(app.get('confirmation-coverage-copy').textContent, coverageMessage('unsure').body);
  assert.equal(app.get('private-offer').hidden, false);
  assert.equal(new URL(app.get('offer-checkout').href).searchParams.has('email'), false);
  assert.equal(app.events.length, 0);
  assert.ok(app.radios.every(input => !input.checked));
  currentStep(app, 2);
});
