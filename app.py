import os
from datetime import datetime
from flask import Flask, jsonify, redirect, render_template, request, session, url_for
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func, inspect, text, JSON
from werkzeug.security import generate_password_hash, check_password_hash
from pendu_words import PENDU_WORDS


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
        ensure_role_column()
        ensure_locked_column()
        ensure_level_category_column()
        ensure_progress_data_column()
        ensure_bonus_points_column()
        bootstrap_levels()
        ensure_admin_account()

    register_routes(app)
    return app


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="participant")
    avatar = db.Column(db.String(40), default="alpha")
    bonus_points = db.Column(db.Integer, default=0)
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
    category = db.Column(db.String(20), default="mission")
    is_locked = db.Column(db.Boolean, default=False)
    progress = db.relationship("Progress", back_populates="level", cascade="all, delete")


class Progress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    score = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20), default="non_commence")
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    level_id = db.Column(db.Integer, db.ForeignKey("level.id"), nullable=False)
    data = db.Column(db.JSON, default={})
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship("User", back_populates="progress")
    level = db.relationship("Level", back_populates="progress")


class Questionnaire(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(120), nullable=False, default="Général")
    icon = db.Column(db.String(60), nullable=False, default="sparkles")
    created_by = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    questions = db.relationship("Question", back_populates="questionnaire", cascade="all, delete-orphan")


class QuestionnaireResult(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    score = db.Column(db.Integer, default=0)
    max_score = db.Column(db.Integer, default=0)
    attempts = db.Column(db.Integer, default=0)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    questionnaire_id = db.Column(db.Integer, db.ForeignKey("questionnaire.id"), nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Question(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(20), nullable=False, default="single")
    points = db.Column(db.Integer, nullable=False, default=1)
    questionnaire_id = db.Column(db.Integer, db.ForeignKey("questionnaire.id"), nullable=False)
    questionnaire = db.relationship("Questionnaire", back_populates="questions")
    options = db.relationship("AnswerOption", back_populates="question", cascade="all, delete-orphan")


class AnswerOption(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    label = db.Column(db.String(255), nullable=False)
    is_correct = db.Column(db.Boolean, default=False)
    question_id = db.Column(db.Integer, db.ForeignKey("question.id"), nullable=False)
    question = db.relationship("Question", back_populates="options")


LEVEL_SEED = [
    {
        "slug": "arret_cardiaque",
        "name": "Arrêt Cardiaque (PSE 2024)",
        "description": "Simulation interactive : Prise en charge d'un ACR adulte avec témoins.",
        "difficulty": "difficile",
        "icon": "pulse",
        "category": "mission",
    },
    {
        "slug": "pendu_300",
        "name": "Challenge Lexique 300",
        "description": "Devinez les 300 mots du secourisme. Un seul essai par mot !",
        "difficulty": "expert",
        "icon": "brain",
        "category": "minigame",
    },
    {
        "slug": "ambulance_chase",
        "name": "Course d'Ambulance",
        "description": "Collectez des pièces avec votre ambulance tout en évitant les dépanneuses !",
        "difficulty": "moyen",
        "icon": "joystick",
        "category": "minigame",
    },
]

AVATAR_CHOICES = {"alpha", "bravo", "charlie", "delta"}
AVATAR_EMOJIS = {
    "alpha": "🛰️",
    "bravo": "🚑",
    "charlie": "🛟",
    "delta": "🧭",
}
USER_ROLES = {"participant", "formateur", "admin"}


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


def ensure_progress_data_column():
    inspector = inspect(db.engine)
    column_names = {column["name"] for column in inspector.get_columns("progress")}
    if "data" in column_names:
        return

    dialect = db.engine.dialect.name
    if dialect == "sqlite":
        with db.engine.connect() as conn:
            conn.execute(text("ALTER TABLE progress ADD COLUMN data JSON"))
            conn.commit()
    else:
        # Postgres generic
        db.session.execute(text("ALTER TABLE progress ADD COLUMN data JSONB DEFAULT '{}'"))
        db.session.commit()


def ensure_role_column():
    inspector = inspect(db.engine)
    column_names = {column["name"] for column in inspector.get_columns("user")}
    if "role" in column_names:
        return

    dialect = db.engine.dialect.name
    if dialect == "sqlite":
        db.session.execute(text("ALTER TABLE user ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'participant'"))
    else:
        db.session.execute(
            text('ALTER TABLE "user" ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT \'participant\'')
        )
    db.session.commit()


def ensure_locked_column():
    inspector = inspect(db.engine)
    column_names = {column["name"] for column in inspector.get_columns("level")}
    if "is_locked" in column_names:
        return

    dialect = db.engine.dialect.name
    if dialect == "sqlite":
        db.session.execute(text("ALTER TABLE level ADD COLUMN is_locked BOOLEAN DEFAULT 0"))
    else:
        db.session.execute(
            text('ALTER TABLE "level" ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE')
        )
    db.session.commit()

def ensure_bonus_points_column():
    inspector = inspect(db.engine)
    columns = inspector.get_columns("user")
    column_names = [c["name"] for c in columns]
    if "bonus_points" in column_names:
        return

    dialect = db.engine.dialect.name
    if dialect == "sqlite":
        with db.engine.connect() as conn:
            conn.execute(text("ALTER TABLE user ADD COLUMN bonus_points INTEGER DEFAULT 0"))
            conn.commit()
    else:
        db.session.execute(text("ALTER TABLE user ADD COLUMN bonus_points INTEGER DEFAULT 0"))
        db.session.commit()


def ensure_level_category_column():
    inspector = inspect(db.engine)
    column_names = {column["name"] for column in inspector.get_columns("level")}
    if "category" in column_names:
        return

    dialect = db.engine.dialect.name
    if dialect == "sqlite":
        db.session.execute(text("ALTER TABLE level ADD COLUMN category VARCHAR(20) DEFAULT 'mission'"))
    else:
        db.session.execute(
            text('ALTER TABLE "level" ADD COLUMN IF NOT EXISTS category VARCHAR(20) DEFAULT \'mission\'')
        )
    db.session.commit()


def ensure_admin_account():
    admin_email = "admin@protec.local"
    admin_user = User.query.filter_by(email=admin_email).first()
    password_hash = generate_password_hash("admin")

    if admin_user:
        admin_user.password_hash = password_hash
        admin_user.role = "admin"
    else:
        admin_user = User(
            username="Admin", email=admin_email, password_hash=password_hash, avatar="alpha", role="admin"
        )
        db.session.add(admin_user)
    db.session.commit()


def bootstrap_levels():
    # Remove old levels that are not in SEED
    target_slugs = {l["slug"] for l in LEVEL_SEED}
    existing_levels = Level.query.all()
    for lvl in existing_levels:
        if lvl.slug not in target_slugs:
            db.session.delete(lvl)
            
    for level_data in LEVEL_SEED:
        existing = Level.query.filter_by(slug=level_data["slug"]).first()
        if not existing:
            db.session.add(Level(**level_data))
        else:
             # Create a copy to update safely
            data = dict(level_data)
            existing.name = data["name"]
            existing.description = data["description"]
            existing.difficulty = data["difficulty"]
            existing.difficulty = data["difficulty"]
            existing.icon = data["icon"]
            existing.category = data.get("category", "mission")
            
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
        "difficulty": level.difficulty,
        "icon": level.icon,
        "category": level.category,
        "is_locked": level.is_locked,
        "progress": progress,
    }


def serialize_user(user: User):
    if not user:
        return None
    return {
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "avatar": user.avatar,
    }


def serialize_user_admin(user: User):
    data = serialize_user(user)
    data.update({
        "id": user.id,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    })
    return data


def serialize_question(question: Question):
    return {
        "id": question.id,
        "text": question.text,
        "type": question.type,
        "points": question.points,
        "options": [
            {"id": opt.id, "label": opt.label, "is_correct": opt.is_correct}
            for opt in question.options
        ],
    }


def serialize_questionnaire(questionnaire: Questionnaire, include_questions: bool = True):
    data = {
        "id": questionnaire.id,
        "title": questionnaire.title,
        "description": questionnaire.description,
        "category": questionnaire.category,
        "icon": questionnaire.icon,
        "question_count": len(questionnaire.questions),
        "total_points": sum(question.points or 0 for question in questionnaire.questions),
        "created_at": questionnaire.created_at.isoformat() if questionnaire.created_at else None,
    }
    if include_questions:
        data["questions"] = [serialize_question(q) for q in questionnaire.questions]
    return data


def serialize_questionnaire_result(result: QuestionnaireResult):
    if not result:
        return None
    return {
        "score": result.score,
        "max_score": result.max_score,
        "attempts": result.attempts,
        "questionnaire_id": result.questionnaire_id,
        "updated_at": result.updated_at.isoformat() if result.updated_at else None,
    }


def current_user():
    user_id = session.get("user_id")
    if not user_id:
        return None
    return User.query.get(user_id)

def get_user_badges(points):
    badges = []
    if points >= 1000:
        badges.append({"icon": "🥇", "label": "Or", "threshold": 1000})
    elif points >= 500:
        badges.append({"icon": "🥈", "label": "Argent", "threshold": 500})
    elif points >= 200:
        badges.append({"icon": "🥉", "label": "Bronze", "threshold": 200})
    return badges


def register_routes(app: Flask) -> None:
    def build_dashboard_context(user: User):
        progress_map = {p.level_id: serialize_progress(p) for p in (user.progress if user else [])}
        levels = [serialize_level(level, progress_map.get(level.id)) for level in Level.query.all()]

        missions_completed = Progress.query.filter(Progress.status != "non_commence").count()
        total_rescuers = User.query.count()
        progress_scores = (
            db.session.query(
                Progress.user_id.label("user_id"),
                func.count(Progress.id).label("missions"),
                func.coalesce(func.sum(Progress.score), 0).label("mission_score"),
            )
            .group_by(Progress.user_id)
            .subquery()
        )

        questionnaire_scores = (
            db.session.query(
                QuestionnaireResult.user_id.label("user_id"),
                func.coalesce(func.sum(QuestionnaireResult.score), 0).label("quiz_score"),
            )
            .group_by(QuestionnaireResult.user_id)
            .subquery()
        )

        leaderboard_rows = (
            db.session.query(
                User.id,
                User.username,
                User.avatar,
                func.coalesce(progress_scores.c.missions, 0),
                func.coalesce(progress_scores.c.mission_score, 0),
                func.coalesce(questionnaire_scores.c.quiz_score, 0),
            )
            .outerjoin(progress_scores, User.id == progress_scores.c.user_id)
            .outerjoin(questionnaire_scores, User.id == questionnaire_scores.c.user_id)
            .order_by((func.coalesce(progress_scores.c.mission_score, 0) + func.coalesce(questionnaire_scores.c.quiz_score, 0)).desc())
            .all()
        )
        leaderboard = []
        for row in leaderboard_rows:
            # score is mission + quiz. We need to fetch bonus points separately or include it in the query.
            # Simplified approach: fetch user object or trust the query. 
            # The query above DOES NOT include bonus points. Let's fix the query or the loop.
            # Re-fetching user for simplicity as this is low traffic app.
            u = User.query.filter_by(username=row[1]).first()
            bonus = u.bonus_points if u else 0
            
            base_score = int((row[4] or 0) + (row[5] or 0))
            total_score = base_score + bonus
            
            leaderboard.append({
                "username": row[1],
                "avatar": row[2] or "alpha",
                "missions": row[3],
                "score": total_score,
                "badges": get_user_badges(total_score)
            })
        trophies = [
            {
                "icon": "🏅",
                "title": "Éclaireur",
                "description": "3 missions activées",
                "earned": missions_completed >= 3,
            },
            {
                "icon": "🚑",
                "title": "Chef d'équipe",
                "description": "Plus de 5 secouristes inscrits",
                "earned": total_rescuers >= 5,
            },
            {
                "icon": "🎯",
                "title": "Précision",
                "description": "Score cumulé supérieur à 200",
                "earned": sum((item[4] or 0) + (item[5] or 0) for item in leaderboard_rows) >= 200,
            },
        ]
        dashboard_stats = {
            "missions_completed": missions_completed,
            "total_rescuers": total_rescuers,
            "leaderboard": leaderboard,
            "trophies": trophies,
            "trophies_unlocked": sum(1 for trophy in trophies if trophy["earned"]),
        }
        return {"levels": levels, "user": user, "dashboard_stats": dashboard_stats}

    def ensure_admin_access():
        user = current_user()
        if not user:
            return user, (jsonify({"error": "Authentification requise"}), 401)
        if user.role != "admin":
            return user, (jsonify({"error": "Accès réservé à l'administrateur"}), 403)
        return user, None

    def ensure_designer_access():
        user = current_user()
        if not user:
            return user, (jsonify({"error": "Authentification requise"}), 401)
        if user.role not in {"admin", "formateur"}:
            return user, (jsonify({"error": "Accès réservé aux formateurs"}), 403)
        return user, None

    def render_shell(page: str):
        user = current_user()
        if not user:
            return redirect(url_for("auth"))
        context = build_dashboard_context(user)
        context["current_page"] = page
        context["avatar_emojis"] = AVATAR_EMOJIS
        if page == "admin" and user.role == "admin":
            context["users"] = User.query.order_by(User.created_at.desc()).all()
        return render_template("index.html", **context)

    @app.route("/")
    def home():
        return render_shell("home")

    @app.route("/missions")
    def missions_page():
        return render_shell("missions")

    @app.route("/mission/<slug>")
    def mission_detail(slug):
        user = current_user()
        if not user:
            return redirect(url_for("auth"))

        level = Level.query.filter_by(slug=slug).first_or_404()
        progress = Progress.query.filter_by(user_id=user.id, level_id=level.id).first()
        if not progress:
            progress = Progress(user_id=user.id, level_id=level.id, status="en_cours")
            db.session.add(progress)
            db.session.commit()
            
        # Calculate total score for the context
        progress_scores = sum(p.score for p in user.progress)
        
        questionnaire_scores = (
            db.session.query(func.coalesce(func.sum(QuestionnaireResult.score), 0))
            .filter(QuestionnaireResult.user_id == user.id)
            .scalar()
        ) or 0
        
        total_score = progress_scores + questionnaire_scores

        if level.slug == 'arret_cardiaque':
            return render_template("mission_interactive.html", level=level, progress=progress, avatar_emojis=AVATAR_EMOJIS)
        
        
        if level.slug == 'pendu_300':
            return render_template("mission_pendu.html", level=level, progress=progress, total_score=total_score)
        
        if level.slug == 'ambulance_chase':
            return render_template("mission_ambulance.html", level=level, progress=progress)
            
        return render_template("mission.html", level=level, progress=progress, avatar_emojis=AVATAR_EMOJIS)

    @app.route("/mini-game")
    def mini_game_page():
        return render_shell("mini-game")

    @app.route("/questionnaire")
    def questionnaire_page():
        return render_shell("questionnaire")

    @app.route("/admin")
    def admin_page():
        user = current_user()
        if not user:
            return redirect(url_for("auth"))
        if user.role != "admin":
            return redirect(url_for("home"))
        return render_shell("admin")

    @app.route("/auth")
    def auth():
        user = current_user()
        if user:
            return redirect(url_for("home"))
        return render_template("auth.html", avatar_emojis=AVATAR_EMOJIS)

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
        progress.score = max(progress.score or 0, score)
        db.session.commit()
        return jsonify(serialize_progress(progress))

    @app.route("/api/profile")
    def api_profile():
        user = current_user()
        if not user:
            return jsonify({"user": None})
        progress_list = [serialize_progress(p) for p in user.progress]
        questionnaire_results = QuestionnaireResult.query.filter_by(user_id=user.id).all()
        quiz_points = sum(result.score for result in questionnaire_results)
        mission_points = sum(p.score for p in user.progress if p.level.category == 'mission')
        minigame_points = sum(p.score for p in user.progress if p.level.category == 'minigame')
        bonus_points = user.bonus_points or 0
        total_points = quiz_points + mission_points + minigame_points + bonus_points
        
        return jsonify(
            {
                **serialize_user(user),
                "progress": progress_list,
                "questionnaire_results": [serialize_questionnaire_result(r) for r in questionnaire_results],
                "quiz_points": quiz_points,
                "mission_points": mission_points,
                "minigame_points": minigame_points,
                "bonus_points": bonus_points,
                "total_points": total_points,
                "badges": get_user_badges(total_points),
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

    @app.route("/api/profile", methods=["DELETE"])
    def api_profile_delete():
        user = current_user()
        if not user:
            return jsonify({"error": "Authentification requise"}), 401

        db.session.delete(user)
        db.session.commit()
        session.pop("user_id", None)
        return jsonify({"ok": True})

    @app.route("/api/ambulance/score", methods=["POST"])
    def api_ambulance_score():
        user = current_user()
        if not user:
            return jsonify({"error": "Authentification requise"}), 401
        
        payload = request.get_json()
        score = payload.get("score", 0)
        
        level = Level.query.filter_by(slug="ambulance_chase").first_or_404()
        progress = Progress.query.filter_by(user_id=user.id, level_id=level.id).first()
        
        if not progress:
            progress = Progress(user_id=user.id, level_id=level.id, status="en_cours")
            db.session.add(progress)
        
        # Update score if new score is higher
        if score > progress.score:
            progress.score = score
            progress.status = "termine"
        
        db.session.commit()
        
        return jsonify({
            "ok": True,
            "score": progress.score,
            "best_score": progress.score
        })

    @app.route("/api/admin/users", methods=["GET"])
    def api_admin_users():
        _, error = ensure_admin_access()
        if error:
            return error
        
        users = User.query.all()
        # Return list directly to match main.js expectation
        return jsonify([
            {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "bonus_points": u.bonus_points or 0
            }
            for u in users
        ])

    @app.route("/api/admin/users/<int:user_id>/bonus", methods=["POST"])
    def api_admin_update_bonus(user_id):
        _, error = ensure_admin_access()
        if error:
            return error
        
        data = request.json
        bonus = data.get("bonus", 0)
        
        target_user = User.query.get(user_id)
        if not target_user:
            return jsonify({"error": "User not found"}), 404
            
        target_user.bonus_points = bonus
        db.session.commit()
        
        return jsonify({"success": True, "bonus_points": target_user.bonus_points})

    @app.route("/api/admin/users/<int:user_id>", methods=["PUT"])
    def api_admin_update_user(user_id: int):
        admin_user, error = ensure_admin_access()
        if error:
            return error
        data = request.get_json() or {}
        role = (data.get("role") or "").lower()
        password = data.get("password")

        if not role and not password:
            return jsonify({"error": "Aucune modification fournie"}), 400

        if role and role not in USER_ROLES:
            return jsonify({"error": "Rôle invalide"}), 400

        user = User.query.get_or_404(user_id)
        if role:
            user.role = role
        if password:
            if len(password) < 8:
                return jsonify({"error": "Le mot de passe doit contenir au moins 8 caractères"}), 400
            user.password_hash = generate_password_hash(password)
        db.session.commit()
        return jsonify(serialize_user_admin(user))

    @app.route("/api/admin/users/<int:user_id>", methods=["DELETE"])
    def api_admin_delete_user(user_id: int):
        admin_user, error = ensure_admin_access()
        if error:
            return error

        user = User.query.get_or_404(user_id)
        if admin_user.id == user.id:
            return jsonify({"error": "Impossible de supprimer votre propre compte"}), 400

        db.session.delete(user)
        db.session.commit()
        return jsonify({"ok": True})

    @app.route("/api/admin/levels/<int:level_id>/toggle_lock", methods=["POST"])
    def api_admin_toggle_lock(level_id: int):
        admin_user, error = ensure_admin_access()
        if error:
            return error

        level = Level.query.get_or_404(level_id)
        level.is_locked = not level.is_locked
        db.session.commit()
        return jsonify(serialize_level(level))
        
    @app.route("/api/questionnaires", methods=["GET"])
    def api_questionnaires():
        user = current_user()
        if not user:
            return jsonify({"error": "Authentification requise"}), 401
        questionnaires = Questionnaire.query.order_by(Questionnaire.created_at.desc()).all()
        include_questions = user.role in {"admin", "formateur"}
        user_results = {}
        if user:
            results = QuestionnaireResult.query.filter_by(user_id=user.id).all()
            user_results = {res.questionnaire_id: serialize_questionnaire_result(res) for res in results}
        return jsonify({
            "questionnaires": [
                {**serialize_questionnaire(q, include_questions=include_questions), "user_result": user_results.get(q.id)}
                for q in questionnaires
            ]
        })

    @app.route("/api/questionnaires/<int:questionnaire_id>")
    def api_questionnaire_detail(questionnaire_id: int):
        user = current_user()
        if not user:
            return jsonify({"error": "Authentification requise"}), 401

        questionnaire = Questionnaire.query.get_or_404(questionnaire_id)
        existing = None
        if user:
            existing = QuestionnaireResult.query.filter_by(user_id=user.id, questionnaire_id=questionnaire.id).first()
        return jsonify(
            {**serialize_questionnaire(questionnaire, include_questions=True), "user_result": serialize_questionnaire_result(existing)}
        )

    @app.route("/api/questionnaires/<int:questionnaire_id>/result", methods=["POST"])
    def api_record_questionnaire_result(questionnaire_id: int):
        user = current_user()
        if not user:
            return jsonify({"error": "Authentification requise"}), 401

        questionnaire = Questionnaire.query.get_or_404(questionnaire_id)
        data = request.get_json() or {}
        score = max(0, int(data.get("score") or 0))
        max_score = max(0, int(data.get("max_score") or 0))

        result = QuestionnaireResult.query.filter_by(user_id=user.id, questionnaire_id=questionnaire.id).first()
        if not result:
            result = QuestionnaireResult(user_id=user.id, questionnaire_id=questionnaire.id)
            db.session.add(result)

        result.attempts = (result.attempts or 0) + 1
        result.score = max(result.score or 0, score)
        result.max_score = max(result.max_score or 0, max_score)
        db.session.commit()
        return jsonify(serialize_questionnaire_result(result))

    @app.route("/api/questionnaires/<int:questionnaire_id>", methods=["DELETE"])
    def api_delete_questionnaire(questionnaire_id: int):
        _, error = ensure_admin_access()
        if error:
            return error

        questionnaire = Questionnaire.query.get_or_404(questionnaire_id)
        db.session.delete(questionnaire)
        db.session.commit()
        return jsonify({"ok": True})

    @app.route("/api/questionnaires", methods=["POST"])
    def api_create_questionnaire():
        designer, error = ensure_designer_access()
        if error:
            return error

        data = request.get_json() or {}
        title = (data.get("title") or "").strip()
        category = (data.get("category") or "Général").strip() or "Général"
        icon = (data.get("icon") or "sparkles").strip() or "sparkles"
        description = (data.get("description") or "").strip()
        questions_data = data.get("questions") or []

        if not title:
            return jsonify({"error": "Un titre est requis"}), 400
        if not questions_data:
            return jsonify({"error": "Ajoutez au moins une question"}), 400

        questionnaire = Questionnaire(
            title=title,
            description=description,
            category=category,
            icon=icon,
            created_by=designer.id,
        )
        db.session.add(questionnaire)
        db.session.flush()

        for question_data in questions_data:
            text = (question_data.get("text") or "").strip()
            q_type = (question_data.get("type") or "single").strip()
            points = int(question_data.get("points") or 0)
            if not text:
                continue
            question = Question(text=text, type=q_type, points=max(points, 0), questionnaire=questionnaire)
            db.session.add(question)

            options = question_data.get("options") or []
            if q_type in {"single", "multiple"}:
                # For single-choice, only the first marked option is kept as correct
                seen_correct = False
                for opt in options:
                    label = (opt.get("label") or "").strip()
                    if not label:
                        continue
                    is_correct = bool(opt.get("is_correct")) and (q_type == "multiple" or not seen_correct)
                    if is_correct and q_type == "single":
                        seen_correct = True
                    db.session.add(AnswerOption(label=label, is_correct=is_correct, question=question))
            elif q_type == "text":
                text_option = next(
                    ((opt.get("label") or "").strip() for opt in options if (opt.get("label") or "").strip()),
                    None,
                )
                if text_option:
                    db.session.add(AnswerOption(label=text_option, is_correct=True, question=question))

        db.session.commit()
        return jsonify(serialize_questionnaire(questionnaire)), 201

    @app.route("/api/questionnaires/<int:questionnaire_id>", methods=["PUT"])
    def api_update_questionnaire(questionnaire_id: int):
        designer, error = ensure_designer_access()
        if error:
            return error

        questionnaire = Questionnaire.query.get_or_404(questionnaire_id)

        data = request.get_json() or {}
        title = (data.get("title") or "").strip()
        category = (data.get("category") or "Général").strip() or "Général"
        icon = (data.get("icon") or "sparkles").strip() or "sparkles"
        description = (data.get("description") or "").strip()
        questions_data = data.get("questions") or []

        if not title:
            return jsonify({"error": "Un titre est requis"}), 400
        if not questions_data:
            return jsonify({"error": "Ajoutez au moins une question"}), 400

        questionnaire.title = title
        questionnaire.description = description
        questionnaire.category = category
        questionnaire.icon = icon

        questionnaire.questions.clear()
        db.session.flush()

        for question_data in questions_data:
            text = (question_data.get("text") or "").strip()
            q_type = (question_data.get("type") or "single").strip()
            points = int(question_data.get("points") or 0)
            if not text:
                continue
            question = Question(text=text, type=q_type, points=max(points, 0), questionnaire=questionnaire)
            db.session.add(question)

            options = question_data.get("options") or []
            if q_type in {"single", "multiple"}:
                seen_correct = False
                for opt in options:
                    label = (opt.get("label") or "").strip()
                    if not label:
                        continue
                    is_correct = bool(opt.get("is_correct")) and (q_type == "multiple" or not seen_correct)
                    if is_correct and q_type == "single":
                        seen_correct = True
                    db.session.add(AnswerOption(label=label, is_correct=is_correct, question=question))
            elif q_type == "text":
                text_option = next(
                    ((opt.get("label") or "").strip() for opt in options if (opt.get("label") or "").strip()),
                    None,
                )
                if text_option:
                    db.session.add(AnswerOption(label=text_option, is_correct=True, question=question))

        db.session.commit()
        return jsonify(serialize_questionnaire(questionnaire))

    # --------------------------------------------------------------------------
    # PENDU APIs
    # --------------------------------------------------------------------------

    @app.route("/api/pendu/state")
    def api_pendu_state():
        user = current_user()
        if not user:
             return jsonify({"error": "Authentification requise"}), 401
        
        level = Level.query.filter_by(slug="pendu_300").first_or_404()
        progress = Progress.query.filter_by(user_id=user.id, level_id=level.id).first()
        
        if not progress:
            progress = Progress(user_id=user.id, level_id=level.id, data={"played_indices": [], "won": 0, "lost": 0}, status="en_cours")
            db.session.add(progress)
            db.session.commit()
            
        data = progress.data or {}
        if not isinstance(data, dict): data = {} 
        
        played = data.get("played_indices", [])
        won = data.get("won", 0)
        lost = data.get("lost", 0)
        
        total_words = 300
        played_count = len(played)
        
        # Sync score in case of drift
        correct_score = won * 10
        if progress.score != correct_score:
            progress.score = correct_score
            db.session.commit()
        
        return jsonify({
            "played_count": played_count,
            "won_count": won,
            "lost_count": lost,
            "total_words": total_words,
            "score": progress.score,
            "is_finished": played_count >= total_words
        })

    @app.route("/api/pendu/word")
    def api_pendu_word():
        import random
        user = current_user()
        if not user: return jsonify({"error": "Authentification requise"}), 401
        
        level = Level.query.filter_by(slug="pendu_300").first_or_404()
        progress = Progress.query.filter_by(user_id=user.id, level_id=level.id).first()
        
        data = progress.data or {}
        played_indices = set(data.get("played_indices", []))
        
        all_indices = set(range(len(PENDU_WORDS)))
        available = list(all_indices - played_indices)
        
        if not available:
            return jsonify({"finished": True})
            
        idx = random.choice(available)
        word = PENDU_WORDS[idx]
        
        return jsonify({
            "word": word,
            "index": idx,
            "length": len(word)
        })

    @app.route("/api/pendu/result", methods=["POST"])
    def api_pendu_result():
        user = current_user()
        if not user: return jsonify({"error": "Authentification requise"}), 401
        
        payload = request.get_json()
        word_index = payload.get("index")
        success = payload.get("success")
        
        if word_index is None or success is None:
            return jsonify({"error": "Invalid payload"}), 400
            
        level = Level.query.filter_by(slug="pendu_300").first_or_404()
        progress = Progress.query.filter_by(user_id=user.id, level_id=level.id).first()
        
        data = dict(progress.data or {})
        played = set(data.get("played_indices", []))
        
        if word_index in played:
            return jsonify({"error": "Already played"}), 400
            
        data.setdefault("played_indices", []).append(word_index)
        
        if success:
            data["won"] = data.get("won", 0) + 1
            progress.score += 10
        else:
            data["lost"] = data.get("lost", 0) + 1
            
        progress.data = data
        
        if len(data["played_indices"]) >= 300:
            progress.status = "termine"
            
        # Enforce score calculation rule: 10 pts per win
        progress.score = data["won"] * 10
        db.session.commit()
        
        return jsonify({
            "ok": True,
            "score": progress.score,
            "won": data["won"],
            "lost": data["lost"],
            "finished": len(data["played_indices"]) >= 300
        })




app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
