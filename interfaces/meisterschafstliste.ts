interface Meisterschaftliste {
    ID: number;
    Bezeichnung: string;
    Beginn: Date;
    Ende?: Date | null;
    MeisterschaftstypID: number;
    TurboDBNummer?: number | null;
    Aktiv: number;
    Bemerkungen?: string | null;
    tblMeisterschaftstyp?: {
        Meisterschaftstyp: string;
    };
}
