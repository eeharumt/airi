import { describe, expect, it } from 'vitest'

import {
  isCompanionRemoteConfig,
  loadCompanionConfigFromEnv,
  parseAutoJoin,
} from '../src/config'

/**
 * @example
 * parseAutoJoin('guild:channel') // -> { guildId: 'guild', channelId: 'channel' }
 */
describe('parseAutoJoin', () => {
  it('returns undefined for empty input', () => {
    expect(parseAutoJoin('')).toBeUndefined()
    expect(parseAutoJoin('   ')).toBeUndefined()
  })

  it('returns undefined for malformed input', () => {
    expect(parseAutoJoin('guildonly')).toBeUndefined()
    expect(parseAutoJoin('a:b:c')).toBeUndefined()
  })

  it('parses a valid guild:channel string', () => {
    expect(parseAutoJoin('g1:c1')).toEqual({ guildId: 'g1', channelId: 'c1' })
  })
})

/**
 * @example
 * isCompanionRemoteConfig({ enabled: true }) // -> true
 */
describe('isCompanionRemoteConfig', () => {
  it('accepts valid payloads', () => {
    expect(isCompanionRemoteConfig({ enabled: true })).toBe(true)
    expect(isCompanionRemoteConfig({ enabled: false, token: 'x' })).toBe(true)
    expect(isCompanionRemoteConfig({
      autoJoin: { guildId: 'g', channelId: 'c' },
    })).toBe(true)
    expect(isCompanionRemoteConfig({ autoJoin: null })).toBe(true)
  })

  it('rejects invalid shapes', () => {
    expect(isCompanionRemoteConfig({ enabled: 'yes' })).toBe(false)
    expect(isCompanionRemoteConfig({ autoJoin: { guildId: 'g' } })).toBe(false)
  })
})

/**
 * @example
 * loadCompanionConfigFromEnv({ DISCORD_COMPANION_TOKEN: 't' }).discordToken // 't'
 */
describe('loadCompanionConfigFromEnv', () => {
  it('applies defaults when no env vars are provided', () => {
    const config = loadCompanionConfigFromEnv({})

    expect(config.discordToken).toBe('')
    expect(config.airiUrl).toBe('ws://localhost:6121/ws')
    expect(config.airiToken).toBe('abcd')
    expect(config.autoJoin).toBeUndefined()
    expect(config.stt.model).toBe('whisper-1')
  })

  it('reads DISCORD_TOKEN as a fallback for the companion token', () => {
    const config = loadCompanionConfigFromEnv({ DISCORD_TOKEN: 'legacy-token' })
    expect(config.discordToken).toBe('legacy-token')
  })

  it('parses auto-join', () => {
    const config = loadCompanionConfigFromEnv({
      DISCORD_COMPANION_AUTO_JOIN: 'g:c',
    })

    expect(config.autoJoin).toEqual({ guildId: 'g', channelId: 'c' })
  })
})
