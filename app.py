import os
from datetime import datetime
from flask import Flask, jsonify, redirect, render_template, request, session, url_for
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import inspect, text
from werkzeug.security import generate_password_hash, check_password_hash


db = SQLAlchemy()


def create_app():
    app = Flask(__name__)
    app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-key")

    database_url = os.environ.get("DATABASE_URL")
    if database_url and database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql+psycopg2://", 1)

    app.config["SQLALCHEMY_DATABASE_URI"] = database_url or "sqlite:///protec_rescue.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)

    with app.app_context():
        db.create_all()
        ensure_avatar_column()
        bootstrap_levels()

    register_routes(app)
    return app


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    avatar = db.Column(db.String(40), default="alpha")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    progress = db.relationship("Progress", back_populates="user", cascade="all, delete")

    def verify_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)


class Level(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    slug = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=False)
    difficulty = db.Column(db.String(40), nullable=False)
    icon = db.Column(db.String(40), nullable=False)
    progress = db.relationship("Progress", back_populates="level", cascade="all, delete")


class Progress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    score = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20), default="non_commence")
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    level_id = db.Column(db.Integer, db.ForeignKey("level.id"), nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship("User", back_populates="progress")
    level = db.relationship("Level", back_populates="progress")


LEVEL_SEED = [
    {
        "slug": "initiation",
        "name": "Initiation vitale",
        "description": "Stabilisez les bases : protection du site, sécurité et premiers bilans.",
        "difficulty": "facile",
        "icon": "shield",
    },
    {
        "slug": "urgence",
        "name": "Urgences dynamiques",
        "description": "Coordonnez l'équipe, sécurisez la victime et basculez en mode alerte.",
        "difficulty": "moyen",
        "icon": "pulse",
    },
    {
        "slug": "mission",
        "name": "Mission avancée",
        "description": "Cas complexe : plusieurs victimes, besoin d'appels prioritaires et gestes adaptés.",
        "difficulty": "difficile",
        "icon": "target",
    },
]

AVATAR_CHOICES = {"alpha", "bravo", "charlie", "delta"}


def ensure_avatar_column():
    inspector = inspect(db.engine)
    column_names = {column["name"] for column in inspector.get_columns("user")}
    if "avatar" in column_names:
        return

    dialect = db.engine.dialect.name
    if dialect == "sqlite":
        db.session.execute(text("ALTER TABLE user ADD COLUMN avatar VARCHAR(40) DEFAULT 'alpha'"))
    else:
        db.session.execute(
            text('ALTER TABLE "user" ADD COLUMN IF NOT EXISTS avatar VARCHAR(40) DEFAULT \'alpha\'')
        )
    db.session.commit()


def bootstrap_levels():
    for level_data in LEVEL_SEED:
        if not Level.query.filter_by(slug=level_data["slug"]).first():
            db.session.add(Level(**level_data))
    db.session.commit()


def serialize_progress(progress: Progress):
    return {
        "level": progress.level.slug,
        "status": progress.status,
        "score": progress.score,
        "updated_at": progress.updated_at.isoformat() if progress.updated_at else None,
    }


def serialize_level(level: Level, progress=None):
    return {
        "id": level.id,
        "slug": level.slug,
        "name": level.name,
        "description": level.description,
        "difficulty": level.difficulty,
        "icon": level.icon,
        "progress": progress,
    }


def serialize_user(user: User):
    if not user:
        return None
    return {
        "username": user.username,
        "email": user.email,
        "avatar": user.avatar,
    }


def current_user():
    user_id = session.get("user_id")
    if not user_id:
        return None
    return User.query.get(user_id)


def register_routes(app: Flask) -> None:
    @app.route("/")
    def home():
        user = current_user()
        if not user:
            return redirect(url_for("auth"))
        progress_map = {p.level_id: serialize_progress(p) for p in (user.progress if user else [])}
        levels = [serialize_level(level, progress_map.get(level.id)) for level in Level.query.all()]
        return render_template("index.html", levels=levels, user=user)

    @app.route("/auth")
    def auth():
        user = current_user()
        if user:
            return redirect(url_for("home"))
        return render_template("auth.html")

    @app.route("/api/register", methods=["POST"])
    def api_register():
        data = request.get_json() or {}
        email = (data.get("email") or "").lower()
        avatar = data.get("avatar") or "alpha"
        if avatar not in AVATAR_CHOICES:
            avatar = "alpha"

        if not email or not data.get("password") or not data.get("username"):
            return jsonify({"error": "Champs manquants"}), 400
        if User.query.filter_by(email=email).first():
            return jsonify({"error": "Un compte existe déjà avec cet e-mail"}), 400

        hashed = generate_password_hash(data["password"])
        user = User(
            username=data["username"].strip(),
            email=email,
            password_hash=hashed,
            avatar=avatar,
        )
        db.session.add(user)
        db.session.commit()
        session["user_id"] = user.id
        return jsonify({"id": user.id, "username": user.username, "avatar": user.avatar})

    @app.route("/api/login", methods=["POST"])
    def api_login():
        data = request.get_json() or {}
        email = (data.get("email") or "").lower()
        password = data.get("password")
        user = User.query.filter_by(email=email).first()
        if not user or not user.verify_password(password or ""):
            return jsonify({"error": "Identifiants invalides"}), 401
        session["user_id"] = user.id
        return jsonify({"id": user.id, "username": user.username, "avatar": user.avatar})

    @app.route("/api/logout", methods=["POST"])
    def api_logout():
        session.pop("user_id", None)
        return jsonify({"ok": True})

    @app.route("/api/menu")
    def api_menu():
        user = current_user()
        if not user:
            return jsonify({"error": "Authentification requise"}), 401
        progress_map = {p.level_id: serialize_progress(p) for p in (user.progress if user else [])}
        levels = [serialize_level(level, progress_map.get(level.id)) for level in Level.query.all()]
        return jsonify({"levels": levels, "user": serialize_user(user)})

    @app.route("/api/progress/<int:level_id>", methods=["POST"])
    def api_progress(level_id: int):
        user = current_user()
        if not user:
            return jsonify({"error": "Authentification requise"}), 401
        level = Level.query.get_or_404(level_id)
        data = request.get_json() or {}
        status = data.get("status") or "en_cours"
        score = int(data.get("score") or 0)

        progress = Progress.query.filter_by(user_id=user.id, level_id=level.id).first()
        if not progress:
            progress = Progress(user=user, level=level)
            db.session.add(progress)

        progress.status = status
        progress.score = max(progress.score, score)
        db.session.commit()
        return jsonify(serialize_progress(progress))

    @app.route("/api/profile")
    def api_profile():
        user = current_user()
        if not user:
            return jsonify({"user": None})
        return jsonify(
            {
                **serialize_user(user),
                "progress": [serialize_progress(p) for p in user.progress],
            }
        )

    @app.route("/api/profile", methods=["PUT", "POST"])
    def api_profile_update():
        user = current_user()
        if not user:
            return jsonify({"error": "Authentification requise"}), 401

        data = request.get_json() or {}
        email = (data.get("email") or user.email).lower()
        username = data.get("username") or user.username
        avatar = data.get("avatar") or user.avatar
        password = data.get("password")

        if avatar not in AVATAR_CHOICES:
            avatar = user.avatar

        email_owner = User.query.filter_by(email=email).first()
        if email_owner and email_owner.id != user.id:
            return jsonify({"error": "Cet e-mail est déjà utilisé"}), 400

        user.email = email
        user.username = username.strip()
        user.avatar = avatar
        if password:
            user.password_hash = generate_password_hash(password)

        db.session.commit()
        return jsonify(serialize_user(user))


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
