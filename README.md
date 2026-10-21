# Jana Kalyan — Co-operative Society Website

A fully responsive, ready-to-deploy website for a member-owned savings & loan
co-operative society, built to the attached requirements spec.

## 1. Folder structure

```
jana-kalyan/
├── index.html              Main content / landing page
├── login.html               Login + Sign up (Google, phone/email + password)
├── dashboard.html            Member dashboard
├── loans.html                 Kalyan loan application
├── profile.html                Member profile (nominee details)
├── admin.html                   Admin dashboard (all members' deposits/balance)
├── css/
│   ├── style.css               Design tokens + public page styles
│   └── dashboard.css           App-shell / sidebar layout (dashboard, admin, loans, profile)
├── js/
│   ├── script.js               Shared helpers, nav + sidebar toggles
│   ├── auth.js                 Login / signup logic (Google + phone/email)
│   ├── dashboard.js             Account statement, recent transactions, interest
│   ├── loans.js                  Kalyan loan calculator + amount→duration rules
│   ├── admin.js                   Members overview table
│   └── profile.js                 Nominee / photo editing
└── backend/
    ├── sql/schema.sql              Full MySQL schema (members, accounts, transactions, loans)
    └── java/com/janakalyan/
        ├── model/                  Member, Admin, Account, Transaction, Loan, User (OOP core)
        ├── db/DatabaseConnection.java   JDBC connector
        └── app/JanaKalyanApp.java  Swing desktop back-office application
```

Every language lives in its own file set, exactly as requested — no inline
`<style>` or `<script>` blocks beyond tiny per-page glue (e.g. the logout
button), which are left inline only because they are two lines long and
page-specific.

## 2. Requirements from the PDF — where each one lives

| Requirement | Implementation |
|---|---|
| Member photo shown on dashboard | `dashboard.html` `#member-photo`, rendered in `dashboard.js` |
| Rename "Recent Transaction" → "Account statement" (full history) | `dashboard.html` panel + `renderAccountStatement()` in `dashboard.js` |
| Rename "Recent deposit" → "Recent Transaction" (latest deposits) | `dashboard.html` panel + `renderRecentTransaction()` in `dashboard.js` |
| Admin sees every member's deposit & balance | `admin.html` + `admin.js`, `Admin.printAllMemberBalances()` in Java |
| Profile has nominee name, nominee ID, phone | `profile.html` + `profile.js` |
| 4% quarterly interest on 31/03, 30/06, 30/09, 31/12 | `applyQuarterlyInterestIfDue()` in `dashboard.js` **and** `Account.java` (server-side source of truth) |
| "Personal loan" renamed "Kalyan loan", 13% interest | `loans.html`, `loans.js`, `Loan.java` |
| Other loan types visible but disabled | `.loan-option.disabled` cards in `loans.html` |
| Loan duration dropdown linked to amount | `LOAN_DURATION_MAP` in `loans.js`, mirrored in `schema.sql` and `Loan.java` |

## 3. Running it locally (no backend required)

Because there's no server yet, `auth.js`/`dashboard.js`/`admin.js` transparently
fall back to `localStorage` so you can click through every screen immediately:

1. Open `index.html` in a browser (or serve the folder with any static
   server, e.g. `npx serve .`).
2. Sign up as a member on `login.html`, or log in as the demo admin with
   `admin` / `admin123`.
3. Everything — deposits, interest, loan applications, profile edits — is
   stored in the browser's `localStorage` under the `jk_members` key.

## 4. Going live with a real backend

The frontend already calls a REST API (`JK.api()` in `js/auth.js`) — it just
falls back to `localStorage` when that API isn't reachable. To go live:

1. **Stand up an API** in front of the MySQL database (`backend/sql/schema.sql`).
   A small Spring Boot or Node/Express service works well; reuse the same
   business rules already written in `backend/java/com/janakalyan/model/`
   (interest calculation, loan duration table) so the frontend, the desktop
   app, and the API all agree.
2. **Point `API_BASE_URL`** in `js/auth.js` at your deployed API
   (e.g. `https://api.janakalyan.org`).
3. **Set `FALLBACK_TO_LOCAL_STORAGE = false`** in `js/auth.js` once the API
   is confirmed working, so the site never silently uses local demo data.
4. **Hash passwords** server-side (bcrypt/argon2) — the demo store keeps
   plain text only so it's readable during local testing; never do this
   in production.
5. **Google sign-in**: replace the `prompt()`-based demo in `auth.js` with
   the real [Google Identity Services](https://developers.google.com/identity/gsi/web)
   script, and verify the returned ID token server-side before creating a
   session.

Expected API endpoints (already called from the frontend):

```
POST   /api/auth/signup            { name, email|phone, password, provider }
POST   /api/auth/login              { identifier, password }
POST   /api/auth/google              { email, name }
GET    /api/members/:id                Member profile + transactions
PUT    /api/members/:id                 Update profile / nominee
POST   /api/members/:id/deposit          Record a deposit
POST   /api/members/:id/interest          Record a quarterly interest credit
POST   /api/loans/apply                    Submit a Kalyan loan application
GET    /api/admin/members                   All members' deposits & balances
```

## 5. The Java desktop application

`backend/java/com/janakalyan/app/JanaKalyanApp.java` is a Swing back-office
tool for staff — separate from the public website — for recording deposits,
running the quarterly interest job, and reviewing loan durations, built on
core OOP principles (encapsulation in `Account`, inheritance from `User` to
`Member`/`Admin`, polymorphism via `dashboardSummary()`).

To compile and run (requires JDK 17+ and, for real DB use, the
[MySQL Connector/J](https://dev.mysql.com/downloads/connector/j/) jar on
your classpath):

```bash
cd backend/java
javac -d out com/janakalyan/model/*.java com/janakalyan/db/*.java com/janakalyan/app/*.java
java -cp out com.janakalyan.app.JanaKalyanApp
```

## 6. Deployment checklist

- [ ] Point `js/auth.js` `API_BASE_URL` at your live API and disable the local fallback.
- [ ] Serve `index.html`/`login.html`/etc. from any static host (Netlify, Vercel, Nginx, S3+CloudFront).
- [ ] Run `backend/sql/schema.sql` against your production MySQL instance.
- [ ] Deploy the API layer that talks to that database.
- [ ] Schedule the quarterly interest job (31/03, 30/06, 30/09, 31/12) on the server — don't rely on a member logging in that day.
- [ ] Replace the demo Google sign-in with a real OAuth Client ID.
- [ ] Enforce HTTPS everywhere; hash all passwords server-side.
