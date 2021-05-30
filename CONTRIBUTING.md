![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg)

# Guide de contribution Vite Ma Dose (web)

Bonjour ! Bienvenue sur le dépôt de code de l'application web [_Vite Ma Dose_](https://vitemadose.covidtracker.fr/).

C'est ici que se développent les prochaines fonctionnalités à ajouter au front et tu as peut-être
envie de participer à l'aventure. Nous accueillons ta contribution avec plaisir et ce document
est là pour faciliter ton intégration au sein du projet VMD.

Mais d'abord, quelques indications sur ce que contient ce dépôt :

+ l'application web type [SPA](https://fr.wikipedia.org/wiki/Application_web_monopage) développée avec
  des composants [lit-elements](https://lit-element.polymer-project.org/guide/templates), [lit-html](https://lit-html.polymer-project.org/guide)
  et compilée avec [vite](vitejs.dev)
+ Les ressources (images, logo, etc.) qui sont utilisées exclusivement par cette application
+ Le contenu SEO en relation avec _Vite Ma Dose._

D'autres dépôts participent au fonctionnement de Vite Ma Dose :

+ [CovidTrackerFr/vitemadose](https://github.com/CovidTrackerFr/vitemadose) : Le scrapper qui récupère et agrège les données
+ [CovidTrackerFr/vitemadose-android](https://github.com/CovidTrackerFr/vitemadose-android) : L'application Android
+ [CovidTrackerFr/vitemadose-ios](https://github.com/CovidTrackerFr/vitemadose-ios) : L'application iOS
+ [CovidTrackerFr/vitemadose-firebase](https://github.com/CovidTrackerFr/vitemadose-firebase) : Les actions FireBase pour les notifications


## Proposer une implémentation de fonctionnalité

Nous fonctionnons par [_Pull Requests_](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/about-pull-requests).
Rien de bien exceptionnel mais voici les quelques points importants :

+ Avant de commencer à coder, clone le dépôt, en particulier la branche `dev`
+ Crée une nouvelle branche à partir de cette branche `dev`
+ Ajoute la nouvelle fonctionnalité ou corrige le bug. Les tests et les petits commits réguliers sont très encouragés.
+ Si tu cherches à résoudre une [issue](https://github.com/CovidTrackerFr/vitemadose-front/issues), pense à indiquer son numéro dans le message de commit
+ Pousse ta branche sur github
+ Ouvre une merge request qui cible la branche `dev`
+ Assure-toi que tout est vert sur l'interface !


## Mettre en prod

Regulièrement, nous mettons en prod le code prêt qui se trouve sur la branche `dev`. Pour faire ceci :

+ Prépare une _Release Note._ Le plus facile est de s'inspirer de [la précédente](https://github.com/CovidTrackerFr/vitemadose-front/releases)
+ Cible la branche `main` avec un nom de tag qui comprends la date du jour au format `YYYYMMDD`.
+ Enregistre en brouillon et demande une revue !
+ Localement, merge `dev` dans `main` avec ces commandes:
  - `git fetch --prune`
  - `git checkout main`
  - `git reset --hard origin/main`
  - `git pull --merge origin dev`
  - `git push origin main`

+ Publie la _relase note_ ! Le tag git sera ajouté directement depuis Github.

### Outils pour la rédaction de la release note

#### Lister les commits depuis la dernière release

    git log --oneline <précédente release>..dev --graph


#### Trouver les numéros des Pull Request mergées depuis la dernière release

    git log --oneline <précédente release>..dev | grep 'Merge pull request'

#### Trouver les noms des contributeurs (de code)

    git shortlog <précédente release>..dev
