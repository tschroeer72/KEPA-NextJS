interface Meisterschaft {
    ID: number;
    Bezeichnung: string;
    Beginn: Date;
    Ende?: Date | null;
    MeisterschaftstypID: number;
    Aktiv: number;
    Bemerkungen?: string | null;
}