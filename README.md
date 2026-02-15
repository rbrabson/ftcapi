# FTC API Frontend

React frontend for the ftcstanding HTTP server API from `github.com/rbrabson/ftcstanding/server`.

## Features

- Configurable API base URL (`VITE_API_BASE_URL`)
- Data-view selector for all documented server routes
- Inputs for required filter options (season, region, event, team, limit)
- One-click data loading for the selected view
- Tabular output modeled after the CLI presentation style
- Light/dark mode toggle with saved preference

## Supported Endpoints

- Health Check
- Teams
- Team Details
- Event Teams
- Event Rankings
- Event Awards
- Event Advancement
- Event Matches
- Team Rankings
- Team Event Rankings
- Region Advancement
- Advancement Summary

## Setup

1. Install dependencies:

    ```bash
    npm install
    ```

2. Configure environment:

    ```bash
    cp .env.example .env
    ```

3. Start dev server:

    ```bash
    npm run dev
    ```

The app runs on `http://localhost:5173` by default.

## Notes

- Default API URL is `http://localhost:8080`.
- Server must be running for requests to succeed.
