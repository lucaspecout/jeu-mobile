from app import app, db, Level

def fix_category():
    with app.app_context():
        # Fix arret_cardiaque
        level = Level.query.filter_by(slug='arret_cardiaque').first()
        if level:
            print(f"Updating {level.slug} category from '{level.category}' to 'mission'")
            level.category = 'mission'
            db.session.commit()
            print("Done.")
        else:
            print("Level not found.")

if __name__ == '__main__':
    fix_category()
