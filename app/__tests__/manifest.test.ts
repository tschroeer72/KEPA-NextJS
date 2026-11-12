import manifest from '../manifest';

describe('app/manifest', () => {
    const m = manifest();

    it('enthaelt Name, Kurzname, Beschreibung und start_url', () => {
        expect(m.name).toBe('KEPA 1958 Verwaltung');
        expect(m.short_name).toBe('KEPAVerwaltung');
        expect(m.description).toBeTruthy();
        expect(m.start_url).toBe('/');
    });

    it('ist als eigenstaendige App konfiguriert', () => {
        expect(m.display).toBe('standalone');
        expect(m.background_color).toMatch(/^#[0-9a-f]{6}$/i);
        expect(m.theme_color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('liefert die PNG-Icons 192 und 512', () => {
        expect(m.icons).toEqual([
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ]);
    });

    it('verweist auf existierende Icon-Dateien', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const fs = require('fs');
        const path = require('path');
        for (const icon of m.icons ?? []) {
            expect(fs.existsSync(path.join(process.cwd(), 'public', icon.src))).toBe(true);
        }
    });
});
