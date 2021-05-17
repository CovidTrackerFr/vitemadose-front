# Pré-requis

Node 14 ou supérieur.

# Installation

Installer les dépendances : `npm ci`

# Exécution

Une fois les dépendances installées, lancer la commande suivante : `npx ts-node communes-import.ts `

Sous IntelliJ IDEA, il faudra configurer le launcher avec les options suivantes :
- Working directory : current `tools` directory
- Node parameters : `--require ts-node/register`
- Application parameters : `--project ./tsconfig.json`
