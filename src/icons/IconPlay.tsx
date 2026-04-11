import type { SVGProps } from "react";

export function IconPlay({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="currentColor"
      className={["icon-play", className].filter(Boolean).join(" ")}
      {...props}
    >
      <path d="M8 5.5v13l11-6.5-11-6.5Z" />
    </svg>
  );
}
