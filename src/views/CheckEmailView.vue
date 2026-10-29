<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import BaseIcon from '@/components/BaseIcon.vue'
import SproutLogo from '@/components/SproutLogo.vue'
import LeafPair from '@/components/auth/LeafPair.vue'
import ResendLink from '@/components/auth/ResendLink.vue'
import { ApiError } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()

const email = computed<string | null>(() => {
  const queryEmail = route.query.email

  return typeof queryEmail === 'string' && queryEmail !== '' ? queryEmail : null
})

const resending = ref(false)
const resent = ref(false)
const resendError = ref<string | null>(null)

// The account exists by now, also right after signing up, so a login link is the right resend.
async function resendLink(emailAddress: string): Promise<void> {
  resending.value = true
  resent.value = false
  resendError.value = null

  try {
    await auth.requestMagicLink(emailAddress)
    resent.value = true
  } catch (caught) {
    if (!(caught instanceof ApiError)) {
      throw caught
    }
    resendError.value = caught.fieldError('email') ?? caught.message
  } finally {
    resending.value = false
  }
}
</script>

<template>
  <div class="flex min-h-svh flex-col items-center justify-center gap-8 px-4 py-12">
    <RouterLink :to="{ name: 'login' }" class="rounded-sm">
      <SproutLogo />
    </RouterLink>

    <main
      class="flex w-full max-w-130 flex-col items-center gap-7 rounded-xl border border-line bg-surface px-6 pt-12 pb-10 text-center shadow-md sm:px-10"
    >
      <div aria-hidden="true" class="relative h-42 w-50">
        <div class="absolute top-2 left-5 size-40 rounded-full bg-sprout-soft" />
        <div class="absolute top-0 right-1.5 size-10 rounded-full bg-sunbeam" />
        <LeafPair
          :width="64"
          left-leaf="fill-muted-teal"
          right-leaf="fill-deep-forest"
          class="absolute top-4.5 left-17"
        />
        <div
          class="absolute top-13 left-13 grid size-24 -rotate-6 place-items-center rounded-lg bg-surface text-sprout-ink shadow-md"
        >
          <BaseIcon name="mail-check" :size="44" />
        </div>
      </div>

      <div class="flex flex-col items-center gap-3">
        <h1 class="font-display text-display text-ink">Check your inbox</h1>
        <p class="max-w-100 text-body-lg text-ink-muted" data-test="sent-to">
          We sent a magic link to
          <strong v-if="email" class="font-[650] break-all text-ink">{{ email }}</strong>
          <template v-else>your email</template>. Tap it to sign in. It works once and expires in 15
          minutes.
        </p>
      </div>

      <ResendLink
        v-if="email"
        :busy="resending"
        :sent="resent"
        :error="resendError"
        @resend="resendLink(email)"
      />

      <div class="flex w-full items-start gap-3 rounded-md bg-surface-tint p-4 text-left">
        <span class="mt-px inline-flex text-sprout-ink">
          <BaseIcon name="inbox" :size="18" />
        </span>
        <p class="text-[14px] leading-5 text-ink">
          Can’t find it? Peek in your spam or promotions folder, or search your inbox for “Sprout”.
        </p>
      </div>
    </main>

    <p class="text-ink-muted">
      Wrong email?
      <RouterLink
        :to="{ name: 'login' }"
        class="font-semibold text-primary hover:text-primary-hover"
      >
        Use a different one
      </RouterLink>
    </p>
  </div>
</template>
