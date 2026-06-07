# 天空庭園と分数のしずく

小学6年生向けの分数の割り算練習Webアプリです。正解すると「しずく」が集まり、100しずくで天空庭園が完成します。

- 想定画面: Chromebook 横長
- 保存: ブラウザ内 `localStorage`
- 外部送信: なし
- 名前: 初回に児童が入力・選択
- 進み具合の移動: 設定からバックアップコードを作成・読み込み
- 庭園の変化: 0しずく -> 20しずく -> 60しずく -> 100しずくで、水が戻って完成
- 学習構成: 分数 ÷ 整数 -> 約分あり -> 整数 ÷ 分数 -> 分数 ÷ 分数 -> 帯分数 -> 文章題
- レベル解放: 1回10問、8問以上正解で次の庭へ進む
- まちがい直し: 10問の中で間違えた問題は、終わったあとに強制やり直し。やり直し正解ではしずくを増やしません。
- 全クリ: 100しずく到達時に、生成画像を使った「全クリ！」画面を表示します。

## ローカル確認

```powershell
npm install
npm run start
npm run audit
npm run audit:device
npm run audit:full
npm run audit:production
npm run audit:static
npm test
```

`http://127.0.0.1:4237/` で確認できます。

`output/` に確認用スクリーンショットと監査レポートが出ます。リンク置き場用コピーは `C:\Users\riton\Projects\school-learning-app-launchpad\fraction-division-dojo` です。
