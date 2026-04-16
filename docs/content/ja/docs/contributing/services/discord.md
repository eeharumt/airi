---
title: Discord Bot
description: Project AIRI への貢献
---

### Discord bot 統合

```shell
cd services/discord-bot
```

`.env` の設定

```shell
cp .env .env.local
```

`.env.local` にランタイム設定を記述します。

```shell
DISCORD_TOKEN=''
AIRI_TOKEN='abcd'
AIRI_URL='ws://localhost:6121/ws'
```

ボットの実行

```shell
pnpm -F @proj-airi/discord-bot start
```

その後、AIRI の「設定 -> Modules -> Discord」で連携を有効化し、トークンを保存してチャット入力モードを選択します。

- **DM またはメンションのみ**: DM と Bot メンション付きメッセージを入力として取り込みます
- **参加中のボイスチャンネルのみ**: 現在 AIRI と同じボイスチャンネルにいるメンバーのメッセージだけを入力として取り込みます
- **すべてのメッセージ**: Bot が読めるチャンネル内の通常メッセージも入力として取り込みます

::: tip

[@antfu/ni](https://github.com/antfu-collective/ni) ユーザーの場合：

```shell
nr -F @proj-airi/discord-bot dev
```

:::
