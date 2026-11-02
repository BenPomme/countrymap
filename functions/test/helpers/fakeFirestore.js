'use strict';

function clone(value) {
  if (value === undefined) return undefined;
  return structuredClone(value);
}

function mergeData(existing, patch) {
  return { ...(existing || {}), ...clone(patch) };
}

class FakeDocRef {
  constructor(db, path) {
    this.db = db;
    this.path = path;
    this.id = path.split('/').pop();
  }

  async get() {
    return this.db._snapshot(this.path);
  }

  collection(name) {
    return new FakeCollectionRef(this.db, `${this.path}/${name}`);
  }

  async set(data, options = {}) {
    const existing = this.db.store.get(this.path);
    this.db.store.set(this.path, options.merge ? mergeData(existing, data) : clone(data));
  }

  async update(data) {
    const existing = this.db.store.get(this.path);
    if (!existing) throw new Error(`No document to update: ${this.path}`);
    this.db.store.set(this.path, mergeData(existing, data));
  }

  async delete() {
    this.db.store.delete(this.path);
  }
}

class FakeQuery {
  constructor(db, collectionName, filters = []) {
    this.db = db;
    this.collectionName = collectionName;
    this.filters = filters;
  }

  where(field, op, value) {
    if (op !== '==') throw new Error(`Unsupported query operator: ${op}`);
    return new FakeQuery(this.db, this.collectionName, [...this.filters, { field, value }]);
  }

  async get() {
    const prefix = `${this.collectionName}/`;
    const docs = [];
    for (const [path, data] of this.db.store.entries()) {
      const relative = path.startsWith(prefix) ? path.slice(prefix.length) : '';
      if (!relative || relative.includes('/')) continue;
      if (this.filters.every(({ field, value }) => data[field] === value)) {
        docs.push({
          id: relative,
          ref: new FakeDocRef(this.db, path),
          exists: true,
          data: () => clone(data),
        });
      }
    }
    docs.sort((left, right) => left.id.localeCompare(right.id));
    return { docs, size: docs.length, empty: docs.length === 0 };
  }
}

class FakeCollectionRef {
  constructor(db, name) {
    this.db = db;
    this.name = name;
  }

  doc(id) {
    return new FakeDocRef(this.db, `${this.name}/${id}`);
  }

  async add(data) {
    const id = `auto_${this.db.nextId++}`;
    await this.doc(id).set(data);
    return new FakeDocRef(this.db, `${this.name}/${id}`);
  }

  where(field, op, value) {
    return new FakeQuery(this.db, this.name).where(field, op, value);
  }

  async get() {
    return new FakeQuery(this.db, this.name).get();
  }
}

class FakeTransaction {
  constructor(db) {
    this.db = db;
    this.staged = new Map();
  }

  _read(path) {
    if (this.staged.has(path)) {
      const entry = this.staged.get(path);
      if (entry.type === 'delete') return null;
      return entry.data;
    }
    return this.db.store.get(path);
  }

  async get(ref) {
    const data = this._read(ref.path);
    return {
      id: ref.id,
      exists: data !== undefined,
      data: () => clone(data),
    };
  }

  set(ref, data, options = {}) {
    const existing = this._read(ref.path);
    this.staged.set(ref.path, {
      type: 'set',
      data: options.merge ? mergeData(existing, data) : clone(data),
    });
  }

  update(ref, data) {
    const existing = this._read(ref.path);
    if (existing === undefined) throw new Error(`No document to update: ${ref.path}`);
    this.staged.set(ref.path, { type: 'set', data: mergeData(existing, data) });
  }

  delete(ref) {
    this.staged.set(ref.path, { type: 'delete' });
  }
}

class FakeFirestore {
  constructor(seed = {}) {
    this.store = new Map();
    this.queue = Promise.resolve();
    this.nextId = 1;
    for (const [path, value] of Object.entries(seed)) this.store.set(path, clone(value));
  }

  _snapshot(path) {
    const data = this.store.get(path);
    return {
      id: path.split('/').pop(),
      exists: data !== undefined,
      data: () => clone(data),
    };
  }

  collection(name) {
    return new FakeCollectionRef(this, name);
  }

  doc(path) {
    return new FakeDocRef(this, path);
  }

  async runTransaction(fn) {
    const previous = this.queue;
    let release;
    this.queue = new Promise((resolve) => { release = resolve; });
    await previous;
    try {
      const transaction = new FakeTransaction(this);
      const result = await fn(transaction);
      for (const [path, entry] of transaction.staged.entries()) {
        if (entry.type === 'delete') this.store.delete(path);
        else this.store.set(path, entry.data);
      }
      return result;
    } finally {
      release();
    }
  }

  read(path) {
    return clone(this.store.get(path));
  }

  write(path, value) {
    this.store.set(path, clone(value));
  }

  paths() {
    return [...this.store.keys()].sort();
  }
}

module.exports = { FakeFirestore };
