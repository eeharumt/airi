export type DiscordMessageMode = 'dm-or-mention' | 'all-messages'

export interface DiscordMessageRoutingOptions {
  isDM: boolean
  isMentioned: boolean
  messageMode?: DiscordMessageMode
}

export function isDiscordMessageMode(value: unknown): value is DiscordMessageMode {
  return value === 'dm-or-mention' || value === 'all-messages'
}

export function shouldIngestDiscordMessage(options: DiscordMessageRoutingOptions): boolean {
  if (options.isDM)
    return true

  if (options.messageMode === 'all-messages')
    return true

  return options.isMentioned
}

export function normalizeDiscordMessageContent(rawContent: string, isMentioned: boolean): string {
  return isMentioned
    ? rawContent.replace(/<@!?\d+>/g, '').trim()
    : rawContent.trim()
}
