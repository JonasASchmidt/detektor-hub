export type RelatedFindingSummary = {
  id: string;
  name: string | null;
  foundAt: Date;
  createdAt: Date;
  images: { publicId: string }[];
  user: { id: string; name: string | null; image: string | null };
};
