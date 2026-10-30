<script setup lang="ts">
import { RouterLink } from 'vue-router'
import BaseIcon from '@/components/BaseIcon.vue'
import SproutLogo from '@/components/SproutLogo.vue'
import LostSproutArt from '@/components/notFound/LostSproutArt.vue'
</script>

<!--
  Shown for a URL the app doesn't know (the catch-all route), and rendered in place by a page whose
  main resource answers 404, so the URL you opened stays in the address bar.
-->
<template>
  <div class="flex min-h-svh flex-col bg-canvas">
    <header class="flex flex-none items-center px-4 py-6 sm:px-8">
      <RouterLink :to="{ name: 'home' }" class="rounded-sm">
        <SproutLogo />
      </RouterLink>
    </header>

    <main class="flex flex-auto items-center justify-center px-4 pt-4 pb-14 sm:px-8">
      <div class="flex w-full max-w-280 flex-wrap items-center justify-center gap-x-12 gap-y-8">
        <div class="flex max-w-115 min-w-0 flex-[1_1_340px] flex-col items-start gap-5">
          <span class="text-overline text-sun-ink">ERROR 404</span>
          <h1
            class="font-display text-display text-balance text-ink sm:text-display-xl"
            data-test="not-found-title"
          >
            Oops. A little lost.
          </h1>
          <p class="text-body-lg text-ink-muted">
            This page doesn’t exist, and Sprout took a wrong turn looking for it. The forest is
            right there on the horizon. It’s just… a very long walk.
          </p>
          <div class="pt-1">
            <RouterLink
              :to="{ name: 'home' }"
              class="inline-flex h-13 items-center justify-center gap-2 rounded-lg border border-transparent bg-primary px-6 text-base font-semibold whitespace-nowrap text-on-primary shadow-xs transition duration-150 ease-default hover:bg-primary-hover active:translate-y-px"
              data-test="home-link"
            >
              <BaseIcon name="house" :size="20" />
              Take me home
            </RouterLink>
          </div>
          <p class="flex items-center gap-1.5 text-label font-normal text-ink-subtle">
            <BaseIcon name="shield-check" :size="14" />
            Nothing is lost: your topics and progress are safe in your library.
          </p>
        </div>

        <div class="max-w-155 min-w-0 flex-[1_1_420px]">
          <LostSproutArt />
        </div>
      </div>
    </main>
  </div>
</template>
