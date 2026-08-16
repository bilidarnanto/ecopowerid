import { prisma } from "@/lib/prisma";
import { GalleryGrid } from "@/components/GalleryGrid";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const items = await prisma.galleryItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return <GalleryGrid items={items} />;
}
