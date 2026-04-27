# AGENTS.md

## Project

School learning app launcher for:

- ナンプレ
- 百マス計算
- 割り算の筆算

## Current Limitation

This repo currently contains launcher/wrapper pages only. The Google Apps Script app source for the three apps is not recovered locally yet.

## Rules

- Answer the user in Japanese.
- Do not change deployed Google Apps Script URLs unless the user asks.
- Do not publish or push without user confirmation.
- If the user asks to debug app behavior inside ナンプレ, 百マス計算, or 割り算の筆算, first recover/export the Apps Script source and put it in a stable local repo.

## Main Files

- `index.html`: list of all three apps.
- `nump.html`: ナンプレ launcher.
- `hyakumasu.html`: 百マス計算 launcher.
- `division.html`: 割り算の筆算 launcher.
- `launch.html`: dynamic launcher.

