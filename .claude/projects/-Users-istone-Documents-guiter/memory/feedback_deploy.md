---
name: デプロイ方針
description: 変更時のデプロイはプレビューのみ。本番デプロイはユーザーが明示的に指示した場合のみ。
type: feedback
---

変更後にデプロイする場合は `bun run deploy:preview`（プレビューデプロイ）を使うこと。

**Why:** ユーザーが確認前に本番反映されることを避けたい。

**How to apply:** コード変更後にデプロイが必要な場合、`bun run deploy` ではなく `bun run deploy:preview` を使う。本番デプロイ（`bun run deploy`）はユーザーが明示的に「デプロイして」と言った場合のみ実行する。
