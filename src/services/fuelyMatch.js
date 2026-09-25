/**
 * Pure Fuely <-> Firestore station matching helpers.
 *
 * Zero imports on purpose: unit-testable in plain node and free of side effects.
 * Fuely price records carry NO coordinates (station {id,name}, brand {id,name},
 * city/state names only), so matching is name/brand based and MUST be gated:
 * only unique, high-confidence matches are ever auto-applied. Everything else
 * is surfaced in the admin preview as "needs review" and never written.
 */

const MIN_TOKEN_LEN = 3;

const STOPWORDS = new Set([
    'filling', 'station', 'stations', 'petrol', 'fuel', 'fuels',
    'oil', 'gas', 'limited', 'ltd', 'plc', 'nigeria', 'lagos',
    'the', 'and', 'of'
]);

/**
 * Normalise a station name for comparison.
 * Mirrors the duplicate-cleanup normaliser in App.jsx.
 */
export const normalizeStationName = (name) =>
    (name || '')
        .toLowerCase()
        .replace(/filling|station|petrol|fuel|oil|limited|ltd|plc|nigeria|lagos/g, '')
        .replace(/[^a-z0-9]/g, '')
        .trim();

const tokensOf = (name) =>
    (name || '')
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((t) => t.length >= MIN_TOKEN_LEN && !STOPWORDS.has(t));

/**
 * Plausibility band for PMS pump prices in Naira.
 * Mirrors validatePrice(price, 'petrol') in priceService.js (500-2000).
 * Kept local so this module stays import-free; fuelyService re-validates
 * with priceService.validatePrice before every write (defence in depth).
 */
export const isPlausiblePmsPrice = (price) => {
    const n = Number(price);
    return Number.isFinite(n) && n >= 500 && n <= 2000;
};

/**
 * Find the best Firestore station for one Fuely price record.
 * @param {object} record - Fuely realtime record ({station:{name}, brand:{name}, ...})
 * @param {Array} stations - Firestore station docs ({id, name, ...})
 * @returns {{station, confidence: 'high'|'medium'|'low'|'none', score, reason}}
 */
export const matchFuelyRecord = (record, stations) => {
    const fNameRaw = record?.station?.name || '';
    const fBrandRaw = record?.brand?.name || '';
    const fNorm = normalizeStationName(fNameRaw);
    const fBrand = normalizeStationName(fBrandRaw);
    const fCity = normalizeStationName(record?.city?.name);
    const fToks = new Set(tokensOf(fNameRaw));

    if (!fNorm || fNorm.length < MIN_TOKEN_LEN) {
        return { station: null, confidence: 'none', score: 0, reason: 'empty Fuely station name' };
    }

    const scored = [];
    for (const s of stations || []) {
        const sNorm = normalizeStationName(s?.name);
        if (!sNorm || sNorm.length < MIN_TOKEN_LEN) continue; // skip 'xx'-style stubs
        let score = 0;
        const why = [];
        if (sNorm === fNorm) {
            score += 3;
            why.push('exact-name');
        } else if (sNorm.includes(fNorm) || fNorm.includes(sNorm)) {
            score += 2;
            why.push('name-contains');
        }
        if (fBrand && fBrand.length >= MIN_TOKEN_LEN && sNorm.includes(fBrand)) {
            score += 2;
            why.push('brand-match');
        }
        // Fuely city (e.g. 'Ikeja') appearing in the station's address breaks
        // ties between same-brand duplicates in different neighbourhoods.
        if (fCity && fCity.length >= MIN_TOKEN_LEN) {
            const addr = (s?.address || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            if (addr.includes(fCity)) {
                score += 2;
                why.push('city-match');
            }
        }
        if (score < 3) {
            const overlap = tokensOf(s?.name).filter((t) => fToks.has(t)).length;
            if (overlap > 0) {
                score += 1;
                why.push(`tokens+${overlap}`);
            }
        }
        if (score > 0) scored.push({ station: s, score, why });
    }

    if (scored.length === 0) {
        return { station: null, confidence: 'none', score: 0, reason: 'no candidate' };
    }

    scored.sort((a, b) => b.score - a.score);
    const top = scored[0];
    const tied = scored.filter((c) => c.score === top.score).length;

    // Same-brand duplicates (e.g. five "Mobil" entries) can never be
    // disambiguated by name alone -> cap at medium, never auto-apply.
    if (tied > 1) {
        return {
            station: top.station,
            confidence: 'medium',
            score: top.score,
            reason: `ambiguous: ${tied} stations tie (${top.why.join(',')})`
        };
    }
    if (top.score >= 4) {
        return { station: top.station, confidence: 'high', score: top.score, reason: top.why.join(',') };
    }
    if (top.score >= 2) {
        return { station: top.station, confidence: 'medium', score: top.score, reason: top.why.join(',') };
    }
    return { station: null, confidence: 'low', score: top.score, reason: 'weak match only' };
};

/**
 * Dry-run a Fuely sync: map every record to a station and decide an action.
 * NEVER writes. Only rows with action === 'update' are eligible for apply.
 *
 * Selection rules (no blind overwrites):
 *  - price outside 500-2000 -> skip 'invalid price range'
 *  - confidence below high -> skip (reason preserved for review)
 *  - Fuely submitted_at missing -> skip 'fuely record undated'
 *  - station has no petrol price -> update 'no existing price'
 *  - station price undated -> update 'existing price undated'
 *  - Fuely submitted_at newer than station lastPriceUpdate -> update 'fuely newer'
 *  - otherwise -> skip 'existing price is newer'
 */
export const previewFuelySync = (records, stations, fuelType = 'petrol') => {
    return (records || []).map((record) => {
        const base = {
            fuelyId: record?.id ?? null,
            fuelyStation: record?.station?.name || 'Unknown',
            fuelyBrand: record?.brand?.name || '',
            fuelyCity: record?.city?.name || '',
            price: Number(record?.price),
            currency: record?.currency || 'NGN',
            submittedAt: record?.submitted_at || null,
            stationId: null,
            stationName: null,
            confidence: 'none',
            score: 0,
            action: 'skip',
            reason: ''
        };

        if (!isPlausiblePmsPrice(base.price)) {
            base.reason = `invalid price range (${record?.price})`;
            return base;
        }

        const match = matchFuelyRecord(record, stations);
        base.confidence = match.confidence;
        base.score = match.score;
        if (match.station) {
            base.stationId = match.station.id;
            base.stationName = match.station.name;
        }
        if (match.confidence !== 'high') {
            base.reason = `no confident match (${match.reason})`;
            return base;
        }
        if (!base.submittedAt || Number.isNaN(new Date(base.submittedAt).getTime())) {
            base.reason = 'fuely record undated';
            return base;
        }

        const station = match.station;
        const current = station?.prices?.[fuelType];
        const stationTime = station?.lastPriceUpdate ? new Date(station.lastPriceUpdate).getTime() : NaN;
        const fuelyTime = new Date(base.submittedAt).getTime();

        if (current == null) {
            base.action = 'update';
            base.reason = 'no existing price';
            return base;
        }
        if (Number.isNaN(stationTime)) {
            base.action = 'update';
            base.reason = 'existing price undated (estimate)';
            return base;
        }
        if (fuelyTime > stationTime) {
            base.action = 'update';
            base.reason = 'fuely record is newer';
            return base;
        }
        base.reason = 'existing price is newer';
        return base;
    });
};
