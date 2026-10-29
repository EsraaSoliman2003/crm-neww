"use client";

export function navigate(path: string) {
  if (typeof window !== "undefined") {
    import("next/navigation").then(({ useRouter }) => {
      const router = useRouter();
      router.push(path);
    }).catch(() => {
      window.location.href = path;
    });
  }
}