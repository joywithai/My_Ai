"use client";

/** "???" bubbles rising past the head while thinking 🫧 */
export default function ThinkingBubbles() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      <div className="absolute left-1/2 top-[13%] ml-10 select-none">
        <span className="bubble-float inline-block text-3xl font-black text-accent">???</span>
      </div>
      <div className="absolute left-1/2 top-[24%] -ml-16 select-none">
        <span className="bubble-float bubble-float-2 inline-block text-xl font-bold text-accent/80">?</span>
      </div>
      <div className="absolute left-1/2 top-[19%] ml-24 select-none">
        <span className="bubble-float bubble-float-3 inline-block text-base font-bold text-accent/60">?</span>
      </div>
    </div>
  );
}
