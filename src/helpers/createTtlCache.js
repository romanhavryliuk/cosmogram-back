// in-memory, so it is per instance and empties on restart. The size cap
// keeps memory bounded: once full, the least recently used entry goes
const createTtlCache = ({ ttlMs, maxEntries }) => {
  // a Map iterates in insertion order, so re-inserting an entry on every
  // hit keeps the least recently used one first
  const entries = new Map();

  const get = (key) => {
    const entry = entries.get(key);
    if (!entry) {
      return undefined;
    }

    entries.delete(key);
    if (entry.expiresAt <= Date.now()) {
      return undefined;
    }

    entries.set(key, entry);
    return entry.value;
  };

  const set = (key, value) => {
    entries.delete(key);
    if (entries.size >= maxEntries) {
      entries.delete(entries.keys().next().value);
    }

    entries.set(key, { value, expiresAt: Date.now() + ttlMs });
  };

  const remove = (key) => {
    entries.delete(key);
  };

  return { get, set, remove };
};

module.exports = createTtlCache;
