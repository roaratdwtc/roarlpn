# Walkthrough: Car Expenses & Company Expenses / Sales SIMs Modules

Added dedicated management views for **Car Expenses & Fleet Maintenance** and **Company Expenses & Sales Agent SIMs**, each equipped with **8 KPI & report analytics cards**, comprehensive category trackers, and instant search/filtering.

---

## 1. Car Expenses & Fleet Maintenance (`CarExpensesView.jsx`)

### 8 KPI & Report Cards:
1. **Total Fleet Spend**: Total AED spent across all vehicle maintenance.
2. **Oil & Lube Service**: Total spent on scheduled engine oil & filter changes + service count.
3. **Tyres & Detailing**: Tyres replacements, puncture repairs, floor mats, and interior detailing.
4. **RTA Passing & Mulkiya**: RTA technical inspection tests and yearly vehicle registration renewals.
5. **Motor Insurance**: Commercial comprehensive vehicle insurance policy premiums.
6. **Accidents & Brakes**: Body repairs, denting/painting, brake pads, and battery replacements.
7. **Top Expensed Car**: Identifies the vehicle plate number with the highest maintenance overhead.
8. **This Month's Maintenance**: Real-time spending total for the current active month.

### Key Features:
- **Vehicle & Driver Selection**: Choose plate numbers from the registered fleet (`48590`, `94697`, etc.) or enter custom plates.
- **Categories**: `Car Passing`, `Tyre Change`, `Oil Change`, `Floor Mats & Detailing`, `Accidents & Body Repair`, `Insurance Renewal`, `Mulkiya Renewals`, `Battery & Brake Pads`, `Miscellaneous Car Expenses`.
- **Filters**: Instant live search, Category filter, Plate number filter, and Date range filter (All Time, This Month, Last Month, Custom Date Range).
- **CRUD Modals**: Add, edit, and delete maintenance records with invoice numbers, workshop names, odometer readings, and payment status.
- **Printable Reports**: Integrated Print / Export view for fleet expense audits.

---

## 2. Company Expenses & Sales SIMs (`CompanyExpensesView.jsx`)

### 8 KPI & Report Cards:
1. **Total Overheads**: Cumulative company operating expenses.
2. **Trade License & GDRFA**: DET, DTCM, and MoHRE government licensing costs.
3. **Office Rent & Ejari**: Commercial office leases and Ejari tenancy fees.
4. **Internet & Main Line**: Du/Etisalat landline hotline bills + high-speed fiber internet.
5. **Sales Agent SIMs**: Number of active sales phone lines and total monthly package spend.
6. **Office Supplies**: Pantry consumables, drinking water, and stationery expenses.
7. **Petty Cash Spent**: Small daily cash disbursements and miscellaneous operational expenses.
8. **Next Critical Renewal**: Expiry countdown alert for upcoming license or office renewals.

### Sub-Tabs:
- **Company Overheads Ledger**: Track bills, invoices, renewal due dates, vendors/authorities, and payment methods (`Bank Transfer`, `Card`, `Bank Cheque`, `Auto Debit`, `Cash`, `Petty Cash`).
- **Sales Agent SIMs & Numbers Directory**:
  - Track **which sales agent has which phone number** (`Du`, `Etisalat`, `Virgin`).
  - View agent department/role (`Inbound Sales & VIP Bookings`, `Outbound Leads & Partner Relations`, `Operations & Driver Dispatch`, etc.).
  - Monthly plan cost and SIM serial number (ICCID).
  - **One-click "Chat on WhatsApp"** button to directly initiate conversation with the sales agent.

---

## 3. Database Schema & Architecture

- Added `car_expenses`, `company_expenses`, and `company_sims` tables with type casting to `SafariCRM/public/api.php` and `public/api.php`.
- Integrated REST synchronization with auto-table generation on MySQL.
- Full offline fallback support with `localStorage` persistence.

---

## 4. Deployment Status

- **React Build**: Successfully compiled with Vite in 3.54s (`0 errors`).
- **Deployment Archive**: Updated `dist.zip` generated in the root folder ready for cPanel upload.
- **Git Repositories**: Committed and pushed to both `GitHub` (`origin/main`) and `GitLab` (`gitlab/main`).
