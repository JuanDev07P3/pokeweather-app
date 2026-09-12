/**
 * Line weather icons in the theme's quiet style (stroke inherits currentColor).
 * Icon name comes from `describeCode(...).icon` in the weather service.
 */

import type { SVGProps } from "react";

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function Sun(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6" />
    </svg>
  );
}

function Cloud(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M6.5 18.5h11a3.5 3.5 0 0 0 .4-6.98A5.5 5.5 0 0 0 7.3 10.1 3.75 3.75 0 0 0 6.5 18.5Z" />
    </svg>
  );
}

function CloudSun(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M15.2 4.3v1.7M20 9h1.7M18.4 5.8l1.2-1.2M15.9 8.9a4 4 0 0 1 4.6 3.6" />
      <path d="M5 19h9.5a3 3 0 0 0 .35-5.98A4.6 4.6 0 0 0 5.6 12a3.25 3.25 0 0 0-.6 7Z" />
    </svg>
  );
}

function CloudDrizzle(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M6.5 14.5h11a3.5 3.5 0 0 0 .4-6.98A5.5 5.5 0 0 0 7.3 6.1a3.9 3.9 0 0 0-.8 8.4Z" />
      <path d="M9 18v1.5M12.5 17v2M16 18v1.5" />
    </svg>
  );
}

function CloudRain(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M6.5 14h11a3.5 3.5 0 0 0 .4-6.98A5.5 5.5 0 0 0 7.3 5.6a3.9 3.9 0 0 0-.8 8.4Z" />
      <path d="M8.5 17.5 8 19.5M12.5 17l-.8 2.7M16.5 17.5 16 19.5" />
    </svg>
  );
}

function CloudSnow(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M6.5 14h11a3.5 3.5 0 0 0 .4-6.98A5.5 5.5 0 0 0 7.3 5.6a3.9 3.9 0 0 0-.8 8.4Z" />
      <path d="M9 18.2h.01M12.3 19.4h.01M15.6 18.2h.01M10.8 20.4h.01M14 20.6h.01" />
    </svg>
  );
}

function CloudFog(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M6.5 12.5h11a3.5 3.5 0 0 0 .4-6.98A5.5 5.5 0 0 0 7.3 4.1a3.9 3.9 0 0 0-.8 8.4Z" />
      <path d="M6 16.5h12M8 19.5h9" />
    </svg>
  );
}

function CloudLightning(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M6.5 13.5h11a3.5 3.5 0 0 0 .4-6.98A5.5 5.5 0 0 0 7.3 5.1a3.9 3.9 0 0 0-.8 8.4Z" />
      <path d="m12.5 14-2.2 4h3l-1.6 3.5 4.3-5.2h-2.8l1.6-2.3Z" />
    </svg>
  );
}

const MAP: Record<string, (p: SVGProps<SVGSVGElement>) => React.JSX.Element> = {
  sun: Sun,
  cloud: Cloud,
  "cloud-sun": CloudSun,
  "cloud-drizzle": CloudDrizzle,
  "cloud-rain": CloudRain,
  "cloud-snow": CloudSnow,
  "cloud-fog": CloudFog,
  "cloud-lightning": CloudLightning,
};

export function WeatherIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Cmp = MAP[name] ?? Cloud;
  return <Cmp className={className} aria-hidden />;
}
