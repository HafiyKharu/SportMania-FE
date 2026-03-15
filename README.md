# SportMania-FE

SportMania-FE is a Next.js frontend for a subscription-based product. It supports two main experiences:

- Public users can browse plans and initiate payments.
- Admin users can sign in, manage plans, and inspect transaction history.

The application is a client-side frontend that communicates with an external backend API.

## Tech Stack

- Next.js 14 App Router
- React 18
- TypeScript
- Tailwind CSS
- Sonner for toast notifications

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

The development server runs on port `3000`.

## Environment

Set the backend API base URL with:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5235
```

If the variable is not set, the app falls back to `http://localhost:5235`.

## Project Structure

```text
src/
	app/
		page.tsx                    Public home page
		login/page.tsx              Login page
		plans/                      Admin plan management
		transactions/               Admin transaction management
	components/
		AuthGate.tsx                Route protection
		Navbar.tsx                  Top navigation
		LoadingSpinner.tsx          Shared loading state UI
		StatusBadge.tsx             Payment status label
	lib/
		api.ts                      Shared fetch wrapper
		auth.ts                     Session-based auth helpers
	services/
		authService.ts              Login API call
		planService.ts              Plan and media API calls
		transactionService.ts       Payment and transaction API calls
		keyService.ts               License key API calls
	types/
		index.ts                    Shared DTOs
```

## How The App Works

### Public Flow

1. A user lands on `/`.
2. The app loads available plans from the backend.
3. The user selects a plan and opens the subscription modal.
4. The modal validates email and phone number.
5. The app calls the payment initiation endpoint.
6. If a redirect URL is returned, the app opens the payment page in a new tab.
7. The backend can later route the user to success or failed transaction pages.

### Admin Flow

1. An admin opens `/login`.
2. The login page sends credentials to the backend.
3. On success, the app stores token, role, and email in `sessionStorage`.
4. Admin users are redirected to `/plans`.
5. From there, admins can create, edit, delete, and inspect plans, and view transactions.

## Authentication And Authorization

Auth is handled on the client.

- `src/lib/auth.ts` stores the token, role, and email in `sessionStorage`.
- `src/components/AuthGate.tsx` protects private routes.
- Public routes are `/` and `/login`.
- Other routes require a logged-in user.
- Admin-only navigation is shown conditionally in the navbar.

## API Integration

The shared API helper is in `src/lib/api.ts`.

It is responsible for:

- Prefixing requests with `NEXT_PUBLIC_API_BASE_URL`
- Attaching a bearer token when present
- Sending JSON headers for standard requests
- Throwing errors for non-success responses

Main service modules:

- `src/services/authService.ts`: login request
- `src/services/planService.ts`: plan CRUD, image upload, activation refresh
- `src/services/transactionService.ts`: payment initiation and transaction retrieval
- `src/services/keyService.ts`: license key lookup

## Main Data Models

Defined in `src/types/index.ts`:

- `PlanDto`: subscription plan data
- `PlanDetailDto`: plan feature/detail item
- `TransactionDto`: transaction record with customer, plan, and key info
- `CustomerDto`: customer profile data
- `KeyDto`: license key and activation data
- `PaymentResponseDto`: payment redirect payload

## Page-By-Page Code Flow

### `src/app/layout.tsx`

- Loads global styles.
- Wraps the app with `AuthGate` and `Navbar`.
- Mounts the Sonner toaster for feedback notifications.

### `src/app/page.tsx`

- Fetches all plans on mount.
- Renders the public pricing grid.
- Opens a modal for subscription checkout.
- Validates email and phone number in the client.
- Calls `transactionService.initiatePayment(...)`.
- Opens the returned payment URL in a new tab when successful.

### `src/app/login/page.tsx`

- Renders the admin login form.
- Calls `login(...)` from `authService`.
- Stores auth state through `setAuth(...)`.
- Redirects admins to `/plans` and non-admin users to `/`.

### `src/app/plans/page.tsx`

- Loads all plans for admin users.
- Shows a plan list with image, price, duration, and actions.
- Navigates to create, detail, edit, and delete routes.
- Includes an activation refresh action via `planService.refreshActivation()`.

### `src/app/plans/create/page.tsx`

- Loads existing media paths from the backend.
- Allows selecting or uploading a plan image.
- Validates name, description, category code, price, duration, and details.
- Creates a plan payload with generated IDs.
- Sends the request through `planService.createPlan(...)`.

### `src/app/plans/details/[id]/page.tsx`

- Loads a single plan by route id.
- Displays plan image, pricing, category code, and included details.
- Lets admins move to edit or back to the list.

### `src/app/plans/edit/[id]/page.tsx`

- Loads the existing plan and available media.
- Prefills the form with current plan data.
- Supports image upload and detail editing.
- Validates edited data.
- Sends updates through `planService.updatePlan(...)`.

### `src/app/plans/delete/[id]/page.tsx`

- Loads the selected plan.
- Shows a confirmation screen.
- Deletes the plan via `planService.deletePlan(...)`.

### `src/app/transactions/page.tsx`

- Loads all transactions.
- Displays them in a table with status badges.
- Links each row to the transaction detail page.

### `src/app/transactions/details/[id]/page.tsx`

- Loads a single transaction.
- Shows transaction info, customer info, plan info, and license key info.
- Supports copying the license key to the clipboard.

### `src/app/transactions/success/[id]/page.tsx`

- Loads transaction data for a successful payment.
- Displays plan name, amount, and the issued license key if available.

### `src/app/transactions/failed/[id]/page.tsx`

- Loads transaction data for a failed payment.
- Displays failure details and common failure reasons.

## UI Notes

- The app uses Tailwind utility classes throughout the UI.
- Shared animation classes and gradient styles live in `src/app/globals.css`.
- Toast messages are used widely for user feedback.

## Current Architecture Notes

- Most pages are client components and fetch data in the browser.
- The backend is expected to provide authentication, plans, transaction data, and payment redirects.
- Image uploads use `FormData` and direct `fetch(...)` instead of the shared JSON helper.
- There is an older token helper in `src/services/authService.ts` using `localStorage`, while the active app auth flow uses `sessionStorage` in `src/lib/auth.ts`.

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Set `NEXT_PUBLIC_API_BASE_URL` if your backend is not on `http://localhost:5235`.

3. Start the dev server:

```bash
npm run dev
```

4. Open `http://localhost:3000`.
