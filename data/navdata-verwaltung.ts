export const NavDataVerwaltung: { title: string; href: string }[] = [
    {
        title: "Mitglieder",
        href: "/verwaltung/mitglieder",
    },
    {
        title: "Meisterschaften",
        href: "/verwaltung/meisterschaften",
    },
    {
        title: "Ergebniseingabe",
        href: "/verwaltung/eingabe",
    },
    {
        title: "Ergebnisausgabe",
        href: "/verwaltung/ausgabe",
    },
    {
        title: "Statistik",
        href: "/verwaltung/statistik",
    },
    {
        title: "Email",
        href: "/verwaltung/email",
    },
    // {
    //     title: "Vorlagen",
    //     href: "/verwaltung/vorlagen",
    // },
]

type Subtitle = {
    subtitle: string;
    href: string;
}

type NavDataVordrucke = {
    title: string;
    subtitle: Subtitle[];
}

export const NavDataVordrucke: NavDataVordrucke[] = [
    {
        title: "Spiele",
        subtitle: [
            {
                subtitle: "6-Tage-Rennen",
                href: "/vorlagen/spiele/6-Tage-Rennen.pdf"
            },
            {
                subtitle: "Kombimeisterschaft",
                href: "/vorlagen/spiele/Kombimeisterschaft.pdf"
            },
            {
                subtitle: "Meisterschaft",
                href: "dummy"
            },
            {
                subtitle: "Blitztunier",
                href: "dummy"
            },
            {
                subtitle: "Weihnachtsbaum",
                href: "/vorlagen/spiele/Weihnachtsbaum.pdf"
            },
        ]
    },    {
        title: "Mitglieder",
        subtitle: [
            {
                subtitle: "Aktive Mitglieder",
                href: "dummy"
            },
            {
                subtitle: "Alle Mitglieder",
                href: "dummy"
            },
        ]
    },
    {
        title: "Kasse",
        subtitle: [
            {
                subtitle: "Spielverluste",
                href: "/vorlagen/kasse/Spielverluste.pdf"
            },
            {
                subtitle: "Abrechnung",
                href: "/vorlagen/kasse/Abrechnung.pdf"
            },
        ]
    },
]