<script setup lang="ts">
import ForestTree, { type TreeLeaves } from '@/components/notFound/ForestTree.vue'

interface DistantTree {
  x: number
  y: number
  /** A different start in the sway, so the forest doesn't move in lockstep. */
  swayDelay: string
  trunkHeight: number
  trunkFill: string
  leaves: TreeLeaves[]
}

interface Bush {
  x: number
  y: number
  radius: number
  fill: string
}

const primary = 'fill-primary'
const sprout = 'fill-sprout'

const forest: DistantTree[] = [
  {
    x: 400,
    y: 222,
    swayDelay: '-0.4s',
    trunkHeight: 44,
    trunkFill: primary,
    leaves: [
      { at: 40, size: 24, leftFill: primary, rightFill: primary },
      { at: 22, size: 15, leftFill: primary, rightFill: primary },
    ],
  },
  {
    x: 426,
    y: 224,
    swayDelay: '-1.1s',
    trunkHeight: 62,
    trunkFill: primary,
    leaves: [
      { at: 58, size: 32, leftFill: primary, rightFill: sprout },
      { at: 32, size: 20, leftFill: primary, rightFill: primary },
    ],
  },
  {
    x: 452,
    y: 227,
    swayDelay: '-2s',
    trunkHeight: 36,
    trunkFill: sprout,
    leaves: [{ at: 32, size: 20, leftFill: sprout, rightFill: sprout }],
  },
  {
    x: 480,
    y: 230,
    swayDelay: '-0.7s',
    trunkHeight: 72,
    trunkFill: primary,
    leaves: [
      { at: 68, size: 36, leftFill: sprout, rightFill: primary },
      { at: 38, size: 22, leftFill: primary, rightFill: primary },
    ],
  },
  {
    x: 508,
    y: 234,
    swayDelay: '-1.6s',
    trunkHeight: 50,
    trunkFill: sprout,
    leaves: [
      { at: 46, size: 26, leftFill: sprout, rightFill: sprout },
      { at: 26, size: 16, leftFill: sprout, rightFill: primary },
    ],
  },
  {
    x: 532,
    y: 238,
    swayDelay: '-2.6s',
    trunkHeight: 40,
    trunkFill: primary,
    leaves: [{ at: 36, size: 22, leftFill: primary, rightFill: primary }],
  },
]

const bushes: Bush[] = [
  { x: 413, y: 224, radius: 9, fill: sprout },
  { x: 466, y: 230, radius: 11, fill: sprout },
  { x: 496, y: 236, radius: 8, fill: primary },
  { x: 548, y: 241, radius: 10, fill: sprout },
]
</script>

<template>
  <!--
    The lost sprout: one 6s loop. It hops, spots the forest, slumps, sheds a tear, straightens up
    and tries again. Drawn on a 560 × 420 grid, straight from the design's NotFound artboard.
  -->
  <svg
    viewBox="0 0 560 420"
    role="img"
    aria-label="A small sprout at the start of a long winding path, looking sadly at a forest far away on the horizon"
    class="block h-auto w-full overflow-visible"
  >
    <circle class="sun fill-sunbeam" cx="462" cy="78" r="30" />
    <path
      class="birds fill-none stroke-ink-subtle"
      d="M296 96 q6 -7 12 0 q6 -7 12 0 M334 82 q5 -6 10 0 q5 -6 10 0"
      stroke-width="1.5"
      stroke-linecap="round"
    />

    <path
      class="fill-surface-tint"
      d="M-20 262 C 150 215, 380 200, 580 250 L 580 420 L -20 420 Z"
    />

    <g aria-hidden="true">
      <circle
        v-for="bush in bushes"
        :key="bush.x"
        :cx="bush.x"
        :cy="bush.y"
        :r="bush.radius"
        :class="bush.fill"
      />
      <g v-for="tree in forest" :key="tree.x" :transform="`translate(${tree.x},${tree.y})`">
        <ForestTree
          class="tree"
          :style="{ animationDelay: tree.swayDelay }"
          :trunk-height="tree.trunkHeight"
          :trunk-fill="tree.trunkFill"
          :leaves="tree.leaves"
        />
      </g>
    </g>

    <path class="fill-sprout-soft" d="M-20 350 C 120 318, 300 322, 580 362 L 580 420 L -20 420 Z" />
    <path
      class="fill-none stroke-sprout"
      d="M60 336 q4 -9 8 0 M70 335 q4 -9 8 0 M226 330 q4 -9 8 0 M288 332 q4 -9 8 0 M298 333 q4 -9 8 0"
      stroke-width="2"
      stroke-linecap="round"
    />
    <ellipse class="fill-line-strong opacity-45" cx="392" cy="341" rx="9" ry="5" />

    <path
      class="trail fill-none stroke-sprout"
      d="M 136 331 C 230 326, 300 300, 360 275 S 440 240 470 234"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-dasharray="7 9"
    />

    <g transform="translate(172,329)" aria-hidden="true">
      <rect class="fill-line-strong" x="-2" y="-40" width="4" height="40" rx="2" />
      <path
        class="fill-surface stroke-line-strong"
        d="M-24 -40 H 18 L 26 -33 L 18 -26 H -24 Z"
        stroke-width="1.5"
        stroke-linejoin="round"
      />
      <text class="fill-ink font-sans text-[9px] font-bold" x="-18" y="-29.5">Forest</text>
      <path
        class="fill-surface stroke-line-strong"
        d="M-28 -22 H 14 L 20 -16.5 L 14 -11 H -28 Z"
        stroke-width="1.5"
        stroke-linejoin="round"
      />
      <text class="fill-ink-muted font-sans text-[7.5px] font-semibold" x="-24" y="-13.5">
        2,847 steps
      </text>
    </g>

    <g transform="translate(120,331)" aria-hidden="true">
      <ellipse class="shadow fill-onyx" cx="0" cy="2" rx="18" ry="4" opacity="0.08" />
      <g class="sprout-body">
        <g class="slump">
          <!-- Invisible boxes give the transforms a stable origin while the parts move. -->
          <rect x="-40" y="-126" width="80" height="126" fill="none" />
          <rect class="fill-primary" x="-4" y="-50" width="8" height="52" rx="4" />
          <g transform="translate(0,-52)">
            <g class="head">
              <rect x="-40" y="-72" width="80" height="72" fill="none" />
              <g transform="translate(0,-22)">
                <g class="leaf-left">
                  <path class="fill-sprout" d="M0 0 A 30 30 0 0 0 -30 -30 A 30 30 0 0 0 0 0 Z" />
                  <path
                    class="fill-none stroke-honeydew"
                    d="M-3 -3 L -21 -21"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    opacity="0.7"
                  />
                </g>
                <g class="leaf-right">
                  <path class="fill-primary" d="M0 0 A 30 30 0 0 1 30 -30 A 30 30 0 0 1 0 0 Z" />
                  <path
                    class="fill-none stroke-honeydew"
                    d="M3 -3 L 21 -21"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    opacity="0.55"
                  />
                </g>
              </g>
              <circle class="fill-honeydew" cx="0" cy="-10" r="15" />
              <circle class="fill-brick-ember" cx="-9" cy="-7" r="2.4" opacity="0.28" />
              <circle class="fill-brick-ember" cx="9" cy="-7" r="2.4" opacity="0.28" />
              <g class="blink fill-onyx">
                <circle cx="-5" cy="-12" r="2.2" />
                <circle cx="5" cy="-12" r="2.2" />
              </g>
              <g class="sad fill-none stroke-onyx" stroke-linecap="round">
                <path d="M-9 -19 L -4 -17 M9 -19 L 4 -17" stroke-width="1.5" />
                <path d="M-4 -4 Q 0 -8 4 -4" stroke-width="1.6" />
              </g>
              <g class="determined fill-none stroke-onyx" stroke-linecap="round">
                <path d="M-9 -17 L -4 -19 M9 -17 L 4 -19" stroke-width="1.5" />
                <path d="M-3.5 -5 L 3.5 -5" stroke-width="1.6" />
              </g>
              <path
                class="tear fill-sky-ink"
                d="M8 -8 C 10.4 -4.6, 10.4 -2, 8 -2 C 5.6 -2, 5.6 -4.6, 8 -8 Z"
              />
            </g>
          </g>
        </g>
        <g class="bubble">
          <circle class="fill-surface stroke-line" cx="36" cy="-84" r="3.5" />
          <circle class="fill-surface stroke-line" cx="46" cy="-100" r="5.5" />
          <g transform="translate(66,-128)">
            <ellipse class="fill-surface stroke-line" cx="0" cy="0" rx="32" ry="21" />
            <ForestTree
              transform="translate(-11,10)"
              :trunk-height="15"
              :trunk-width="3"
              :trunk-fill="primary"
              :leaves="[{ at: 13, size: 8, leftFill: primary, rightFill: primary }]"
            />
            <ForestTree
              transform="translate(2,11)"
              :trunk-height="22"
              :trunk-width="3"
              :trunk-fill="primary"
              :leaves="[{ at: 19, size: 10, leftFill: sprout, rightFill: primary }]"
            />
            <ForestTree
              transform="translate(15,10)"
              :trunk-height="13"
              :trunk-width="3"
              :trunk-fill="sprout"
              :leaves="[{ at: 11, size: 7, leftFill: sprout, rightFill: sprout }]"
            />
          </g>
        </g>
      </g>
    </g>
  </svg>
</template>

<style scoped>
.sun {
  animation: glow 3s ease-in-out infinite alternate;
  transform-box: fill-box;
  transform-origin: 50% 50%;
}
.birds {
  animation: drift 6s ease-in-out infinite;
}
.tree {
  animation: sway 3.6s ease-in-out infinite alternate;
  transform-box: fill-box;
  transform-origin: 50% 100%;
}
.trail {
  animation: walk 2.4s linear infinite;
}
.shadow {
  animation: shadow 6s ease-in-out infinite;
  transform-box: fill-box;
  transform-origin: 50% 50%;
}
.sprout-body {
  animation: hop 6s ease-in-out infinite;
}
.slump {
  animation: slump 6s ease-in-out infinite;
  transform-box: fill-box;
  transform-origin: 50% 100%;
}
.head {
  animation: look 6s ease-in-out infinite;
  transform-box: fill-box;
  transform-origin: 50% 100%;
}
.leaf-left {
  animation: leaf-left 6s ease-in-out infinite;
  transform-box: fill-box;
  transform-origin: 100% 100%;
}
.leaf-right {
  animation: leaf-right 6s ease-in-out infinite;
  transform-box: fill-box;
  transform-origin: 0% 100%;
}
.blink {
  animation: blink 4.2s ease-in-out infinite;
  transform-box: fill-box;
  transform-origin: 50% 50%;
}
.tear {
  opacity: 0;
  animation: tear 6s ease-in-out infinite;
}
.bubble {
  opacity: 0;
  animation: think 6s ease-in-out infinite;
}
.sad {
  animation: sad 6s steps(1, end) infinite;
}
.determined {
  opacity: 0;
  animation: determined 6s steps(1, end) infinite;
}

@keyframes glow {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.06);
  }
}
@keyframes drift {
  0%,
  100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(8px, -5px);
  }
}
@keyframes sway {
  from {
    transform: rotate(-1.5deg);
  }
  to {
    transform: rotate(1.5deg);
  }
}
@keyframes walk {
  to {
    stroke-dashoffset: -32;
  }
}
/* 0–36%: three hops towards the forest. */
@keyframes hop {
  0%,
  36%,
  100% {
    transform: translateY(0);
  }
  6%,
  18%,
  30% {
    transform: translateY(-14px);
  }
  12%,
  24% {
    transform: translateY(0);
  }
}
@keyframes shadow {
  0%,
  36%,
  100% {
    transform: scale(1);
    opacity: 0.08;
  }
  6%,
  18%,
  30% {
    transform: scale(0.7);
    opacity: 0.04;
  }
  12%,
  24% {
    transform: scale(1);
    opacity: 0.08;
  }
}
/* 40–88%: it sees how far the forest is and slumps. */
@keyframes slump {
  0%,
  40%,
  88%,
  100% {
    transform: scale(1, 1);
  }
  52%,
  74% {
    transform: scale(1.07, 0.93);
  }
}
@keyframes look {
  0%,
  38%,
  82%,
  100% {
    transform: rotate(0);
  }
  44%,
  72% {
    transform: rotate(9deg);
  }
}
@keyframes leaf-right {
  0%,
  40% {
    transform: rotate(0);
  }
  4%,
  16%,
  28% {
    transform: rotate(-14deg);
  }
  10%,
  22%,
  34% {
    transform: rotate(6deg);
  }
  54%,
  74% {
    transform: rotate(30deg);
  }
  90% {
    transform: rotate(-8deg);
  }
  100% {
    transform: rotate(0);
  }
}
@keyframes leaf-left {
  0%,
  40% {
    transform: rotate(0);
  }
  4%,
  16%,
  28% {
    transform: rotate(14deg);
  }
  10%,
  22%,
  34% {
    transform: rotate(-6deg);
  }
  54%,
  74% {
    transform: rotate(-30deg);
  }
  90% {
    transform: rotate(8deg);
  }
  100% {
    transform: rotate(0);
  }
}
@keyframes blink {
  0%,
  90%,
  100% {
    transform: scaleY(1);
  }
  94% {
    transform: scaleY(0.1);
  }
}
@keyframes tear {
  0%,
  46% {
    opacity: 0;
    transform: translateY(0);
  }
  50% {
    opacity: 1;
    transform: translateY(0);
  }
  66% {
    opacity: 1;
    transform: translateY(24px);
  }
  70%,
  100% {
    opacity: 0;
    transform: translateY(24px);
  }
}
@keyframes think {
  0%,
  36%,
  78%,
  100% {
    opacity: 0;
    transform: translateY(4px);
  }
  44%,
  70% {
    opacity: 1;
    transform: translateY(0);
  }
}
/* The sad face shows from 38% to 86%; the determined face the rest of the loop. */
@keyframes sad {
  0% {
    opacity: 0;
  }
  38% {
    opacity: 1;
  }
  86%,
  100% {
    opacity: 0;
  }
}
@keyframes determined {
  0% {
    opacity: 1;
  }
  38% {
    opacity: 0;
  }
  86%,
  100% {
    opacity: 1;
  }
}

/* A still picture that still tells the story: the sad sprout dreaming of the forest. */
@media (prefers-reduced-motion: reduce) {
  .sun,
  .birds,
  .tree,
  .trail,
  .shadow,
  .sprout-body,
  .slump,
  .head,
  .leaf-left,
  .leaf-right,
  .blink,
  .tear,
  .bubble,
  .sad,
  .determined {
    animation: none;
  }
  .bubble,
  .sad {
    opacity: 1;
  }
  .determined,
  .tear {
    opacity: 0;
  }
}
</style>
