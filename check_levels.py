from app import create_app, db, Level

app = create_app()

with app.app_context():
    levels = Level.query.all()
    print(f"Total levels: {len(levels)}")
    for l in levels:
        print(f"- {l.name} ({l.slug})")

    target = Level.query.filter_by(slug="arret_cardiaque").first()
    if target:
        print("\nSUCCESS: 'arret_cardiaque' found in DB.")
    else:
        print("\nFAILURE: 'arret_cardiaque' NOT found in DB.")
