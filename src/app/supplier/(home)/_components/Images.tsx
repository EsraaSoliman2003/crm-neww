import { default_image } from "@/assets";
import Image from "next/image";

type Props = {
  coverImage?: string | null;
};

export default function Images({ coverImage }: Props) {
  return (
    <div className="px-6 pt-6 md:px-8">
      <div className="relative h-56 w-full overflow-hidden border border-gray-200 bg-gray-200 md:h-64">
        {/* COVER */}
        <Image
          src={coverImage ? coverImage : default_image}
          alt="cover"
          fill
          className="object-cover"
          sizes="(min-width: 768px) calc(100vw - 4rem), calc(100vw - 3rem)"
          priority
        />

      </div>
    </div>
  );
}
