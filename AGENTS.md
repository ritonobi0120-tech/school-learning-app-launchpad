# AGENTS.md

## Project

School learning app launcher for:

- ナンプレ
- 百マス計算
- 割り算の筆算

## Current Limitation

This repo contains launcher/wrapper pages only. Recovered app bodies are managed separately under `C:\Users\riton\Projects\school-learning-app-sources`.

- ナンプレ source: `C:\Users\riton\Projects\school-learning-app-sources\nump\apps-script`
- 百マス計算 source: `C:\Users\riton\Projects\school-learning-app-sources\hyakumasu\apps-script`
- 割り算の筆算 source: not recovered yet.

## Rules

- Answer the user in Japanese.
- Do not change deployed Google Apps Script URLs unless the user asks.
- Do not publish or push without user confirmation.
- If the user asks to debug app behavior inside ナンプレ or 百マス計算, edit the recovered source repo, not these launcher pages.
- If the user asks to debug 割り算の筆算 internals, first recover/export the Apps Script source and put it under `school-learning-app-sources\division\apps-script`.

## Main Files

- `index.html`: list of all three apps.
- `nump.html`: ナンプレ launcher.
- `hyakumasu.html`: 百マス計算 launcher.
- `division.html`: 割り算の筆算 launcher.
- `launch.html`: dynamic launcher.
