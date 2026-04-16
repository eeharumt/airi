import { describe, expect, it } from 'vitest'

import {
  isDiscordMessageMode,
  normalizeDiscordMessageContent,
  shouldIngestDiscordMessage,
} from './discord-message-input'

describe('discord-message-input', () => {
  it('accepts known message modes', () => {
    expect(isDiscordMessageMode('dm-or-mention')).toBe(true)
    expect(isDiscordMessageMode('all-messages')).toBe(true)
    expect(isDiscordMessageMode('unknown')).toBe(false)
  })

  it('always ingests direct messages', () => {
    expect(shouldIngestDiscordMessage({
      isDM: true,
      isMentioned: false,
      messageMode: 'dm-or-mention',
    })).toBe(true)
  })

  it('keeps the legacy mention-only behavior by default', () => {
    expect(shouldIngestDiscordMessage({
      isDM: false,
      isMentioned: true,
      messageMode: 'dm-or-mention',
    })).toBe(true)

    expect(shouldIngestDiscordMessage({
      isDM: false,
      isMentioned: false,
      messageMode: 'dm-or-mention',
    })).toBe(false)
  })

  it('allows regular channel messages when all-messages mode is enabled', () => {
    expect(shouldIngestDiscordMessage({
      isDM: false,
      isMentioned: false,
      messageMode: 'all-messages',
    })).toBe(true)
  })

  it('removes Discord mention markup before ingestion', () => {
    expect(normalizeDiscordMessageContent('  <@12345> hello AIRI  ', true)).toBe('hello AIRI')
    expect(normalizeDiscordMessageContent('  general chat  ', false)).toBe('general chat')
  })
})
