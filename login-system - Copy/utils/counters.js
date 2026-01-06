// ==========================================
//        COUNTER UTILITIES (AUTO-INCREMENT)
// ==========================================
// Provides atomic sequence generation backed by the `counters` collection.

const Counter = require("../models/Counter");

/**
 * Atomically increments and returns a formatted sequence value.
 * @param {string} name - Counter key (e.g., 'request_id', 'asset_id')
 * @param {object} options
 * @param {string} options.prefix - String prefix to prepend (e.g., 'REQ-')
 * @param {number} options.pad - Zero-pad length for numeric part (default 5)
 * @param {number} options.startAt - Optional base number; resulting number = startAt + seq - 1
 * @returns {Promise<string>} formatted sequence (e.g., 'REQ-00001')
 */
async function getNextSequence(name, { prefix = "", pad = 5, startAt } = {}) {
  const result = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  ).lean();

  const seqValue = result.seq;
  const numericValue = startAt !== undefined ? startAt + seqValue - 1 : seqValue;
  const padded = String(numericValue).padStart(pad, "0");
  return `${prefix}${padded}`;
}

module.exports = { getNextSequence };
