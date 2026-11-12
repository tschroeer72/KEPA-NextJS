/**
 * @jest-environment node
 */
jest.mock('@/lib/prisma', () => ({ prisma: {} }));

import * as eingabe from '../index';
import * as saveEingabe from '../save-eingabe';
import * as getEingabe from '../get-eingabe';

describe('app/actions/verwaltung/eingabe index', () => {
    it('re-exportiert save-eingabe und get-eingabe', () => {
        const expected = [...Object.keys(saveEingabe), ...Object.keys(getEingabe)];
        expect(expected.length).toBeGreaterThan(0);
        for (const name of expected) {
            expect(typeof (eingabe as any)[name]).toBe('function');
        }
        expect(Object.keys(eingabe).sort()).toEqual([...new Set(expected)].sort());
    });
});
