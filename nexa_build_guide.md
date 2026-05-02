# Nexa build guide (canonical text)

This file was exported from the author Word document (`nexa_build_guide.docx`) and converted to Markdown for version control. **Live progress**—completed steps, the step in progress, and upcoming work—is maintained in [`docs/wiki/progress.md`](docs/wiki/progress.md).

---

**◆ ◆ ◆**

**NEXA**

**BUILD GUIDE**

**──────────────────────────────────**

**Figma › Cursor › Claude Code › Production**

*Every prompt. Every step. Copy and paste ready.*

+:--------------:+:--------------:+:--------------:+:--------------:+
| **15**         | **6**          | **5**          | **1**          |
|                |                |                |                |
| Build Steps    | Role           | API            | Help System    |
|                | Dashboards     | Integrations   |                |
+----------------+----------------+----------------+----------------+

**BRAND COLOR PALETTE --- Dark Blues · Golds · Browns · Neutrals**

A rich, professional palette evoking trust, tradition, and precision.
Deep navies anchor the interface; antique golds mark hierarchy and
action; warm browns and neutrals provide warmth and approachability.

+:--------:+:--------:+:--------:+:-------------:+:---------:+:-----------:+
| **Deep   | **Navy** | **Gold** | **Gilt**      | **Brown** | **Neutral** |
| Navy**   |          |          |               |           |             |
|          | #1A2E4A  | #C9922A  | #E8B84B       | #6B4226   | #EDE9E3     |
| #0D1B2A  |          |          |               |           |             |
+----------+----------+----------+---------------+-----------+-------------+
| **Mid    | **Steel  | **Warm   | **Parchment** | **Cream** | **Warm      |
| Navy**   | Blue**   | Brown**  |               |           | White**     |
|          |          |          | #F0E6D8       | #F5E6C0   |             |
| #1E3A5F  | #2D5F8A  | #8B5E3C  |               |           | #F7F5F2     |
+----------+----------+----------+---------------+-----------+-------------+

**HOW TO USE THIS GUIDE**

Every prompt is copy-and-paste ready. Each step is color-coded by tool
and explained with a plain-language summary. Complete steps in order ---
each chapter depends on the previous one being complete.

  -- ------------- ----------------------------------------------------
     **◆ FIGMA**   Paste into Figma AI, plugin field, or frame
                   annotation

     **◆ CURSOR**  Paste into Cursor AI Chat or Composer

     **◆ CLAUDE    Paste into Claude Code terminal (run: claude)
     CODE**        
  -- ------------- ----------------------------------------------------

**SIX ROLE DASHBOARDS --- ONE PLATFORM**

Every party gets their own scoped dashboard. No role ever sees another
party\'s data --- enforced at the database level by Row Level Security.

+:--------:+:-----------:+:---------:+:----------:+:------------:+:---------:+
| 🗂        | 🏠          | 🔑        | 📋         | 🏦           | 📜        |
|          |             |           |            |              |           |
| **TC**   | **Agent**   | **Buyer** | **Seller** | **Mortgage** | **Title** |
|          |             |           |            |              |           |
| Full     | Transaction | My        | My sale    | Loan         | Closing   |
| file     | status      | purchase  |            | milestones   | prep      |
| control  |             |           |            |              |           |
+----------+-------------+-----------+------------+--------------+-----------+

**CURSOR vs. CLAUDE CODE --- WHICH SHOULD YOU USE?**

They run the same Claude model. The difference is workflow. Use Cursor
where the Figma MCP matters. Use Claude Code for sustained backend
builds.

  ----------------------- ---------------------- ----------------------
  **Feature**             **Cursor + Figma MCP** **Claude Code**

  Figma MCP integration   ✅ Native --- reads    ⚠️ Requires manual
                          Figma directly         export

  Code gen from designs   ✅ Frame → code via    ✅ Paste specs → code
                          MCP                    

  Full codebase awareness ✅ Yes                 ✅ Yes

  Built-in terminal       ✅ Yes                 ✅ Yes

  Design token            ✅ Via MCP             Manual / copy-paste
  auto-extraction                                

  Long autonomous build   ⚠️ Good, watch context ✅ Purpose-built for
  sessions                limits                 this

  Best use in this        ✅ UI --- Chapters     ✅ Backend ---
  project                 1--2                   Chapters 3--5
  ----------------------- ---------------------- ----------------------

  -- ------------------------------------------------------------------
     RECOMMENDATION: Use Cursor + Figma MCP for Chapters 1--2 (design
     and UI generation). Switch to Claude Code for Chapters 3--5
     (database, auth, APIs, AI engine, and the help system). Both tools
     share the same intelligence --- the difference is workflow, not
     capability.

  -- ------------------------------------------------------------------

**◆ CHAPTER 1**

**FIGMA**

*Design System & Screen Blueprints*

Complete all of Chapter 1 before opening Cursor or Claude Code. The
Figma MCP reads your layer names directly --- clean naming here becomes
clean component names in code.

  ------------------------------ ------- ------------------------------
                                    ◆    

  ------------------------------ ------- ------------------------------

**STEP 1 Set Up Your Figma File Structure**

**◆ FIGMA**

+---+------------------------------------------------------------------+
|   | **WHAT THIS DOES**                                               |
|   |                                                                  |
|   | Creates the page and folder structure for the entire design      |
|   | file. Cursor\'s MCP maps frame names directly to component names |
|   | --- every layer name you set here becomes a variable in your     |
|   | codebase.                                                        |
|   |                                                                  |
|   | **WHY IT MATTERS**                                               |
|   |                                                                  |
|   | Disorganized Figma layers generate disorganized code. \'TC       |
|   | Dashboard/Default\' becomes a clean component; \'Frame 47\'      |
|   | becomes noise. Naming everything now prevents hours of renaming  |
|   | later.                                                           |
+---+------------------------------------------------------------------+

**◆ PROMPT --- FIGMA --- File structure & naming rules**

Create Figma file \"Nexa\" with these pages in exact order:

Page 1: Cover & Changelog

Page 2: 00 --- Design Tokens

Page 3: 01 --- Component Library

Page 4: 02 --- TC Dashboard

Page 5: 03 --- Agent Dashboard

Page 6: 04 --- Buyer Dashboard

Page 7: 05 --- Seller Dashboard

Page 8: 06 --- Mortgage Dashboard

Page 9: 07 --- Title Dashboard

Page 10: 08 --- Shared Flows

Page 11: 09 --- Mobile

Page 12: 10 --- Prototype Flows

Frame naming rules (enforced on every layer):

Screens: \"ScreenName/State\" e.g. \"TC Dashboard/Default\"

Components: slash-notation variants e.g. \"Button/Primary/Large/Hover\"

No generics: rename all \"Group 1\", \"Frame 47\", \"Rectangle 3\"

Frame widths: Desktop 1440px · Tablet 768px · Mobile 390px

**STEP 2 Build the Design Token Page**

**◆ FIGMA**

+---+------------------------------------------------------------------+
|   | **WHAT THIS DOES**                                               |
|   |                                                                  |
|   | Defines every color, font, spacing, shadow, and radius as a      |
|   | named Figma style. The MCP reads these exact names into          |
|   | tailwind.config.ts --- making them reusable design tokens in     |
|   | code.                                                            |
|   |                                                                  |
|   | **WHY IT MATTERS**                                               |
|   |                                                                  |
|   | Without design tokens, Cursor hardcodes hex values. With tokens, |
|   | every component uses brand.navy or gold.primary. A future        |
|   | rebrand touches one file instead of 400 components.              |
+---+------------------------------------------------------------------+

**◆ PROMPT --- FIGMA --- Brand design tokens (dark blues · golds ·
browns · neutrals)**

On page \"00 --- Design Tokens\", create named Figma color styles.

Name EXACTLY as written --- Cursor maps these to Tailwind keys.

BRAND COLORS:

brand/navy-deep #0D1B2A (cover, darkest surfaces)

brand/navy #1A2E4A (sidebar, primary nav)

brand/navy-mid #1E3A5F (secondary headers)

brand/steel #2D5F8A (links, accents)

brand/sky #4A82B4 (hover, highlights)

brand/gold #C9922A (CTAs, active states, progress)

brand/gold-light #E8B84B (secondary gold)

brand/gold-pale #F5E6C0 (cream backgrounds)

brand/brown #6B4226 (tags, rich accents)

brand/brown-warm #8B5E3C (secondary accents)

brand/brown-pale #F0E6D8 (parchment backgrounds)

NEUTRALS (warm-toned, not cold grey):

neutral/50 #F7F5F2 (warm white --- page bg)

neutral/100 #EDE9E3 (alt rows, panels)

neutral/300 #C4BDB5 (borders)

neutral/600 #6B6560 (secondary text)

neutral/900 #1C1917 (body text)

STATUS:

status/success #2D6A4F

status/warning #92400E

status/danger #991B1B

TYPOGRAPHY (text styles):

Font: Playfair Display for headings · Inter for UI · Georgia for body

heading/xl 36px Bold Playfair, lh 1.1

heading/lg 28px Bold Playfair, lh 1.2

heading/md 22px SemiBold Playfair, lh 1.3

ui/label 13px SemiBold Inter, uppercase, ls 0.08em

ui/body 16px Regular Inter, lh 1.5

prose/body 17px Regular Georgia, lh 1.6

SPACING: 4px base: 4 8 12 16 20 24 32 40 48 64 80 96

RADII: sm=4px md=8px lg=12px full=9999px

SHADOWS: sm: 0 1px 3px rgba(13,27,42,0.08)

md: 0 4px 8px rgba(13,27,42,0.12)

lg: 0 12px 24px rgba(13,27,42,0.16)

**STEP 3 Build the Complete Component Library**

**◆ FIGMA**

+---+------------------------------------------------------------------+
|   | **WHAT THIS DOES**                                               |
|   |                                                                  |
|   | Creates every reusable UI element as a proper Figma component    |
|   | with variants and Auto Layout. Each variant becomes a typed prop |
|   | in the generated React component.                                |
|   |                                                                  |
|   | **WHY IT MATTERS**                                               |
|   |                                                                  |
|   | Components with variants generate accurate typed React           |
|   | components. A Button with 5 variants + 3 sizes + 3 states        |
|   | generates one perfectly structured component instead of 15       |
|   | separate elements. The brand palette --- navy backgrounds, gold  |
|   | accents, warm neutrals --- must be applied consistently          |
|   | throughout.                                                      |
+---+------------------------------------------------------------------+

**◆ PROMPT --- FIGMA --- Component library (atoms through organisms)**

On page \"01 --- Component Library\". Auto Layout on everything.

Apply brand palette throughout: navy surfaces, gold accents, warm
neutrals.

── ATOMS
──────────────────────────────────────────────────────────────────

BUTTON: Variant: Primary(navy bg, white text) / Gold(gold bg, navy text)
/

Secondary(white bg, navy border) / Ghost(no bg, gold underline hover) /

Danger(danger-red bg). Size: Large/Medium/Small. State:
Default/Hover/Loading/Disabled.

All buttons: Playfair Display label, 8px radius, gold hover
border-bottom.

INPUT: Default/Focus(gold border + gold glow shadow)/Error/Disabled.

Always: Inter label above, helper text below.

BADGE: Success/Warning/Danger/Navy(gold text)/Gold(navy text)/Neutral.
Full pill.

AVATAR: XS/SM/MD/LG/XL circles. Fallback: navy bg, gold initials.

── MOLECULES
──────────────────────────────────────────────────────────────

DOCUMENT CARD: 240px wide, neutral/50 bg, 1px neutral/300 border, 10px
radius.

Thumbnail: 240x150px, dark navy bg with category icon in gold centered.

Body: category badge, filename (semibold), status badge, date, actions.

Hover: gold border-top 3px, shadow/md.

STATS CARD: white bg, gold border-top 3px, 10px radius, shadow/sm.

Number: 36px Playfair Display brand/navy. Label: Inter uppercase
neutral/600.

Icon: 28px brand/gold top-right.

TRANSACTION CARD (kanban): 270px, white bg, 10px radius.

Top accent bar 4px: navy=active listing, gold=under contract,

brown=pending, steel=pre-listing, green=closed.

Body: address (bold navy), close date, TC avatar, gold progress bar.

SIDEBAR: 256px, navy-deep bg, gold nav accents.

Active nav: navy-mid bg, gold-light text, 3px gold left border.

Logo: Playfair Display, gold text on navy-deep.

TOPBAR: 64px, white bg, 2px gold border-bottom.

Page title: Playfair Display 20px navy.

── GRAPHICS & ILLUSTRATIONS
───────────────────────────────────────────────

Create decorative graphic elements to use across screens:

Hero graphic: abstract geometric composition using brand colors ---

overlapping navy rectangles at angles, gold diamond accent,

brown circle element. 600x400px. Used on the buyer/seller welcome
screens.

Progress ring: circular SVG-style progress indicator, gold fill on

navy-dark track. For the AI confidence score on First Pass screen.

Document icon set: 6 custom icons (contract, disclosure, inspection,

loan, title, photos) --- line style, navy stroke, gold accent detail.

Empty state illustration: simple geometric, navy/gold, for empty file
lists.

Pattern background: subtle repeating diamond pattern in navy/navy-mid,

4% opacity. For use as sidebar texture and screen hero backgrounds.

**STEP 4 Design All 14 Application Screens**

**◆ FIGMA**

+---+------------------------------------------------------------------+
|   | **WHAT THIS DOES**                                               |
|   |                                                                  |
|   | Creates pixel-accurate layouts for all 6 role dashboards, auth   |
|   | screens, and shared flows. These are what Cursor reads via MCP   |
|   | to generate real page components.                                |
|   |                                                                  |
|   | **WHY IT MATTERS**                                               |
|   |                                                                  |
|   | Every screen designed in Figma is one Cursor prompt away from    |
|   | becoming real code. Realistic placeholder data (real addresses,  |
|   | real names, real dates) means the generated code handles real    |
|   | content correctly from day one. Consumer-facing screens (buyer,  |
|   | seller) must feel warm and friendly, not corporate.              |
+---+------------------------------------------------------------------+

> **◆** TC Dashboard --- stats, kanban pipeline, deadlines, tasks
>
> **◆** Transaction Detail --- two-panel layout, First Pass Review tab,
> checklist
>
> **◆** Document Manager --- category tree, document cards, toolbar
>
> **◆** Agent Dashboard --- transaction status, documents, messaging
>
> **◆** Buyer Dashboard --- warm hero, progress timeline, action items
> (mobile-first)
>
> **◆** Seller Dashboard --- same structure, seller-specific content
>
> **◆** Mortgage Dashboard --- loan milestones, required docs
>
> **◆** Title Dashboard --- closing details, title checklist
>
> **◆** Login / MFA / Invite Acceptance --- auth screens
>
> **◆** E-Signature flow --- embedded DocuSign full-screen modal

**◆ PROMPT --- FIGMA --- TC Dashboard & Buyer Dashboard screens**

TC DASHBOARD --- frame \"TC Dashboard/Default\" 1440x900px:

Sidebar (256px, navy-deep bg, gold nav accents) + TopBar (gold bottom
border).

Page bg: neutral/50 (warm white). All text: neutral/900 or brand/navy.

STATS ROW: 4 StatsCards, gold border-top each:

Active Transactions · Due This Week · Pending Reviews · Signatures
Needed

PIPELINE KANBAN: navy column headers, gold count badges.

TransactionCards with colored status accent bars (see card spec above).

Column scroll: horizontal on overflow.

TWO-COL ROW: Deadlines (left 60%) with colored dot indicators,

Tasks (right 40%) with gold/brown/navy priority badges.

Decorative: pattern background at 4% opacity in sidebar.

BUYER DASHBOARD --- frame \"Buyer Dashboard/Default\" 1440x900px:

Also create \"Buyer Dashboard/Mobile\" 390x844px. Mobile-first priority.

INTENT: Warm and approachable. Large type. Clear plain English. No
jargon.

Background: brand/neutral-50. Headings: Playfair Display navy.

Gold for progress only. Brown for secondary accents.

HERO: \"Your Home Purchase\" (Playfair Display 36px navy) + address +

large status pill (gold bg, navy text). Hero graphic (geometric)
top-right.

PROGRESS TIMELINE: 5 steps horizontal, gold fill for complete,

navy circle for active, neutral for future.

Labels: Inter 14px. Connecting line: neutral/300.

ACTION NEEDED card: parchment bg, 3px gold left border, clear CTA
buttons.

YOUR DOCUMENTS: 2-col grid, document cards (dark navy thumbnail).

IMPORTANT DATES: 3 calendar chips. Playfair Display large date number.

Mobile: single column, sticky bottom action bar, simplified timeline.

  ------------------------------ ------- ------------------------------
                                    ◆    

  ------------------------------ ------- ------------------------------

**◆ CHAPTER 2**

**CURSOR**

*Bootstrap the Project from Figma*

With your Figma file complete, open Cursor and confirm the Figma MCP is
active in Settings → MCP. All prompts in this chapter go into Cursor\'s
AI Chat or Composer.

  ------------------------------ ------- ------------------------------
                                    ◆    

  ------------------------------ ------- ------------------------------

**STEP 5 Extract Design Tokens from Figma into Tailwind**

**◆ CURSOR**

+---+------------------------------------------------------------------+
|   | **WHAT THIS DOES**                                               |
|   |                                                                  |
|   | Cursor reads your Figma design token page via MCP and writes all |
|   | values into tailwind.config.ts --- every brand color, font,      |
|   | spacing, and shadow becomes a Tailwind class.                    |
|   |                                                                  |
|   | **WHY IT MATTERS**                                               |
|   |                                                                  |
|   | This synchronizes Figma and code. Every component generated      |
|   | after this step automatically uses the brand palette. Change a   |
|   | color in Figma, update this file, and every component updates.   |
+---+------------------------------------------------------------------+

**◆ PROMPT --- CURSOR --- Extract tokens → tailwind.config.ts**

Using the Figma MCP, read page \"00 --- Design Tokens\" from my Figma
file.

Extract every named color style, text style, and effect style.

Write a complete tailwind.config.ts:

1\. Map brand/\* colors → theme.extend.colors.brand.\*

Map neutral/\* → theme.extend.colors.neutral.\*

Map status/\* → theme.extend.colors.status.\*

2\. fontFamily: { display:\[\'Playfair Display\'\], sans:\[\'Inter\'\],
prose:\[\'Georgia\'\] }

3\. Map typography → fontSize with lineHeight pairs

4\. Map spacing → theme.extend.spacing

5\. Map shadows → theme.extend.boxShadow

6\. Map radii → theme.extend.borderRadius

7\. Full shadcn/ui CSS variable mapping

globals.css:

Import Playfair Display + Inter from Google Fonts

CSS custom properties for shadcn/ui

Warm neutral base bg (neutral/50) as default body background

Dark mode scaffold (even if not implementing now)

**STEP 6 Scaffold the Next.js 14 Project**

**◆ CURSOR**

+---+------------------------------------------------------------------+
|   | **WHAT THIS DOES**                                               |
|   |                                                                  |
|   | Creates the complete project structure with TypeScript strict    |
|   | mode, all required packages, and a folder layout mirroring the   |
|   | Figma file and phase plan.                                       |
|   |                                                                  |
|   | **WHY IT MATTERS**                                               |
|   |                                                                  |
|   | A disciplined scaffold means every subsequent prompt has a       |
|   | predictable home. Without this, files scatter and imports break  |
|   | as the project grows.                                            |
+---+------------------------------------------------------------------+

**◆ PROMPT --- CURSOR --- Scaffold Next.js 14 project structure**

Create a Next.js 14 App Router project with TypeScript strict mode.

Write all files manually --- do not use create-next-app.

/app/(auth) login signup mfa invite/\[token\]

/app/(dashboard) layout.tsx (sidebar+topbar, role-aware)

/tc /tc/transactions/\[id\] /tc/transactions/\[id\]/documents

/tc/transactions/\[id\]/first-pass /tc/settings

/agent/\[id\] /buyer/\[id\] /seller/\[id\] /mortgage/\[id\]
/title/\[id\]

/app/api transactions documents checklists messages

webhooks/docusign webhooks/email integrations/mls integrations/bank

/components/ui /dashboard /documents /transactions

/checklist /first-pass /signature /help /graphics

/lib/supabase /docusign /anthropic /mls /email /security

/inngest/functions

/supabase/migrations

/types

/help/articles/tc /agent /buyer /seller /mortgage /title

/public/graphics

PACKAGES: next@14 react typescript tailwindcss \@supabase/supabase-js

\@supabase/ssr \@anthropic-ai/sdk docusign-esign inngest

\@upstash/redis \@upstash/ratelimit framer-motion react-hook-form

zod \@hookform/resolvers date-fns lucide-react clsx tailwind-merge

pdfjs-dist pdf-lib react-dropzone \@dnd-kit/core \@dnd-kit/sortable

fuse.js react-markdown remark-gfm

tsconfig.json: strict mode, path aliases @/\* → ./\*

.env.local: scaffold all required env var keys (empty values)

.gitignore: .env.local

**STEP 7 Generate All Components from Figma**

**◆ CURSOR**

+---+------------------------------------------------------------------+
|   | **WHAT THIS DOES**                                               |
|   |                                                                  |
|   | Cursor reads each Figma component via the MCP and generates the  |
|   | matching React + Tailwind code with all variants, states, and    |
|   | brand styling applied accurately.                                |
|   |                                                                  |
|   | **WHY IT MATTERS**                                               |
|   |                                                                  |
|   | With the MCP active, Cursor reads exact pixel values, colors,    |
|   | and layout from Figma --- not from your description. Generated   |
|   | components are pixel-accurate to your design including the       |
|   | navy/gold/brown brand palette.                                   |
+---+------------------------------------------------------------------+

**◆ PROMPT --- CURSOR --- Generate all components from Figma MCP**

Using the Figma MCP, read every component on page \"01 --- Component
Library\".

For each component generate a typed React component at
/components/ui/\[name\].tsx.

Match all variants using cva (class-variance-authority).

Use only Tailwind classes referencing our custom tokens (brand.\*,
neutral.\*).

Full TypeScript props interface with JSDoc. shadcn/ui compatible.

Also generate the custom graphics components:

/components/graphics/HeroGraphic.tsx --- geometric brand illustration
(SVG)

/components/graphics/ProgressRing.tsx --- animated circular progress
(SVG)

/components/graphics/DocumentIcons.tsx --- 6 document category icons
(SVG)

/components/graphics/EmptyState.tsx --- empty list illustration

/components/graphics/PatternBg.tsx --- subtle diamond pattern background

Priority order: Button → Input → Badge → Avatar → DocumentCard →

StatsCard → TransactionCard → Sidebar → TopBar → DataTable → Modal →

MessageThread → ChecklistPanel → FirstPassReview → TimelineBar

**STEP 8 Generate All 14 Screen Pages**

**◆ CURSOR**

+---+------------------------------------------------------------------+
|   | **WHAT THIS DOES**                                               |
|   |                                                                  |
|   | Generates every application page from Figma frames via the MCP   |
|   | with placeholder data, full responsive behavior, and Framer      |
|   | Motion animations. Every data-fetch point is marked with a TODO  |
|   | comment.                                                         |
|   |                                                                  |
|   | **WHY IT MATTERS**                                               |
|   |                                                                  |
|   | This builds the complete visual shell of the application. Having |
|   | all 14 pages working with placeholder data lets you test layout, |
|   | navigation, and brand consistency before touching the database.  |
+---+------------------------------------------------------------------+

**◆ PROMPT --- CURSOR --- Generate all screens from Figma frames**

Using the Figma MCP, generate each screen in order. For each:

Read the named Figma frame → generate Next.js page → placeholder data →

TODO comments for all data points → full responsive behavior.

Brand palette enforcement throughout:

navy-deep sidebar, gold nav accents, warm neutral-50 page backgrounds.

Playfair Display headings, Inter UI text, Georgia body/prose.

Gold for active states and CTAs only. Brown for secondary accents.

Include brand graphics components where shown in Figma.

Screens (frame name → route):

1\. \"TC Dashboard/Default\" → /tc

2\. \"Transaction Detail/Default\" → /tc/transactions/\[id\]

3\. \"First Pass Review/Default\" → /tc/transactions/\[id\]/first-pass

4\. \"Document Manager/Default\" → /tc/transactions/\[id\]/documents

5\. \"Agent Dashboard/Default\" → /agent/\[id\]

6\. \"Buyer Dashboard/Default\" → /buyer/\[id\] (include HeroGraphic)

7\. \"Seller Dashboard/Default\" → /seller/\[id\]

8\. \"Mortgage Dashboard/Default\" → /mortgage/\[id\]

9\. \"Title Dashboard/Default\" → /title/\[id\]

10\. \"Login/Default\" → /login

11\. \"MFA Setup/Default\" → /auth/mfa

12\. \"Invite Acceptance/Default\" → /invite/\[token\]

Framer Motion:

Pages: fade + upward slide 200ms on mount

Kanban cards: lift shadow + scale(1.02) on drag

Stats: count-up animation on first render

Checklist complete: gold checkmark flash + strikethrough

  ------------------------------ ------- ------------------------------
                                    ◆    

  ------------------------------ ------- ------------------------------

**◆ CHAPTER 3**

**CLAUDE CODE**

*Database, Auth & Security*

Switch to Claude Code for all backend work. Open your project in
terminal and run: claude

  ------------------------------ ------- ------------------------------
                                    ◆    

  ------------------------------ ------- ------------------------------

**STEP 9 Database Schema & Row Level Security**

**◆ CLAUDE CODE**

+---+------------------------------------------------------------------+
|   | **WHAT THIS DOES**                                               |
|   |                                                                  |
|   | Creates all Supabase tables, relationships, enums, indexes,      |
|   | triggers, and Row Level Security policies. RLS enforces tenant   |
|   | isolation at the database level --- not just the application     |
|   | level.                                                           |
|   |                                                                  |
|   | **WHY IT MATTERS**                                               |
|   |                                                                  |
|   | RLS is your security perimeter. Even with an application bug,    |
|   | one tenant\'s data can never reach another tenant. A Nexa holds  |
|   | buyer SSNs, bank statements, and home addresses --- this         |
|   | protection is non-negotiable.                                    |
+---+------------------------------------------------------------------+

**◆ PROMPT --- CLAUDE CODE --- Full database schema + RLS**

Create all Supabase migration files in /supabase/migrations/.

Every table: tenant_id UUID NOT NULL, created_at, updated_at
TIMESTAMPTZ.

TABLES: tenants users transactions transaction_parties documents

checklists checklist_items checklist_templates messages

email_ingestion tasks audit_log api_integrations

ENUMS: user_role transaction_status document_status document_category

RLS --- one policy per table per operation:

TCs: full CRUD within their tenant

Agents: SELECT/INSERT on their linked transactions and documents

Buyers/Sellers: SELECT only on their single transaction + shared docs

Mortgage/Title: SELECT on assigned transactions, INSERT documents

Admins: full access within their tenant

audit_log: INSERT only (no one can read or modify)

INDEXES: tenant_id (all), transaction_id (all child), status, email,
close_date DESC

TRIGGERS: auto-update updated_at, write audit_log on every
INSERT/UPDATE/DELETE

FUNCTIONS: get_user_tenant_id() from JWT, generate_transaction_email(id)

**STEP 10 Auth, MFA & Security Hardening**

**◆ CLAUDE CODE**

+---+------------------------------------------------------------------+
|   | **WHAT THIS DOES**                                               |
|   |                                                                  |
|   | Builds complete authentication: login, MFA enforcement for       |
|   | TC/admin roles, session management, rate limiting, CSRF          |
|   | protection, security headers, and the invite token system.       |
|   |                                                                  |
|   | **WHY IT MATTERS**                                               |
|   |                                                                  |
|   | Security cannot be retrofitted. Building it now means every      |
|   | feature that ships afterward inherits it automatically.          |
+---+------------------------------------------------------------------+

**◆ PROMPT --- CLAUDE CODE --- Auth, MFA, security, invites**

AUTH (Supabase Auth + \@supabase/ssr):

/lib/supabase/server.ts /lib/supabase/client.ts
/lib/supabase/middleware.ts

/middleware.ts --- session validation + route protection for all role
paths

Inject tenant_id + role into request headers after validation

MFA: enforce TOTP for tc/admin/superadmin roles on first login

Redirect to /auth/mfa, use Supabase built-in MFA

RATE LIMITING (Upstash): login 10/15min/IP, API 100/min/user, return 429

SECURITY HEADERS (next.config.js):

CSP, X-Frame-Options:DENY, X-Content-Type-Options:nosniff,

Referrer-Policy:strict-origin, HSTS, Permissions-Policy

CSRF: token in httpOnly cookie, validate on all mutations

AUDIT (/lib/security/audit.ts): log all actions with ip + user_agent

INVITE: signed JWT 72hr, Postmark email, /invite/\[token\] acceptance,

store used tokens in Redis to prevent replay

  ------------------------------ ------- ------------------------------
                                    ◆    

  ------------------------------ ------- ------------------------------

**◆ CHAPTER 4**

**CLAUDE CODE**

*AI Engine & External Integrations*

The intelligence layer and the data pipes that feed it. Build
integrations first --- the AI engine calls them immediately.

  ------------------------------ ------- ------------------------------
                                    ◆    

  ------------------------------ ------- ------------------------------

**STEP 11 Build All External API Integrations**

**◆ CLAUDE CODE**

+---+------------------------------------------------------------------+
|   | **WHAT THIS DOES**                                               |
|   |                                                                  |
|   | Creates isolated client modules for MLS (RESO), county assessor  |
|   | (ATTOM), e-signature (DocuSign), email ingestion (Postmark), and |
|   | banking (Plaid). Each is self-contained and swappable.           |
|   |                                                                  |
|   | **WHY IT MATTERS**                                               |
|   |                                                                  |
|   | These are the data pipes that make the AI first pass possible.   |
|   | Without MLS and assessor data, the AI has nothing to work with   |
|   | on transaction open.                                             |
+---+------------------------------------------------------------------+

**◆ PROMPT --- CLAUDE CODE --- All external API clients**

Build all integration clients. All credentials in env vars --- never
hardcode.

Encrypt stored credentials with AES-256 before saving to
api_integrations table.

1\. MLS (/lib/mls/client.ts) RESO Web API OAuth 2.0 per tenant

getListingByMlsNumber() getListingPhotos() refreshToken()

2\. ATTOM (/lib/clerk/client.ts) REST API key

getPropertyByAddress() getOwnerInfo()

3\. DOCUSIGN (/lib/docusign/client.ts) REST v2.1 JWT Grant

createEnvelope() getEmbeddedSigningUrl() voidEnvelope()
downloadSignedDocument()

Webhook /api/webhooks/docusign: verify HMAC, handle events, download on
complete

4\. POSTMARK (/lib/email/client.ts) templates + inbound webhook

Inbound: parse attachments → save to Storage → classify with Claude →
notify TC

5\. PLAID (/lib/bank/client.ts)

createLinkToken() exchangePublicToken() verifyFundsAvailable()

All clients: retry 429/5xx exponential backoff max 3, typed errors,
audit log calls

**STEP 12 Build the AI First Pass Engine**

**◆ CLAUDE CODE**

+---+------------------------------------------------------------------+
|   | **WHAT THIS DOES**                                               |
|   |                                                                  |
|   | On transaction open: pulls MLS + assessor data, parses uploaded  |
|   | documents with Claude, merges all sources with per-field         |
|   | confidence scores (0--100), and presents a color-coded review    |
|   | screen. Target: 80--100% field completion.                       |
|   |                                                                  |
|   | **WHY IT MATTERS**                                               |
|   |                                                                  |
|   | This is the platform\'s core value. A TC opening a transaction   |
|   | with an MLS number and one uploaded contract should review an    |
|   | 85% complete file instead of building it from scratch. This      |
|   | saves 30--60 minutes per transaction.                            |
+---+------------------------------------------------------------------+

**◆ PROMPT --- CLAUDE CODE --- AI First Pass Inngest function**

FILE: /inngest/functions/aiFirstPass.ts

TRIGGER: event \"transaction.opened\" { transactionId, tenantId,
mlsNumber, documentIds }

STEP 1 MLS: fetch all property fields, store in
transactions.property_data jsonb

STEP 2 ATTOM: fetch assessor data, merge into property_data

STEP 3 DOCS: for each document --- download → send to Claude API:

System: \"Real estate document parser. Extract structured data. Return
ONLY

valid JSON --- no markdown --- matching schema: { parties, property,
dates,

financial, contingencies, other }. Use null for missing. Never invent
data.\"

Store in documents.ai_extracted jsonb

STEP 4 MERGE: unify all sources, score each field:

100=2+ independent sources match, 85=single quality source,

70=single doc extraction, 50=inferred, 0=not found

Store in transactions.first_pass_data + first_pass_scores jsonb

STEP 5 CHECKLIST: create from matching template by transaction_type

STEP 6 NOTIFY: in-app notification + Postmark email to TC with
confidence %

Handle step failures gracefully. Log everything to audit_log.

**STEP 13 Wire Data to UI & End-to-End Test**

**◆ CLAUDE CODE**

+---+------------------------------------------------------------------+
|   | **WHAT THIS DOES**                                               |
|   |                                                                  |
|   | Replaces all placeholder data with real Supabase queries, adds   |
|   | Realtime subscriptions, connects Inngest jobs to their triggers, |
|   | and runs a 10-step manual integration test.                      |
|   |                                                                  |
|   | **WHY IT MATTERS**                                               |
|   |                                                                  |
|   | This step makes the application go from looking right to         |
|   | actually working. Every TODO comment from Chapter 2 gets         |
|   | resolved with a real data query.                                 |
+---+------------------------------------------------------------------+

**◆ PROMPT --- CLAUDE CODE --- Wire all UI + full integration test**

Replace all placeholder data with real Supabase server-side queries.

Add Supabase Realtime for: new messages, inbound documents, checklist
changes.

Use Suspense + skeletons for loading, error.tsx for error boundaries.

Optimistic updates for: checklist toggles, task completion.

RUN 10-STEP INTEGRATION TEST:

1\. Create tenant + TC user

2\. TC opens transaction with MLS# → confirm AI First Pass triggers

3\. Upload purchase contract → appears in document manager

4\. Complete + approve First Pass → status updates

5\. Invite buyer → accepts invite → logs in

6\. Buyer sees only their transaction → confirms RLS

7\. TC sends agreement to DocuSign → signs → webhook fires

8\. Document status updates → checklist item auto-completes

9\. Check audit_log → every action recorded with IP + user agent

10\. Test rate limit → exceed 10 logins → confirm 429

Report and fix all failures. Do not mark complete until all 10 pass.

  ------------------------------ ------- ------------------------------
                                    ◆    

  ------------------------------ ------- ------------------------------

**◆ CHAPTER 5**

**CLAUDE CODE**

*Help System --- Built As You Build*

The help system is built in parallel with the application --- not as an
afterthought. One help article per feature, written before moving to the
next step. Every user in every role always has guidance one click away.

  -- ------------------------------------------------------------------
     THE RULE: Every time a feature is built in Chapters 1--4, a
     corresponding help article is written before moving to the next
     step. Help articles live in /help/articles/\[role\]/ as markdown
     files, are served via an in-app sliding panel, and are
     context-aware --- they know which screen the user is on.

  -- ------------------------------------------------------------------

**STEP 14 Build the In-App Help Panel**

**◆ CLAUDE CODE**

+---+------------------------------------------------------------------+
|   | **WHAT THIS DOES**                                               |
|   |                                                                  |
|   | Creates a sliding help panel accessible from every screen via a  |
|   | persistent \'?\' button. The panel renders role-appropriate      |
|   | markdown articles, supports fuzzy search, and automatically      |
|   | shows the relevant article based on the current route.           |
|   |                                                                  |
|   | **WHY IT MATTERS**                                               |
|   |                                                                  |
|   | Users should never need to leave the platform to find help. A    |
|   | help button on every screen means the answer is always one click |
|   | away --- dramatically reducing support tickets from agents,      |
|   | buyers, and other parties who are new to the platform.           |
+---+------------------------------------------------------------------+

**◆ PROMPT --- CLAUDE CODE --- Help panel component + article system**

HELP PANEL (/components/help/HelpPanel.tsx):

Trigger: floating \"?\" button, bottom-right, every screen (add to
dashboard/layout.tsx)

Behavior: slides in from right, 420px fixed panel, overlay (not pushing
content)

Header: \"Help & Guide\" in Playfair Display navy, gold close button

Body: markdown rendered with react-markdown + remark-gfm

Search: fuzzy search across all articles using Fuse.js

Cmd+K: opens full-screen search modal across all articles

Context-aware: shows relevant article for current route automatically

/tc → \"TC Dashboard Overview\"

/tc/transactions/\[id\] → \"Managing a Transaction File\"

/buyer/\[id\] → \"Your Home Purchase --- What to Expect\"

(full route mapping for all 14 routes)

ARTICLE INDEX (/help/index.ts):

Array of { slug, title, route, role, content } --- load from markdown at
build time

ARTICLE RENDERER: Playfair Display headings, Georgia body, gold callout
borders.

Support: headings, bold, bullets, numbered steps, callout blocks,
screenshots.

Colors: navy headings, gold left-border callouts, neutral/50 bg.

Apply brand palette to help panel: navy header bar, gold accents, warm
neutral body.

**STEP 15 Write All Help Articles --- Every Role**

**◆ CLAUDE CODE**

+---+------------------------------------------------------------------+
|   | **WHAT THIS DOES**                                               |
|   |                                                                  |
|   | Generates a complete set of help articles for every role and     |
|   | every major feature. Written in plain, friendly language --- not |
|   | technical documentation --- because the primary readers are real |
|   | estate agents, buyers, and sellers.                              |
|   |                                                                  |
|   | **WHY IT MATTERS**                                               |
|   |                                                                  |
|   | A help article written before a user calls saves your TC team    |
|   | time every time. Written immediately after a feature is built,   |
|   | articles are always accurate. Written from the user\'s           |
|   | perspective, they actually get read.                             |
+---+------------------------------------------------------------------+

**◆ PROMPT --- CLAUDE CODE --- TC role help articles**

Write all TC role help articles. Save each as .md in /help/articles/tc/.

Voice: confident, clear, warm. Assume reader knows real estate, not
software.

Use numbered steps for procedures. Gold callout blocks (\> syntax) for
key notes.

Apply brand voice throughout --- professional, not corporate.

ARTICLES:

tc/dashboard-overview.md --- \"Your TC Dashboard --- At a Glance\"

Stats cards, pipeline kanban, deadline color coding, tasks, new
transaction button.

tc/opening-a-transaction.md --- \"Opening a New Transaction\"

Step-by-step from New Transaction through AI First Pass completion.

What confidence percentages mean. How to approve and route documents.

tc/document-manager.md --- \"Managing Transaction Documents\"

Upload methods (drag-drop, email-in, direct). Category organization.

Approving/rejecting, sending for signature, version history.

tc/checklists.md --- \"Using the Transaction Checklist\"

Auto-complete behavior, manual completion, due dates, PDF export.

tc/inviting-parties.md --- \"Inviting Parties to the Transaction\"

How to invite all roles, what each party can and cannot see,

resending invites, revoking access.

tc/signature-workflow.md --- \"Sending Documents for Signature\"

Preparing a document, placing signature blocks, selecting signers,

what the signer sees, voiding envelopes.

tc/deadlines-and-tasks.md --- \"Tracking Deadlines and Tasks\"

How deadlines are created, color coding, adding custom deadlines,

task board, daily digest email.

**◆ PROMPT --- CLAUDE CODE --- All other role help articles**

Write help articles for agent, buyer, seller, mortgage, and title.

Save in /help/articles/\[role\]/. Same voice standards as TC articles.

Buyer and seller articles: warm welcome letter tone, never technical.

AGENT: dashboard-overview.md / uploading-documents.md / messaging.md

BUYER: welcome.md (warm, reassuring, explains portal purpose and
privacy)

signing-documents.md (plain English e-sign walkthrough)

uploading-documents.md / understanding-timeline.md / important-dates.md

SELLER: welcome.md / disclosures.md / signing-documents.md / timeline.md

MORTGAGE: dashboard-overview.md / uploading-documents.md / milestones.md

TITLE: dashboard-overview.md / checklist.md / uploading.md /
closing-coordination.md

  ---------- ----------------------------------------------------------------
   **RULE**  Going forward: every new feature built in future phases (forms
             automation, workflow templates, document generation, reporting)
             requires a corresponding help article before that step is
             considered complete. The help system stays current because it is
             part of the definition of done.

  ---------- ----------------------------------------------------------------

**QUICK REFERENCE --- ALL 15 STEPS**

  -------- --------- ------------ ---------------------------------- ----------------------
  **\#**   **Ch.**   **Tool**     **Step**                           **Output**

  **1**    Ch.1      **FIGMA**    Set up file & layer structure      *Named Figma file*

  **2**    Ch.1      **FIGMA**    Build design token page            *Brand token system*

  **3**    Ch.1      **FIGMA**    Build component library + graphics *All UI components*

  **4**    Ch.1      **FIGMA**    Design all 14 screens              *Full screen designs*

  **5**    Ch.2      **CURSOR**   Extract tokens → Tailwind          *tailwind.config.ts*

  **6**    Ch.2      **CURSOR**   Scaffold Next.js project           *Full project
                                                                     structure*

  **7**    Ch.2      **CURSOR**   Generate components from Figma     *React component
                                                                     library*

  **8**    Ch.2      **CURSOR**   Generate all screen pages          *14 working pages*

  **9**    Ch.3      **CL CODE**  Database schema + RLS              *Supabase migrations*

  **10**   Ch.3      **CL CODE**  Auth + security hardening          *Login, MFA, rate
                                                                     limiting*

  **11**   Ch.4      **CL CODE**  External API integrations          *MLS, ATTOM, DocuSign*

  **12**   Ch.4      **CL CODE**  AI First Pass engine               *Inngest + Claude*

  **13**   Ch.4      **CL CODE**  Wire data + E2E test               *Working application*

  **14**   Ch.5      **CL CODE**  Help panel component               *In-app help system*

  **15**   Ch.5      **CL CODE**  Write all help articles            *Complete help docs*
  -------- --------- ------------ ---------------------------------- ----------------------

**ENVIRONMENT VARIABLES**

**◆ PROMPT --- CLAUDE CODE --- .env.local template**

Create .env.local with every variable this project needs.

Group by service. Comment each line (what it is + where to get it).

Services: Supabase, Anthropic, DocuSign, Postmark, Upstash Redis,

ATTOM, MLS (RESO generic), Plaid, JWT secrets, Inngest, app config.

Add .env.local to .gitignore. Never commit credentials.

**FULL BUILD SEQUENCE**

+:---------:+:-----:+:----------:+:-----:+:------------:+:-----:+:--------:+:-----:+:--------:+
| 🎨        | **→** | ⚡         | **→** | 🗄            | **→** | 🤖       | **→** | 📖       |
|           |       |            |       |              |       |          |       |          |
| **Figma** |       | **Cursor** |       | **Database** |       | **AI     |       | **Help   |
|           |       |            |       |              |       | Engine** |       | System** |
| Ch. 1     |       | Ch. 2      |       | Ch. 3        |       |          |       |          |
|           |       |            |       |              |       | Ch. 4    |       | Ch. 5    |
+-----------+-------+------------+-------+--------------+-------+----------+-------+----------+

  ------------------------------ ------- ------------------------------
                                    ◆    

  ------------------------------ ------- ------------------------------

**◆ More phases coming ◆**

*Forms automation · Workflow templates · Document generation ·
Reporting*
