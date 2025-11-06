# Prayer.so 🙏

A live audio prayer platform connecting believers worldwide in real-time prayer rooms.

## Features

### Live Prayer Rooms
- Join audio rooms on topics like healing, thanksgiving, family, and worship
- Host your own prayer rooms with up to 500 participants
- Real-time audio using LiveKit technology
- Text chat during prayer sessions
- Speaker management for organized prayer times

### Prayer Wall
- Share prayer requests with the community
- Give and receive "Amens"
- Respond with encouragement and support
- Filter by category and search requests
- Mark prayers as answered

### Circles
- Create private prayer groups for family, church, or friends
- Host exclusive prayer rooms for your circle
- Share private prayer requests
- Invite members to your community

### Modern Experience
- Progressive Web App (PWA) - install on any device
- Responsive design for mobile, tablet, and desktop
- Real-time updates and notifications
- Profile customization with photo upload

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage
- **Real-time Audio:** LiveKit
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Supabase account
- LiveKit account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/getmobilehq/prayso.git
cd prayso
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Add your credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_LIVEKIT_URL=your_livekit_url
```

4. Run database migrations:
- Go to your Supabase project
- Run migrations from `supabase/migrations/` in order

5. Deploy the edge function:
- Deploy `supabase/functions/generate-livekit-token` to your Supabase project

6. Start development server:
```bash
npm run dev
```

Visit http://localhost:5173

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.

### Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/getmobilehq/prayso)

### Environment Variables

Required for deployment:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `VITE_LIVEKIT_URL` - Your LiveKit WebSocket URL

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript type checking
```

## Project Structure

```
pray.so/
├── src/
│   ├── components/       # Reusable UI components
│   ├── contexts/         # React contexts (Auth, etc.)
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Page components
│   ├── services/        # API services
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   └── config/          # Configuration files
├── supabase/
│   ├── migrations/      # Database migrations
│   └── functions/       # Edge functions
├── public/              # Static assets
└── .github/
    └── workflows/       # CI/CD workflows
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security

Prayer.so takes security seriously:
- Row Level Security (RLS) enabled on all tables
- Secure authentication with Supabase Auth
- Environment variables for sensitive data
- Input validation and sanitization

See [SECURITY_SUMMARY.md](./SECURITY_SUMMARY.md) for details.

## License

Copyright © 2024 Prayer.so

## Support

- Website: https://prayer.so
- GitHub Issues: https://github.com/getmobilehq/prayso/issues

## Acknowledgments

- Built with [Supabase](https://supabase.com)
- Real-time audio powered by [LiveKit](https://livekit.io)
- Icons by [Lucide](https://lucide.dev)

---

Made with ❤️ for the prayer community
