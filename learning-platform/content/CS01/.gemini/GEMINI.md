# GEMINI Project Context: CS01 Docs

## Directory Overview

This directory contains the source code for a Jekyll-based static website. The website is an interactive case study titled "NewCo Term Sheet Negotiation: A Case Study," designed for law students, business students, and entrepreneurs. It simulates a real-world negotiation between a technology startup (NewCo) and a corporate investor (BigTech) to teach concepts of venture financing and intellectual property commercialization.

The content is organized into several modules, covering the foundations of the deal, the term sheet, the negotiation exercise, and financials. There is also a separate section with confidential materials for instructors.

## Key Files

*   `_config.yml`: The main Jekyll configuration file. It sets the site's theme, title, and description.
*   `index.md` & `*.md`: These Markdown files represent the core content of the website. Each file corresponds to a page or a module in the case study.
*   `_data/navigation.yml`: This YAML file defines the structure of the main navigation menu for the website, linking to the different modules.
*   `instructor/`: This directory contains materials specifically for instructors or facilitators of the case study, including guides and confidential information.
*   `_layouts/`, `_includes/`, `assets/`: These are standard Jekyll directories that control the site's HTML structure, reusable components, and assets like CSS and JavaScript.
*   `Gemfile`: This file lists the Ruby gems (dependencies) required to build and run the Jekyll site, specifically using the `github-pages` gem to ensure compatibility.
*   `_site/`: This directory contains the fully generated static website. **Note:** This directory is the output of the build process and should not be edited directly, as any changes will be overwritten.
*   `api/analyze.js`: A Node.js serverless function that analyzes uploaded term sheets using the Gemini API.
*   `assets/js/term-sheet-analyzer.js`: Frontend JavaScript for handling file uploads and displaying analysis results.
*   `term-sheet-analysis-plan.ai.md`: A document outlining the implementation plan for the term sheet analyzer feature.

## Term Sheet Analyzer

This project includes an AI-powered term sheet analyzer. Users can upload their term sheet documents (`.docx` or `.pdf`). The system will then use the Gemini API to analyze the document in the context of the case study, providing feedback and negotiation suggestions.

The analyzer consists of:
*   A frontend component for file uploads, located in `03-the-exercise.md` and powered by `assets/js/term-sheet-analyzer.js`.
*   A serverless backend function in `api/analyze.js` that handles the analysis.
*   Supabase for file storage.

## DealCraft AI Negotiation

This project also includes a simulated negotiation exercise called DealCraft. Users can upload their term sheet, choose a role (NewCo or BigTech), and negotiate with an AI opponent to get the best deal for their side.

The DealCraft feature consists of:
*   A frontend chat interface in `03-the-exercise.md`, powered by `assets/js/dealcraft.js`.
*   A serverless backend function in `api/negotiate.js` that manages the negotiation session and generates AI responses using the Gemini API.
*   Supabase for storing negotiation history and session data.

## Deployment

The live version of this project, including the Term Sheet Analyzer, is deployed on Vercel and can be accessed at:
[https://cs-01.vercel.app/](https://cs-01.vercel.app/)

## Usage and Development

This is a Jekyll project with a Node.js serverless function. To work with it locally, you will need Ruby, Bundler, and Node.js installed.

1.  **Install Dependencies:**
    Navigate to this directory in your terminal and run the following command to install the required gems specified in the `Gemfile`:
    ```bash
    bundle install
    ```
    To use the serverless function, you will also need to install the Node.js dependencies:
    ```bash
    npm install --prefix api
    ```

2.  **Run the Local Server:**
    To build the Jekyll site and run the serverless function locally for development, it is recommended to use the Vercel CLI:
    ```bash
    vercel dev
    ```
    This command will handle running both the Jekyll server and the Node.js function.

    Alternatively, you can run the Jekyll server independently:
    ```bash
    bundle exec jekyll serve
    ```
    However, `vercel dev` is preferred to have the full application running.

3.  **View the Site:**
    Once the server is running (either with `vercel dev` or `jekyll serve`), you can view the website by opening your browser and navigating to the URL provided by the command (typically `http://localhost:3000` for `vercel dev` or `http://localhost:4000` for Jekyll).

Any changes made to the Markdown files (`.md`) or other source files will be automatically detected, and the site will be regenerated.