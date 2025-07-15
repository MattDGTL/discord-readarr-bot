# Discord Readarr Bot

This Discord bot allows users to search for books using the Open Library API and add them to a Readarr instance.

## Features

-   Search for books by title or author.
-   Select from a list of search results.
-   View book details, including cover image, author, and description.
-   Add books to Readarr with a single click.
-   Automatically adds authors to Readarr if they don't already exist.

## Prerequisites

-   Node.js
-   A Discord bot token
-   A Readarr instance with API key

## Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/MattDGTL/discord-readarr-bot.git
    ```
2.  Install the dependencies:
    ```bash
    cd discord-readarr-bot
    npm install
    ```
3.  Create a `.env` file in the `discord-readarr-bot` directory and add the following:
    ```
    DISCORD_TOKEN=your_discord_bot_token
    READARR_URL=http://your_readarr_instance:8787
    READARR_API_KEY=your_readarr_api_key
    READARR_QUALITY_PROFILE_ID=your_quality_profile_id
    READARR_ROOT_FOLDER_PATH=/path/to/your/readarr/root/folder
    ```
4.  To get your `READARR_QUALITY_PROFILE_ID`, run the following command:
    ```bash
    node get_readarr_profiles.js
    ```
    This will print a list of your available quality profiles with their corresponding IDs.

## Usage

1.  Start the bot:
    ```bash
    node src/index.js
    ```
2.  In a Discord channel where the bot is present, use the `!searchbook` command to search for a book:
    ```
    !searchbook The Hobbit
    ```
3.  The bot will respond with a dropdown menu of search results. Select a book to view its details.
4.  Click the "Add to Readarr" button to add the book to your Readarr instance.

## Docker Usage

Alternatively, you can run the bot using Docker.

1.  **Prerequisites:**
    *   Docker and Docker Compose must be installed.

2.  **Build and Run:**
    *   Make sure you have a correctly configured `.env` file in the root directory (as described in the Installation section).
    *   Run the following command to build and start the bot in the background:
        ```bash
        docker-compose up --build -d
        ```

3.  **Stopping the bot:**
    ```bash
    docker-compose down
    ```

## How it Works

The bot uses the following libraries:

-   `discord.js` to interact with the Discord API.
-   `axios` to make HTTP requests to the Open Library and Readarr APIs.
-   `dotenv` to manage environment variables.

When a user runs the `!searchbook` command, the bot does the following:

1.  Searches for the book on the Open Library API.
2.  Displays the search results in a dropdown menu.
3.  When the user selects a book, the bot displays the book's details in an embed.
4.  If the user clicks the "Add to Readarr" button, the bot:
    1.  Looks up the book on Readarr using its ISBN or title and author.
    2.  If the author doesn't exist in Readarr, it adds them.
    3.  Adds the book to Readarr using the data from the lookup.