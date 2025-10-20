# Google Places Business Finder

A Node.js automation script that searches for local businesses using Google Places API and fetches their detailed information. The results are automatically exported to a CSV file for easy analysis.

## Features

- 🔍 Search for any type of business using Google Places Text Search API
- 📊 Fetch detailed business information (name, address, phone, website)
- 💾 Export all data to CSV format for easy analysis
- 🔄 Automatic pagination handling for multiple pages of results
- ⚙️ Easy configuration via command line arguments or environment variables
- 📝 Built-in help system

## Prerequisites

Before running this script, you'll need:

1. **Node.js** (v14 or higher)
2. **Google Cloud Platform Account** with Places API (New) enabled
3. **Google Places API Key**

### Setting Up Google Cloud APIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Places API (New):
   - Navigate to APIs & Services → Library → Search for "Places API (New)" → Enable
   - **Important**: Make sure to enable the NEW Places API, not the legacy one
4. Create API credentials:
   - Go to APIs & Services → Credentials
   - Click "Create Credentials" → "API Key"
   - Restrict the API key to only the Places API (New) for security

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

4. Add your API key to the `.env` file:

```env
GCP_PLACES_KEY=your_google_places_api_key_here
```

## Usage

### Quick Start

Run the script with a search query:

```bash
node index.js "restaurants in New York"
```

### Command Line Options

```bash
# Basic usage with search query
node index.js "dentists in Chicago"

# Specify search query and output file
node index.js "plumbers in Los Angeles" "la_plumbers.csv"

# Limit results to 50 businesses
node index.js "restaurants in New York" "nyc_restaurants.csv" 50

# Use double queue to get more than 20 results
node index.js "restaurants in New York" "nyc_restaurants.csv" 100 --double-queue

# Show help
node index.js --help
```

### Environment Variables

You can also set configuration using environment variables:

```bash
# Set search query via environment variable
SEARCH_QUERY="restaurants in Miami" node index.js

# Set output file via environment variable
OUTPUT_FILE="miami_restaurants.csv" node index.js "restaurants in Miami"

# Set maximum results via environment variable
MAX_RESULTS=25 node index.js "dentists in Austin"

# Enable double queue mode via environment variable
USE_DOUBLE_QUEUE=true node index.js "restaurants in Miami" "miami_restaurants.csv" 50
```

### Configuration Options
- **search_query**: The search term for Google Places (e.g., "restaurants in New York", "dentists in Chicago")
- **output_file**: Name of the output CSV file (optional, defaults to 'businesses.csv')
- **max_results**: Maximum number of results to fetch (optional, no limit by default)
- **--double-queue**: Use multiple search strategies to get more than 20 results

The script will:

1. Search for businesses matching your query
2. Fetch detailed information for each business
3. Save all results to the specified CSV file

### Double Queue Mode

When you use the `--double-queue` flag, the script will:

1. **Generate multiple search variations** from your original query
2. **Search using synonyms** (e.g., "restaurants" → "dining", "food", "eateries")
3. **Search different neighborhoods** (e.g., "New York" → "Manhattan", "Brooklyn", "Queens")
4. **Remove duplicates** automatically using place IDs
5. **Respect API rate limits** with delays between searches

**Example**: Searching "restaurants in New York" with `--double-queue` will also search for:
- "dining in New York"
- "food in New York" 
- "eateries in New York"
- "restaurants in Manhattan"
- "restaurants in Brooklyn"
- And more variations...

This can help you get 50-100+ results instead of just 20!

### Example Output

Console output:

```
Fetching businesses for "plumbers in Los Angeles"...
📋 Found: Joe's Plumbing (1)
📋 Found: ABC Plumbing Services (2)
📋 Found: Quick Fix Plumbing (3)
...
💾 Saved 20 business records to businesses.csv
```

CSV output includes:
| Business Name | Address | Website | Phone |
|--------------|---------|---------|-------|
| Joe's Plumbing | 123 Main St... | https://... | (555) 123-4567 |

## Use Cases

This script is perfect for:

- 🏢 **Local Business Research**: Find and catalog businesses in any industry and location
- 📊 **Market Analysis**: Gather comprehensive business data for market research
- 💼 **Lead Generation**: Identify potential clients in specific industries and locations
- 🎯 **Competitive Analysis**: Map out competitors in your target market
- 📈 **Business Development**: Find businesses for partnerships or sales opportunities

## Rate Limits & Best Practices

- Google Places API has rate limits - the script includes a 2-second delay between pagination requests
- **Note**: The new Google Places API (New) currently returns a maximum of 20 results per search query
- For more results, try using different search terms or locations
- For large-scale use, consider implementing additional delays or batching
- Always check your API usage in Google Cloud Console to avoid unexpected charges

## Dependencies

- `dotenv` - Environment variable management
- `csv-writer` - CSV file generation

## Error Handling

The script includes error handling for:

- HTTP errors from Google APIs
- Missing business details
- Network connectivity issues

All found businesses will be included in the CSV output, even if some details are missing.

## License

ISC

## Author

Created by Kevin Kane of [10xDev](https://10xdev.io)

---

💡 **Tip**: Try different search queries and locations to discover businesses in various industries and markets!

## Examples

```bash
# Find restaurants in different cities
node index.js "restaurants in San Francisco" "sf_restaurants.csv"
node index.js "pizza places in Chicago" "chicago_pizza.csv" 25

# Find service businesses
node index.js "lawyers in Miami" "miami_lawyers.csv"
node index.js "dentists in Austin" "austin_dentists.csv" 50

# Find retail businesses
node index.js "clothing stores in Seattle" "seattle_clothing.csv"
node index.js "bookstores in Portland" "portland_bookstores.csv" 30
```
