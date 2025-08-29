# 🎉 EventFlow – AI-Powered Event Management Platform

EventFlow is a full-stack web platform for **event creation, attendee management, engagement, and post-event analytics**.  
It empowers **organizers** with dashboards, AI scheduling, and QR-based check-ins, while **attendees** enjoy smart recommendations, e-tickets, live engagement, and personalized insights.

---

## ✨ Features

### 👩‍💼 Organizers
- Create and manage events with **venue, schedule, sessions, and attendees**.
- Organizer dashboard with analytics: registrations, check-ins, engagement stats.
- AI **Schedule Assistant** that avoids clashes and balances session lengths.
- QR-code based **check-in system** (scan attendee tickets at entry).
- Post-event **insights and reports** delivered automatically.

### 🙋 Attendees
- **Smart Registration** with e-tickets + QR codes sent via email.
- Event **recommendations** based on interests and past activity.
- Interactive **Engagement Hub**: live chat, Q&A, polls, gamified leaderboard.
- **AI Event Assistant** that answers FAQs (where is Session X, how to register, etc).
- Personalized **post-event insights**.

### 🤖 AI
- Schedule optimization (avoiding conflicts).
- Natural-language Q&A assistant for event/session queries.
- Recommendation engine based on user behavior and website usage tracking.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js (App Router) + TailwindCSS
- **Backend:** Next.js API Routes + Prisma
- **Database:** PostgreSQL / Supabase (with pgvector for AI embeddings)
- **Authentication:** NextAuth.js (planned)
- **Emails:** Resend (e-tickets, confirmations)
- **Analytics:** PostHog
- **QR Codes:** `qrcode` + `@zxing/browser`
- **Fonts:** 
  - Navigation Bar → `LL Letterra`
  - Content → `NType 82 Mono`
- **Background Theme:** Gradient (`#FFFFFF` dominant with subtle `#8A78BA` and `#592CD5`)

---

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/eventflow.git
cd eventflow
pnpm install
```

### 2. Environment Variables
Create a `.env` file:
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/eventflow"
QR_SECRET="your-secret-key"
RESEND_API_KEY="your-resend-api-key"
NEXT_PUBLIC_POSTHOG_KEY="your-posthog-key"
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

### 3. Database Setup
Using **Supabase** (recommended):
1. Create a free Supabase project.
2. Copy your project’s DB connection string → put in `.env` as `DATABASE_URL`.
3. Enable `pgvector` extension from the SQL editor.
4. Run migrations:
   ```bash
   npx prisma migrate dev --name init
   ```

### 4. Fonts Setup
- Add licensed font files into `public/fonts/`:
  - `LL_LETTERA.woff2`
  - `NType82Mono.woff2`
- `globals.css` already includes `@font-face` rules.

### 5. Run Dev Server
```bash
pnpm dev
```
Visit: [http://localhost:3000](http://localhost:3000)

---

## 🧪 Test Flow (MVP)

1. **Create Event (DB seed)** → Add event via Prisma or API.  
2. **Register Attendee** → Go to `/events/[id]` → fill form → e-ticket with QR is emailed.  
3. **Check-in** → Open `/scan` → scan attendee QR → marked as checked-in.  
4. **Engage** → Attendees join polls, Q&A, chat.  
5. **AI Assistant** → Ask event-related questions.  
6. **Post-event** → Both organizers and attendees receive insights.

---

## 📊 Roadmap

- [ ] Authentication with NextAuth.js  
- [ ] Payments for ticketed events  
- [ ] Mobile app (React Native)  
- [ ] Offline QR scanning mode  
- [ ] Calendar integration (Google/Outlook)  

---

## 🤝 Contributing

1. Fork the repo.  
2. Create a new branch (`feature/xyz`).  
3. Commit changes.  
4. Open a PR.  

---

## 📜 License
This project is licensed under the **MIT License**.  
Fonts (`LL Letterra` and `NType 82 Mono`) require proper licensing for production use.

---

## 👨‍💻 Author
Built with ❤️ by [Your Name]  
