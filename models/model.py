from sqlalchemy import Column, Integer, String, ForeignKey, Date, Numeric, Text, Sequence, DateTime, SmallInteger,func, Float

from sqlalchemy.orm import relationship, declarative_base
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
Base= declarative_base()




class Cancer(Base):
    __tablename__ = 'cancer_data'

    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(String(20), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(10), nullable=False)
    country_region = Column(String(50), nullable=False)
    year = Column(Integer, nullable=False)
    genetic_risk = Column(Float)
    air_pollution = Column(Float)
    alcohol_use = Column(Float)
    smoking = Column(Float)
    obesity_level = Column(Float)
    cancer_type = Column(String(50))
    cancer_stage = Column(String(20))
    treatment_cost_usd = Column(Float)
    survival_years = Column(Float)
    target_severity_score = Column(Float)

    def __repr__(self):
        return f"<CancerRecord(patient_id='{self.patient_id}', cancer_type='{self.cancer_type}', stage='{self.cancer_stage}')>"

from flask_login import UserMixin

class Usuario(Base, UserMixin):
    __tablename__ = 'usuarios'

    id = Column(Integer, primary_key=True)
    username = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)
