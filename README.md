# Event Ticketing Admin Panel

A comprehensive, beautiful admin dashboard for managing event ticketing operations. Built with Next.js, Neon Postgres, and Drizzle ORM.

## Features

### 🎫 Event Management
- Create physical and online events
- Flexible scheduling: one-time, daily, weekly, bi-weekly, monthly, or custom recurring patterns
- Custom age-based pricing tiers (e.g., Child $10, Adult $25, Senior $20)
- Free or paid events with capacity limits

### 📦 Package Builder
- **Ticket Bundles**: Family packs, group discounts (e.g., "2 Adults + 2 Kids")
- **Event Passes**: Season passes, multi-event bundles
- **Add-ons**: VIP upgrades, parking, meals, merchandise

### 🎨 Ticket Designer
- Pre-made professional templates (Modern Dark, Gradient Premium, Minimal White)
- Drag-and-drop visual editor
- Custom elements: text, QR codes, event details, customer info
- Styling controls: colors, fonts, positioning, opacity

### 👥 Customer Management
- Individual customer profiles with age tracking
- Family accounts with relationship linking (head, spouse, child, etc.)
- Purchase history and total spending stats
- Contact information and notes

### 💳 Transaction Center
- All payment methods: Card, Cash, Bank Transfer, PayPal, Other
- Advanced filtering: date range, status, payment method, amount
- Refund processing (full or partial)
- CSV export for accounting

### 📊 Report Builder
- **Sales Reports**: Revenue by day/event/payment method, trends, averages
- **Customer Reports**: Age distribution, top spenders, repeat customers
- Save report configurations for quick access
- Export to CSV

## Tech Stack
- **Frontend**: Next.js 16, React, Tailwind CSS, shadcn/ui
- **Database**: Neon Postgres + Drizzle ORM (API routes with live polling)
- **Styling**: Dark theme with purple/cyan accent gradients

## Admin Routes
- `/admin` - Dashboard overview
- `/admin/events` - Event management
- `/admin/packages` - Package builder
- `/admin/tickets` - Ticket designer
- `/admin/customers` - Customer management
- `/admin/transactions` - Transaction center
- `/admin/reports` - Report builder
