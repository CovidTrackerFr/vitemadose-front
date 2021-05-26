import {LieuAffichableAvecDistance, LieuxAvecDistanceParDepartement} from "./State";
import {InfiniteScroll} from "./InfiniteScroll";

let scroll: InfiniteScroll;
let lieuxParDepartementAffiches: LieuxAvecDistanceParDepartement;

describe('InfiniteScroll', () => {
    beforeEach(() => {
        scroll = new InfiniteScroll();
        let lieuxAffichables: LieuAffichableAvecDistance[] = [];
        for (let i = 0; i < 45; i ++) {
            lieuxAffichables.push({
                appointment_count: i,
                departement: '21',
                location: {
                    latitude: i,
                    longitude: i
                },
                nom: 'Name_' + i,
                url: 'https://an-awesome-place-to-live-in/' + i,
                appointment_by_phone_only: false,
                appointment_schedules: [],
                plateforme: 'Doctolib',
                internal_id: 'doctolib12345',
                prochain_rdv: '2021-05-17T09:10:00.000+02:00',
                metadata: {
                    address: '1 Place de la Concorde',
                    phone_number: undefined,
                    business_hours: undefined
                },
                type: 'vaccination-center',
                vaccine_type: 'Pfizer-BioNTech',
                disponible: true,
                distance: undefined
            });
        }
        lieuxParDepartementAffiches = {
            lieuxMatchantCriteres: lieuxAffichables,
            lieuxDisponibles: [],
            codeDepartements: [],
            derniereMiseAJour: new Date().toISOString()
        };
    });

    it('should ajouterCartesPaginees add 20 more cards', () => {
        // Given
        const cartesAffichees: LieuAffichableAvecDistance[] = [];

        // When
        const output = scroll.ajouterCartesPaginees(lieuxParDepartementAffiches, cartesAffichees);

        // Then
        expect(output.length).toEqual(20);
    });

    it('should ajouterCartesPaginees add 20 more cards', () => {
        // Given
        const cartesAffichees = lieuxParDepartementAffiches.lieuxMatchantCriteres.slice(0, 20);

        // When
        const output = scroll.ajouterCartesPaginees(lieuxParDepartementAffiches, cartesAffichees);

        // Then
        expect(output.length).toEqual(40);
    });

    it('should ajouterCartesPaginees add 5 more cards', () => {
        // Given
        const cartesAffichees = lieuxParDepartementAffiches.lieuxMatchantCriteres.slice(0, 40);

        // When
        const output = scroll.ajouterCartesPaginees(lieuxParDepartementAffiches, cartesAffichees);

        // Then
        expect(output.length).toEqual(45);
    });

    it('should ajouterCartesPaginees not add more cards', () => {
        // Given
        const cartesAffichees = lieuxParDepartementAffiches.lieuxMatchantCriteres.slice(0, 45);

        // When
        const output = scroll.ajouterCartesPaginees(lieuxParDepartementAffiches, cartesAffichees);

        // Then
        expect(output.length).toEqual(45);
    });
});
