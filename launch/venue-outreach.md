# Venue outreach (DRAFT: nothing has been sent)

Goal: get the 5 core details (Wi-Fi, outlets, laptop policy, noise, hours) straight from the venue, so the map stops guessing and says "per the venue". Lexi creates the form, sends the DMs, and pastes answers back (or exports the form's CSV into `data/venue-answers.csv`, and I'll import it with the venue as the source).

---

## 1. Google Form: "Colo NYC: help us describe your space"

**Form description**
> Colo NYC (colo-nyc.vercel.app) is a free, non-commercial map of the best places in NYC to work on a laptop, and to meet other people doing the same. We list your space because people recommend it. These 2 minutes help us describe it accurately, including your house rules. We never post anything you mark as private.

| # | Question | Type | Options |
|---|---|---|---|
| 1 | Venue name and location | Short answer | (required) |
| 2 | Your role | Multiple choice | Owner · Manager · Staff · Other |
| 3 | Are laptops welcome? | Multiple choice | Always · Weekdays only · Only in certain areas or at certain times · Not really |
| 4 | If there are laptop rules, what are they exactly? | Short answer | e.g. "No laptops Sat–Sun 10–3", "back room only" |
| 5 | Is there a time limit for laptop users? | Multiple choice | No limit · 1 hour · 2 hours · 3+ hours · "Buy something every ___" (other) |
| 6 | Wi-Fi for customers | Multiple choice | Yes, fast · Yes, basic · No Wi-Fi |
| 7 | Power outlets customers can use | Multiple choice | Many (most seats) · Some · A few · None |
| 8 | How loud is it usually on weekdays? | Multiple choice | Quiet · Moderate · Lively |
| 9 | Are phone or video calls OK? | Multiple choice | Yes · Quietly / headphones · Please no |
| 10 | Largest group that can sit together | Multiple choice | 2–3 · 4–6 · 7+ |
| 11 | Current opening hours | Paragraph | "Mon–Fri 7–6, Sat–Sun 8–5" |
| 12 | Busiest times we should warn people about | Short answer | optional |
| 13 | Anything else people should know before coming to work? | Paragraph | optional |
| 14 | May we cite "per the venue" on the map? | Multiple choice | Yes · Use it but don't cite us · Private, for accuracy only |
| 15 | Email for occasional updates (optional) | Short answer | |

Settings: don't collect emails automatically; responses go to a Sheet; limit 1 response off (multiple staff may answer).

---

## 2. DM / email templates

### Instagram DM (English)
> Hi! I'm Lexi. I'm making Colo NYC, a free map of the best places in NYC to work on a laptop (and to meet others doing the same). [Venue] is on it because people love working there 🙌
> Could someone on your team take a 2-minute form so we describe your house rules right (Wi-Fi, outlets, laptop hours)? [form link]
> Here's your page: colo-nyc.vercel.app/en/spot/[slug]. Thank you!

### Instagram DM (中文, for Chinese-owned cafes)
> 你好！我是 Lexi，在做一个免费的「纽约同城办公地图」Colo NYC，收录纽约最适合带电脑办公的地方，也方便大家约着一起 co-work。[店名] 被很多人推荐，所以收录了～
> 想麻烦店里花 2 分钟填个小表格（Wi-Fi、插座、什么时候能开电脑），这样我们写的规则更准确：[表格链接]
> 这是你们店的页面：colo-nyc.vercel.app/zh/spot/[slug]　谢谢！

### Email (for hotels, libraries and atriums with a press or community contact)
> **Subject:** Quick accuracy check: [Venue] on Colo NYC
>
> Hello [Venue] team,
>
> I'm building Colo NYC (colo-nyc.vercel.app), a free, non-commercial map of NYC places that welcome people working on laptops. [Venue] is listed, and I'd like to make sure we describe it correctly: when non-guests/visitors are welcome, Wi-Fi, outlets, and any house rules.
>
> If you have 2 minutes, this short form covers it: [form link]. Or just reply with any corrections.
>
> Current page: colo-nyc.vercel.app/en/spot/[slug]
>
> Thank you,
> Lexi

---

## 3. Who to contact first (highest value per message)

Spots where one answer fills the most missing core details. Brooklyn first, matching `data/gaps.md`. See `data/gaps.md` for the full list; good first wave:
- Cafés with 2+ missing core details and an Instagram account (`website` points to instagram.com or the venue site lists one)
- Hotel lobbies: lobby hours for non-guests are the most common gap, and only the hotel can answer it
- Public atriums (POPS): building management, via the address on the APOPS page

Rules: one message per venue, no follow-up spam (at most one reminder after 2 weeks), and no promises of placement.
