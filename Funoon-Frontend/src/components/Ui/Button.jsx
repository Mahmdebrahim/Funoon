import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

const Button = forwardRef(
    (
        {
            children,
            variant = "primary",
            size = "md",
            isLoading = false,
            icon: Icon = null,
            iconPosition = "start",
            fullWidth = false,
            className = "",
            ...props
        },
        ref,
    ) => {
        const baseClasses = `
      relative
      inline-flex items-center justify-center
      font-body font-semibold tracking-wider
      uppercase text-sm
      cursor-pointer
      transition-premium
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]
      disabled:cursor-not-allowed disabled:opacity-50
      rounded-sm
    `;

        const variants = {
            primary: `
        bg-[var(--color-primary)] text-white
        border border-transparent
        hover:bg-[var(--color-primary)]/90
        btn-underline-effect
      `,

            secondary: `
  bg-[var(--color-surface-container-lowest)] 
  text-[var(--color-primary)]
  border border-[var(--color-outline-variant)]
  hover:border-[var(--color-primary)]
  hover:text-white
  btn-fill-rtl
`,

            outline: `
  bg-transparent 
  text-[var(--color-primary)]
  border border-[var(--color-primary)]
  hover:text-white
  btn-fill-up
`,

            premium: `
  bg-[var(--color-brand-100)] 
  text-[var(--color-primary)]
  border border-[var(--color-secondary)]
  hover:text-white
  btn-fill-ltr
`,

            editorial: `
        bg-transparent text-[var(--color-on-surface)]
        border-b border-[var(--color-on-surface)]/30
        hover:border-[var(--color-on-surface)]
        px-0 normal-case
      `,

            ghost: `
        bg-transparent text-[var(--color-on-surface-variant)]
        border border-transparent
        hover:bg-[var(--color-surface-container)] hover:text-[var(--color-on-surface)]
      `,

            danger: `
        bg-[var(--color-error)] text-[var(--color-on-error)]
        border border-transparent
        hover:bg-[var(--color-error)]/90
      `,
        };

        const sizes = {
            xs: "px-4 py-2 text-xs min-h-[36px]",
            sm: "px-5 py-2.5 text-xs min-h-[42px]",
            md: "px-8 py-3.5 text-sm min-h-[50px]",
            lg: "px-10 py-4 text-sm min-h-[58px]",
            xl: "px-12 py-5 text-base min-h-[64px]",
        };

        const isIconOnly = Icon && !children;

        // تحديد لون الـ spinner بناءً على الـ variant
        const spinnerColor =
            variant === "primary" || variant === "danger"
                ? "text-white"
                : variant === "premium"
                    ? "text-[var(--color-primary)]"
                    : "text-[var(--color-primary)]";

        return (
            <button
                ref={ref}
                disabled={isLoading || props.disabled}
                className={`
                    ${className}
          ${baseClasses}
          ${variants[variant]}
          ${sizes[size]}
          ${fullWidth ? "w-full" : ""}
        `}
                {...props}
            >
                {isLoading ? (
                    <div
                        className={`flex items-center gap-3 ${iconPosition === "end" ? "flex-row-reverse" : ""}`}
                    >
                        <span>{children}</span>
                        <div className={`animate-spin mt-2 rounded-full h-4 w-4 border-b-2 ${spinnerColor}`} />
                    </div>
                ) : isIconOnly ? (
                    <Icon className="w-5 h-5" />
                ) : (
                    <div
                        className={`flex items-center gap-3 ${iconPosition === "end" ? "flex-row-reverse" : ""}`}
                    >
                        <span>{children}</span>
                        {Icon && <Icon className="w-5 h-5 mt-1" strokeWidth={1.5} />}
                    </div>
                )}
            </button>
        );
    },
);

Button.displayName = "Button";

export default Button;