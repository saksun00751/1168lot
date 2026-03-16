import { forwardRef, InputHTMLAttributes, ReactNode } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftEl?: ReactNode;
  rightEl?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, hint, leftEl, rightEl, className = "", ...rest }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[13px] font-medium text-ap-secondary tracking-[-0.1px] select-none">
          {label}
        </label>
      )}
      <div className="relative">
        {leftEl && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ap-tertiary pointer-events-none">
            {leftEl}
          </div>
        )}
        <input
          ref={ref}
          className={[
            "w-full bg-ap-bg text-ap-primary text-[15px] rounded-2xl",
            "px-4 py-3.5 outline-none border transition-all duration-200",
            "placeholder:text-ap-tertiary",
            leftEl ? "pl-10" : "",
            rightEl ? "pr-11" : "",
            error
              ? "border-ap-red/40 focus:border-ap-red focus:shadow-focus-red"
              : "border-ap-border focus:border-ap-blue focus:shadow-focus-blue focus:bg-white",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...rest}
        />
        {rightEl && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightEl}</div>
        )}
      </div>
      {error && (
        <p className="text-[12px] text-ap-red flex items-center gap-1.5 animate-fade-in">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 10.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5zm.75-3.5a.75.75 0 0 1-1.5 0V5.75a.75.75 0 0 1 1.5 0V8z"/>
          </svg>
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-[12px] text-ap-tertiary">{hint}</p>
      )}
    </div>
  )
);
Input.displayName = "Input";
export default Input;
