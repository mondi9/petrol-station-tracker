/**
 * Fuely price sync - PetrolPulse Lagos (ADMIN-TRIGGERED ONLY, never automatic).
 *
 * Data source: https://fuely.ng/api/v1/prices/realtime (Bearer token).
 * - Sandbox keys return stable demo records with charged_amount 0 (free).
 * - Production bills NGN 50 per successful response: keep syncs admin-triggered
 *   and paginated pulls capped (MAX_PAGES) so costs stay predictable.
 * - Fuely records carry NO coordinates: station matching is name/brand based
 *   (see fuelyMatch.js) and only unique high-confidence matches are applied.
 *
 * Provenance: every applied price is written with priceSource: 'fuely' and
 * lastPriceUpdate set to the Fuely submitted_at timestamp (the price's real
 * vintage - never Date.now()).
 */
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { validatePrice } from './priceService';
import { previewFuelySync } from './fuelyMatch';

export { previewFuelySync };

export const PRICE_SOURCES = {
    SEED: 'seed-estimate',
    ADMIN: 'admin',
    COMMUNITY: 'community',
    FUELY: 'fuely'
};

const FUELY_BASE = 'https://fuely.ng/api/v1';
const FUELY_PRODUCT = 'petrol';
const FUELY_STATE = 'lagos';
const PER_PAGE = 10; // Fuely caps per_page at 10
const MAX_PAGES = 15; // safety cap: bounds time and (production) cost

const getApiKey = () => (import.meta.env.VITE_FUELY_API_KEY || '').trim();

/**
 * Fetch latest approved Fuely prices for Lagos petrol across all pages.
 * Throws with an actionable message when the key is missing, auth fails,
 * or the network/CORS blocks the call. Never writes anything.
 * @returns {Promise<{records: Array, meta: object|null}>}
 */
export const fetchFuelyRealtime = async ({ product = FUELY_PRODUCT, state = FUELY_STATE, onProgress } = {}) => {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('Fuely API key missing. Add VITE_FUELY_API_KEY (sandbox key from fuely.ng > API Access) to .env and restart.');
    }

    const records = [];
    let meta = null;

    for (let page = 1; page <= MAX_PAGES; page++) {
        if (onProgress) onProgress(`Fetching Fuely prices (page ${page})...`);
        const url =
            `${FUELY_BASE}/prices/realtime` +
            `?filter[product]=${encodeURIComponent(product)}` +
            `&filter[state]=${encodeURIComponent(state)}` +
            `&page=${page}&per_page=${PER_PAGE}`;

        let res;
        try {
            res = await fetch(url, {
                headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' }
            });
        } catch (e) {
            throw new Error(`Fuely request failed (network or CORS blocked): ${e.message}`);
        }
        if (res.status === 401 || res.status === 403) {
            throw new Error('Fuely rejected the API key (401/403). Check VITE_FUELY_API_KEY.');
        }
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(`Fuely HTTP ${res.status}: ${text.slice(0, 200)}`);
        }

        const body = await res.json();
        meta = body.meta || null;
        const data = Array.isArray(body.data) ? body.data : [];
        records.push(...data);

        const lastPage = Number(meta?.last_page || page);
        if (page >= lastPage || data.length === 0) break;
    }

    return { records, meta };
};

/**
 * Apply preview rows with action === 'update' to Firestore.
 * Re-validates every price with priceService.validatePrice before writing.
 * Writes ONLY: prices.<fuel>, lastPriceUpdate (= Fuely submitted_at),
 * priceSource ('fuely'). Never touches names, coords, status, or queues.
 * @returns {Promise<{updated: number, failed: number, errors: Array}>}
 */
export const applyFuelySync = async (rows, fuelType = 'petrol') => {
    const result = { updated: 0, failed: 0, errors: [] };

    for (const row of rows || []) {
        if (!row || row.action !== 'update' || !row.stationId) continue;
        if (!validatePrice(row.price, fuelType)) {
            result.failed += 1;
            result.errors.push(`${row.fuelyStation}: price failed validation (₦${row.price})`);
            continue;
        }
        try {
            await updateDoc(doc(db, 'stations', row.stationId), {
                [`prices.${fuelType}`]: Number(row.price),
                lastPriceUpdate: row.submittedAt,
                priceSource: PRICE_SOURCES.FUELY
            });
            result.updated += 1;
        } catch (e) {
            result.failed += 1;
            result.errors.push(`${row.fuelyStation}: ${e.message}`);
        }
    }

    return result;
};
