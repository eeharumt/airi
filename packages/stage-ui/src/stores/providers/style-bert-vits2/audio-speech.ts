import type { SpeechProvider } from '@xsai-ext/providers/utils'

import type { ModelInfo, ProviderMetadata, VoiceInfo } from '../../providers'

const DEFAULT_BASE_URL = 'http://127.0.0.1:5000/'
const PROVIDER_ID = 'style-bert-vits2'

/** Unlikely in speaker or style names from SBV2 config */
const SBV2_VOICE_SEP = '\u001E'

interface Sbv2ModelsInfoResponse {
  [modelId: string]: {
    config_path: string
    model_path: string
    device: string
    spk2id: Record<string, number>
    id2spk: Record<string, string>
    style2id: Record<string, number>
  }
}

function normalizeRoot(value: unknown): string {
  let base = typeof value === 'string' ? value.trim() : ''
  if (!base)
    base = DEFAULT_BASE_URL
  if (!base.endsWith('/'))
    base += '/'
  return base
}

function modelDisplayName(configPath: string, modelId: string): string {
  const normalized = configPath.replace(/\\/g, '/')
  const withoutConfig = normalized.replace(/\/config\.json$/i, '')
  const segment = withoutConfig.split('/').filter(Boolean).pop()
  return segment || `model-${modelId}`
}

async function fetchSbv2ModelsInfo(baseUrl: string): Promise<Sbv2ModelsInfoResponse> {
  const root = normalizeRoot(baseUrl)
  const res = await globalThis.fetch(new URL('models/info', root))
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`Style-Bert-VITS2 /models/info failed: ${res.status} ${t}`)
  }
  return res.json() as Promise<Sbv2ModelsInfoResponse>
}

function parseVoiceId(voiceId: string): { speakerName: string, style: string } {
  const parts = voiceId.split(SBV2_VOICE_SEP)
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error(
      'Invalid Style-Bert-VITS2 voice id. Pick a voice from the list after selecting a model.',
    )
  }
  return { speakerName: parts[0], style: parts[1] }
}

function createVoiceFetch(
  root: string,
  speechModelFallback: string | undefined,
  runtimeOptions: Record<string, unknown> | undefined,
) {
  return async (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    if (!init?.body || typeof init.body !== 'string')
      throw new Error('Invalid request body')

    const body = JSON.parse(init.body) as {
      model?: string
      input?: string
      voice?: string
    }

    const text = body.input
    if (!text?.trim())
      throw new Error('Style-Bert-VITS2: empty input text')

    const voiceId = body.voice
    if (!voiceId)
      throw new Error('Style-Bert-VITS2: voice is required')

    const { speakerName, style } = parseVoiceId(voiceId)

    const modelStr = body.model ?? speechModelFallback ?? '0'
    const modelId = Number.parseInt(String(modelStr), 10)
    if (Number.isNaN(modelId)) {
      throw new TypeError(`Style-Bert-VITS2: invalid model id: ${modelStr}`)
    }

    const langRaw = runtimeOptions?.language
    const language = typeof langRaw === 'string' && langRaw.trim()
      ? langRaw.trim()
      : 'JP'

    const url = new URL('voice', root)
    const q = url.searchParams
    q.set('text', text)
    q.set('model_id', String(modelId))
    q.set('speaker_name', speakerName)
    q.set('style', style)
    q.set('language', language)

    const res = await globalThis.fetch(url.toString(), { method: 'POST' })

    if (!res.ok) {
      let detail = ''
      try {
        detail = await res.text()
      }
      catch {
        detail = res.statusText
      }
      throw new Error(`Style-Bert-VITS2 /voice failed: ${res.status} ${detail}`)
    }

    const buf = await res.arrayBuffer()
    return new Response(buf, {
      status: 200,
      headers: { 'Content-Type': res.headers.get('Content-Type') || 'audio/wav' },
    })
  }
}

function makeSbv2SpeechProvider(root: string): SpeechProvider {
  return {
    speech: (model?: string, runtimeOptions?: Record<string, unknown>) => {
      return {
        baseURL: `${root}v1/`,
        model: model ?? '0',
        fetch: createVoiceFetch(root, model, runtimeOptions),
      }
    },
  }
}

async function listModels(baseUrl: string): Promise<ModelInfo[]> {
  const data = await fetchSbv2ModelsInfo(baseUrl)
  return Object.entries(data).map(([id, info]) => ({
    id,
    name: modelDisplayName(info.config_path, id),
    provider: PROVIDER_ID,
    description: info.config_path,
    contextLength: 0,
    deprecated: false,
  } satisfies ModelInfo))
}

async function listVoices(baseUrl: string): Promise<VoiceInfo[]> {
  const data = await fetchSbv2ModelsInfo(baseUrl)
  const voices: VoiceInfo[] = []

  for (const [modelId, info] of Object.entries(data)) {
    const speakers = Object.keys(info.spk2id || {})
    const styles = Object.keys(info.style2id || {})

    for (const speakerName of speakers) {
      for (const style of styles) {
        const id = `${speakerName}${SBV2_VOICE_SEP}${style}`
        voices.push({
          id,
          name: `${speakerName} / ${style}`,
          provider: PROVIDER_ID,
          compatibleModels: [modelId],
          description: info.config_path,
          languages: [{ code: 'ja', title: 'Japanese' }],
          gender: 'neutral',
        } satisfies VoiceInfo)
      }
    }
  }

  return voices
}

export function buildStyleBertVits2SpeechProvider(
  baseUrlValidator: (baseUrl: unknown) => { errors: unknown[], reason: string, valid: boolean } | null | undefined,
): ProviderMetadata {
  return {
    id: PROVIDER_ID,
    category: 'speech',
    tasks: ['text-to-speech'],
    nameKey: 'settings.pages.providers.provider.style-bert-vits2.title',
    name: 'Style-Bert-VITS2',
    descriptionKey: 'settings.pages.providers.provider.style-bert-vits2.description',
    description: 'Local Style-Bert-VITS2 API (server_fastapi.py)',
    icon: 'i-lobe-icons:huggingface',
    requiresCredentials: false,
    defaultOptions: () => ({
      baseUrl: DEFAULT_BASE_URL,
      language: 'JP',
      model: '0',
    }),
    createProvider: async (config) => {
      const baseUrl = normalizeRoot(config?.baseUrl ?? '')
      return makeSbv2SpeechProvider(baseUrl)
    },
    capabilities: {
      /** Uses default base URL when unset so list works after initializeProvider. */
      listModels: async (config: Record<string, unknown>) => {
        const root = normalizeRoot(config?.baseUrl ?? '')
        return await listModels(root)
      },
      listVoices: async (config: Record<string, unknown>) => {
        const root = normalizeRoot(config?.baseUrl ?? '')
        return await listVoices(root)
      },
    },
    validators: {
      chatPingCheckAvailable: false,
      validateProviderConfig: async (config) => {
        const rootForValidation = normalizeRoot(config?.baseUrl ?? '')
        const baseUrlForValidator = config?.baseUrl
        if (typeof baseUrlForValidator !== 'string' || !baseUrlForValidator.trim()) {
          return {
            errors: [new Error('Base URL is required.')],
            reason: 'Base URL is required.',
            valid: false,
          }
        }

        const res = baseUrlValidator(baseUrlForValidator)
        if (res)
          return res

        try {
          const r = await globalThis.fetch(new URL('models/info', rootForValidation))
          if (!r.ok) {
            const text = await r.text()
            return {
              errors: [new Error(`Server returned ${r.status}`)],
              reason: `Cannot reach Style-Bert-VITS2 at this URL (${r.status}): ${text.slice(0, 200)}`,
              valid: false,
            }
          }
        }
        catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          return {
            errors: [e instanceof Error ? e : new Error(msg)],
            reason: `Cannot connect to Style-Bert-VITS2: ${msg}`,
            valid: false,
          }
        }

        return {
          errors: [],
          reason: '',
          valid: true,
        }
      },
    },
  }
}
