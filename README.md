# GharSeva — Local Home Service Platform

This ZIP is a runnable frontend prototype with Supabase database/auth integration.

## Included
- Modern responsive home page
- Customer + Service Provider registration
- Separate customer/provider profiles
- Provider expertise selection
- Location capture
- Nearby provider search (nearest first, 25 km default)
- Provider verification status
- Customer service requests
- Ratings/reviews database tables
- Admin dashboard foundation: providers, users, requests, services
- Social links editable in `js/config.js`
- Supabase SQL schema + RLS

## IMPORTANT: Phone OTP
The website UI supports phone OTP using Supabase Auth, but real SMS OTP requires you to configure a supported SMS provider in your Supabase project. SMS delivery is not automatically free.

Email OTP/magic-link login can be used for a simpler prototype.

## IMPORTANT: Aadhaar
Do NOT store a full Aadhaar number or Aadhaar image in a simple student prototype. This project stores only optional last-4 digits and an admin verification status. If real identity verification is later required, use a compliant identity-verification provider and proper security/legal controls.

## STEP 1 — Create FREE Supabase project
1. Open https://supabase.com/
2. Create an account and a new project.
3. Wait for the database to finish creating.
4. Open SQL Editor.
5. Paste ALL of `sql/setup.sql`.
6. Run it.

## STEP 2 — Get API settings
Supabase: Project Settings → API.
Copy:
- Project URL
- anon / public key

Open `js/config.js` and replace:
PASTE_YOUR_SUPABASE_PROJECT_URL
PASTE_YOUR_SUPABASE_ANON_PUBLIC_KEY

NEVER paste the `service_role` secret into this website.

## STEP 3 — Email authentication
Supabase Authentication → Providers → Email.
For easiest testing, configure email according to your Supabase project settings.

The registration creates an account and profile. The user then logs in through email magic link.

## STEP 4 — Phone OTP
Supabase Authentication → Providers → Phone.
Configure the SMS provider shown by your Supabase dashboard.
Then the "Send Mobile OTP" button can send real SMS OTPs.

## STEP 5 — Make an admin
1. Register one account from the website.
2. In Supabase → Authentication → Users, copy that user's UUID.
3. In SQL Editor run:
   update public.profiles set role='admin' where id='YOUR_UUID';
4. Login again. Admin Control Center will appear.

## STEP 6 — Run on laptop
Easiest:
1. Extract the ZIP.
2. Open the folder.
3. Double-click `index.html` for basic UI testing.

For auth/geolocation, use a local server:
- Install VS Code.
- Open this folder.
- Install "Live Server" extension.
- Right-click `index.html` → Open with Live Server.

OR with Python installed:
`python -m http.server 5500`
Then open:
`http://localhost:5500`

## STEP 7 — Free online link
After testing, you can deploy the folder to a static host such as GitHub Pages / Netlify / Cloudflare Pages.
Do not upload a Supabase service_role secret.

## What still needs production work
- Provider accept/reject request screen
- Real-time notifications/chat
- Secure private problem-photo/video storage
- Complete review UI
- Payment integration
- Provider document verification workflow
- Abuse/report system
- Stronger admin permissions and audit logs
- Terms, privacy policy and consent flows
- Production security review

This is intentionally a strong working prototype foundation rather than a production marketplace.
