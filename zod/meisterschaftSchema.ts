import { z } from 'zod';

export const meisterschaftsSchema = z.object({
    Bezeichnung: z.string()
        .min(1, "Bezeichnung darf nicht leer sein")
        .max(50, "Bezeichnung darf maximal 50 Zeichen lang sein"),

    Beginn: z.date(),
    Ende: z.date().optional(),

    MeisterschaftstypID: z.number()
        .gt(0, "MeisterschaftstypID muss größer als 0 sein")

}).refine((data) => {
    // Beginn muss vor Ende liegen
    if (data.Ende) {
        return data.Beginn < data.Ende;
    }
    return true;
}, {
    message: "Beginn muss vor Ende liegen",
});

export type MeisterschaftSchemaType = z.infer<typeof meisterschaftsSchema>;