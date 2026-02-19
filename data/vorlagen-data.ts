import { VorlagenGruppe } from "@/types/vorlagen"

export const VorlagenData: VorlagenGruppe[] = [
    {
        title: "Spiele",
        subtitle: [
            {
                subtitle: "6-Tage-Rennen",
                href: "/api/vorlagen/6-tage-rennen"
            },
            {
                subtitle: "Kombimeisterschaft",
                href: "/api/vorlagen/kombimeisterschaft"
            },
            {
                subtitle: "Meisterschaft",
                href: "/api/vorlagen/meisterschaft"
            },
            {
                subtitle: "Blitztunier",
                href: "/api/vorlagen/blitztunier"
            },
            {
                subtitle: "Weihnachtsbaum Variante 1",
                href: "/api/vorlagen/weihnachtsbaum?variant=1"
            },
            {
                subtitle: "Weihnachtsbaum Variante 2",
                href: "/api/vorlagen/weihnachtsbaum?variant=2"
            },
        ]
    },
    {
        title: "Mitglieder",
        subtitle: [
            {
                subtitle: "Aktive Mitglieder",
                href: "/api/vorlagen/mitgliederliste?aktiv=true"
            },
            {
                subtitle: "Alle Mitglieder",
                href: "/api/vorlagen/mitgliederliste?aktiv=false"
            },
        ]
    },
    {
        title: "Kasse",
        subtitle: [
            {
                subtitle: "Spielverluste",
                href: "/api/vorlagen/spielverluste"
            },
            {
                subtitle: "Abrechnung",
                href: "/api/vorlagen/abrechnung"
            },
        ]
    },
]
