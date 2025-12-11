# Protec Rescue 38

Prototype de jeu web en français basé sur le référentiel PSE (Premiers Secours en Équipe). Il s'agit d'une application 100% front-end : tout est stocké dans le navigateur pour permettre la création de compte, la connexion et la progression par niveaux.

## Lancer le jeu
1. Ouvrez `index.html` dans votre navigateur (double clic ou via un petit serveur local : `python -m http.server 8000`).
2. Créez un compte ou connectez-vous.
3. Choisissez un module PSE et lancez la simulation.

## Exécuter avec Docker
1. Construisez l'image : `docker build -t protec-rescue-38 .`.
2. Lancez le conteneur : `docker run -p 8080:80 protec-rescue-38`.
3. Ouvrez le jeu sur `http://localhost:8080`.

### Via Docker Compose
1. Démarrez le service : `docker compose up --build`.
2. Ouvrez le jeu sur `http://localhost:8080`.

## Fonctionnalités clés
- **Création de compte / connexion** : stockage local avec persistance de la progression.
- **Niveaux PSE** : évaluation initiale, bilan vital, gestes de secours avec scénarios et explications.
- **Statuts** : Non commencé, En cours, Réussi avec score cumulatif.
- **Tableau d'honneur** : top 5 des secouristes selon les points accumulés.

## Notes
- Aucune dépendance externe à installer.
- Vous pouvez réinitialiser votre progression en vidant le stockage local du navigateur (localStorage).
