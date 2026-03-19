import { z } from "zod";

export interface FindingFormData {
  name: string;
  location: { lat: number; lng: number };
  depth?: number;
  weight?: number;
  diameter?: number;
  description?: string;
  descriptionFront?: string;
  descriptionBack?: string;
  dating?: string;
  datingFrom?: number;
  datingTo?: number;
  references?: string;
  thumbnailId?: string;
  detectorId?: string;
  conductivity?: number;
  foundAt: Date;
  tags: string[];
  images: string[];
  fieldSessionId?: string | null;
  locationPublic?: boolean;
}

/** Minimal schema for the mobile quick-find form. Name is optional (auto-generated from session naming scheme). */
export const findingDraftSchema = z.object({
  name: z.string().optional(),
  location: z.object({
    lat: z.coerce.number({ required_error: "Koordinaten fehlen." }),
    lng: z.coerce.number({ required_error: "Koordinaten fehlen." }),
  }),
  description: z.string().optional(),
  conductivity: z.coerce.number().optional(),
  foundAt: z.coerce.date(),
  images: z.string().array().default([]),
  fieldSessionId: z.string().optional().nullable(),
});

export type FindingDraftData = z.infer<typeof findingDraftSchema>;

export const findingSchemaCompleted = z
  .object({
    name: z.string({ required_error: "Name wird benötigt." }),
    location: z.object({
      lat: z.coerce.number({ required_error: "Latitude wird benötigt." }),
      lng: z.coerce.number({ required_error: "Longitude wird benötigt." }),
    }),
    depth: z.coerce.number().nonnegative().optional(),
    weight: z.coerce.number().nonnegative().optional(),
    diameter: z.coerce.number().nonnegative().optional(),
    description: z.string().optional(),
    descriptionFront: z.string().optional(),
    descriptionBack: z.string().optional(),
    dating: z.string().optional(),
    datingFrom: z.coerce.number().optional(),
    datingTo: z.coerce.number().optional(),
    references: z.string().optional(),
    thumbnailId: z.string().optional(),
    conductivity: z.coerce.number().optional(),
    foundAt: z.coerce.date(),
    tags: z.string().array(),
    images: z.string().array(),
    fieldSessionId: z.string().optional().nullable(),
    locationPublic: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.datingFrom && data.datingTo) {
        return data.datingFrom <= data.datingTo;
      }
      return true;
    },
    {
      message: "Muss vor 'Datierung bis Jahr' liegen.",
      path: ["datingFrom"],
    }
  );
