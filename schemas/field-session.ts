import { z } from "zod";

export const fieldSessionSchema = z
  .object({
    name: z.string().min(1, "Name wird benötigt."),
    description: z.string().optional(),
    dateFrom: z.coerce.date({ required_error: "Startdatum wird benötigt." }),
    dateTo: z.coerce.date().optional().nullable(),
    zoneId: z.string().optional().nullable(),
    detectorId: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.dateFrom && data.dateTo) {
        return data.dateFrom <= data.dateTo;
      }
      return true;
    },
    {
      message: "Enddatum muss nach dem Startdatum liegen.",
      path: ["dateTo"],
    }
  );

export type FieldSessionFormData = z.infer<typeof fieldSessionSchema>;
