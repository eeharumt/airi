import { env } from 'node:process'

import * as v from 'valibot'

/**
 * Optional auto-join target applied once on Discord `ClientReady`.
 */
export interface CompanionAutoJoin {
  guildId: string
  channelId: string
}

export interface CompanionConfig {
  discordToken: string
  discordClientId: string
  airiUrl: string
  airiToken: string
  /**
   * When true, post AIRI assistant text into the same Discord text channel.
   * Default false so replies appear only on Stage / other clients.
   */
  replyInDiscord: boolean
  autoJoin?: CompanionAutoJoin
  stt: {
    baseUrl: string
    apiKey: string
    model: string
  }
}

const RawEnvSchema = v.object({
  DISCORD_COMPANION_TOKEN: v.optional(v.string(), ''),
  DISCORD_COMPANION_CLIENT_ID: v.optional(v.string(), ''),
  AIRI_URL: v.optional(v.string(), 'ws://localhost:6121/ws'),
  AIRI_TOKEN: v.optional(v.string(), ''),
  DISCORD_COMPANION_AUTO_JOIN: v.optional(v.string(), ''),
  /** When "1", "true", "yes", "on" — echo assistant text to Discord. Default: off. */
  DISCORD_COMPANION_REPLY_IN_CHANNEL: v.optional(v.string(), ''),
  OPENAI_STT_API_BASE_URL: v.optional(v.string(), 'https://api.openai.com/v1/'),
  OPENAI_STT_API_KEY: v.optional(v.string(), ''),
  OPENAI_STT_MODEL: v.optional(v.string(), 'whisper-1'),
})

/**
 * Parses a `guildId:channelId` string into a {@link CompanionAutoJoin} descriptor.
 *
 * Before:
 * - "123456789:987654321"
 *
 * After:
 * - { guildId: "123456789", channelId: "987654321" }
 *
 * Returns `undefined` if the input is empty or malformed.
 */
export function parseAutoJoin(raw: string): CompanionAutoJoin | undefined {
  const trimmed = raw.trim()
  if (!trimmed)
    return undefined

  const parts = trimmed.split(':').map(part => part.trim()).filter(Boolean)
  if (parts.length !== 2)
    return undefined

  const [guildId, channelId] = parts
  return { guildId, channelId }
}

function parseTruthyEnv(raw: string | undefined): boolean {
  if (raw === undefined || raw === '')
    return false
  const x = raw.trim().toLowerCase()
  return x === '1' || x === 'true' || x === 'yes' || x === 'on'
}

/**
 * Reads and validates companion configuration from `process.env` (with sensible
 * fallbacks).
 *
 * Use when:
 * - Bootstrapping the service at process start-up. Secrets may be empty at this
 *   point — in that case the service will stay idle until the `module:configure`
 *   event arrives from the AIRI host.
 */
export function loadCompanionConfigFromEnv(source: NodeJS.ProcessEnv = env): CompanionConfig {
  const parsed = v.parse(RawEnvSchema, {
    DISCORD_COMPANION_TOKEN: source.DISCORD_COMPANION_TOKEN ?? source.DISCORD_TOKEN,
    DISCORD_COMPANION_CLIENT_ID: source.DISCORD_COMPANION_CLIENT_ID ?? source.DISCORD_BOT_CLIENT_ID,
    AIRI_URL: source.AIRI_URL,
    AIRI_TOKEN: source.AIRI_TOKEN,
    DISCORD_COMPANION_AUTO_JOIN: source.DISCORD_COMPANION_AUTO_JOIN,
    DISCORD_COMPANION_REPLY_IN_CHANNEL: source.DISCORD_COMPANION_REPLY_IN_CHANNEL,
    OPENAI_STT_API_BASE_URL: source.OPENAI_STT_API_BASE_URL,
    OPENAI_STT_API_KEY: source.OPENAI_STT_API_KEY,
    OPENAI_STT_MODEL: source.OPENAI_STT_MODEL,
  })

  return {
    discordToken: parsed.DISCORD_COMPANION_TOKEN,
    discordClientId: parsed.DISCORD_COMPANION_CLIENT_ID,
    airiUrl: parsed.AIRI_URL,
    airiToken: parsed.AIRI_TOKEN || 'abcd',
    replyInDiscord: parseTruthyEnv(parsed.DISCORD_COMPANION_REPLY_IN_CHANNEL),
    autoJoin: parseAutoJoin(parsed.DISCORD_COMPANION_AUTO_JOIN),
    stt: {
      baseUrl: parsed.OPENAI_STT_API_BASE_URL,
      apiKey: parsed.OPENAI_STT_API_KEY,
      model: parsed.OPENAI_STT_MODEL,
    },
  }
}

/**
 * Configuration shape accepted through the AIRI `module:configure` event for
 * the companion module (module name: `discord-companion`).
 */
export interface CompanionRemoteConfig {
  enabled?: boolean
  token?: string
  autoJoin?: CompanionAutoJoin | null
  /** Override env: echo assistant replies into Discord text channels. */
  replyInDiscord?: boolean
}

export const CompanionRemoteConfigSchema = v.object({
  enabled: v.optional(v.boolean()),
  token: v.optional(v.string()),
  replyInDiscord: v.optional(v.boolean()),
  autoJoin: v.optional(
    v.nullable(
      v.object({
        guildId: v.string(),
        channelId: v.string(),
      }),
    ),
  ),
})

/**
 * Type guard for arbitrary `module:configure` payloads.
 */
export function isCompanionRemoteConfig(value: unknown): value is CompanionRemoteConfig {
  const result = v.safeParse(CompanionRemoteConfigSchema, value)
  return result.success
}
