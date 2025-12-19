from app import app, db, Level

def probe():
    with app.app_context():
        # 1. Check Database Level
        level = Level.query.filter_by(slug='arret_cardiaque').first()
        if not level:
            print("ERROR: Level 'arret_cardiaque' NOT FOUND in DB.")
        else:
            print(f"Level: {level.name}")
            print(f"Slug: {level.slug}")
            print(f"Category: {level.category}")
            print(f"Has Scenario Data: {bool(level.data and 'scenario' in level.data)}")
            
            # Check render logic simulation
            if level.slug == 'quiz_dps' or level.category == 'minigame':
                print("ROUTING: Would render 'mission_quiz_dps.html'")
            elif level.slug == 'arret_cardiaque':
                print("ROUTING: Would render 'mission_interactive.html'")
            else:
                print("ROUTING: Fallback routing")

        # 2. Simulate API Call (using test client)
        print("\n--- API RESPONSE PROBE ---")
        with app.test_client() as client:
            # Login first (mock user)
            # Actually, let's just create a dummy admin user or use existing
            from app import User
            admin = User.query.filter_by(username='Admin').first()
            if not admin:
                # Create temp admin
                admin = User(username='ProbeAdmin', email='probe@test.com', password_hash='x', avatar='x')
                db.session.add(admin)
                db.session.commit()
            
            with client.session_transaction() as sess:
                sess['user_id'] = admin.id
                
            res = client.post('/api/mission/start/arret_cardiaque')
            print(f"Status: {res.status_code}")
            if res.status_code == 200:
                print("JSON Data keys:", res.json.keys())
                print("Step ID:", res.json.get('step_id'))
                print("Text Sample:", res.json.get('text', '')[:50])
            else:
                print("Error Response:", res.data.decode())

if __name__ == '__main__':
    probe()
