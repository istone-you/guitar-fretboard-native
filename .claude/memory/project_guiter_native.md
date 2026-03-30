---
name: Guitar Native Project
description: React Native版ギターフレットボードアプリの開発状況と構造
type: project
---

Expo + React Native版の Guitar Fretboard アプリ（`/Users/istone/Documents/guiter-native`）

**Why:** `/Users/istone/Documents/guiter` のWebアプリ（React + Vite + Tailwind）のモバイル版を作成するため

**How to apply:** このプロジェクトはExpoを使ったReact Nativeアプリ。スタイルはNativeWindではなくReact Native StyleSheetを使用している。

## 技術スタック
- Expo SDK 52
- React Native 0.76.9
- React 18.2.0
- i18next + react-i18next（日/英対応）
- @react-native-async-storage/async-storage（設定永続化）
- TypeScript（strict mode）

## ポートした内容
- `src/logic/fretboard.ts` — そのままコピー（純粋ロジック）
- `src/types.ts` — Webからコピー + QuizMode/QuizType/QuizQuestion等を追加
- `src/i18n.ts` — AsyncStorage使用に変更（localStorage→AsyncStorage）
- `src/hooks/usePersistedSetting.ts` — AsyncStorage使用に変更
- `src/hooks/useDegreeFilter.ts`, `useDiatonicSelection.ts` — そのままコピー
- `src/hooks/useQuiz.ts` — importパスのみ変更
- 全コンポーネント — div/spanをView/Textに変換、TailwindをStyleSheetに変換

## ビルド確認済み
`npx expo export --platform ios` でバンドル成功（600 modules, 1.82 MB）
