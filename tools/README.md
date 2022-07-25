# Pré-requis

Node 14 ou supérieur.

# Installation

Installer les dépendances : `npm ci`

# Exécution

Une fois les dépendances installées, lancer les commandes suivantes :
- `npx ts-node communes-import.ts` : pour générer les autocomplete de toutes les communes fr
- `npx ts-node update-offline-data.ts` : pour mettre à jour les fichiers utilisés pour le dev offline

Sous IntelliJ IDEA, il faudra configurer le launcher avec les options suivantes :
- Working directory : current `tools` directory
- Node parameters : `--require ts-node/register`
- Application parameters : `--project ./tsconfig.json`
