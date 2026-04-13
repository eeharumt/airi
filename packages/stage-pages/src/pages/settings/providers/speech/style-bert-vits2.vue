<script setup lang="ts">
import type { SpeechProvider } from '@xsai-ext/providers/utils'

import {
  ErrorContainer,
  SpeechPlayground,
  SpeechProviderSettings,
} from '@proj-airi/stage-ui/components'
import { useSpeechStore } from '@proj-airi/stage-ui/stores/modules/speech'
import { useProvidersStore } from '@proj-airi/stage-ui/stores/providers'
import { Callout, FieldCombobox } from '@proj-airi/ui'
import { storeToRefs } from 'pinia'
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const speechStore = useSpeechStore()
const providersStore = useProvidersStore()
const { providers } = storeToRefs(providersStore)
const { speechProviderError } = storeToRefs(speechStore)
const { t } = useI18n()

const providerId = 'style-bert-vits2'
const defaultModel = '0'

const model = computed({
  get: () => (providers.value[providerId]?.model as string | undefined) || defaultModel,
  set: (value) => {
    if (!providers.value[providerId])
      providers.value[providerId] = {}
    providers.value[providerId].model = value
  },
})

const language = computed({
  get: () => (providers.value[providerId]?.language as string | undefined) || 'JP',
  set: (value) => {
    if (!providers.value[providerId])
      providers.value[providerId] = {}
    providers.value[providerId].language = value
  },
})

const languageOptions = [
  { value: 'JP', label: 'JP' },
  { value: 'EN', label: 'EN' },
  { value: 'ZH', label: 'ZH' },
]

const providerModels = computed(() => providersStore.getModelsForProvider(providerId))
const isLoadingModels = computed(() => providersStore.isLoadingModels[providerId] || false)

/** Only voices for the selected checkpoint — SBV2 /voice pairs model_id with speaker_name. */
const availableVoices = computed(() => {
  const all = speechStore.availableVoices[providerId] || []
  const mid = model.value || defaultModel
  return all.filter(
    voice => !voice.compatibleModels?.length || voice.compatibleModels.includes(mid),
  )
})

const modelLoadError = computed(() => providersStore.modelLoadError[providerId] ?? null)

const connectionHint = computed(() => modelLoadError.value || speechProviderError.value)

onMounted(async () => {
  await providersStore.loadModelsForConfiguredProviders()
  await providersStore.fetchModelsForProvider(providerId)
  await speechStore.loadVoicesForProvider(providerId)
})

async function handleGenerateSpeech(input: string, voiceId: string, _useSSML: boolean) {
  const provider = await providersStore.getProviderInstance<SpeechProvider<string>>(providerId)
  if (!provider)
    throw new Error('Failed to initialize speech provider')

  const providerConfig = providersStore.getProviderConfig(providerId)
  const modelToUse = model.value || defaultModel

  return await speechStore.speech(
    provider,
    modelToUse,
    input,
    voiceId,
    providerConfig,
  )
}
</script>

<template>
  <SpeechProviderSettings
    :provider-id="providerId"
    :default-model="defaultModel"
    placeholder=""
  >
    <template #basic-settings>
      <Callout :label="t('settings.pages.providers.provider.style-bert-vits2.fields.api_key_hint.title')">
        <p>{{ t('settings.pages.providers.provider.style-bert-vits2.fields.api_key_hint.description') }}</p>
      </Callout>
    </template>

    <template #voice-settings>
      <FieldCombobox
        v-model="model"
        :label="t('settings.pages.providers.provider.style-bert-vits2.fields.model.label')"
        :description="t('settings.pages.providers.provider.style-bert-vits2.fields.model.description')"
        :options="providerModels.map(m => ({ value: m.id, label: m.name }))"
        :disabled="isLoadingModels || providerModels.length === 0"
        :placeholder="t('settings.pages.providers.provider.style-bert-vits2.fields.model.placeholder')"
      />
      <FieldCombobox
        v-model="language"
        :label="t('settings.pages.providers.provider.style-bert-vits2.fields.language.label')"
        :description="t('settings.pages.providers.provider.style-bert-vits2.fields.language.description')"
        :options="languageOptions"
      />
    </template>

    <template #playground>
      <ErrorContainer
        v-if="connectionHint"
        class="mb-4"
        :title="t('settings.pages.providers.provider.style-bert-vits2.connection_error.title')"
        :error="connectionHint"
      />
      <SpeechPlayground
        :available-voices="availableVoices"
        :generate-speech="handleGenerateSpeech"
        api-key-configured
        :default-text="t('settings.pages.providers.provider.style-bert-vits2.playground.default-text')"
      />
    </template>
  </SpeechProviderSettings>
</template>

<route lang="yaml">
  meta:
    layout: settings
    stageTransition:
      name: slide
</route>
