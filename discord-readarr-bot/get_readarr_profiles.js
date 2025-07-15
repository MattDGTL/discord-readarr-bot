require('dotenv').config();
const axios = require('axios');

async function getReadarrProfiles() {
  const readarrUrl = process.env.READARR_URL;
  const apiKey = process.env.READARR_API_KEY;

  if (!readarrUrl || !apiKey) {
    console.error('Please ensure READARR_URL and READARR_API_KEY are set in your .env file.');
    return;
  }

  try {
    console.log(`Fetching profiles from: ${readarrUrl}/api/v1/qualityprofile`);
    const response = await axios.get(`${readarrUrl}/api/v1/qualityprofile`, {
      headers: {
        'X-Api-Key': apiKey,
      },
    });
    console.log('Readarr Quality Profiles:');
    response.data.forEach(profile => {
      console.log(`  Name: ${profile.name}, ID: ${profile.id}`);
    });
  } catch (error) {
    console.error('Error fetching Readarr profiles:', error.response ? error.response.data : error.message);
  }
}

getReadarrProfiles();
