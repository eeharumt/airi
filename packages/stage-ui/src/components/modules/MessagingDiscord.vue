<script setup lang="ts">
import type { DiscordMessageMode } from '../../stores/modules/discord'

import { Button, FieldCheckbox, FieldInput, FieldSelect } from '@proj-airi/ui'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useDiscordStore } from '../../stores/modules/discord'

const { t } = useI18n()
const discordStore = useDiscordStore()
const { enabled, token, messageMode, configured } = storeToRefs(discordStore)

const messageModeOptions = computed<Array<{
  label: string
  description: string
  value: DiscordMessageMode
}>>(() => [
  {
    label: t('settings.pages.modules.messaging-discord.message-mode-options.dm-or-mention.label'),
    description: t('settings.pages.modules.messaging-discord.message-mode-options.dm-or-mention.description'),
    value: 'dm-or-mention',
  },
  {
    label: t('settings.pages.modules.messaging-discord.message-mode-options.all-messages.label'),
    description: t('settings.pages.modules.messaging-discord.message-mode-options.all-messages.description'),
    value: 'all-messages',
  },
])

function saveSettings() {
  discordStore.saveSettings()
}
</script>

<template>
  <div :class="['flex', 'flex-col', 'gap-6']">
    <FieldCheckbox
      v-model="enabled"
      :label="t('settings.pages.modules.messaging-discord.enable')"
      :description="t('settings.pages.modules.messaging-discord.enable-description')"
    />

    <FieldInput
      v-model="token"
      type="password"
      :label="t('settings.pages.modules.messaging-discord.token')"
      :description="t('settings.pages.modules.messaging-discord.token-description')"
      :placeholder="t('settings.pages.modules.messaging-discord.token-placeholder')"
    />

    <FieldSelect
      v-model="messageMode"
      :label="t('settings.pages.modules.messaging-discord.message-mode')"
      :description="t('settings.pages.modules.messaging-discord.message-mode-description')"
      :placeholder="t('settings.pages.modules.messaging-discord.message-mode-placeholder')"
      :options="messageModeOptions"
    />

    <div :class="['text-xs', 'text-neutral-500', 'dark:text-neutral-400']">
      {{ t('settings.pages.modules.messaging-discord.chat-input-note') }}
    </div>

    <div>
      <Button
        :label="t('settings.common.save')"
        variant="primary"
        @click="saveSettings"
      />
    </div>

    <div
      v-if="configured"
      :class="['mt-4', 'rounded-lg', 'bg-green-100', 'p-4', 'text-green-800', 'dark:bg-green-950/40', 'dark:text-green-200']"
    >
      {{ t('settings.pages.modules.messaging-discord.configured') }}
    </div>
  </div>
</template>
