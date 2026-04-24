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
- **タップ**: レイヤー行をタップして編集モーダルを開く
- **長押し**: iOS 26ネイティブ風コンテキストメニューを表示（編集・複製・削除）
- **左スワイプ**: 削除アクション（赤背景＋ゴミ箱アイコン）
- **ドラッグ&ドロップ**: 長押し200msから縦ドラッグで並べ替え（`react-native-reanimated-dnd` 使用、`layer.id` をキーとしてドロップ後のちらつきを防止）
- プラスボタンでレイヤー追加
- 同じセルに複数レイヤーが重なる場合は同心円状に入れ子でドットを表示（外側が1番目）

#### レイヤー設定モーダル
- ステップ式UI（type → settings → color / chips）
- タイプ選択（スケール / コード / CAGED / コード進行 / カスタム）
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
  - 対応コード: Major, Minor, 5, 7th, maj7, m7, m7(b5), dim7, m(maj7), sus2, sus4, 6, m6, dim, aug, 9, b9, #9, maj9, m9, add9, 7(b9), 7(#9), 11, #11, add11, add#11, m11, 13, b13, maj13, m13, 6/9, m6/9
  - コード枠の表示/非表示切り替え（スライドトグル）
- **トライアド**: 3弦セット（1-3弦 / 2-4弦 / 3-5弦 / 4-6弦）×転回形（基本 / 第一転回 / 第二転回）
  - 対応: Major, Minor, Diminished, Augmented
- **ダイアトニック**: キー種別（メジャー/マイナー）×和音種別（3和音/4和音）×度数
- **オンコード**: スラッシュコード（C/E, Am/G 等）のボイシングを表示
  - ルート音に応じた一覧から選択
  - 200以上のオンコードに対応

#### 3. CAGEDレイヤー

- C・A・G・E・Dの5フォームを複数選択で表示
- メジャー / マイナーの切り替え
- コード枠の表示/非表示切り替え

#### 4. プログレッションレイヤー

コード進行を**他レイヤーを固定したままコードだけを順に差し替えるため**のレイヤー。

- **進行テンプレート**: 組み込みテンプレート（I-IV-V / ii-V-I / I-vi-ii-V / I-VI-IV-V / I-V-vi-IV / iii-VI-ii-V / I-III-IV-iv / minor ii-V-i / i-VII-VI-VII / 12bar blues）＋ユーザー作成テンプレート
- **キータイプ**: Major / Minor（ヘッダーのルート音を使用）
- **コードサイズ**: 組み込みは3和音固定、カスタムはコードごとに個別指定（3和音〜テンション混在可）
- **ステップ操作**: レイヤーパネルの ‹ / › ボタンで前後のコードへ即時移動
- **ゴースト表示**: 前後ステップのコードを同色の低透明度で重ねて表示（任意ON/OFF）

#### 5. カスタムレイヤー

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
  - 対象: テーマ、臨時記号、フレット範囲、言語設定、左利きモード。
  - クイズ回答履歴も AsyncStorage に保持（`guiter:quiz-records`、最大1000件）。

## 4. 技術スタック

- **Runtime / Package Manager**: Bun
- **Framework**: Expo (~55.0.0) + React Native (0.83.4)
- **Language**: TypeScript (strict mode)
- **UI**: React 19.2.0
- **Navigation**: react-native-bottom-tabs（フッタータブ）+ @react-navigation/native
- **Styling**: NativeWind 4（Tailwind CSS for React Native）
- **SVG**: react-native-svg
- **Glass Effect**: expo-glass-effect（iOS Liquid Glass / GlassView）
- **Gradient**: expo-linear-gradient
- **Haptics**: expo-haptics
- **Gesture**: react-native-gesture-handler
- **Bundler**: Metro
- **i18n**: i18next + react-i18next
- **Storage**: @react-native-async-storage/async-storage
- **Formatter**: oxfmt / **Linter**: oxlint
- **Path Alias**: `@/*` → `./src/*`（tsconfig.json）
- **Logic**:
  - 音名配列: `['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']`
  - 度数計算: `(TargetNoteIndex - RootNoteIndex + 12) % 12`
  - **臨時記号の表記**: フラットは必ず `♭`（Unicode U+266D）を使用する。ASCII の `b` は使用禁止。
  - **コード進行の内部度数表記**: `CHROMATIC_DEGREES`・`DEGREE_TO_OFFSET`・`ProgressionChord.degree` では `b` prefix（例: `bIII`, `bVII`）を使用する（ストレージ互換のため）。`PROGRESSION_TEMPLATES.degrees[]` のみ伝統的ダイアトニック表記（`ii`, `vi` 等の小文字）を使うが、UI や `ProgressionChord` に変換する際は必ず `resolveProgressionDegree()` を通してクロマティック度数に正規化すること。
  - **UI表示用の度数ラベル**（`degreeLabel` 等）: 大文字クロマティック度数（♭は`♭`記号を使用）にコード種別サフィックスを付加した形式を使用する。`diatonicDegreeLabel()` の出力形式に準拠すること。
    - Major: `I`, `IV`, `♭VII`（サフィックスなし）
    - Minor: `IIm`, `IVm`, `VIm`（`m` を付加）
    - Diminished triad: `IIm(-5)`, `VIIm(-5)`（`m(-5)` を付加）
    - Augmented triad: `I+`（`+` を付加）
    - 7th コード: `Imaj7`, `IIm7`, `V7`, `VIIm7(-5)`, `VIIdim7` 等（コード種別をそのまま付加）
    - 小文字（`ii`, `iv` 等）は使用禁止。

## 5. プロジェクト構成

```
guiter-native/
├── App.tsx                    # ルートコンポーネント（providers + TabView のみ、共有状態を管理）
├── index.js                   # エントリーポイント
├── app.json                   # Expo 設定
├── global.css                 # NativeWind ディレクティブ
├── src/
│   ├── i18n.ts                # i18next 初期化
│   ├── types.ts               # 型定義（LayerConfig, ChordDisplayMode, LayerType 等）
│   ├── components/
│   │   ├── AppHeader/         # 設定ボタン・設定モーダル（テーマ / 言語 / フレット範囲）
│   │   │   └── SceneHeader/   # 各タブのヘッダー（ルート音 / ラベルモード / 設定ボタン）
│   │   ├── FretboardControls/ # 指板下部の操作パネル（ルート音 ‹ › / ラベルモード切替）
│   │   ├── LandscapeLayout/   # 横画面レイアウト（2カラム）
│   │   ├── LayerEditModal/    # レイヤー設定モーダル（タイプ選択・色・スケール・コード等）
│   │   ├── LayerList/         # レイヤーリスト（ドラッグ&ドロップ・コンテキストメニュー）
│   │   ├── NormalFretboard/   # 通常モード指板
│   │   ├── QuizFretboard/     # クイズモード指板（タップ可能）
│   │   ├── QuizPanel/         # クイズ出題・回答UI
│   │   ├── Stats/             # クイズ統計（ヒートマップ・ランキング）
│   │   ├── TabBar/            # フッタータブバー
│   │   └── ui/                # 共通UIコンポーネント
│   │       ├── BottomSheetModal/       # ボトムシートモーダル（SHEET_HANDLE_CLEARANCE エクスポート）
│   │       ├── BounceActionButton/     # バウンスアニメーション付きボタン
│   │       ├── ChordDiagram/           # コード図表示
│   │       ├── ColorPicker/            # 10色プリセットカラーピッカー
│   │       ├── ContextMenu/            # iOS 26ネイティブ風コンテキストメニュー
│   │       ├── Fretboard/              # 指板レンダリング（SVG）
│   │       ├── GlassIconButton/        # expo-glass-effect 統合ボタン（×・‹・? 等、44pt 標準）
│   │       ├── Icon/                   # SVG / SF Symbol アイコン
│   │       ├── PillButton/             # ピル形ボタン
│   │       ├── SegmentedToggle/        # セグメント選択UI
│   │       ├── SheetProgressiveHeader/ # iOS 26風フロストガラスヘッダー（BlurView + LinearGradient）
│   │       └── SlideToggle/            # スライドトグル
│   ├── hooks/
│   │   ├── useDiatonicSelection.ts     # ダイアトニックコード選択ロジック
│   │   ├── useLayerDerivedState.ts     # レイヤー有効状態・重複音・度数ラベル算出
│   │   ├── useLayerPresets.ts          # レイヤープリセット CRUD（AsyncStorage）
│   │   ├── useLayers.ts                # レイヤー管理（追加・削除・更新・並べ替え）
│   │   ├── useOrientation.ts           # 画面向き判定・横画面切り替え
│   │   ├── usePersistedSetting.ts      # AsyncStorage 永続化ユーティリティ
│   │   ├── useProgressionTemplates.ts  # カスタム進行テンプレート CRUD（AsyncStorage）
│   │   ├── useQuiz.ts                  # クイズ生成・判定・統計（全クイズモード）
│   │   ├── useQuizNavigation.ts        # クイズ画面内遷移（Selection ↔ Active スライド）
│   │   ├── useQuizRecords.ts           # 回答履歴管理（AsyncStorage、最大1000件）
│   │   ├── useQuizViewModel.ts         # クイズ表示ロジック（種別ラベル等）
│   │   └── useRootStepper.ts           # ルート音の ‹ › ステップ移動
│   ├── lib/
│   │   ├── fretboard.ts        # 音楽理論ロジック（スケール・コード・CAGED・度数・オンコード・進行テンプレート）
│   │   ├── chordFinder.ts      # 選択音からコード自動識別（完全一致・含有・被包含）
│   │   └── scaleFinder.ts      # 選択音からスケール自動識別
│   ├── screens/                # 各タブのルートスクリーン（タブローカルな状態はここで管理）
│   │   ├── Layer/              # タブ1: レイヤー管理（指板 + レイヤーリスト）
│   │   ├── Finder/             # タブ2: 音識別（コード / スケール検索）
│   │   ├── CircleOfFifths/     # タブ3: 五度圏（静的3リング円盤 + 4トグル表示オーバーレイ + 中央パネル）
│   │   ├── Templates/          # タブ4: コード進行テンプレート管理（プリセット管理はLayerタブ内）
│   │   │   ├── Detail/         # テンプレート詳細ビュー（スライドオーバー）
│   │   │   └── TemplateFormSheet/ # テンプレート作成・編集ボトムシート
│   │   └── Quiz/               # タブ5: クイズ
│   │       ├── Active/         # クイズ出題画面
│   │       ├── Selection/      # クイズ種別選択画面
│   │       └── Stats/          # 苦手分析画面（スライドオーバー）
│   ├── themes/
│   │   └── tokens.ts           # カラートークン・タイポグラフィ・radius（getColors 関数）
│   └── locales/
│       ├── en/common.json      # 英語
│       └── ja/common.json      # 日本語
├── metro.config.js             # Metro 設定
├── babel.config.js             # Babel 設定（expo preset）
└── tsconfig.json               # TypeScript 設定（strict, パスエイリアス）
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

### テストについて

- 新しいコンポーネント・hooks・ユーティリティを追加した際は、必ず対応するテストファイルも同時に作成すること。
- テストファイルは対象ファイルと同じディレクトリ内の `__tests__/` に配置すること。
- `jest.mock()` のパスはテストファイルからの相対パスで解決されることに注意すること（ソースファイルからではない）。

### BottomSheetModal の高さについて

`BottomSheetModal` のコンテンツには必ず `useSheetHeight()` が返す値を `height` として指定すること。独自の高さ（`paddingBottom` での調整や固定値）は使わない。

```tsx
const sheetHeight = useSheetHeight();
// ...
<View style={{ height: sheetHeight, ... }}>
```

### 色の定義について

色値（HEX・rgba・rgb）はコンポーネント内にインラインで書かず、必ず `src/themes/design.ts` で定義すること。

- テーマに応じて変わる色（ライト/ダーク）は `lightPalette` / `darkPalette` にトークンとして追加し、`ThemeColors` 型にも追記する。`getColors(isDark).tokenName` で参照すること。
- テーマに関わらず固定の色（オーバーレイ・セマンティック色など）は `design.ts` 内の対応するエクスポート定数（`OVERLAY_COLORS`・`ON_ACCENT`・`WHITE`・`BLACK` 等）に追加すること。
- 例外は動的計算（`rgba(${r},${g},${b},...)` のような関数内生成）とテストの期待値アサーションのみ。

### useEffect の使用について

`useEffect` を使う場合は https://zenn.dev/begineer/articles/8a0696fda04c09 のチェックリストに該当するかどうかを確認すること。該当しない場合は使わないこと。
