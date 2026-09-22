import Image from "next/image";

interface InstituteLogoProps {
  logoUrl: string | null;
  name: string;
  /** Size in pixels (width = height). Default: 36 */
  size?: number;
  /** Extra className on the wrapper div */
  className?: string;
}

/**
 * Shows the institute logo image if `logoUrl` is set,
 * otherwise falls back to the initials box (e.g. "FL").
 */
export function InstituteLogo({
  logoUrl,
  name,
  size = 36,
  className = "",
}: InstituteLogoProps) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (logoUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`rounded-lg overflow-hidden shrink-0 ${className}`}
      >
        <Image
          src={logoUrl}
          alt={`${name} logo`}
          width={size}
          height={size}
          className="object-contain w-full h-full"
          priority
        />
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.33 }}
      className={`rounded-lg bg-primary flex items-center justify-center font-bold text-white shadow-md shrink-0 ${className}`}
    >
      {initials}
    </div>
  );
}
