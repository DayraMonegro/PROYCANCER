import pandas as pd
from sqlalchemy import create_engine
import os
import sys
# Agrega el path al directorio raíz del proyecto
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from models.model import Base, CancerRecord
from sqlalchemy.orm import sessionmaker

# Configura tu conexión
DATABASE_URL = "postgresql://postgres:2003@localhost:5432/cancer_db"  # ← cámbialo

# Crear engine y sesión
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()

# Crear tablas si no existen
Base.metadata.create_all(engine)

# Leer el CSV con pandas
CSV_URL = "https://raw.githubusercontent.com/rudyluis/DashboardJS/refs/heads/main/global_cancer.csv"
df = pd.read_csv(CSV_URL)

# Limpieza / transformación si es necesario
df['Year'] = pd.to_numeric(df['Year'], errors='coerce')

# Convertir DataFrame en lista de objetos VideoGameSale
records = [
    CancerRecord(
        patient_id=row['Patient_ID'],
        age=int(row['Age']),
        gender=row['Gender'],
        country_region=row['Country_Region'],
        year=int(row['Year']),
        genetic_risk=row['Genetic_Risk'],
        air_pollution=row['Air_Pollution'],
        alcohol_use=row['Alcohol_Use'],
        smoking=row['Smoking'],
        obesity_level=row['Obesity_Level'],
        cancer_type=row['Cancer_Type'],
        cancer_stage=row['Cancer_Stage'],
        treatment_cost_usd=row['Treatment_Cost_USD'],
        survival_years=row['Survival_Years'],
        target_severity_score=row['Target_Severity_Score']
    )
    for _, row in df.iterrows()
]

# Insertar en la base de datos
session.bulk_save_objects(records)
session.commit()
print("✅ Migración de datos completada")
session.close()
