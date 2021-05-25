import {Strings} from "./Strings";

describe('Strings', () => {
    it('should upperFirst upper first char', () => {
        // Given
        const input = 'test';
        const expectedOutput = 'Test';

        // When
        const output = Strings.upperFirst(input);

        // Then
        expect(output).toEqual(expectedOutput);
    });

    it('should upperFirst upper lone char', () => {
        // Given
        const input = 't';
        const expectedOutput = 'T';

        // When
        const output = Strings.upperFirst(input);

        // Then
        expect(output).toEqual(expectedOutput);
    });

    it('should upperFirst return empty string', () => {
        // Given
        const input = '';
        const expectedOutput = '';

        // When
        const output = Strings.upperFirst(input);

        // Then
        expect(output).toEqual(expectedOutput);
    });
});
