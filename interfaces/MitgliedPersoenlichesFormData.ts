export interface MitgliedPersoenlichesFormData {
    Anrede?: string;
    Vorname: string;
    Nachname: string;
    Spitzname?: string;
    Strasse?: string;
    PLZ?: string;
    Ort?: string;
    TelefonPrivat?: string;
    TelefonMobil?: string;
    EMail?: string;
    Geburtsdatum?: Date;
    MitgliedSeit: Date;
    PassivSeit?: Date;
    AusgeschiedenAm?: Date;
    Ehemaliger: boolean;
}