from database.database import Base, engine
from database import models


print("Creating PostgreSQL tables...")

Base.metadata.create_all(bind=engine)

print("PostgreSQL tables created successfully!")