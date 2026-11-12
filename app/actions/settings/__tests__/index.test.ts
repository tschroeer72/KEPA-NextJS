/**
 * @jest-environment node
 */
jest.mock('@/lib/prisma', () => ({ prisma: {} }));

import * as settings from '../index';
import { getCurrentMeisterschaft } from '../get-current-meisterschaft';
import { setCurrentMeisterschaft } from '../set-current-meisterschaft';

describe('app/actions/settings index', () => {
    it('exportiert genau get/setCurrentMeisterschaft', () => {
        expect(Object.keys(settings).sort()).toEqual(['getCurrentMeisterschaft', 'setCurrentMeisterschaft']);
        expect(settings.getCurrentMeisterschaft).toBe(getCurrentMeisterschaft);
        expect(settings.setCurrentMeisterschaft).toBe(setCurrentMeisterschaft);
    });
});
