---
title: Discord Bot
description: Contribute to Project AIRI
---

### Discord bot integration

```shell
cd services/discord-bot
```

Configure `.env`

```shell
cp .env .env.local
```

Edit the runtime configuration in `.env.local`.

```shell
DISCORD_TOKEN=''
AIRI_TOKEN='abcd'
AIRI_URL='ws://localhost:6121/ws'
```

Run the bot

```shell
pnpm -F @proj-airi/discord-bot start
```

Then open AIRI Settings -> Modules -> Discord, enable the integration, save the token, and choose the chat input mode:

- **DMs or mentions only**: ingest DMs and messages that mention the bot
- **All messages**: ingest every readable text message in a channel

::: tip

For [@antfu/ni](https://github.com/antfu-collective/ni) users, you can

```shell
nr -F @proj-airi/discord-bot dev
```

:::
