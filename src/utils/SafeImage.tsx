"use client";

import Image, { ImageProps, StaticImageData } from "next/image";
import { useMemo, useState } from "react";

import { getSafeImageUrl } from "./getSafeImageUrl";
import { default_image } from "@/assets";

type SafeImageProps = ImageProps & {
  src: string;
};

const SafeImage = ({ src, ...props }: SafeImageProps) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const resolvedSrc = useMemo<string | StaticImageData>(() => {
    if (src?.startsWith("blob:")) {
      return src;
    }

    return getSafeImageUrl(src);
  }, [src]);

  const resolvedKey =
    typeof resolvedSrc === "string" ? resolvedSrc : resolvedSrc.src;
  const imgSrc = failedSrc === resolvedKey ? default_image : resolvedSrc;

  return (
    <Image
      {...props}
      alt={props.alt ?? ""}
      src={imgSrc}
      onError={() => setFailedSrc(resolvedKey)}
    />
  );
};

export default SafeImage;
