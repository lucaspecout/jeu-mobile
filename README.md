# Protec Rescue 38 — Edition Flask

Refonte du prototype en véritable application serveur : Flask + base SQL, menus façon jeu et interface néon animée.

## Lancer en local
1. Créez un environnement virtuel et installez les dépendances :
   ```bash
   pip install -r requirements.txt
   ```
2. Démarrez le serveur :
   ```bash
   flask --app app run --host 0.0.0.0 --port 8000
   ```
3. Ouvrez `http://localhost:8000` et créez un compte. Les données sont persistées via SQLite par défaut (ou via `DATABASE_URL`).

## Docker
1. Construisez l'image :
   ```bash
   docker build -t protec-rescue-flask .
   ```
2. Lancez-la :
   ```bash
   docker run -p 8033:8000 protec-rescue-flask
   ```
3. Accédez à `http://localhost:8033`.

### Avec Docker Compose + Postgres
```bash
docker compose up --build
```
- L'application écoute sur `http://localhost:8033`.
- La variable `DATABASE_URL` est injectée (format `postgres://` accepté et converti automatiquement).

## Fonctionnalités
- Authentification / inscription côté serveur avec hash des mots de passe.
- Menus de mission dynamiques, difficultés et progression en base.
- Animations GSAP (scanner, lignes de flux) et interface futuriste.
- API JSON pour le menu, le profil et la progression.
