import { z } from "zod";

export const zoneSchema = z.object({
  name: z.string().min(1, "Name wird benötigt."),
  description: z.string().optional(),
  geometry: z.string().optional().nullable(), // GeoJSON Polygon string
});

export type ZoneFormData = z.infer<typeof zoneSchema>;
