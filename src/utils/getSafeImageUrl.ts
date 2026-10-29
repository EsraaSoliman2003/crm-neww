import { default_image } from "@/assets";
import { StaticImageData } from "next/image";

const API_BASE_URL = "https://mongiz.api.imothmr.com";

export const getSafeImageUrl = (
  image?: string | null | StaticImageData,
): string | StaticImageData => {
  if (!image) return default_image;

  // Static import
  if (typeof image === "object") return image;

  // Full URL
  if (image.startsWith("http")) return image;

  // Backend relative path (basic validation)
  if (image.includes("/")) {
    return `${API_BASE_URL}/${image}`;
  }

  // Invalid string
  return default_image;
};
