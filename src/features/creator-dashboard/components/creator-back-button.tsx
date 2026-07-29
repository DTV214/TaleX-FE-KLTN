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
        "inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-creator-gold/60 bg-creator-gold/10 px-5 text-base font-black text-creator-gold shadow-[0_0_0_1px_rgba(223,183,74,0.12)] transition-colors",
        "hover:bg-creator-gold hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-creator-gold focus-visible:ring-offset-2 focus-visible:ring-offset-creator-bg",
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
