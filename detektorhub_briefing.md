# Detektorhub — Project Briefing

**Source:** Prototype Fund Application #PTFJ02495 + GitHub ([JonasASchmidt/detektor-hub](https://github.com/JonasASchmidt/detektor-hub))
**Applicant:** Robert Schlick — Webentwickler, zertifizierter Sondengänger, M.Sc. Hydrologie
**Funding:** Prototype Fund Jahrgang 02 — 6 Monate + optional 4 Monate Second Stage

---

## What is it?

Detektorhub is a **web platform for the legal, digital registration of archaeological metal detector finds** in Germany. It bridges the gap between volunteer detectorists ("Sondler*innen") and the state archaeology authorities (*Landesämter*) responsible for managing and documenting those finds.

Currently every federal state handles find documentation differently — analog forms, Slack channels, email chains, or nothing at all. There is no unified digital solution. Detektorhub aims to fix that.

---

## The Problem

- ~800 certified detectorists in Schleswig-Holstein alone; many more operating without permits
- Reporting rules differ by state: Saxony requires all pre-1871 finds reported; SH pre-1600; Hamburg issues area-wide permits vs. per-parcel in other states
- High bureaucratic overhead for both volunteers and authorities
- No standardised, public record of finds for research or civic interest
- Illegal digs produce finds that vanish from the archaeological record entirely

---

## Core User Groups

1. **Sondler*innen** — apply for area permits, log finds, help ID them via community features
2. **Authorities / Archaeologists** — define state-specific rules, approve search areas, manage permissions, receive reports
3. **Public** — browse approved finds, read up on regulations
4. **Illegal diggers** — anonymous find submission to preserve archaeological value without self-incrimination

---

## Functionality

### Already built (as of late 2025)
- User registration & login
- Find registration (desktop): tag selector, location picker, image gallery
- Comment system on finds — community-driven identification assistance
- **Determination Score** — algorithmic indicator of how well a find has been IDed by the community
- Map + list view of finds
- Geo API: resolves coordinates → Bundesland / Landkreis / Gemeinde

### Planned — 6-month funded period
- Improved UX/UI, scoring algorithm, comment system (links to similar finds, @mentions), filters & search
- **Field App** — lightweight mobile view for quick field logging, with full editing at home later
- **Permission system** — authorities define groups, approve polygon areas, assign permissions
- **Import / Export** — from GPS apps (Google Maps, GoTerrain, QField); export for analog reports
- **Anonymous find submission** — preserves data from illegal digs for archaeological record

### Second Stage goals (+4 months)
- Roll-out pitch to all 16 federal states
- Translate analogue bureaucratic workflows into digital platform flows
- UI/UX refinement with real users
- Prep find data for potential future AI-assisted identification

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (TypeScript) |
| Frontend | React, Tailwind CSS, shadcn/ui, Radix UI |
| Maps | Leaflet |
| ORM | Prisma |
| Database | PostgreSQL |
| Image storage | Cloudinary (→ own service long-term) |
| Geo API | Custom (coords → admin units) |
| Deployment | Vercel / Netlify / GitHub Pages compatible |

**Repo:** TypeScript 96% · Python 2% · CSS 1% · 47 commits · MIT licence · Active development

### Key repo structure
```
app/
  api/        → auth, findings, geo/admin-units, images, tags, user-images
  dashboard/  → findings, image-gallery, tags
  login/, signup/
components/   → auth, map, image-gallery, modals, tags, ui, sidebar, nav
prisma/       → DB schema & migrations
schemas/      → data validation
hooks/, lib/, types/, scripts/
```

---

## Developer Background

Robert Schlick has an M.Sc. in Hydrology and previously contributed to [INOWAS](https://www.inowas.com) (open-source groundwater modelling, React/TS) and FaceliftBBT (social media management, Angular). He is a licensed detectorist himself — strong domain expertise baked in. Solo project, estimated 720 hours over the funding period.

---

## Strategic Notes

- **No direct competitor exists in Germany** — current "solutions" are Slack, forums, or paper
- Sustainability depends on institutional adoption by state authorities — that's the make-or-break factor
- AI angle (automated find ID from community-labelled data) is a credible future phase, not a gimmick
- MIT licence is a Prototype Fund requirement but is also an asset for institutional trust
