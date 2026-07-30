import { ChevronLeft } from "lucide-react";

type CreatorBackButtonProps = {
  onClick: () => void;
  className?: string;
};

export function CreatorBackButton({ onClick, className }: CreatorBackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "creator-shine-card inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-creator-gold/55 bg-creator-gold/15 px-5 text-base font-black text-creator-gold shadow-[0_12px_34px_rgba(226,177,60,0.12)] ring-1 ring-creator-gold/10 transition-all",
        "hover:-translate-y-0.5 hover:border-creator-gold hover:bg-creator-gold hover:text-black hover:shadow-[0_18px_44px_rgba(226,177,60,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-creator-gold focus-visible:ring-offset-2 focus-visible:ring-offset-creator-bg",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <ChevronLeft className="h-5 w-5" strokeWidth={3} />
      Quay lại
    </button>
  );
}
