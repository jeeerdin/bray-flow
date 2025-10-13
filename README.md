# PageSpeed Automation

A Node.js automation script that searches for local businesses using Google Places API, fetches their details, and runs PageSpeed Insights audits on their websites. The results are automatically exported to a CSV file for easy analysis.

## Features

- 🔍 Search for any type of business using Google Places Text Search API
- 📊 Fetch detailed business information (name, address, phone, website)
- ⚡ Run automated PageSpeed Insights audits on business websites
- 📈 Collect performance metrics including:
  - Performance Score
  - Best Practices Score
  - SEO Score
- 💾 Export all data to CSV format for easy analysis
- 📱 Configurable strategy (mobile/desktop)
- 🔄 Automatic pagination handling for multiple pages of results

## Prerequisites

Before running this script, you'll need:

1. **Node.js** (v14 or higher)
2. **Google Cloud Platform Account** with the following APIs enabled:
   - Places API
   - PageSpeed Insights API
3. **API Keys** for both services

### Setting Up Google Cloud APIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Places API**: Navigate to APIs & Services → Library → Search for "Places API" → Enable
   - **PageSpeed Insights API**: Navigate to APIs & Services → Library → Search for "PageSpeed Insights API" → Enable
4. Create API credentials:
   - Go to APIs & Services → Credentials
   - Click "Create Credentials" → "API Key"
   - Create two separate API keys (or use the same key for both)

## Installation

1. Clone this repository:

```bash
git clone https://github.com/kevinthomaskane/pagespeed-automation.git
cd pagespeed-automation
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory:

```bash
touch .env
```

4. Add your API keys to the `.env` file:

```env
GCP_PLACES_KEY=your_google_places_api_key_here
GCP_PAGESPEED_KEY=your_pagespeed_insights_api_key_here
```

## Configuration

Open `index.js` and modify the configuration section at the top of the file:

```javascript
const query = 'plumbers in Los Angeles'; // Change to any business type and location
const strategy = 'mobile'; // 'mobile' or 'desktop'
const outputFile = 'plumbers_with_audits.csv'; // Output filename
```

### Configuration Options

- **query**: The search term for Google Places (e.g., "restaurants in New York", "dentists in Chicago")
- **strategy**: PageSpeed test strategy - either `'mobile'` or `'desktop'`
- **outputFile**: Name of the output CSV file

## Usage

Run the script:

```bash
node index.js
```

The script will:

1. Search for businesses matching your query
2. Fetch detailed information for each business
3. Run PageSpeed audits on websites that are available
4. Save all results to the specified CSV file

### Example Output

Console output:

```
Fetching plumbers for "plumbers in Los Angeles"...
🌐 Auditing: https://example-plumber.com
⚠️ No website for ABC Plumbing
🌐 Auditing: https://another-plumber.com
...
💾 Saved 20 plumber records with audit data to plumbers_with_audits.csv
```

CSV output includes:
| Business Name | Address | Website | Phone | Performance (%) | Best Practices (%) | SEO (%) |
|--------------|---------|---------|-------|-----------------|-------------------|---------|
| Joe's Plumbing | 123 Main St... | https://... | (555) 123-4567 | 85 | 92 | 88 |

## Use Cases

This script is perfect for:

- 🏢 **Local Business Analysis**: Analyze the digital presence of local businesses in any industry
- 📊 **Competitive Analysis**: Compare website performance across competitors
- 💼 **Lead Generation**: Identify businesses with poor website performance who might need web development services
- 🎯 **Market Research**: Understand the digital maturity of businesses in specific sectors
- 📈 **SEO Consulting**: Find potential clients who need SEO improvements

## Rate Limits & Best Practices

- Google Places API has rate limits - the script includes a 2-second delay between pagination requests
- PageSpeed Insights API may have rate limits depending on your quota
- For large-scale use, consider implementing additional delays or batching
- Always check your API usage in Google Cloud Console to avoid unexpected charges

## Dependencies

- `dotenv` - Environment variable management
- `csv-writer` - CSV file generation

## Error Handling

The script includes error handling for:

- Missing or invalid websites
- Failed PageSpeed API requests
- HTTP errors from Google APIs

Businesses without websites or failed audits will still be included in the CSV with "N/A" values for the audit scores.

## License

ISC

## Author

Created by Kevin Kane of [10xDev](https://10xdev.io)

---

💡 **Tip**: Try different search queries and locations to gather insights about various industries and markets!
