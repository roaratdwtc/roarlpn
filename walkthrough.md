# Walkthrough: Auto-Apply Off-Peak Season Coupon Discounts on All Packages

Implemented the option to automatically apply the seasonal off-peak coupon code across all packages in both the CRM Bookings system and the Customer Booking Portal.

---

## 1. Features Added & Updated

### A. Central Seasonal Control in `PackagesView.jsx`:
- Added a prominent **Auto-Apply Off-Peak Season Coupon (All Packages)** control card right above the packages directory and coupons manager.
- **Toggle Button**: 1-click enable/disable for auto-applying off-peak rates across all packages.
- **Coupon Selector**: Allows selecting which coupon code represents the off-peak seasonal promotion (defaults to `RoarSummerOffer26`, or any active universal promo code).
- **Universal Package Mapping**: Universal coupons (`packageId === 'all_safari'` or `'all_packages'`) now apply to **all packages** in the catalog (Morning, Evening, Self-Drive, Dune Buggy, and City Tours).

### B. Admin & Staff Bookings in `BookingsView.jsx`:
- When adding a new booking:
  - If auto-apply off-peak is enabled, the booking form automatically initializes with:
    - `pricingType: 'offpeak'`
    - `couponCode: 'RoarSummerOffer26'` (or the configured seasonal coupon)
    - Automatically calculates the discounted price using each package's `offpeakRate`.
  - When switching packages in the dropdown, the off-peak rate is automatically maintained.
- **In-Modal 1-Click Seasonal Toggle**:
  - Added a dedicated status banner and switch button right inside the booking modal:
    - Displays: `⚡ Off-Peak Season Discount Active (All Packages)`
    - Allows staff to toggle between Peak (Standard) and Off-Peak (Discounted) with 1 click.

### C. Customer Booking Portal in `CustomerBookingView.jsx`:
- When auto-apply off-peak is active:
  - The portal automatically unlocks and applies the off-peak seasonal coupon code.
  - All package base rates display with the peak rate crossed out and the discounted off-peak rate highlighted.
  - Added an announcement banner: `🎉 Off-Peak Season Discount Automatically Applied on All Packages!`.
  - Bookings placed online automatically record the off-peak discount and coupon code in the CRM database.

---

## 2. Verification & Build
- `npm run build`: Vite build succeeded in 4.38s with 0 errors.
- `dist.zip`: Packaged in the root directory for cPanel deployment.
- Git: Pushed to both **GitHub** (`origin/main`) and **GitLab** (`gitlab/main`).
