import type { Message, OmitPartialGroupDMChannel } from 'discord.js'

import type { AiriChannel } from '../airi/channel'

import { useLogg } from '@guiiai/logg'

import { stripDiscordMentions } from '../utils/text'

const log = useLogg('Discord:TextBridge').useGlobalConfig()

export interface TextBridgeOptions {
  airi: AiriChannel
  /**
   * Returns the attached text channel id of a guild's active voice channel, if any.
   */
  getAttachedTextChannelId: (guildId: string) => string | undefined
  /**
   * Bot's own user id, used to strip @mentions from forwarded text when present.
   */
  getSelfUserId: () => string | undefined
}

export interface TextBridgeHandle {
  /**
   * Called with an incoming non-bot message; returns true if the message was
   * forwarded to AIRI.
   */
  handleMessage: (
    message: OmitPartialGroupDMChannel<Message>,
  ) => boolean
}

/**
 * Returns a text-message router that relays Discord messages to AIRI as
 * `input:text` only when the message is posted in the text chat attached to the
 * voice channel the bot is currently connected to in that guild.
 *
 * When forwarding, mentions of the bot are stripped from the text payload.
 */
export function createTextBridge(options: TextBridgeOptions): TextBridgeHandle {
  const handleMessage = (
    message: OmitPartialGroupDMChannel<Message>,
  ): boolean => {
    if (message.author.bot)
      return false

    const rawContent = message.content
    if (!rawContent)
      return false

    const guildId = message.guildId
    if (!guildId)
      return false

    const attachedChannelId = options.getAttachedTextChannelId(guildId)
    if (attachedChannelId !== message.channelId)
      return false

    const selfUserId = options.getSelfUserId()
    const isMentioned = selfUserId
      ? message.mentions.users.has(selfUserId)
      : false

    const cleanedText = isMentioned
      ? stripDiscordMentions(rawContent)
      : rawContent.trim()

    if (!cleanedText)
      return false

    log
      .withField('author', message.author.tag)
      .withField('channelId', message.channelId)
      .withField('mentioned', isMentioned)
      .log('Forwarding Discord text message to AIRI')

    options.airi.sendChatInput({
      kind: 'text',
      text: cleanedText,
      textRaw: rawContent,
      discord: {
        channelId: message.channelId,
        guildId: message.guildId ?? undefined,
        guildName: message.guild?.name ?? undefined,
        guildMember: {
          id: message.author.id,
          displayName: message.member?.displayName ?? message.author.username,
          nickname: message.member?.nickname ?? message.author.username,
        },
      },
    })

    return true
  }

  return { handleMessage }
}
