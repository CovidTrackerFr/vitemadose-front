import {DEPARTEMENTS_LIMITROPHES} from "./Departements";

describe('Departements', () => {
    Object.keys(DEPARTEMENTS_LIMITROPHES).forEach(startingDep => {
        DEPARTEMENTS_LIMITROPHES[startingDep].forEach(endingDep => {
            it(`${startingDep} => ${endingDep} should have bijective adjacent departments`, () => {
                // Given
        
                // When
                const endingDepAdjacentDepartments = DEPARTEMENTS_LIMITROPHES[endingDep];
                
                // Then
                expect(endingDepAdjacentDepartments).toBeDefined()
                try {
                    expect(endingDepAdjacentDepartments.includes(startingDep)).toBeTrue()
                }catch(e){ throw new Error(`Missing "${startingDep}" in DEPARTEMENTS_LIMITROPHES["${endingDep}"]`); }
            });    
        })
    })
});
