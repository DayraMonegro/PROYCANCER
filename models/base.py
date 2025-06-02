from sqlalchemy import create_engine
engine = create_engine('postgresql://postgres:2003@localhost:5432/cancer_db')