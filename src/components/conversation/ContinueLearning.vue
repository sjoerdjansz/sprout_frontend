<script setup lang="ts">
import FormError from '@/components/FormError.vue'
import ChatComposer from '@/components/chat/ChatComposer.vue'

const {
  topicTitle,
  disabled = false,
  error = null,
} = defineProps<{
  /** The saved topic the new conversation continues. */
  topicTitle: string
  /** While the tutor answers your first message. */
  disabled?: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  send: [text: string]
}>()

const message = defineModel<string>({ required: true })
</script>

<template>
  <section class="flex flex-col gap-3" aria-labelledby="continue-learning" data-test="continue">
    <div class="flex flex-col gap-0.5">
      <h2 id="continue-learning" class="text-heading text-ink">Continue learning</h2>
      <!-- A saved conversation stays read-only, so say where your message goes. -->
      <p class="text-ink-muted">Your next message starts a new conversation on {{ topicTitle }}.</p>
    </div>
    <FormError v-if="error" :message="error" />
    <ChatComposer
      v-model="message"
      :disabled="disabled"
      placeholder="What do you want to learn next?"
      @send="emit('send', $event)"
    />
  </section>
</template>
