<script setup lang="ts">
/** Floating beat strip — messenger rhythm under the centered brand. */
</script>

<template>
  <div
    class="chaos-preview mx-auto w-full"
    aria-hidden="true"
  >
    <ol class="flex flex-col gap-4">
      <li class="chaos-beat chaos-beat-1 mr-8 self-start sm:mr-12">
        <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
          Prompt
        </span>
        <div class="chip-sketch flex items-center gap-1 rounded-2xl rounded-bl-md py-1.5 pl-3.5 pr-1.5">
          <span class="min-w-0 flex-1 text-left text-sm font-semibold leading-snug text-[var(--ink)] sm:text-base">
            a penguin surfing
          </span>
          <span
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--ink)]"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 24"
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              stroke-width="2.25"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect
                x="3"
                y="3"
                width="18"
                height="18"
                rx="3"
              />
              <circle
                cx="8"
                cy="8"
                r="1.25"
                fill="currentColor"
                stroke="none"
              />
              <circle
                cx="16"
                cy="8"
                r="1.25"
                fill="currentColor"
                stroke="none"
              />
              <circle
                cx="12"
                cy="12"
                r="1.25"
                fill="currentColor"
                stroke="none"
              />
              <circle
                cx="8"
                cy="16"
                r="1.25"
                fill="currentColor"
                stroke="none"
              />
              <circle
                cx="16"
                cy="16"
                r="1.25"
                fill="currentColor"
                stroke="none"
              />
            </svg>
          </span>
        </div>
      </li>

      <li class="chaos-beat chaos-beat-2 ml-8 w-[min(calc(100%-2rem),15.5rem)] shrink-0 self-end sm:ml-12 sm:w-[17rem]">
        <span class="mb-1.5 block text-right text-[11px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
          Drawing
        </span>
        <div class="relative aspect-square w-full overflow-hidden rounded-2xl rounded-br-md border border-[var(--ink)] bg-[var(--canvas)] shadow-block">
          <svg
            viewBox="0 0 160 160"
            class="absolute inset-0 h-full w-full text-[var(--ink)]"
            fill="none"
            stroke="currentColor"
            stroke-width="3.25"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M28 118 C48 98, 112 98, 138 122 C118 132, 48 132, 28 118 Z" />
            <ellipse
              cx="78"
              cy="78"
              rx="22"
              ry="30"
            />
            <ellipse
              cx="78"
              cy="84"
              rx="12"
              ry="18"
              class="fill-[var(--canvas)]"
              stroke="currentColor"
            />
            <circle
              cx="78"
              cy="48"
              r="16"
            />
            <circle
              cx="72"
              cy="46"
              r="2.4"
              fill="currentColor"
              stroke="none"
            />
            <circle
              cx="84"
              cy="46"
              r="2.4"
              fill="currentColor"
              stroke="none"
            />
            <path
              d="M78 52 L88 56 L78 58 Z"
              fill="currentColor"
              stroke="none"
            />
            <path d="M56 72 L38 58" />
            <path d="M100 72 L122 64" />
            <path d="M68 106 L62 116" />
            <path d="M88 106 L94 116" />
            <path d="M40 128c4-6 8-6 12 0" />
            <path d="M118 130c4-5 8-5 11 0" />
          </svg>
        </div>
      </li>

      <li class="chaos-beat chaos-beat-3 mr-6 self-start sm:mr-10">
        <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
          Guess
        </span>
        <div class="space-y-2">
          <p class="text-sm font-bold text-[var(--ink)] sm:text-base">
            What is this?
          </p>
          <div class="chip-sketch rounded-2xl rounded-bl-md px-3.5 py-3.5 text-sm font-semibold leading-snug text-[var(--ink)] sm:text-base">
            a tuxedo bowling pin on a banana
          </div>
        </div>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.chaos-beat {
  opacity: 0;
  transform: translateY(10px);
  animation: chaos-in 0.5s ease forwards;
}

.chaos-beat-1 {
  animation-delay: 0.1s;
}

.chaos-beat-2 {
  animation-delay: 0.4s;
}

.chaos-beat-3 {
  animation-delay: 0.7s;
}

@keyframes chaos-in {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .chaos-beat {
    opacity: 1;
    transform: none;
    animation: none;
  }
}
</style>
