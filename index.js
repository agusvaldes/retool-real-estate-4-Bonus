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
