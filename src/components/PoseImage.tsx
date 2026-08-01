import { useEffect, useState } from "react";
import { getCroppedImageUrl } from "@/lib/imageCrop";

interface PoseImageProps {
  src?: string;
  alt: string;
  className?: string;
  paddingRatio?: number;
  onLoad?: () => void;
}

/**
 * Displays a pose image with its real content bounding box auto-detected
 * and cropped client-side — fixes inconsistent internal padding (some
 * images generated tight, others with lots of empty canvas) without
 * needing to re-crop and re-upload the source file. Shows the original
 * image immediately, then swaps to the corrected crop once it's ready
 * (near-instant for cached images, no visible flash for most users).
 *
 * Fades in on its own once the browser actually paints pixels, rather than
 * popping in abruptly whenever the network/decode happens to finish —
 * network image loads are inherently slower than the surrounding text, so
 * without this the page reads as glitchy as images arrive out of sync.
 */
const PoseImage = ({ src, alt, className, paddingRatio = 0.06, onLoad }: PoseImageProps) => {
  const [displaySrc, setDisplaySrc] = useState(src);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setDisplaySrc(src);
    setLoaded(false);
    if (!src) return;
    let cancelled = false;
    getCroppedImageUrl(src, paddingRatio).then((cropped) => {
      if (!cancelled) setDisplaySrc(cropped);
    });
    return () => {
      cancelled = true;
    };
  }, [src, paddingRatio]);

  if (!displaySrc) return null;

  return (
    <img
      src={displaySrc}
      alt={alt}
      className={className}
      decoding="async"
      onLoad={() => {
        setLoaded(true);
        onLoad?.();
      }}
      style={{
        opacity: loaded ? 1 : 0,
        transform: loaded ? "translateY(0)" : "translateY(4px)",
        transition: "opacity 300ms ease, transform 300ms ease",
      }}
    />
  );
};

export default PoseImage;
