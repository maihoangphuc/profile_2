import type { SVGProps } from "react";

export function IconPause({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="currentColor"
      className={["icon-pause", className].filter(Boolean).join(" ")}
      {...props}
    >
      <rect x="6.5" y="5.5" width="4.2" height="13" rx="1.1" />
      <rect x="13.3" y="5.5" width="4.2" height="13" rx="1.1" />
    </svg>
  );
}
