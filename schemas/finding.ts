import { z } from "zod";

export const findingSchemaCompleted = z
  .object({
    name: z.string({ required_error: "Name wird benötigt." }),
    latitude: z.number({ required_error: "Latitude wird benötigt." }),
    longitude: z.number({ required_error: "Longitude wird benötigt." }),
    depth: z.number().nonnegative().optional(),
    weight: z.number().nonnegative().optional(),
    diameter: z.number().nonnegative().optional(),
    description: z.string().optional(),
    description_front: z.string().optional(),
    description_back: z.string().optional(),
    dating: z.string().optional(),
    dating_from: z.number().optional(),
    dating_to: z.number().optional(),
    references: z.string().optional(),
    thumbnailId: z.string().optional(),
    conductivity: z.number().optional(),
    foundAt: z.string(),
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
