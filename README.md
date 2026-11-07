# Lakou — botanica marketplace (prototype)

A clickable prototype of a Kreyòl-first marketplace where Haitian botanicas sell supplies,
take bookings for readings and baths, and post ceremonies. Customers and shop owners use the
same React app; a button in the header switches between the two views.

Everything runs in the browser on sample data. Every shop, person, price and review is invented.

## Run it

```bash
npm install
npm run dev              # local dev server
npm test                 # unit tests for prices, cart totals, hours and booking slots
npm run build            # production web build in dist/
npm run build:artifact   # one self-contained HTML file in dist-artifact/lakou.html
```

Requires Node 18 or newer. Stack: React 18 + Vite, no other runtime dependencies.

## What you can click through

**Customer view**
- Home: Fèt Gede banner, search, shops, upcoming ceremonies, supplies by category
- Shop page: services (instant booking, by-consultation requests, private inquiries), supplies, ceremonies, hours, house rules, reviews
- Product sheet: pickup or shipping; rum, cigars and sacred items show as in-store only and can't be bought online
- Cart: one order per shop, pickup or flat-rate shipping, discreet packaging, 7% sample sales tax
- Booking: format, date, open time slots (one hour of notice, finishes before closing), private note, a "no promised outcome" acknowledgment
- Ceremonies: public RSVP, tickets, invitation requests, Google Calendar link
- Me: recommendations from a reading (one tap to add to cart), bookings and quotes, orders with pickup codes, privacy settings

**Shop owner view** (Lakou Ginen Botanica)
- Today: weekly numbers, everything waiting for a reply, upcoming appointments
- Send a recommendation after a reading; it appears on the customer's Home and Me pages
- Inbox: quote a lave tèt request, approve invitations, mark orders ready or shipped
- Ceremonies: post an event; it appears immediately in the customer view
- Catalog: stock on/off, add products (age-gated and sacred items stay off online checkout), change how each service books

## Code map

```
src/
  data/seed.js        sample shops, products, services, events, reviews
  lib/logic.js        pure functions: money, cart totals, payouts, hours, slots, calendar links
  lib/logic.test.js   unit tests for the above
  lib/store.jsx       app state (one reducer); each slice maps to a future database table
  lib/router.jsx      small path router (memory mode inside the artifact)
  lib/format.js       date formatting in English and Kreyòl
  i18n.js             UI strings, English and Kreyòl
  components/         UI kit, drawn product art, cards, header and tab bar
  pages/              customer pages and sheets (product, booking, event)
  owner/Owner.jsx     shop owner pages and sheets (recommendation, quote)
  styles.css          design tokens (light and dark) and all styles
```

## Before it's a real product

1. **Kreyòl review.** `src/i18n.js` is a first draft. Have native speakers and practitioners review every string.
2. **Backend.** Replace `lib/store.jsx` with real queries. The product brief lists the tables; a hosted Postgres such as Supabase gives auth, row-level security and storage.
3. **Payments.** Stripe Connect, one connected account per shop. Never hold shop money in a platform account.
4. **Auth.** Phone or email sign-in; shop staff roles; an admin role for verification and disputes.
5. **Notifications.** Neutral wording by default ("Your order is ready for pickup").
6. **Routing.** The tiny router works with real URLs in the web build; swap in React Router when it grows.
7. **Legal.** Florida rules on paid readings and herbal products, terms of service, refund policy.
