# PR Guardian --- AI-Powered Pull Request Reviewer

PR Guardian is an AI-powered code-review application that analyzes
GitHub pull requests for potential bugs, security concerns, performance
issues, code-quality problems, and testing gaps. It retrieves
pull-request metadata and changed-file diffs, sends the changes to a
configurable AI provider, validates the returned findings, and generates
a Markdown review report.

The project includes a standalone web dashboard, a REST API, and an MCP
server so that the review capabilities can be used both through the
application and by compatible AI clients.

> **Project status:** Core pull-request retrieval, AI review, report
> generation, and the dashboard review flow have been implemented.
> Automated GitHub webhook reviews, posting inline review comments, and
> applying fixes are not implemented yet.

## Features

-   **GitHub pull-request inspection** --- fetches pull-request details
    and changed files.
-   **Diff-based AI review** --- analyzes the changed code rather than
    asking the model to review an entire repository.
-   **Multiple AI-provider architecture** --- uses a shared provider
    interface and factory so providers can be selected through backend
    configuration.
-   **Finding validation** --- checks AI-generated findings against the
    supplied pull-request changes.
-   **Markdown reports** --- generates and saves a report under the
    local `reports/` directory.
-   **Web dashboard** --- submit a repository owner, repository name,
    and pull-request number; inspect the review summary and findings.
-   **MCP tools** --- exposes pull-request operations to compatible MCP
    clients through NitroStack.

## Architecture

``` text
                         PR Guardian
                              |
              +---------------+---------------+
              |                               |
        React dashboard                  MCP clients
              |                               |
        Express REST API               NitroStack MCP server
              |                               |
              +---------------+---------------+
                              |
                       GitHub module
                              |
                 Pull request + changed files
                              |
                       AI provider
                              |
                     Review validator
                              |
                      Report service
                              |
                 Markdown report in reports/
```

### Main components

  -----------------------------------------------------------------------
  Component                           Responsibility
  ----------------------------------- -----------------------------------
  `frontend/`                         React + TypeScript dashboard built
                                      with Vite

  `src/api/server.ts`                 Express REST API used by the
                                      dashboard

  `src/modules/github/`               GitHub pull-request and
                                      changed-file retrieval; review tool

  `src/modules/ai/`                   AI provider interface, provider
                                      selection, and finding validation

  `src/modules/report/`               Markdown report generation and
                                      local report storage

  `src/app.module.ts` and             NitroStack MCP application setup
  `src/index.ts`                      

  `reports/`                          Generated Markdown review reports
  -----------------------------------------------------------------------

## MCP tools

The MCP server provides the following tools:

  -----------------------------------------------------------------------
  Tool                                Description
  ----------------------------------- -----------------------------------
  `get_pull_request`                  Retrieves metadata for a specified
                                      GitHub pull request

  `get_pull_request_files`            Retrieves the files changed in a
                                      pull request, including available
                                      patches

  `review_pull_request`               Fetches the pull request and its
                                      changed files, runs the AI review,
                                      validates findings, and generates a
                                      Markdown report
  -----------------------------------------------------------------------

Tool inputs use the repository owner, repository name, and pull-request
number.

## Technology stack

-   **TypeScript / Node.js** --- backend implementation
-   **NitroStack** --- MCP server and tool framework
-   **GitHub REST API** --- pull-request metadata and diff retrieval
-   **Gemini / Groq provider integrations** --- AI review providers
    (depending on the configured provider and available implementation)
-   **Express** --- REST API for the dashboard
-   **React + Vite** --- frontend
-   **Lucide React** --- dashboard icons

## Run locally

### Prerequisites

-   Node.js and npm
-   A GitHub personal access token with permission to read repository
    metadata, pull requests, and repository contents for the
    repositories you want to review
-   An API key for the AI provider configured in the backend
-   Git

### 1. Clone the repository

``` bash
git clone https://github.com/ganesh1729-bit/pr-guardian
cd pr-guardian
```

### 2. Install backend dependencies

``` bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root. Do not commit this file.

``` env
GITHUB_TOKEN=your_github_token

AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
AI_MODEL=your_supported_model_name

API_PORT=3000
FRONTEND_URL=http://localhost:5174
```

Use the provider-specific variables required by the provider you select.
For a Groq configuration, provide the Groq API key and select the
provider name supported by the current `ai.factory.ts` implementation.
Check `.env.example` and the provider factory in the repository for the
exact supported names and model settings.

**Security:** Never put API keys in frontend code, commit them to Git,
or include them in screenshots or public issue reports. If a key is
accidentally exposed, revoke it and create a replacement.

### 4. Start the MCP development server

In a terminal at the project root:

``` bash
npm run dev
```

This starts the NitroStack development workflow. Follow the terminal
output for the MCP transport and any local development URLs.

### 5. Start the REST API

Open a second terminal at the project root:

``` bash
npx tsx src/api/server.ts
```

The API listens on the port configured by `API_PORT` (default: `3000`).

Check that it is running:

``` text
http://localhost:3000/api/health
```

Expected response:

``` json
{
  "status": "PR Guardian API is running"
}
```

### 6. Start the frontend

Open another terminal:

``` bash
cd frontend
npm install
npm run dev
```

Open the exact local URL printed by Vite. The port may change if the
default port is already in use. Set `FRONTEND_URL` in the backend `.env`
to match the frontend origin, then restart the REST API if you change
it.

## Using the dashboard

1.  Open the PR Guardian dashboard.
2.  Select **New Review**.
3.  Enter the GitHub repository owner, repository name, and pull-request
    number.
4.  Select **Start AI review**.
5.  Open **Reports** to inspect the repository, pull-request title,
    overall risk, files analyzed, findings, evidence, and generated
    Markdown report.

The dashboard currently keeps review history in React state. It is not a
persistent database-backed history, so the list resets when the page is
refreshed. Generated Markdown files are saved by the backend in the
`reports/` directory.

## REST API

### Health check

``` http
GET /api/health
```

### Run a pull-request review

``` http
POST /api/review
Content-Type: application/json
```

Example request:

``` json
{
  "owner": "pallets",
  "repo": "flask",
  "pull_number": 5918
}
```

The endpoint returns the pull-request details, number of files reviewed,
AI review result, generated Markdown report, and report file path.

## Example test repositories

You can test the application with public pull requests that are
accessible through the GitHub API. For example:

-   [Node.js --- PR #67122](https://github.com/nodejs/node/pull/67122)
-   [Flask --- PR #5918](https://github.com/pallets/flask/pull/5918)

AI-generated findings are suggestions, not guaranteed defects. Review
the cited file, line, and evidence before acting on a finding. The
current validation stage is intended to reduce unsupported findings, but
it does not guarantee that every finding is correct or that every defect
will be detected.

## Current limitations

-   The application is currently initiated by a user or an MCP client;
    automatic review on every newly opened PR via GitHub webhooks is not
    implemented.
-   Findings are shown in the PR Guardian dashboard and Markdown report;
    automatic inline comments on GitHub are not implemented.
-   The application does not automatically modify source files, push
    commits, or merge pull requests.
-   Review history in the frontend is session state rather than
    persistent database storage.
-   AI output can contain false positives or miss real defects. Human
    review is required.
-   Large pull requests may require additional handling for diff size,
    API pagination limits, and model context limits.

## Future work

-   GitHub webhook integration for automatic review when a PR is opened
    or updated.
-   Inline review comments on changed GitHub lines.
-   Improved evidence and changed-line validation to reduce false
    positives.
-   Suggested patches with explicit developer approval before applying
    changes.
-   Re-review after new commits and CI/CD integration.
-   Persistent review history, user accounts, and team settings.

## Repository structure

``` text
pr-guardian/
├── frontend/
│   └── src/
├── reports/
├── src/
│   ├── api/
│   ├── modules/
│   │   ├── ai/
│   │   ├── github/
│   │   └── report/
│   ├── app.module.ts
│   └── index.ts
├── .env.example
├── .gitignore
├── package.json
└── tsconfig.json
```

## Acknowledgements

Built using the GitHub REST API, NitroStack, and AI model provider APIs.
