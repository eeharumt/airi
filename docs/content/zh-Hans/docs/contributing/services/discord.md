---
title: Discord Bot
description: 参与并贡献 Project AIRI
---

### Discord Bot / 机器人

```shell
cd services/discord-bot
```

配置 `.env` 文件：

```shell
cp .env .env.local
```

在 `.env.local` 中填写运行时配置。

```shell
DISCORD_TOKEN=''
AIRI_TOKEN='abcd'
AIRI_URL='ws://localhost:6121/ws'
```

启动机器人：

```shell
pnpm -F @proj-airi/discord-bot start
```

然后在 AIRI 的“设置 -> Modules -> Discord”中启用集成、保存令牌，并选择聊天输入模式：

- **仅私信或提及**：把私信和提及 Bot 的消息作为输入
- **所有消息**：把 Bot 可读取频道中的普通文本消息也作为输入

::: tip

如果你使用 [@antfu/ni](https://github.com/antfu-collective/ni)，你可以：

```shell
nr -F @proj-airi/discord-bot dev
```

:::
