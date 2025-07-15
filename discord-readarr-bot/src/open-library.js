const axios = require('axios');

async function searchBooks(query) {
  try {
    // Return the top 5 results to give the user a choice
    const response = await axios.get(`http://openlibrary.org/search.json?q=${query}&limit=5`);
    return response.data.docs;
  } catch (error) {
    console.error('Error searching for books:', error);
    return [];
  }
}

module.exports = { searchBooks };
