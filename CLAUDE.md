# 開発指示：ギター学習アプリ「Guitar Fretboard」

## 1. アプリの概要

「ベースシート（指板の音名または度数）」の上に、「透明なレイヤー（スケール・コード・カスタム）」を重ね合わせ、ルート音に合わせてスライド（平行移動）させる学習ツール。
Expo + React Native でクロスプラットフォーム（iOS / Android / Web）対応。

## 2. 画面構成と機能要件

### A. ベースレイヤー (Base Sheet)

- **指板構造**: 6弦×15フレット（0〜14フレット）のテーブルレイアウト。
- **データ**: スタンダードチューニング（E2, A2, D3, G3, B3, E4）に基づく全フレットの音名を表示。
- **ベース表示切り替え**: ベースレイヤーは「音名表示」と「度数表示（P1, m2, M2 ...）」をUIで切り替えられること。
  度数表示時は各セルを度数ごとの色枠でも識別できること。
- **視覚要素**: 3, 5, 7, 9, 12(ダブル)フレットにポジションマークを配置。
- **ルート音ハイライト**: 選択中のルート音は常時ハイライト表示する。

### B. レイヤーシステム

最大3つのレイヤーを同時に表示できるレイヤーシステム。各レイヤーは独立した色を持ち、以下の3種類から選択。

#### レイヤーパネル
- トグルスイッチで表示/非表示
- サマリー表示（レイヤーの種類、設定、構成音）
- 複製ボタン（色違いでコピー、3つ目は薄く表示）
- 設定ボタン（歯車アイコン）→ 設定モーダル
- 削除ボタン（×アイコン）
- ドラッグ&ドロップで順序変更（1つ目と3つ目の直接入れ替え可）
- プラスボタンでレイヤー追加

#### レイヤー設定モーダル
- ステップ式UI（type → settings → color / chips）
- タイプ選択（スケール / コード / カスタム）
- カラーピッカー（別ページ、10色プリセット）
- バウンスアニメーション付き遷移

#### 1. スケールレイヤー

対応スケール:
- 基本: メジャー、ナチュラルマイナー
- ペンタトニック: メジャーペンタ、マイナーペンタ
- ブルーノートスケール
- マイナー派生: ハーモニックマイナー、メロディックマイナー
- モード: Ionian, Dorian, Phrygian, Lydian, Mixolydian, Aeolian, Locrian
- 応用: フリジアンドミナント、リディアンドミナント、オルタード、ホールトーン、ディミニッシュ

#### 2. コードレイヤー

表示形式:
- **コードフォーム**: 6弦/5弦ルートのバレーコード + オープンコードを枠付きで表示。
  - 対応コード: Major, Minor, 7th, maj7, m7, m7(b5), dim7, m(maj7), sus2, sus4, 6, m6, dim, aug, 9, b9, #9, add9, 11, #11, add11, add#11, 13, b13
  - コード枠の表示/非表示切り替え（スライドトグル）
- **パワーコード**: ルートと5度のみの2音フォーム
- **トライアド**: 3弦セット（1-3弦 / 2-4弦 / 3-5弦 / 4-6弦）×転回形（基本 / 第一転回 / 第二転回）
  - 対応: Major, Minor, Diminished, Augmented
- **ダイアトニック**: キー種別（メジャー/マイナー）×和音種別（3和音/4和音）×度数
- **オンコード**: スラッシュコード（C/E, Am/G 等）のボイシングを表示
  - ルート音に応じた一覧から選択
  - 200以上のオンコードに対応
- **CAGED**: C・A・G・E・Dの5フォームを複数選択で表示

#### 3. カスタムレイヤー

- 音名または度数をチップで自由に選択して指板上に表示（別ページUI）
- 度数は拡張テンション対応（♭9, 9, ♯9, 11, ♯11, ♭13, 13）
- コードの構成音を抽出する機能（コードタイプを選択して抽出）

### C. クイズ機能

- **クイズモード**: 5種類（note / degree / chord / scale / diatonic）。
- **クイズタイプ**: choice（12択）/ fretboard（指板タップ）/ all（ダイアトニック用）。
- **コード識別**:
  - 指板上にコードフォームを表示し、ルート選択とコード種別選択の2段階で回答。
  - コード種別の出題範囲は複数選択で絞り込めること。
- **スケールクイズ**:
  - クイズパネル内からスケール種類を切り替えられること。
  - 音名選択は構成音を複数選択。
  - 指板は表示範囲内の該当セルをすべて選ぶ。
- **進行**:
  - 回答後は自動遷移せず、明示的なボタンで次へ進むこと。
  - スケールクイズのみ `次へ` ではなく `もう一度` と表示し、同じ問題をリトライ。

## 3. ロジックと操作性

- **ルート選択**: ヘッダーの ‹ › ボタンでルート音を変更。
- **臨時記号**: ♯/♭ の表記を設定から切り替えられること。
- **トランスポーズ**: ルートを変更すると、コードやスケールの「形」がそのまま平行移動すること。
- **多言語対応**: UI文言は日本語 / 英語を切り替えられること。
  - 実装は `i18next` / `react-i18next` を使用。
  - 翻訳辞書は `src/locales/{en,ja}/common.json` で管理。
- **設定永続化**: 設定は `@react-native-async-storage/async-storage` に保持。
  - ストレージキーは `guiter:` プレフィックス。
  - 対象: テーマ、臨時記号、フレット範囲、言語設定。

## 4. 技術スタック

- **Runtime / Package Manager**: Bun
- **Framework**: Expo (~54.0.0) + React Native (0.81.5)
- **Language**: TypeScript (strict mode)
- **UI**: React 19.1.0
- **SVG**: react-native-svg
- **Bundler**: Metro
- **i18n**: i18next + react-i18next
- **Storage**: @react-native-async-storage/async-storage
- **Path Alias**: `@/*` → `./src/*`（tsconfig.json）
- **Logic**:
  - 音名配列: `['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']`
  - 度数計算: `(TargetNoteIndex - RootNoteIndex + 12) % 12`

## 5. プロジェクト構成

```
guiter-native/
├── App.tsx                    # ルートコンポーネント（タブナビゲーション）
├── index.js                   # エントリーポイント
├── app.json                   # Expo 設定
├── global.css                 # Tailwind ディレクティブ
├── src/
│   ├── components/
│   │   ├── AppHeader/         # 設定・テーマ・言語・フレット範囲
│   │   ├── FretboardHeader/   # ルート音・ラベルモード切替
│   │   ├── LayerSystem/       # レイヤーリスト・設定モーダル
│   │   │   ├── LayerList.tsx
│   │   │   └── LayerEditModal.tsx
│   │   ├── LayerControls/     # レイヤー設定パネル（旧式、互換用）
│   │   ├── NormalFretboard/   # 通常モード指板
│   │   ├── QuizFretboard/     # クイズモード指板
│   │   ├── QuizPanel/         # クイズ出題・回答UI
│   │   └── ui/                # 共通UIコンポーネント
│   │       ├── Fretboard.tsx  # 指板レンダリング（SVG）
│   │       ├── ChevronIcon.tsx # 共有シェブロンアイコン
│   │       ├── DropdownSelect.tsx
│   │       ├── SegmentedToggle.tsx
│   │       └── scaleOptions.ts
│   ├── hooks/
│   │   ├── useQuiz.ts              # クイズロジック
│   │   ├── useDiatonicSelection.ts # ダイアトニック選択
│   │   └── usePersistedSetting.ts  # AsyncStorage 永続化
│   ├── logic/
│   │   └── fretboard.ts      # 音楽理論ロジック（スケール・コード・CAGED・度数・オンコード）
│   ├── types.ts               # 型定義（LayerConfig, ChordDisplayMode 等）
│   └── locales/
│       ├── en/common.json     # 英語
│       └── ja/common.json     # 日本語
├── metro.config.js            # Metro 設定
├── babel.config.js            # Babel 設定（expo preset）
└── tsconfig.json              # TypeScript 設定（strict, パスエイリアス）
```

## 6. 開発ルール

コードを変更した際は必ず以下を実行し、エラーがないことを確認すること。

```bash
bun run fmt
bun run lint
bun run typecheck
bun run test
```

- 機能追加・仕様変更を行った場合は、必ず `README.md` の該当箇所も同時に更新すること。

### useEffect の使用について

`useEffect` を使う場合は https://zenn.dev/begineer/articles/8a0696fda04c09 のチェックリストに該当するかどうかを確認すること。該当しない場合は使わないこと。
