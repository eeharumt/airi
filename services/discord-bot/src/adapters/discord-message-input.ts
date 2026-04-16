export type DiscordMessageMode = 'dm-or-mention' | 'joined-voice-channel' | 'all-messages'

export interface DiscordMessageRoutingOptions {
  isDM: boolean
  isMentioned: boolean
  messageChannelId?: string
  joinedVoiceChannelId?: string
  memberVoiceChannelId?: string
  messageMode?: DiscordMessageMode
}

export function isDiscordMessageMode(value: unknown): value is DiscordMessageMode {
  return value === 'dm-or-mention'
    || value === 'joined-voice-channel'
    || value === 'all-messages'
}

export function shouldIngestDiscordMessage(options: DiscordMessageRoutingOptions): boolean {
  if (options.isDM)
    return true

  if (options.messageMode === 'all-messages')
    return true

  if (options.messageMode === 'joined-voice-channel') {
    if (!options.joinedVoiceChannelId)
      return false

    return options.memberVoiceChannelId === options.joinedVoiceChannelId
      || options.messageChannelId === options.joinedVoiceChannelId
  }

  return options.isMentioned
}

export function normalizeDiscordMessageContent(rawContent: string, isMentioned: boolean): string {
  return isMentioned
    ? rawContent.replace(/<@!?\d+>/g, '').trim()
    : rawContent.trim()
}
