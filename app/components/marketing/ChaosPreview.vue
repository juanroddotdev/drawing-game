<script setup lang="ts">
/** Canned 3-beat pitch: prompt → doodle → wrong guess. */
</script>

<template>
  <div
    class="chaos-preview overflow-hidden rounded-3xl border border-slate-200/80 bg-white/70 px-4 py-5 shadow-sm backdrop-blur-sm"
    aria-label="Example round: prompt, drawing, wrong guess"
  >
    <ol class="grid gap-4 sm:grid-cols-3 sm:gap-3">
      <li class="chaos-beat chaos-beat-1 flex flex-col gap-2">
        <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Prompt
        </span>
        <p class="rounded-2xl bg-slate-900 px-3 py-3 text-sm font-semibold leading-snug text-white">
          Cat on a skateboard
        </p>
      </li>

      <li class="chaos-beat chaos-beat-2 flex flex-col gap-2">
        <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Drawing
        </span>
        <div class="relative flex aspect-square items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-[radial-gradient(circle_at_30%_20%,#f8fafc,transparent_55%),linear-gradient(180deg,#f1f5f9,#e2e8f0)]">
          <!-- Simple ink doodle (SVG) -->
          <svg
            viewBox="0 0 120 120"
            class="h-[72%] w-[72%] text-slate-900"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <ellipse
              cx="58"
              cy="48"
              rx="22"
              ry="18"
            />
            <path d="M42 42 Q48 28 58 34" />
            <path d="M74 42 Q80 28 70 34" />
            <circle
              cx="50"
              cy="46"
              r="2.5"
              fill="currentColor"
              stroke="none"
            />
            <circle
              cx="66"
              cy="46"
              r="2.5"
              fill="currentColor"
              stroke="none"
            />
            <path d="M52 54 Q58 60 64 54" />
            <path d="M58 66 L58 78" />
            <path d="M40 88 L80 88" />
            <circle
              cx="40"
              cy="88"
              r="8"
            />
            <circle
              cx="80"
              cy="88"
              r="8"
            />
            <path d="M48 88 L72 88" />
          </svg>
          <span class="pointer-events-none absolute bottom-2 right-2 rotate-[-6deg] rounded bg-[#d9f99d] px-1.5 py-0.5 text-[10px] font-bold text-slate-900">
            ink
          </span>
        </div>
      </li>

      <li class="chaos-beat chaos-beat-3 flex flex-col gap-2">
        <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Guess
        </span>
        <p class="rounded-2xl border-2 border-[#d9f99d] bg-[#ecfccb] px-3 py-3 text-sm font-semibold leading-snug text-slate-900">
          Hairy potato on wheels
        </p>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.chaos-beat {
  opacity: 0;
  transform: translateY(10px);
  animation: chaos-in 0.55s ease forwards;
}

.chaos-beat-1 {
  animation-delay: 0.08s;
}

.chaos-beat-2 {
  animation-delay: 0.28s;
}

.chaos-beat-3 {
  animation-delay: 0.48s;
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
