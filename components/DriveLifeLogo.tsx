import Image from "next/image";

type Props = {
  /** Rendered height in px. Width is calculated from the logo's 8.75:1 aspect ratio. */
  height?: number;
  className?: string;
  priority?: boolean;
};

const NATURAL_WIDTH = 2529;
const NATURAL_HEIGHT = 289;

/**
 * The DriveLife wordmark. Uses the original brand PNG (transparent background)
 * served from /public so it renders identically across the site.
 */
export function DriveLifeLogo({
  height = 22,
  className = "",
  priority = false,
}: Props) {
  const width = Math.round(height * (NATURAL_WIDTH / NATURAL_HEIGHT));

  return (
    <Image
      src="/logo-dark.png"
      alt="DriveLife"
      width={width}
      height={height}
      priority={priority}
      className={className}
      // Tell the browser the intrinsic ratio so layout doesn't jump.
      style={{ height, width: "auto" }}
    />
  );
}
