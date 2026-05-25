import { Shield } from 'lucide-react';

/** RescueNet shield mark — dark circle, gold outline (matches reference UI) */
export default function BrandLogo({ size = 'md', variant = 'dark' }) {
  const sizes = {
    sm: { box: 'h-8 w-8', icon: 16 },
    md: { box: 'h-9 w-9', icon: 18 },
    lg: { box: 'h-11 w-11', icon: 22 },
  };
  const s = sizes[size] || sizes.md;

  if (variant === 'light') {
    return (
      <div
        className={`${s.box} flex shrink-0 items-center justify-center rounded-full bg-primary shadow-[0_2px_10px_rgba(30,41,59,0.25)]`}
      >
        <Shield size={s.icon} className="text-accent" strokeWidth={1.75} fill="none" />
      </div>
    );
  }

  return (
    <div
      className={`${s.box} flex shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15`}
    >
      <Shield size={s.icon} className="text-accent" strokeWidth={1.75} fill="none" />
    </div>
  );
}
