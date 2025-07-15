
# Discord Readarr Bot

A Discord bot that allows you to search for books on Open Library and add them to Readarr.

## Prerequisites

* Node.js
* A Discord bot token
* Your Readarr API key and URL

## Installation

1. Clone the repository.
2. Run `npm install` to install the dependencies.
3. Create a `.env` file in the root of the project and add the following:

   ```
   DISCORD_TOKEN=
   READARR_API_KEY=
   READARR_URL=
   ```

4. Fill in the values for your Discord bot token, Readarr API key, and Readarr URL.

## Running the bot

Run `npm start` to start the bot.

## Usage

To search for a book, type `!search <book title>` in a channel where the bot is present.

The bot will reply with an embed containing the book's information and a button to add it to Readarr.
