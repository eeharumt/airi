# `discord-bot`

Allow AIRI to receive Discord text and voice input, then send the response back to Discord.

## Getting started

```shell
git clone git@github.com:moeru-ai/airi.git
pnpm i
```

Create a bot application in the [Discord Developer Portal](https://discord.com/developers/home), then invite it to your server.

In the **Bot** tab, enable these intents:

- **Server Members Intent**
- **Message Content Intent**

Copy the bot token from the **Token** section for later use.

> [!NOTE]
> You can provide the bot token either through `.env.local` or from the AIRI settings UI. If you reset the token in Discord, update the saved configuration as well.

Create a `.env.local` file:

```shell
cd services/discord-bot
cp .env .env.local
```

Set the runtime configuration:

```shell
DISCORD_TOKEN=''
AIRI_TOKEN='abcd'
AIRI_URL='ws://localhost:6121/ws'
```

Start the Discord bridge:

```shell
pnpm -F @proj-airi/discord-bot start
```

## Text input behavior

After the bot is connected and enabled from AIRI Settings -> Modules -> Discord:

- **DMs or mentions only**: default mode; direct messages and messages that mention the bot become AIRI input.
- **Joined voice channel only**: only regular channel messages from members who are currently in the same voice channel as AIRI become AIRI input.
- **All messages**: every readable text message in a channel becomes AIRI input.

In **Joined voice channel only** mode, AIRI does not react to DMs or mentions.

## Other similar projects

- [pladisdev/Discord-AI-With-STT](https://github.com/pladisdev/Discord-AI-With-STT)

## Acknowledgements

- Implementation of Audio handling and processing https://github.com/TheTrueSCP/CharacterAIVoice/blob/54d6a41b4e0eba9ad996c5f9ddcc6230277af2f8/src/VoiceHandler.js
- Example of usage https://github.com/discordjs/voice-examples/blob/da0c3b419107d41053501a4dddf3826ad53c03f7/radio-bot/src/bot.ts
- Excellent library https://github.com/discordjs/discord.js
