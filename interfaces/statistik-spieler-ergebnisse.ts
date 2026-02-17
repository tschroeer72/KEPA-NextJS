export interface StatistikSpielerErgebnisse {
    Spieltag: Date;
    Meisterschaft: string;
    Gegenspieler?: string;
    Ergebnis?: number;
    Holz?: number;
    SechsTageRennen_Runden?: number;
    SechsTageRennen_Punkte?: number;
    SechsTageRennen_Platz?: number;
    Sarg?: number;
    Pokal?: number;
    Neuner?: number;
    Ratten?: number;
}
