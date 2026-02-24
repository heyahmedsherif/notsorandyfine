# Product Requirements Document: NotSoRandyFine

## App Name

**NotSoRandyFine** — `notsorandyfine.com`

- **Tagline**: *"He's not so fine, Florida."*
- **Hashtag**: #NotSoRandyFine
- **Why it works**: "Not so fine" = not acceptable. "Not so randy" = mocking his name. Rolls off the tongue. Instantly memorable and shareable.

---

## 1. Product Overview

### 1.1 Vision
A web-based civic engagement platform that empowers citizens to contact their elected representatives (state and federal) about Rep. Randy Fine's documented history of hateful rhetoric, and to advocate for his censure or removal from Congress. The platform makes civic action accessible, personalized, and impactful.

### 1.2 Problem Statement
Randy Fine (R-FL-06) has a documented, multi-year pattern of dehumanizing rhetoric toward Muslims, Palestinians, and Arab-Americans — including calling for streets to "overflow with blood," telling people to "starve away" during a famine, comparing Muslims unfavorably to dogs, and calling for mass expulsion of American Muslims. Despite widespread condemnation from civil rights organizations, Jewish Democratic groups, and Democratic lawmakers, institutional accountability has been minimal. Most citizens who are outraged lack the time, knowledge, or tools to effectively contact their representatives about it.

### 1.3 Target Users
- Concerned citizens anywhere in the U.S. who want to take action
- Activists and organizers looking for tools to mobilize their communities
- People unfamiliar with Randy Fine who want to learn about his record
- Community members who want to track which leaders are speaking up (or staying silent)

### 1.4 Key Principles
- **Factual**: Every claim is sourced and documented with screenshots, links, and dates
- **Accessible**: Anyone with a name and zip code can take action in under 2 minutes
- **Varied**: AI-generated emails are unique each time — different tones, lengths, and angles
- **Gamified**: Points, leaderboards, and badges make civic engagement rewarding
- **Non-partisan framing**: This is about basic human decency, not party politics

---

## 2. Core Features

### 2.1 Email Generator (Primary Feature)

#### 2.1.1 User Flow
1. User enters **name** and **zip code**
2. System looks up their **federal representatives** (2 Senators + House Rep) and **state legislators** (State Senator + State House Rep)
3. System displays the list of representatives with:
   - Name, title, party, photo
   - Whether they have publicly spoken about Fine (badge: "Spoke Up" or "Silent")
   - A toggle to include/exclude each representative
4. User can optionally **add custom recipients** (name + email) for ad hoc contacts
5. User selects an **email tone/style** (or lets the system choose randomly):
   - **Formal/Professional** — suitable for official correspondence
   - **Passionate/Urgent** — conveys strong emotion and moral urgency
   - **Personal Story** — frames the issue through personal impact
   - **Factual/Evidence-Based** — heavy on citations and documentation
   - **Brief & Direct** — short, punchy, gets to the point
6. System generates **unique emails** for each recipient using AI, with:
   - Varied sentence structure, word choice, and length
   - Specific Fine quotes/actions cited (randomly selected from the evidence database)
   - **Conditional logic**:
     - If the recipient has **criticized Fine** → thank them, encourage continued leadership, ask for concrete next steps (co-sponsor censure resolution, etc.)
     - If the recipient has **been silent** → urge them to speak up, call for censure/removal
     - If the recipient has **defended/praised Fine** → express disappointment, demand accountability, note their constituents are watching
7. User can **preview, edit, regenerate, or approve** each email
8. System provides **send options**:
   - **Copy to clipboard** (one click)
   - **Open in default email client** (mailto: link pre-filled)
   - **Direct send** (if email API is integrated — Phase 2)
9. After sending, user earns **points** and the action is logged

#### 2.1.2 Email Variation Engine
To ensure no two emails are identical:
- Maintain a database of 20+ Fine quotes/incidents, each with source citations
- Randomly select 2-4 incidents per email
- Vary opening hooks (question, statistic, personal statement, quote)
- Vary closing calls to action
- Vary email length: short (100-150 words), medium (200-300 words), long (400-500 words)
- Vary paragraph structure and rhetorical approach
- Include the user's name and state for personalization

#### 2.1.3 Representative Lookup
- Use the **Google Civic Information API** (free) or **Congress.gov API** + **OpenStates API** for state legislators
- Input: zip code (5-digit or ZIP+4)
- Output: federal senators, federal house rep, state senator, state house rep
- Cache results to reduce API calls

### 2.2 The Evidence Wall

A dedicated section documenting Fine's record with primary sources.

#### 2.2.1 Content Types
- **Screenshots** of tweets/posts (with dates, archived URLs)
- **Video clips** (embedded or linked) of TV appearances, floor speeches
- **News article excerpts** with links to full articles
- **Official statements** and press releases
- **Voting record** highlights

#### 2.2.2 Organization
- **Timeline view** — chronological, scrollable
- **Category view** — grouped by topic (anti-Muslim rhetoric, Gaza statements, voting irregularities, etc.)
- **"Greatest Hits" carousel** — the most egregious examples front and center
- Each piece of evidence has:
  - Date
  - Source link (archived)
  - Brief context
  - A "Use in my email" button that pre-loads this incident into the email generator

#### 2.2.3 Content Management
- Evidence stored as structured data (JSON/YAML) in the repo
- Easy to add new incidents via PR or admin interface
- Each entry: `{ id, date, category, summary, quote, source_url, archive_url, media_type, media_path }`

### 2.3 Accountability Tracker & Gamification

#### 2.3.1 Public Figure Leaderboard

Track elected officials, media figures, and public personalities based on their response to Fine.

**Scoring System:**

| Action | Points |
|--------|--------|
| Called for censure publicly | +50 |
| Called for resignation/removal | +75 |
| Co-sponsored censure resolution | +100 |
| Made public statement criticizing Fine | +30 |
| Voted for censure (when vote happens) | +150 |
| Shared/amplified criticism on social media | +10 |
| Stayed silent (no public statement) | -10 (per week of silence) |
| Defended Fine's statements | -50 |
| Praised Fine after controversial statements | -75 |
| Voted against censure | -150 |

**Leaderboard Display:**
- **Champions** tier (green) — top scorers who have been vocal
- **Silent Majority** tier (gray) — haven't spoken up
- **Enablers** tier (red) — defended or praised Fine
- Each entry shows: name, title, party, state, score, last action, source links
- Filterable by: party, state, chamber, score range

#### 2.3.2 User Gamification

**Points for Users:**

| Action | Points |
|--------|--------|
| Send first email | +25 |
| Send email to all your reps | +50 |
| Send emails on 3 different days | +30 |
| Add a custom recipient | +10 |
| Share the site on social media | +15 |
| Refer a friend who sends an email | +20 |
| Submit new evidence (approved) | +40 |

**Badges:**
- 🏛️ **First Contact** — sent your first email
- 📬 **Full Coverage** — emailed all your representatives
- 🔁 **Persistent Voice** — sent emails on 3+ different days
- 📢 **Amplifier** — shared the site on social media
- 🔍 **Investigator** — submitted approved evidence
- ⭐ **Recruiter** — referred someone who took action
- 🏆 **Champion** — earned 200+ total points

**User Leaderboard:**
- Anonymous by default (show first name + last initial + state)
- Opt-in to show full name
- Weekly and all-time views
- State-level leaderboards

### 2.4 The Kudos & Callout Board

A prominent, always-visible section:

#### 2.4.1 Kudos Wall (Heroes)
- Public figures who have spoken up, with their quotes
- Sorted by leaderboard score
- "Thank them" button → generates a thank-you email/tweet

#### 2.4.2 Callout Wall (Cowards & Enablers)
- Public figures who have stayed silent or defended Fine
- "Urge them to act" button → generates a targeted email
- Shows how long they've been silent (day counter)

---

## 3. Technical Architecture

### 3.1 Deployment Strategy

**Phase 1: GitHub Pages + Serverless**
- Static site hosted on GitHub Pages (free, reliable, custom domain support)
- Custom domain via Namecheap (point DNS to GitHub Pages)
- Serverless functions via **Cloudflare Workers** (free tier: 100k requests/day) for:
  - AI email generation (proxy to OpenAI/Claude API)
  - Representative lookup API calls
  - Analytics/tracking

**Phase 2: Enhanced Backend**
- Supabase (free tier) for:
  - User accounts (optional, anonymous by default)
  - Leaderboard data
  - Action tracking
  - Evidence submissions

### 3.2 Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | Next.js (static export) or Astro | Fast, SEO-friendly, deploys to GitHub Pages |
| **Styling** | Tailwind CSS + shadcn/ui | Modern, accessible, responsive |
| **Email Generation** | Claude API (via Cloudflare Worker) | Best quality writing, varied output |
| **Rep Lookup** | Google Civic Information API | Free, reliable, covers federal + state |
| **Database** | Supabase (PostgreSQL) | Free tier, real-time, auth built-in |
| **Analytics** | PostHog or Plausible | Privacy-respecting, open-source options |
| **Evidence Storage** | GitHub repo (images in `/public/evidence/`) | Version controlled, easy to update |
| **Hosting** | GitHub Pages + Cloudflare (CDN/Workers) | Free, fast, custom domain |

### 3.3 API Keys & Costs
- **Claude API**: ~$0.01-0.03 per email generation (pay as you go)
- **Google Civic API**: Free (quota: 25,000 requests/day)
- **Supabase**: Free tier (50k monthly active users, 500MB database)
- **Cloudflare Workers**: Free tier (100k requests/day)
- **GitHub Pages**: Free
- **Domain**: ~$10/year on Namecheap

**Estimated monthly cost at 1,000 users/month: $5-15 (mostly AI API calls)**

---

## 4. Information Architecture

```
Home Page
├── Hero: "The People Are Keeping Receipts" + quick action CTA
├── Email Generator (primary CTA)
│   ├── Name + Zip Code input
│   ├── Representative results
│   ├── Tone selector
│   ├── Generated emails (preview/edit/send)
│   └── Add custom recipients
├── The Evidence Wall
│   ├── Timeline view
│   ├── Category view
│   └── Individual evidence cards
├── Accountability Tracker
│   ├── Public Figure Leaderboard
│   │   ├── Champions
│   │   ├── Silent Majority
│   │   └── Enablers
│   ├── Kudos Wall
│   └── Callout Wall
├── Take Action
│   ├── Email your reps (links to generator)
│   ├── Share on social media
│   ├── Submit evidence
│   └── Spread the word
├── About
│   ├── Why this matters
│   ├── FAQ
│   └── Sources & methodology
└── User Dashboard (optional login)
    ├── My actions
    ├── My points & badges
    └── My leaderboard position
```

---

## 5. Design & UX

### 5.1 Visual Identity
- **Primary colors**: Navy blue (#1a365d) + white + accent red (#dc2626)
- **Typography**: Inter or Source Sans Pro (clean, modern, readable)
- **Tone**: Serious but empowering — not angry, not timid
- **Imagery**: Constitutional imagery, civic symbols, American democratic tradition
- **Mobile-first**: 60%+ of traffic will be mobile

### 5.2 Key UX Principles
- **2-minute action**: Name + zip → emails ready in under 2 minutes
- **No account required**: Core functionality works without login
- **Progressive disclosure**: Start simple, reveal complexity as needed
- **Accessibility**: WCAG 2.1 AA compliant, screen reader friendly
- **Share-friendly**: OpenGraph tags, social cards, shareable action summaries

### 5.3 Emotional Design
- After sending emails: celebratory animation + points earned
- Progress bar: "You've contacted X of Y representatives"
- Social proof: "Z people have taken action today"
- Urgency without anxiety: countdown to next Congressional session, not fear-based

---

## 6. Data Model

### 6.1 Evidence Entry
```typescript
interface EvidenceEntry {
  id: string;
  date: string;                    // ISO date
  category: 'anti-muslim' | 'anti-palestinian' | 'voting-irregularity' | 'other';
  summary: string;                 // 1-2 sentence summary
  quote?: string;                  // Direct quote if applicable
  sourceUrl: string;               // Original source
  archiveUrl?: string;             // Archive.org backup
  mediaType: 'screenshot' | 'video' | 'article' | 'official-statement';
  mediaPath?: string;              // Path to screenshot/video in repo
  severity: 1 | 2 | 3 | 4 | 5;   // For prioritizing in emails
}
```

### 6.2 Public Figure
```typescript
interface PublicFigure {
  id: string;
  name: string;
  title: string;                   // "U.S. Senator", "CNN Anchor", etc.
  party?: string;
  state?: string;
  chamber?: 'senate' | 'house' | 'state-senate' | 'state-house' | 'media' | 'other';
  stance: 'criticized' | 'silent' | 'defended' | 'praised';
  score: number;
  actions: PublicFigureAction[];
  photoUrl?: string;
  contactInfo?: {
    email?: string;
    twitter?: string;
    office_phone?: string;
  };
}

interface PublicFigureAction {
  date: string;
  type: 'called-for-censure' | 'called-for-removal' | 'public-criticism' |
        'co-sponsored-resolution' | 'social-media-criticism' | 'silent' |
        'defended' | 'praised' | 'voted-for-censure' | 'voted-against-censure';
  description: string;
  sourceUrl: string;
  points: number;
}
```

### 6.3 User Action (anonymous tracking)
```typescript
interface UserAction {
  id: string;
  sessionId: string;              // Anonymous session, not tied to identity
  timestamp: string;
  type: 'email-generated' | 'email-copied' | 'email-opened' | 'share' | 'evidence-viewed';
  recipientType: 'federal-senator' | 'federal-house' | 'state-senator' | 'state-house' | 'custom';
  zipCode: string;                // For geographic analytics (not stored with name)
  tone: string;
  emailLength: 'short' | 'medium' | 'long';
}
```

---

## 7. Content Strategy

### 7.1 Initial Evidence Database
Seed with documented incidents (each with primary source):

1. "May the streets of Gaza overflow with blood" (Oct 2023)
2. "Quite well, actually!" response to dead Palestinian child photo (2021)
3. Palestinians are "demons that live on Earth" who "deserve death"
4. "Gaza must be destroyed"
5. "Starve away" response to Gaza famine reporting (Jul 2025)
6. Called activist "little more than a Muslim terrorist," said citizenship should be stripped (Oct 2025)
7. "Mainstream Muslims" should "be destroyed" (Dec 2025)
8. "If you're not an Islamophobe, you're a fool" (Dec 2025)
9. "The choice between dogs and Muslims is not a difficult one" (Feb 2026)
10. Mass expulsion of American Muslims advocacy
11. Hiroshima/Nagasaki as model for Palestinian "unconditional surrender"
12. Alleged illegal proxy voting in Florida State House (video evidence)

### 7.2 Initial Public Figure Tracker
Seed with known positions:

**Critics (positive scores):**
- Hakeem Jeffries — called Fine "a disgrace," threatened forced censure vote
- Ro Khanna — called for censure
- Delia Ramirez — called words "despicable, hateful and dangerous," demanded resignation
- Don Bacon (R-NE) — only Republican to publicly disagree
- Jake Tapper — called it "disgusting bigotry"
- Jewish Democratic Council of America — called it "a disgrace to Congress"
- Democratic Majority for Israel — called comments "vile and indefensible"
- CAIR — called for censure addressing full history

**Defenders/Silent (negative or zero scores):**
- Mike Johnson — no public disciplinary action as Speaker
- AIPAC — endorsed Fine, stated support for his work

---

## 8. Gamification Deep Dive

### 8.1 Daily Challenges
- "Contact all your reps today" — bonus 25 points
- "Share the Evidence Wall on social media" — bonus 15 points
- "Generate emails in 3 different tones" — bonus 20 points

### 8.2 Streaks
- 3-day streak: "Consistent Citizen" badge
- 7-day streak: "Dedicated Democrat" badge (nonpartisan alternative: "Dedicated Advocate")
- 30-day streak: "Relentless" badge

### 8.3 Community Milestones
- Display site-wide counters:
  - "X emails generated"
  - "Y representatives contacted"
  - "Z states represented"
- Milestone celebrations (every 1,000 emails, etc.)

### 8.4 Social Sharing Cards
After taking action, generate a shareable image card:
- "I just emailed my representatives about Randy Fine. Join me at [site]"
- Include the user's badge count
- Optimized for Twitter/Instagram/Facebook

---

## 9. Legal & Ethical Considerations

### 9.1 Content Guidelines
- All claims must be sourced with primary documentation
- Direct quotes only — no paraphrasing that could be challenged
- Screenshots must include dates and be verifiable
- Archive.org backups for all web sources
- No doxxing — only use publicly available contact information for public officials

### 9.2 Disclaimers
- "This site is not affiliated with any political party or organization"
- "All information is sourced from public records and news reporting"
- "Contacting your representatives is a constitutionally protected right under the First Amendment"
- "Email content is AI-generated. Please review and personalize before sending."

### 9.3 Privacy
- No personally identifiable information stored by default
- Zip codes stored for aggregate analytics only (not linked to names)
- No cookies required for core functionality
- Optional anonymous accounts for gamification features
- Clear privacy policy

---

## 10. Phased Rollout

### Phase 1: MVP (Week 1-2)
- [ ] Static site with email generator (name + zip → generated emails)
- [ ] Representative lookup (federal only)
- [ ] Evidence Wall (initial 12 incidents)
- [ ] Copy-to-clipboard and mailto: functionality
- [ ] Mobile-responsive design
- [ ] Deploy to GitHub Pages with custom domain
- [ ] Basic public figure tracker (static data)

### Phase 2: Gamification (Week 3-4)
- [ ] Points system and badges (client-side, localStorage)
- [ ] User leaderboard (anonymous)
- [ ] Public figure leaderboard (interactive)
- [ ] Social sharing cards
- [ ] State legislator lookup (OpenStates API)
- [ ] Supabase backend for persistent tracking

### Phase 3: Community (Week 5-6)
- [ ] Evidence submission form (moderated)
- [ ] Thank-you email generator for critics
- [ ] Callout email generator for silent/defending figures
- [ ] Daily challenges and streaks
- [ ] Community milestone counters
- [ ] Email tracking (did they open the mailto link?)

### Phase 4: Scale (Ongoing)
- [ ] Direct email sending (SendGrid/Resend integration)
- [ ] Phone call script generator
- [ ] Template letters for physical mail
- [ ] Integration with other accountability campaigns
- [ ] Embeddable widget for other sites
- [ ] API for partner organizations

---

## 11. Success Metrics

| Metric | Target (Month 1) | Target (Month 3) |
|--------|------------------|------------------|
| Unique visitors | 5,000 | 25,000 |
| Emails generated | 2,000 | 15,000 |
| Representatives contacted | 200 | 1,000 |
| States represented | 25 | 45+ |
| Social shares | 500 | 5,000 |
| Evidence entries | 15 | 50+ |
| Media mentions | 1 | 5 |

---

## 12. Domain & Hosting Setup

### 12.1 Domain Registration (Namecheap)
1. Register chosen domain (~$10/year)
2. Set up DNS:
   - CNAME record pointing to `<username>.github.io`
   - Or A records pointing to GitHub Pages IPs
3. Enable HTTPS (automatic with GitHub Pages)

### 12.2 GitHub Pages Setup
1. Create repo: `github.com/<username>/<repo-name>`
2. Enable GitHub Pages in repo settings
3. Add `CNAME` file with custom domain
4. Configure build action (Next.js static export or Astro build)

---

## 13. Open Questions

1. **Which domain name?** — Need to check availability and register
2. **AI API choice** — Claude API vs OpenAI for email generation (Claude recommended for quality)
3. **API key funding** — Who pays for AI API calls? Rate limiting strategy?
4. **Moderation** — How to handle evidence submissions? Manual review?
5. **Legal review** — Should the site be reviewed by a First Amendment attorney?
6. **Organization backing** — Individual project or affiliated with an org (CAIR, etc.)?
7. **Social media presence** — Create matching Twitter/Instagram accounts?
