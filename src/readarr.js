const axios = require('axios');

async function addBook(book) {
  const qualityProfileId = process.env.READARR_QUALITY_PROFILE_ID;
  const rootFolderPath = process.env.READARR_ROOT_FOLDER_PATH;
  const readarrUrl = process.env.READARR_URL;
  const apiKey = process.env.READARR_API_KEY;

  if (!qualityProfileId || !rootFolderPath || !readarrUrl || !apiKey) {
    console.error('Readarr configuration is incomplete in the .env file.');
    return null;
  }

  let bookToAdd = null; // Declare bookToAdd outside try block

  try {
    // Determine the search term for the book: prioritize ISBN, fall back to title and author
    const hasIsbn = book.isbn && Array.isArray(book.isbn) && book.isbn.length > 0;
    const bookSearchTerm = hasIsbn ? `isbn:${book.isbn[0]}` : `${book.title} ${book.author_name ? book.author_name.join(', ') : ''}`.trim();

    // Step 1: Look up the book on Readarr
    const bookSearchResponse = await axios.get(`${readarrUrl}/api/v1/book/lookup?term=${encodeURIComponent(bookSearchTerm)}`, {
      headers: { 'X-Api-Key': apiKey },
    });

    if (!bookSearchResponse.data || bookSearchResponse.data.length === 0) {
      console.error(`Book not found on Readarr via lookup: ${bookSearchTerm}`);
      return null;
    }

    bookToAdd = bookSearchResponse.data[0]; // Assign value to the already declared variable

    // --- Author Handling ---
    const authorName = book.author_name ? book.author_name.join(', ') : 'Unknown Author';
    let readarrAuthorId = bookToAdd.authorId; // Get authorId from book lookup
    let fullAuthorObject = null;

    if (readarrAuthorId === 0) { // Author not found in Readarr via book lookup
      console.log(`Author '${authorName}' not found in Readarr. Attempting to add author...`);

      // Step 1a: Search for the author in Readarr
      const authorLookupResponse = await axios.get(`${readarrUrl}/api/v1/author/lookup?term=${encodeURIComponent(authorName)}`, {
        headers: { 'X-Api-Key': apiKey },
      });

      let authorData = authorLookupResponse.data && authorLookupResponse.data.length > 0 ? authorLookupResponse.data[0] : null;

      if (!authorData || authorData.id === 0) { // Author still not found, add new author
        console.log(`Author '${authorName}' not found in Readarr lookup. Adding new author...`);
        const newAuthorPayload = {
          authorName: authorName,
          monitored: true,
          rootFolderPath: rootFolderPath,
          addOptions: {
            searchForMissingBooks: true,
          },
        };

        const addAuthorResponse = await axios.post(`${readarrUrl}/api/v1/author`, newAuthorPayload, {
          headers: { 'X-Api-Key': apiKey },
        });
        authorData = addAuthorResponse.data;
        console.log(`Successfully added author '${authorName}' to Readarr. New Author ID: ${authorData.id}`);
      } else {
        console.log(`Author '${authorName}' found in Readarr. Author ID: ${authorData.id}`);
      }
      readarrAuthorId = authorData.id; // Update the author ID
      fullAuthorObject = authorData; // Store the full author object
    } else {
      console.log(`Author '${authorName}' already exists in Readarr. Author ID: ${readarrAuthorId}`);
      // Fetch the full author object if it already exists
      const existingAuthorResponse = await axios.get(`${readarrUrl}/api/v1/author/${readarrAuthorId}`, {
        headers: { 'X-Api-Key': apiKey },
      });
      fullAuthorObject = existingAuthorResponse.data;
    }

    // Construct the payload for adding the book
    const payload = {
      title: bookToAdd.title,
      author: fullAuthorObject, // Include the full author object
      foreignBookId: bookToAdd.foreignBookId,
      foreignEditionId: bookToAdd.foreignEditionId,
      titleSlug: bookToAdd.titleSlug,
      releaseDate: bookToAdd.releaseDate || "0001-01-01T00:00:00Z",
      pageCount: bookToAdd.pageCount || 0,
      remoteCover: bookToAdd.remoteCover || null,
      genres: (bookToAdd.genres && bookToAdd.genres[0] !== "none") ? bookToAdd.genres : [],
      seriesId: bookToAdd.seriesId || 0,
      monitored: true,
      qualityProfileId: parseInt(qualityProfileId, 10),
      rootFolderPath,
      addOptions: {
        searchForNewBook: true,
      },
      editions: [{
        foreignEditionId: bookToAdd.foreignEditionId,
        isbn: book.isbn && book.isbn.length > 0 ? book.isbn[0] : null,
        monitored: true,
      }], // Always provide a single edition from the Open Library data
    };

    console.log('Sending payload to Readarr:', JSON.stringify(payload, null, 2));

    // Step 2: Add the book using the data from the lookup
    const addResponse = await axios.post(`${readarrUrl}/api/v1/book`, payload, {
      headers: { 'X-Api-Key': apiKey }
    });

    return addResponse.data;

  } catch (error) {
    const errorMessage = error.response ? JSON.stringify(error.response.data, null, 2) : error.message;
    // Check for the specific unique constraint error
    if (errorMessage.includes('UNIQUE constraint failed: Editions.ForeignEditionId')) {
      console.log(`Book '${book.title}' (Edition ID: ${bookToAdd.foreignEditionId}) is already in Readarr.`);
      // Return a success-like object to indicate it's already added
      return { message: 'Book already exists in Readarr.' };
    }
    console.error(`Error adding book to Readarr: ${errorMessage}`);
    return null;
  }
}

module.exports = { addBook };
