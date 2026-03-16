import { z } from "zod";

export interface FindingFormData {
  name: string;
  location: { lat: number; lng: number };
  depth?: number;
  weight?: number;
  diameter?: number;
  description?: string;
  description_front?: string;
  description_back?: string;
  dating?: string;
  dating_from?: number;
  dating_to?: number;
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
    description_front: z.string().optional(),
    description_back: z.string().optional(),
    dating: z.string().optional(),
    dating_from: z.coerce.number().optional(),
    dating_to: z.coerce.number().optional(),
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
      if (data.dating_from && data.dating_to) {
        return data.dating_from <= data.dating_to;
      }
      return true;
    },
    {
      message: "Muss vor 'Datierung bis Jahr' liegen.",
      path: ["dating_from"],
    }
  );
