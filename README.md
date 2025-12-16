# ScanForm — Escaneo de Contenido Web (Demo)

ScanForm is a professional demo application designed to test Cloudflare's Web Content Scanning functionality. It enables users to submit a form along with a file upload, visualize upload progress, and receive a simulated scan report. Built on the Vite Cloudflare Durable Objects template, it leverages React with Shadcn UI for the frontend, Hono for the API worker, and Cloudflare Workers with Durable Objects for metadata persistence.

## Key Features

- **Elegant File Upload Interface**: Drag-and-drop file uploader with preview support for images, progress indicators, and validation.
- **Form Integration**: Optional metadata fields (title, description) accompanying file uploads.
- **Simulated Scanning**: Backend processes multipart/form-data requests, simulates analysis, and persists scan metadata in Durable Objects.
- **Real-Time Feedback**: Polling for scan status updates, with loading states, success/error handling, and toast notifications.
- **Scan History**: Paginated list of previous scans with filters (date, status) and detailed views.
- **Responsive Design**: Mobile-first UI with smooth animations, hover effects, and flawless cross-device layouts.
- **Secure & Scalable**: Metadata-only storage (no raw files in DOs), CORS-enabled APIs, and size limits for uploads.

The application provides a fully functional MVP for Phase 1, deployable and demoable immediately. Future phases can integrate real Web Content Scanning APIs.

## Technology Stack

- **Frontend**: React 18, React Router 6, TypeScript, Tailwind CSS 3, Shadcn/UI components
- **State Management**: Zustand (minimal usage), React Hook Form, Zod for validation
- **UI/UX Enhancements**: Framer Motion (animations), Lucide React (icons), Sonner (toasts), React Dropzone (file upload)
- **Backend**: Hono 4 (API framework), Cloudflare Workers
- **Persistence**: Durable Objects (via custom IndexedEntity library), no external databases
- **Data Fetching**: TanStack Query (optional caching/polling)
- **Build Tools**: Vite, Bun (package manager), Wrangler (Cloudflare deployment)
- **Utilities**: Date-fns (date handling), UUID (IDs), Immer (immutable updates)

## Quick Start

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/dgonzalezfernandez-a11y/scanform-escaneo-de-contenido-web-demo)

Get started in minutes by deploying to Cloudflare Workers.

## Installation

This project uses Bun as the package manager for faster setup and development.

1. Clone the repository:
   ```
   git clone <repository-url>
   cd scanform
   ```

2. Install dependencies:
   ```
   bun install
   ```

3. (Optional) Generate TypeScript types for Cloudflare bindings:
   ```
   bun run cf-typegen
   ```

## Development

1. Start the development server (runs frontend on port 3000 and proxies API to Worker):
   ```
   bun run dev
   ```

2. In a separate terminal, start the Worker in local mode (for API testing):
   ```
   npx wrangler dev
   ```

3. Open http://localhost:3000 in your browser. The app will be available for testing uploads and scans.

### Environment Setup

- No additional environment variables are required for development.
- For production, ensure your Cloudflare account has Workers enabled and the Durable Object binding (`GlobalDurableObject`) is configured (handled automatically via Wrangler).

### Linting and Formatting

- Run ESLint:
  ```
  bun run lint
  ```

- The project uses TypeScript for type safety and includes strict mode.

## Usage

### Frontend Views

- **Home (/)**: Main landing page with upload form, file dropzone, and immediate scan results. Users can add optional form fields and upload files (max 20MB recommended).
  
- **Scans (/scans)**: Paginated list of scan history using ScanCard components. Filter by date or status (processing, completed, flagged, error).

- **Scan Detail (/scans/:id)**: Detailed view of a scan with metadata (filename, size, MIME type), simulated report summary, and actions (retry, download metadata JSON).

### API Endpoints

All APIs are under `/api/` and return JSON responses with `ApiResponse<T>` structure.

- **POST /api/scan**: Submit form with file (multipart/form-data). Returns scan ID and initial status. Simulated processing updates status asynchronously.
  
  Example (using fetch):
  ```javascript
  const formData = new FormData();
  formData.append('title', 'Test Scan');
  formData.append('description', 'Sample file upload');
  formData.append('file', fileInput.files[0]);

  const response = await fetch('/api/scan', {
    method: 'POST',
    body: formData
  });
  const result = await response.json();
  // { success: true, data: { id: '...', status: 'processing' } }
  ```

- **GET /api/scans**: List scans with optional `cursor` and `limit` query params for pagination.

- **GET /api/scans/:id**: Retrieve detailed scan metadata and report.

### File Upload Flow

1. User fills optional form fields and selects/drags a file.
2. On submit, frontend shows progress bar and polls `/api/scans/:id` every 1s.
3. Backend creates `ScanEntity` with status 'processing', simulates analysis (basic MIME/size checks), and updates to 'completed' with a verdict.
4. Frontend displays ScanCard with summary; history persists across sessions.

**Notes**:
- Files are not stored server-side (metadata only) to avoid DO storage limits.
- Uploads are limited client-side; large files (>20MB) may fail due to Worker memory constraints.
- Simulated verdicts: 'clean', 'flagged' (random for demo), or 'error'.

## Deployment

Deploy to Cloudflare Workers for edge execution with global CDN distribution.

1. Build the project:
   ```
   bun run build
   ```

2. Deploy using Wrangler:
   ```
   bun run deploy
   ```

   This bundles the Worker, uploads assets, and deploys the frontend as a static site with Worker-first routing (APIs handled by Worker, static files served directly).

3. Access your deployed app at `<your-worker>.<your-subdomain>.workers.dev`.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/dgonzalezfernandez-a11y/scanform-escaneo-de-contenido-web-demo)

### Production Considerations

- **Custom Domain**: Use `wrangler deploy --name my-scanform` and configure a custom domain in the Cloudflare dashboard.
- **Bindings**: The single `GlobalDurableObject` binding handles all persistence; no additional setup needed.
- **Scaling**: Durable Objects scale automatically; monitor usage via Cloudflare dashboard.
- **Security**: APIs include CORS for '*'; add authentication in future phases if needed.
- **Limits**: Worker execution timeout is 30s (unbound for paid); keep scans lightweight.

For real Web Content Scanning integration (Phase 2), add Cloudflare API bindings via Wrangler configuration (consult Cloudflare docs for credentials).

## Contributing

Contributions are welcome! Please:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/scan-enhancement`).
3. Commit changes (`git commit -m 'Add scan filtering'`).
4. Push to the branch (`git push origin feature/scan-enhancement`).
5. Open a Pull Request.

Ensure code follows TypeScript best practices, and test thoroughly. Focus on visual polish and error handling.

## License

This project is licensed under the MIT License. See the LICENSE file for details.