import { z } from 'zod';

export const mitgliedSchema = z.object({
    Anrede: z.string().max(50, "Anrede darf maximal 50 Zeichen lang sein").optional(),

    Vorname: z.string()
        .min(1, "Vorname darf nicht leer sein")
        .max(50, "Vorname darf maximal 50 Zeichen lang sein"),

    Nachname: z.string()
        .min(1, "Nachname darf nicht leer sein")
        .max(50, "Nachname darf maximal 50 Zeichen lang sein"),

    Spitzname: z.string().max(50, "Spitzname darf maximal 50 Zeichen lang sein").optional(),

    Strasse: z.string().max(50, "Straße darf maximal 50 Zeichen lang sein").optional(),

    Ort: z.string().max(50, "Ort darf maximal 50 Zeichen lang sein").optional(),

    PLZ: z.string()
        .length(5, "PLZ muss 5 Zeichen lang sein")
        .regex(/^\d{5}$/, "PLZ muss aus 5 Ziffern bestehen")
        .optional()
        .or(z.literal("")),

    EMail: z.string()
        .max(100, "EMail darf maximal 100 Zeichen lang sein")
        .email("EMail muss eine gültige EMail-Adresse sein")
        .optional()
        .or(z.literal("")),

    TelefonPrivat: z.string().max(50, "TelefonPrivat darf maximal 50 Zeichen lang sein").optional(),
    TelefonMobil: z.string().max(50, "TelefonMobil darf maximal 50 Zeichen lang sein").optional(),
    TelefonFirma: z.string().max(50, "TelefonFirma darf maximal 50 Zeichen lang sein").optional(),
    Fax: z.string().max(50, "Fax darf maximal 50 Zeichen lang sein").optional(),

    Geburtsdatum: z.date().optional(),
    MitgliedSeit: z.date(),
    PassivSeit: z.date().optional(),
    AusgeschiedenAm: z.date().optional(),

    Ehemaliger: z.boolean(),

    // Notizen: z.string().optional(),
    // Bemerkungen: z.string().optional(),
}).refine((data) => {
    // Geburtsdatum muss vor MitgliedSeit liegen
    if (data.Geburtsdatum && data.MitgliedSeit) {
        return data.Geburtsdatum < data.MitgliedSeit;
    }
    return true;
}, {
    message: "Geburtsdatum muss vor MitgliedSeit liegen",
    path: ["Geburtsdatum"]
}).refine((data) => {
    // MitgliedSeit darf nicht in der Zukunft liegen
    return data.MitgliedSeit <= new Date();
}, {
    message: "MitgliedSeit darf nicht in der Zukunft liegen",
    path: ["MitgliedSeit"]
}).refine((data) => {
    // PassivSeit muss nach MitgliedSeit liegen
    if (data.PassivSeit && data.MitgliedSeit) {
        return data.PassivSeit > data.MitgliedSeit;
    }
    return true;
}, {
    message: "PassivSeit muss nach MitgliedSeit liegen",
    path: ["PassivSeit"]
}).refine((data) => {
    // PassivSeit muss nach Geburtsdatum liegen
    if (data.PassivSeit && data.Geburtsdatum) {
        return data.PassivSeit > data.Geburtsdatum;
    }
    return true;
}, {
    message: "PassivSeit muss nach Geburtsdatum liegen",
    path: ["PassivSeit"]
}).refine((data) => {
    // AusgeschiedenAm muss nach MitgliedSeit liegen
    if (data.AusgeschiedenAm && data.MitgliedSeit) {
        return data.AusgeschiedenAm > data.MitgliedSeit;
    }
    return true;
}, {
    message: "AusgeschiedenAm muss nach MitgliedSeit liegen",
    path: ["AusgeschiedenAm"]
}).refine((data) => {
    // AusgeschiedenAm muss nach Geburtsdatum liegen
    if (data.AusgeschiedenAm && data.Geburtsdatum) {
        return data.AusgeschiedenAm > data.Geburtsdatum;
    }
    return true;
}, {
    message: "AusgeschiedenAm muss nach Geburtsdatum liegen",
    path: ["AusgeschiedenAm"]
});

export type MitgliedSchemaType = z.infer<typeof mitgliedSchema>;