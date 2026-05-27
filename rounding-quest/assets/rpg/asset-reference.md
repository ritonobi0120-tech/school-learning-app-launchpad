# RPG Asset Reference

## Chapter 4 / Final Chapter

- `final-castle.png`
  - Usage: stage card background and final-clear result background.
  - Role: the final royal castle reached after chapters 1-3.
  - Notes: wide reward/world image, no UI text is embedded by the app.

- `final-reward.png`
  - Usage: final reward illustration shown only after clearing chapter 4 with 10/10.
  - Role: the prize image for completing the whole rounding dungeon.
  - Prompt basis: a bright completed sky kingdom, a crown, treasure, and the four chapter emblems in a polished child-friendly RPG illustration style.

- `badge-stage4.png`
  - Usage: chapter 4 badge, stage card badge, question-screen reward icon.
  - Source: cropped reusable badge from `final-reward.png`.
  - Role: the crown emblem for the final mixed battle.

## Story Mapping

- Chapter 1: `光の鍵`
- Chapter 2: `塔の光`
- Chapter 3: `星のメダル`
- Chapter 4: `王冠の宝石`

Chapter 4 mixes the three previous problem types instead of teaching a new single pattern.

## Reuse Notes

- `guide-spirit.png`: moving player marker on the home map and the 10-step session path.
- `correct-burst.png`: correct-answer reward card image.
- `repair-workshop.png`: wrong-answer and review repair image.
- `badge-stage1.png` through `badge-stage4.png`: stage select badges, session gate icons, and progress destination icons.
- Stage background images live in the same folder and are referenced through `rounding-core.js` stage metadata so the local app and Apps Script draft can share the same names.
