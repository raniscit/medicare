from app.database import SessionLocal, engine, Base
from app.services.demo_data_service import seed_demo_data

def run_seed():
    print("Initializing MediCare AI database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        print("Seeding synthetic demo medical data...")
        user = seed_demo_data(db)
        print(f"Successfully seeded demo data for: {user.email}")
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()

