import { ButtonHTMLAttributes, ReactNode } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading,
  fullWidth,
  disabled,
  className = "",
  ...rest
}: Props) {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-all duration-200 active:scale-[0.97] select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

  const v = {
    primary: "bg-ap-blue text-white hover:bg-ap-blue-h shadow-md hover:shadow-lg",
    outline: "bg-white text-ap-primary border border-ap-border hover:border-ap-blue/30 hover:bg-ap-bg shadow-card",
    ghost: "bg-transparent text-ap-blue hover:bg-ap-blue/5",
  };

  const s = {
    sm: "text-[13px] px-4 py-2",
    md: "text-[14px] px-5 py-3",
    lg: "text-[15px] px-6 py-3.5",
  };

  return (
    <button
      className={`${base} ${v[variant]} ${s[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <>
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span>กรุณารอสักครู่…</span>
        </>
      ) : children}
    </button>
  );
}
