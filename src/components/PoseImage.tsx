import { useEffect, useState } from "react";
import { getCroppedImageUrl } from "@/lib/imageCrop";

interface PoseImageProps {
  src?: string;
  alt: string;
  className?: string;
}

/**
 * Displays a pose image with its real content bounding box auto-detected
 * and cropped client-side — fixes inconsistent internal padding (some
 * images generated tight, others with lots of empty canvas) without
 * needing to re-crop and re-upload the source file. Shows the original
 * image immediately, then swaps to the corrected crop once it's ready
 * (near-instant for cached images, no visible flash for most users).
 */
const PoseImage = ({ src, alt, className }: PoseImageProps) => {
  const [displaySrc, setDisplaySrc] = useState(src);

  useEffect(() => {
    setDisplaySrc(src);
    if (!src) return;
    let cancelled = false;
    getCroppedImageUrl(src).then((cropped) => {
      if (!cancelled) setDisplaySrc(cropped);
    });
    return () => {
      cancelled = true;
    };
  }, [src]);

  if (!displaySrc) return null;

  return <img src={displaySrc} alt={alt} className={className} />;
};

export default PoseImage;
