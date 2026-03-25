# Invest Tracker Pro

A production-ready investment tracking web application for Indonesian investors to monitor stocks and mutual funds, set price alerts, and receive notifications via Telegram.

## Features

- **Portfolio Tracking** - Track your stock holdings with real-time valuations
- **Watchlist** - Monitor favorite Indonesian stocks (BBCA, BBRI, BMRI, etc.)
- **Price Alerts** - Get notified when stocks hit your target prices
- **Mutual Funds** - Track your investment fund holdings
- **Telegram Alerts** - Receive instant notifications via Telegram bot
- **Glassmorphism UI** - Beautiful dark theme with glass effects

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Auth + Database)
- **State**: Zustand
- **Charts**: Recharts
- **Deployment**: Vercel Ready

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Telegram Bot (for notifications)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd invest-tracker-pro
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env.local
```

4. Fill in your environment variables in `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Telegram (optional)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id

# Cron Security
CRON_SECRET=your_random_secret
```

### Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. Run the database migrations in your Supabase SQL Editor:
   - `lib/supabase/migrations/001_portfolio.sql`
   - `lib/supabase/migrations/002_watchlist.sql`
   - `lib/supabase/migrations/003_alerts.sql`
   - `lib/supabase/migrations/004_mutual_funds.sql`

3. Copy your Supabase URL and keys to `.env.local`

### Telegram Setup (Optional)

1. Open Telegram and search for @BotFather
2. Send `/newbot` to create a new bot
3. Copy the bot token to `TELEGRAM_BOT_TOKEN`
4. Start a chat with your bot
5. Send any message to the bot
6. Visit: `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
7. Copy your chat ID to `TELEGRAM_CHAT_ID`

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost) to view the app.

### Deployment to Vercel

1. Push your code to GitHub
2. Import project to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Protected dashboard pages
│   └── api/               # API routes
├── components/             # React components
│   ├── ui/                # Base UI components
│   ├── layout/            # Layout components
│   ├── dashboard/          # Dashboard components
│   ├── portfolio/          # Portfolio components
│   ├── watchlist/          # Watchlist components
│   ├── alerts/             # Alerts components
│   ├── mutual-funds/       # Mutual funds components
│   └── charts/             # Chart components
├── lib/                    # Utilities and libraries
│   ├── actions/            # Server actions
│   ├── supabase/           # Supabase clients
│   └── utils/              # Utility functions
├── store/                  # Zustand stores
└── types/                  # TypeScript types
```

## API Endpoints

- `GET /api/prices?ticker=BBCA` - Get stock price
- `POST /api/telegram/test` - Test Telegram notification
- `GET /api/cron/prices` - Cron job endpoint (every 5 min)

## Default Indonesian Stocks

The app comes with popular Indonesian stocks pre-configured:

- BBCA - Bank Central Asia
- BBRI - Bank Rakyat Indonesia
- BMRI - Bank Mandiri
- TLKM - Telkom Indonesia
- UNVR - Unilever Indonesia
- ASII - Astra International
- HMSN - Hansoh Brewery
- BRIS - BRISyariah

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License
