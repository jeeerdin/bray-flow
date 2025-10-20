import 'dotenv/config';
import { createObjectCsvWriter } from 'csv-writer';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────
const PLACES_API_KEY = process.env.GCP_PLACES_KEY; // Google Places API key

// Get configuration from command line arguments or environment variables
const args = process.argv.slice(2);
const query = args[0] || process.env.SEARCH_QUERY || 'plumbers in Los Angeles';
const outputFile = args[1] || process.env.OUTPUT_FILE || 'businesses.csv';
const maxResults = parseInt(args[2]) || parseInt(process.env.MAX_RESULTS) || null; // No limit by default
const useDoubleQueue = args.includes('--double-queue') || process.env.USE_DOUBLE_QUEUE === 'true';

// Display usage if help is requested
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node index.js [search_query] [output_file] [max_results] [--double-queue]

Arguments:
  search_query  The search term for Google Places (e.g., "restaurants in New York")
  output_file   Name of the output CSV file (optional, defaults to 'businesses.csv')
  max_results   Maximum number of results to fetch (optional, no limit by default)
  --double-queue  Use multiple search strategies to get more than 20 results

Environment Variables:
  SEARCH_QUERY  Alternative way to set the search query
  OUTPUT_FILE   Alternative way to set the output file name
  MAX_RESULTS   Alternative way to set the maximum number of results
  USE_DOUBLE_QUEUE  Alternative way to enable double queue mode
  GCP_PLACES_KEY  Your Google Places API key (required)

Examples:
  node index.js "dentists in Chicago"
  node index.js "restaurants in New York" "nyc_restaurants.csv"
  node index.js "plumbers in LA" "la_plumbers.csv" 50
  node index.js "restaurants in NYC" "nyc_restaurants.csv" 100 --double-queue
  SEARCH_QUERY="restaurants in Miami" MAX_RESULTS=25 node index.js

Current configuration:
  Search Query: "${query}"
  Output File: "${outputFile}"
  Max Results: ${maxResults ? maxResults : 'No limit'}
  Double Queue: ${useDoubleQueue ? '✅ Enabled' : '❌ Disabled'}
  API Key: ${PLACES_API_KEY ? '✅ Set' : '❌ Missing'}
`);
  process.exit(0);
}

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
  ],
});

// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE PLACES HELPERS
// ─────────────────────────────────────────────────────────────────────────────
async function fetchPlaces(nextPageToken) {
  const baseUrl = 'https://places.googleapis.com/v1/places:searchText';
  const url = new URL(baseUrl);
  url.searchParams.set('key', PLACES_API_KEY);

  // Use a larger page size to get more results per request
  // Note: Google Places API (New) may have different limits
  const pageSize = Math.min(100, maxResults || 100);
  
  const requestBody = {
    textQuery: global.currentQuery || query,
    maxResultCount: pageSize,
    pageToken: nextPageToken || undefined
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber'
    },
    body: JSON.stringify(requestBody)
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(`HTTP ${res.status} - ${res.statusText}: ${JSON.stringify(errorData)}`);
  }
  
  const data = await res.json();
  console.log('API Response:', JSON.stringify(data, null, 2));
  return data;
}

async function fetchDetails(placeId) {
  const baseUrl = `https://places.googleapis.com/v1/places/${placeId}`;
  const url = new URL(baseUrl);
  url.searchParams.set('key', PLACES_API_KEY);

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Goog-FieldMask': 'id,displayName,formattedAddress,websiteUri,nationalPhoneNumber'
    }
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(`HTTP ${res.status} - ${res.statusText}: ${JSON.stringify(errorData)}`);
  }

  const data = await res.json();
  return data;
}



// ─────────────────────────────────────────────────────────────────────────────
// DOUBLE QUEUE HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────
function generateSearchVariations(baseQuery) {
  const variations = [baseQuery];
  
  // Extract business type and location from query
  const parts = baseQuery.toLowerCase().split(' in ');
  if (parts.length === 2) {
    const businessType = parts[0];
    const location = parts[1];
    
    // Generate variations with different business type synonyms
    const synonyms = {
      'restaurants': ['dining', 'food', 'eateries', 'cafes', 'bistros'],
      'lawyers': ['attorneys', 'law firms', 'legal services', 'legal counsel'],
      'dentists': ['dental offices', 'dental care', 'orthodontists', 'oral health'],
      'plumbers': ['plumbing services', 'plumbing contractors', 'pipe repair'],
      'doctors': ['physicians', 'medical offices', 'healthcare providers', 'clinics'],
      'gyms': ['fitness centers', 'workout facilities', 'exercise studios'],
      'salons': ['beauty salons', 'hair salons', 'spas', 'beauty services'],
      'contractors': ['construction services', 'home improvement', 'renovation'],
      'medspa': ['medical spa', 'med spa', 'aesthetic clinic', 'beauty clinic', 'wellness center'],
      'medspas': ['medical spas', 'med spas', 'aesthetic clinics', 'beauty clinics', 'wellness centers'],
      'medspa\'s': ['medical spa', 'med spa', 'aesthetic clinic', 'beauty clinic', 'wellness center']
    };
    
    // Add synonym variations
    Object.keys(synonyms).forEach(key => {
      if (businessType.includes(key)) {
        synonyms[key].forEach(synonym => {
          variations.push(`${synonym} in ${location}`);
        });
      }
    });
    
    // Add location variations (try different neighborhoods/areas)
    const locationVariations = {
      'new york': ['manhattan', 'brooklyn', 'queens', 'bronx', 'staten island'],
      'los angeles': ['hollywood', 'beverly hills', 'santa monica', 'downtown la'],
      'chicago': ['downtown chicago', 'lincoln park', 'wicker park', 'lakeview'],
      'miami': ['south beach', 'wynwood', 'brickell', 'coconut grove'],
      'toronto': ['downtown toronto', 'yorkville', 'queen west', 'king west', 'etobicoke']
    };
    
    Object.keys(locationVariations).forEach(key => {
      if (location.includes(key)) {
        locationVariations[key].forEach(area => {
          variations.push(`${businessType} in ${area}`);
        });
      }
    });
  }
  
  return [...new Set(variations)]; // Remove duplicates
}

async function fetchWithDoubleQueue() {
  console.log(`🔄 Using double queue strategy to get more results...`);
  
  const searchVariations = generateSearchVariations(query);
  console.log(`📝 Generated ${searchVariations.length} search variations`);
  
  let allRecords = [];
  const seenIds = new Set();
  
  for (let i = 0; i < searchVariations.length; i++) {
    const variation = searchVariations[i];
    console.log(`\n🔍 Searching variation ${i + 1}/${searchVariations.length}: "${variation}"`);
    
    // Temporarily override the query for this search
    const originalQuery = query;
    global.currentQuery = variation;
    
    try {
      const data = await fetchPlaces(null);
      const places = data.places || [];
      
      for (const place of places) {
        // Check if we've reached the maximum number of results
        if (maxResults && allRecords.length >= maxResults) {
          console.log(`\n🛑 Reached maximum limit of ${maxResults} results`);
          break;
        }
        
        // Skip duplicates using place ID
        if (seenIds.has(place.id)) {
          continue;
        }
        seenIds.add(place.id);
        
        const website = place.websiteUri || '';
        const record = {
          name: place.displayName?.text || 'Unknown',
          address: place.formattedAddress || 'Unknown',
          website,
          phone: place.nationalPhoneNumber || '',
        };
        
        console.log(`📋 Found: ${record.name} (${allRecords.length + 1}${maxResults ? `/${maxResults}` : ''})`);
        allRecords.push(record);
      }
      
      // Add delay between searches to be respectful to the API
      if (i < searchVariations.length - 1) {
        console.log(`⏳ Waiting 3 seconds before next search...`);
        await new Promise((r) => setTimeout(r, 3000));
      }
      
    } catch (error) {
      console.error(`❌ Error searching "${variation}":`, error.message);
    }
    
    // Restore original query
    global.currentQuery = originalQuery;
    
    // Break if we've reached the limit
    if (maxResults && allRecords.length >= maxResults) {
      break;
    }
  }
  
  return allRecords;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCRIPT
// ─────────────────────────────────────────────────────────────────────────────
async function run() {
  console.log(`Fetching businesses for "${query}"...`);
  if (maxResults) {
    console.log(`📊 Limiting results to ${maxResults} businesses`);
  }
  
  let allRecords = [];
  
  if (useDoubleQueue) {
    allRecords = await fetchWithDoubleQueue();
  } else {
    // Original single search logic
    let nextPageToken = null;
    
    do {
      const data = await fetchPlaces(nextPageToken);
      const places = data.places || [];
      
      for (const place of places) {
        // Check if we've reached the maximum number of results
        if (maxResults && allRecords.length >= maxResults) {
          console.log(`\n🛑 Reached maximum limit of ${maxResults} results`);
          break;
        }

        // For the new API, we get most data directly from the search results
        const website = place.websiteUri || '';

        const record = {
          name: place.displayName?.text || 'Unknown',
          address: place.formattedAddress || 'Unknown',
          website,
          phone: place.nationalPhoneNumber || '',
        };

        console.log(`📋 Found: ${record.name} (${allRecords.length + 1}${maxResults ? `/${maxResults}` : ''})`);
        allRecords.push(record);
      }

      // Break out of the loop if we've reached the maximum results
      if (maxResults && allRecords.length >= maxResults) {
        break;
      }

      // Check for different possible pagination field names
      nextPageToken = data.nextPageToken || data.next_page_token || data.nextPage;
      console.log(`📄 Page completed. Total found so far: ${allRecords.length}. Next page token: ${nextPageToken ? 'Yes' : 'No'}`);
      if (nextPageToken) await new Promise((r) => setTimeout(r, 2000));
    } while (nextPageToken);
  }

  await csvWriter.writeRecords(allRecords);
  console.log(
    `\n💾 Saved ${allRecords.length} business records to ${outputFile}`
  );
}

run().catch(console.error);
