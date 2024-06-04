# Realtor Scraper Retool App

This project is a Retool application that scrapes real estate listings from Realtor.com based on user-entered zip codes. The app allows users to filter the results by price, number of bedrooms, and bathrooms. It utilizes ScraperAPI for data extraction and ngrok to provide a public URL for local development.

![Tools](https://github.com/agusvaldes/retool-real-estate-4-Bonus/blob/main/Img%20project/node%20js.png?raw=true)

## Features

- Prompt users to enter a zip code
- Scrape real estate listings from Realtor.com
- Display results in a table within Retool
- Filter results based on listing price, number of bedrooms, and bathrooms

## Tools and Technologies

- **Retool**: For building the user interface and displaying data.
- **ScraperAPI**: For scraping data from Realtor.com.
- **ngrok**: For creating a public URL to access the local application.
- **Node.js**: Server-side runtime environment.
- **Express.js**: Web framework for Node.js.
- **cheerio**: Library for parsing and manipulating HTML.
- **cors**: Middleware for enabling Cross-Origin Resource Sharing.

## Installation

### Prerequisites

- Node.js and npm installed
- ScraperAPI account and API key
- ngrok account

### Steps

1. **Clone the repository:**
    ```sh
    git clone https://github.com/yourusername/realtor-scraper-retool-app.git
    cd realtor-scraper-retool-app
    ```

2. **Install dependencies:**
    ```sh
    npm install
    ```

3. **Set up environment variables:**
    Create a `.env` file in the root directory and add your ScraperAPI key:
    ```env
    SCRAPER_API_KEY=your_scraperapi_key
    ```

4. **Run the server:**
    ```sh
    node index.js
    ```

5. **Expose the local server using ngrok:**
    ```sh
    ngrok http 3000
    ```
    Note the public URL provided by ngrok.

6. **Set up the Retool app:**
    - Create a new Retool app.
    - Add an HTTP request resource that points to your ngrok URL (e.g., `https://your-ngrok-url.ngrok.io/scrape/{{input1.value}}`).
    - Set up the UI components to prompt for zip code and filters, and display the results in a table.

![Retool App](https://github.com/agusvaldes/retool-real-estate-4-Bonus/blob/main/Img%20project/app_retool.png?raw=true)

## Usage

1. Open the Retool app.
2. Enter a zip code and apply any desired filters for price, bedrooms, or bathrooms.
3. View the filtered real estate listings in the table.

## Code Overview

### `index.js`
This is the main server file which sets up an Express server and handles the scraping logic using ScraperAPI and cheerio.

```javascript
const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const cors = require('cors');
const app = express();

app.use(cors());

const PORT = process.env.PORT || 3000;
const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY || "your_api_key";

app.get('/', (req, res) => {
  res.send('Welcome to the Realtor.com Scraper API. Use the /scrape/:zipCode endpoint.');
});

app.get('/scrape/:zipCode', async (req, res) => {
  const zipCode = req.params.zipCode;
  const minPrice = parseInt(req.query.min_price, 10) || 0;
  const maxPrice = parseInt(req.query.max_price, 10) || Infinity;
  const minBeds = parseInt(req.query.min_beds, 10) || 0;
  const maxBeds = parseInt(req.query.max_beds, 10) || 0;
  const minBaths = parseInt(req.query.min_baths, 10) || 0;
  const maxBaths = parseInt(req.query.max_baths, 10) || 0;

  let filters = [];
  if (minBeds || maxBeds) {
    filters.push(`beds-${minBeds || 0}-${maxBeds || minBeds}`);
  }
  if (minBaths || maxBaths) {
    filters.push(`baths-${minBaths || 0}-${maxBaths || minBaths}`);
  }
  if (minPrice || maxPrice) {
    filters.push(`price-${minPrice || 0}-${maxPrice || minPrice}`);
  }

  const filterPath = filters.join('/');
  const searchUrl = `https://www.realtor.com/realestateandhomes-search/${zipCode}/${filterPath}`;
  const url = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(searchUrl)}`;

  try {
    console.log(`Fetching data from URL: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    const data = await response.text();
    const $ = cheerio.load(data);
    const scriptContent = $('#__NEXT_DATA__').html();
    if (!scriptContent) {
      console.error('Data script not found');
      return res.status(404).send('Data script not found');
    }

    let jsonData;
    try {
      jsonData = JSON.parse(scriptContent);
    } catch (parseError) {
      console.error('Error parsing JSON data:', parseError.message);
      return res.status(500).send('Error parsing JSON data');
    }

    const properties = jsonData?.props?.pageProps?.properties;
    if (!properties) {
      console.error('No property data found');
      console.error('jsonData:', jsonData);
      return res.status(404).send('No property data found');
    }

    const listings = properties.map(property => ({
      address: property.location.address.line,
      price: property.list_price,
      beds: property.description.beds,
      baths: Math.round(property.description.baths_consolidated),
      sqft: property.description.sqft,
      link: `https://www.realtor.com/realestateandhomes-detail/${property.permalink}`
    }));

    res.json(listings);

  } catch (error) {
    console.error('Error fetching data:', error.message);
    res.status(500).send(`Error fetching data: ${error.message}`);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
```
## Video Demo
Link to the video demo - [Video](https://www.loom.com/share/349e038c7d3546059d96c55c3dbfa778?sid=3d517a1b-00bb-484d-b7e5-63a488114c21)

Feel free to replace placeholder values like the repository URL, ScraperAPI key, and video demo link with the actual values for your project.
