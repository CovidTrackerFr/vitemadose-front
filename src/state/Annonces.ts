import { CodeDepartement, LieuAnnonce } from './State'

export const ANNONCES: Record<CodeDepartement, LieuAnnonce> = {
  "50": {
    type: "annonce",
    departement: "50",
    appointment_count: 10,
    location: {
      latitude: 48.814568,
      longitude: -1.561985
    },
    metadata: {
      address: "290 Rue du Moulin À Vent, 50380 Saint-Pair-sur-Mer",
      phone_number: "+33123456789"
    },
    nom: "Dr. Beaujoux - généraliste",
    prochain_rdv: "2021-04-16",
  }
}
