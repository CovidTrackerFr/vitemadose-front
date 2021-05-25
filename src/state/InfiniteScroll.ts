import {LieuAffichableAvecDistance, LieuxAvecDistanceParDepartement} from "./State";

const PAGINATION_SIZE = 20;

export class InfiniteScroll {

    ajouterCartesPaginees(lieuxParDepartementAffiches: LieuxAvecDistanceParDepartement | undefined = undefined,
                          cartesAffichees: LieuAffichableAvecDistance[]) {

        if (!lieuxParDepartementAffiches?.lieuxMatchantCriteres ||
            cartesAffichees.length >= lieuxParDepartementAffiches?.lieuxMatchantCriteres.length) {

            return cartesAffichees;
        }

        const startIndex = cartesAffichees.length
        let cartesAAjouter = lieuxParDepartementAffiches.lieuxMatchantCriteres
            .slice(startIndex, startIndex + PAGINATION_SIZE);

        return cartesAffichees.concat(cartesAAjouter);
    }
}
