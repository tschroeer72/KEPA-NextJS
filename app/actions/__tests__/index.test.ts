/**
 * @jest-environment node
 */
jest.mock('@/lib/prisma', () => ({ prisma: {} }));
jest.mock('server-only', () => ({}), { virtual: true });

describe('app/actions index (Re-Exports)', () => {
    it('exportiert Funktionen aus allen Teilmodulen', async () => {
        const index = await import('../index');
        const names = Object.keys(index);
        expect(names.length).toBeGreaterThan(10);
        for (const name of [
            'getCurrentMeisterschaft', 'setCurrentMeisterschaft', // settings
            'getAlleMitglieder', 'getAktiveMitglieder', 'getMitgliedById', // mitglieder
        ]) {
            expect(typeof (index as any)[name]).toBe('function');
        }
    });

    it('re-exportiert dieselben Funktionen wie die Quellmodule', async () => {
        const index: any = await import('../index');
        const mitglieder: any = await import('../verwaltung/mitglieder/actions');
        const current: any = await import('../settings/get-current-meisterschaft');
        expect(index.getAlleMitglieder).toBe(mitglieder.getAlleMitglieder);
        expect(index.getCurrentMeisterschaft).toBe(current.getCurrentMeisterschaft);
    });
});
