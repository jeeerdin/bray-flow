import 'dotenv/config';
import { createObjectCsvWriter } from 'csv-writer';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────
const PLACES_API_KEY = process.env.GCP_PLACES_KEY; // Google Places API key
const PAGESPEED_API_KEY = process.env.GCP_PAGESPEED_KEY; // PageSpeed API key
const query = 'plumbers in Los Angeles'; // Change as needed
const strategy = 'mobile';
const outputFile = 'plumbers_with_audits.csv';

// ─────────────────────────────────────────────────────────────────────────────
// SETUP CSV
// ─────────────────────────────────────────────────────────────────────────────
const csvWriter = createObjectCsvWriter({
  path: outputFile,
  header: [
    { id: 'name', title: 'Business Name' },
    { id: 'address', title: 'Address' },
    { id: 'website', title: 'Website' },
    { id: 'phone', title: 'Phone' },
    { id: 'performance', title: 'Performance (%)' },
    { id: 'bestPractices', title: 'Best Practices (%)' },
    { id: 'seo', title: 'SEO (%)' },
  ],
});

// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE PLACES HELPERS
// ─────────────────────────────────────────────────────────────────────────────
async function fetchPlaces(nextPageToken) {
  const baseUrl = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
  const url = new URL(baseUrl);
  url.searchParams.set('query', query);
  url.searchParams.set('key', PLACES_API_KEY);
  if (nextPageToken) url.searchParams.set('pagetoken', nextPageToken);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);
  const data = await res.json();
  console.log(data);
  return data;
}

async function fetchDetails(placeId) {
  const fields = [
    'name',
    'formatted_address',
    'website',
    'formatted_phone_number',
  ].join(',');
  const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${PLACES_API_KEY}`;
  const res = await fetch(detailsUrl);
  const data = await res.json();
  return data.result;
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGESPEED AUDIT
// ─────────────────────────────────────────────────────────────────────────────
async function runPageSpeedAudit(url) {
  if (!url || !url.startsWith('http')) return null;
  try {
    const api =
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?` +
      `url=${encodeURIComponent(url)}` +
      `&strategy=${strategy}` +
      `&category=performance&category=best-practices&category=seo` +
      `&key=${PAGESPEED_API_KEY}`;

    const res = await fetch(api);
    if (!res.ok) {
      console.error(
        `❌ PageSpeed failed for ${url} — ${res.status} ${res.statusText}`
      );
      return null;
    }

    const data = await res.json();

    const perf = data.lighthouseResult?.categories?.performance?.score ?? null;
    const bp =
      data.lighthouseResult?.categories?.['best-practices']?.score ?? null;
    const seo = data.lighthouseResult?.categories?.seo?.score ?? null;

    return {
      performance: perf !== null ? (perf * 100).toFixed(0) : 'N/A',
      bestPractices: bp !== null ? (bp * 100).toFixed(0) : 'N/A',
      seo: seo !== null ? (seo * 100).toFixed(0) : 'N/A',
    };
  } catch (err) {
    console.error(`Error auditing ${url}:`, err.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCRIPT
// ─────────────────────────────────────────────────────────────────────────────
async function run() {
  console.log(`Fetching plumbers for "${query}"...`);
  let allRecords = [];
  let nextPageToken = null;

  do {
    const data = await fetchPlaces(nextPageToken);
    for (const place of data.results) {
      const details = await fetchDetails(place.place_id);
      const website = details.website || '';

      const record = {
        name: details.name || place.name,
        address: details.formatted_address || place.formatted_address,
        website,
        phone: details.formatted_phone_number || '',
        performance: 'N/A',
        bestPractices: 'N/A',
        seo: 'N/A',
      };

      if (website) {
        console.log(`🌐 Auditing: ${website}`);
        const scores = await runPageSpeedAudit(website);
        if (scores) {
          record.performance = scores.performance;
          record.bestPractices = scores.bestPractices;
          record.seo = scores.seo;
        }
      } else {
        console.log(`⚠️ No website for ${record.name}`);
      }

      allRecords.push(record);
    }

    nextPageToken = data.next_page_token;
    if (nextPageToken) await new Promise((r) => setTimeout(r, 2000));
  } while (nextPageToken);

  await csvWriter.writeRecords(allRecords);
  console.log(
    `\n💾 Saved ${allRecords.length} plumber records with audit data to ${outputFile}`
  );
}

run().catch(console.error);
