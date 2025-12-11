# Mobile Game (Expo + Docker)

Ce dépôt contient un mini-jeu React Native prêt à être lancé avec Expo Go et à être exécuté dans un conteneur Docker. Le jeu affiche une grille : touchez la case mise en évidence pour enchaîner des combos et marquer des points avant la fin du chronomètre.

## Prérequis
- Node.js 20+
- npm
- Docker (pour l'exécution conteneurisée)
- Expo Go installé sur votre téléphone si vous souhaitez tester sur mobile

## Installation locale
1. Installez les dépendances (génère automatiquement les assets placeholders en PNG) :
   ```bash
   npm install
   ```
   Si vous avez déjà les dépendances mais pas les images, vous pouvez regénérer les assets à tout moment :
   ```bash
   npm run generate:assets
   ```

2. Démarrez le serveur de développement :
   ```bash
   npm run start -- --tunnel
   ```
   - L'option `--tunnel` facilite le scan du QR code avec Expo Go depuis un autre réseau.
   - Si vous voulez cibler une adresse précise, vous pouvez ajouter `--host 0.0.0.0`.

## Exécution dans Docker
### Avec Docker Compose (recommandé)
1. Construisez l'image et lancez le conteneur Expo :
   ```bash
   docker compose up --build
   ```
   Le service expose automatiquement les ports Expo (`19000-19002`) ainsi que le packager Metro (`8081`).
2. Depuis les logs du conteneur, scannez le QR code avec Expo Go pour charger l'application sur votre mobile.

### Via Docker directement
1. Construisez l'image :
   ```bash
   docker build -t mobile-game .
   ```
2. Lancez le conteneur en exposant les ports Expo :
   ```bash
   docker run --rm -it \
     -p 19000:19000 -p 19001:19001 -p 19002:19002 -p 8081:8081 \
     -e EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0 \
     -e REACT_NATIVE_PACKAGER_HOSTNAME=0.0.0.0 \
     mobile-game
   ```
3. Depuis le terminal de `docker run`, Expo affichera un QR code. Scannez-le avec Expo Go pour charger l'application sur votre mobile.

## Contrôles du jeu
- Touchez la case verte pour gagner 10 points multipliés par votre combo actuel.
- Chaque coup réussi augmente légèrement le multiplicateur jusqu'à un maximum de x5.
- Si vous ratez, le multiplicateur retombe à x1.
- Le bouton **Rejouer** réinitialise le score et le timer (60 secondes).

## Développement web
Vous pouvez également tester le jeu dans le navigateur :
```bash
npm run web
```
Expo démarre alors en mode web sur le port 19006 par défaut.

## Remarques
- Les assets (icône, splash, favicon) sont générés à partir de chaînes Base64 pour éviter de commiter des binaires. Remplacez-les par vos propres images en écrasant les fichiers dans `assets/` après l'exécution de `npm run generate:assets`.
- Si votre environnement réseau bloque l'installation des dépendances via `npm install`, réessayez depuis une machine ayant accès au registre npm ou configurez un miroir interne. L'image Docker force l'usage du registre public npmjs.org et supprime les proxys hérités pour éviter les erreurs 403 pendant le build.
