# 公開前チェック記録

最終更新: 2026-06-07

## 状態

`天空庭園と分数のしずく` は、リンク置き場用コピーで授業投入前のローカル確認を通過済み。

- 編集元: `C:\Users\riton\Projects\school-learning-app-sources\fraction-division-dojo`
- 表示用コピー: `C:\Users\riton\Projects\school-learning-app-launchpad\fraction-division-dojo`
- ローカル確認URL: `http://127.0.0.1:4242/fraction-division-dojo/`
- 保存方式: ブラウザ内 `localStorage`
- 外部送信: なし
- 学校データ・Sheet書き込み: なし

## 通過済みの主な確認

- 通常練習、10問完了、リザルト、ホーム復帰
- 間違いがある10問後の強制やり直し
- やり直し正解ではしずくを増やさない
- やり直し待ちがある場合、ホームに戻ってもスキップできない
- 10問途中でホームに戻った場合の再開
- 10問途中で再読み込みした場合の再開
- 全角・半角数字のキーボード入力
- Enterで分子から分母へ移動、再Enterで答え合わせ
- 答え欄は空欄時に枠だけ表示し、入力時に即反映
- 通常時はヒント非表示、やり直し時はヒント表示
- 約分の3ステップと長い線の視覚説明
- 正解時・不正解時の演出が問題文や解答に重ならない
- 20 / 60 / 100しずくで景色が切り替わる
- 100しずく到達時に生成画像の全クリ画面を表示
- Chromebook幅、390px、360px幅でボタン・文字が画面外に出ない
- 編集元と表示用コピーの主要ファイル・参照画像が一致
- `google.script.run`、`SpreadsheetApp`、`fetch` など外部送信系の混入なし

## 検査コマンド

```powershell
npm test
```

`npm test` は次をまとめて実行する。

- `npm run audit:static`
- `npm run audit`
- `npm run audit:device`
- `npm run audit:full`
- `npm run audit:production`

## 主要スクリーンショット

- 全クリ画面: `output\production-audit\04-final-clear.png`
- やり直し優先確認: `output\production-audit\03-pending-retry-priority.png`
- 再読み込み再開: `output\production-audit\02-after-reload-resume.png`
- 端末幅確認: `output\device-audit\`
- しずく進行通し確認: `output\full-playthrough\`
