from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from sqlalchemy.orm import sessionmaker
from sqlalchemy import func
from models.model import Cancer, Usuario
from models.base import engine
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
import os
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev_key_fallback")
CORS(app)

# Create SQLAlchemy session
Session = sessionmaker(bind=engine)
db_session = Session()

# Setup Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'auth'

@login_manager.user_loader
def load_user(user_id):
    return db_session.query(Usuario).get(int(user_id))

# Routes
@app.route('/')
def home():
    return render_template('auth.html')

@app.route('/auth', methods=['GET', 'POST'])
def auth():
    if request.method == 'POST':
        action = request.form['action']
        username = request.form['username']
        password = request.form['password']
        if action == 'register':
            if db_session.query(Usuario).filter_by(username=username).first():
                flash('El usuario ya existe', 'danger')
            else:
                new_user = Usuario(
                    username=username,
                    password=generate_password_hash(password)
                )
                db_session.add(new_user)
                db_session.commit()
                flash('Usuario creado exitosamente', 'success')
                return redirect(url_for('auth'))
        elif action == 'login':
            user = db_session.query(Usuario).filter_by(username=username).first()
            if user and check_password_hash(user.password, password):
                login_user(user)
                flash('Sesión iniciada exitosamente', 'success')
                return redirect(url_for('dashboard'))
            else:
                flash('Usuario o contraseña incorrectos', 'danger')
                return redirect(url_for('auth'))
    return render_template('auth.html')

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html', username=current_user.username)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('auth'))

@app.route('/listcancers')
@login_required
def listcancers():
    return render_template('index.html')

#### Creacion y llamada ala BD
@app.route('/api/cancer-data')
@login_required
def api_cancer_data():
    try:
        logger.debug("Fetching cancer data")
        cancer_data = db_session.query(Cancer).limit(1000).all()
        datos = [{
            "id": dato.id,
            "patient_id": dato.patient_id,
            "age": dato.age,
            "gender": dato.gender,
            "country_region": dato.country_region,
            "year": dato.year,
            "genetic_risk": float(dato.genetic_risk) if dato.genetic_risk else None,
            "air_pollution": float(dato.air_pollution) if dato.air_pollution else None,
            "alcohol_use": float(dato.alcohol_use) if dato.alcohol_use else None,
            "smoking": float(dato.smoking) if dato.smoking else None,
            "obesity_level": float(dato.obesity_level) if dato.obesity_level else None,
            "cancer_type": dato.cancer_type,
            "cancer_stage": dato.cancer_stage,
            "treatment_cost_usd": float(dato.treatment_cost_usd) if dato.treatment_cost_usd else None,
            "survival_years": float(dato.survival_years) if dato.survival_years else None,
            "target_severity_score": float(dato.target_severity_score) if dato.target_severity_score else None
        } for dato in cancer_data]
        return jsonify(datos)
    except Exception as e:
        logger.error(f"Error fetching cancer data: {str(e)}")
        return jsonify({"error": str(e)}), 500

# API Routes for CRUD
@app.route('/api/list_cancer_records', methods=['GET'])
@login_required
def api_list_cancer_records():
    try:
        records = db_session.query(Cancer).all()
        data = [{
            "id": r.id,
            "age": r.age,
            "gender": r.gender,
            "country_region": r.country_region,
            "year": r.year,
            "genetic_risk": float(r.genetic_risk) if r.genetic_risk else None,
            "air_pollution": float(r.air_pollution) if r.air_pollution else None,
            "alcohol_use": float(r.alcohol_use) if r.alcohol_use else None,
            "smoking": float(r.smoking) if r.smoking else None,
            "obesity_level": float(r.obesity_level) if r.obesity_level else None,
            "cancer_type": r.cancer_type,
            "cancer_stage": r.cancer_stage,
            "treatment_cost_usd": float(r.treatment_cost_usd) if r.treatment_cost_usd else None,
            "survival_years": float(r.survival_years) if r.survival_years else None,
            "target_severity_score": float(r.target_severity_score) if r.target_severity_score else None
        } for r in records]
        logger.debug(f"Cancer records retrieved: {len(data)} records")
        return jsonify(data)
    except Exception as e:
        logger.error(f"Error retrieving cancer records: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/cancer_options', methods=['GET'])
@login_required
def obtener_cancer_options():
    try:
        cancer_types = db_session.query(Cancer.cancer_type).distinct().all()
        cancer_stages = db_session.query(Cancer.cancer_stage).distinct().all()
        country_regions = db_session.query(Cancer.country_region).distinct().all()
        years = db_session.query(Cancer.year).distinct().all()
        return jsonify({
            "cancer_types": sorted([c[0] for c in cancer_types if c[0]]),
            "cancer_stages": sorted([s[0] for s in cancer_stages if s[0]]),
            "country_regions": sorted([r[0] for r in country_regions if r[0]]),
            "years": sorted([y[0] for y in years if y[0]])
        })
    except Exception as e:
        logger.error(f"Error retrieving cancer options: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/add/cancer_record', methods=['POST'])
@login_required
def crear_cancer_record():
    try:
        data = request.json
        nuevo = Cancer(
            patient_id=data.get('patient_id'),
            age=int(data.get('age')) if data.get('age') else None,
            gender=data.get('gender'),
            country_region=data.get('country_region'),
            year=int(data.get('year')) if data.get('year') else None,
            genetic_risk=float(data.get('genetic_risk')) if data.get('genetic_risk') else None,
            air_pollution=float(data.get('air_pollution')) if data.get('air_pollution') else None,
            alcohol_use=float(data.get('alcohol_use')) if data.get('alcohol_use') else None,
            smoking=float(data.get('smoking')) if data.get('smoking') else None,
            obesity_level=float(data.get('obesity_level')) if data.get('obesity_level') else None,
            cancer_type=data.get('cancer_type'),
            cancer_stage=data.get('cancer_stage'),
            treatment_cost_usd=float(data.get('treatment_cost_usd')) if data.get('treatment_cost_usd') else None,
            survival_years=float(data.get('survival_years')) if data.get('survival_years') else None,
            target_severity_score=float(data.get('target_severity_score')) if data.get('target_severity_score') else None
        )
        db_session.add(nuevo)
        db_session.commit()
        return jsonify({"mensaje": "Registro de cáncer agregado correctamente"})
    except Exception as e:
        db_session.rollback()
        logger.error(f"Error creating cancer record: {str(e)}")
        return jsonify({"error": str(e)}), 400

@app.route('/del/cancer_record/<int:id>', methods=['DELETE'])
@login_required
def eliminar_cancer_record(id):
    try:
        record = db_session.query(Cancer).get(id)
        if record:
            db_session.delete(record)
            db_session.commit()
            return jsonify({"mensaje": "Registro de cáncer eliminado correctamente"})
        return jsonify({"error": "Registro no encontrado"}), 404
    except Exception as e:
        logger.error(f"Error deleting cancer record: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/upd/cancer_record/<int:id>', methods=['PUT'])
@login_required
def actualizar_cancer_record(id):
    try:
        data = request.json
        record = db_session.query(Cancer).get(id)
        if not record:
            return jsonify({"error": "Registro no encontrado"}), 404
        record.patient_id = data.get("patient_id")
        record.age = int(data.get("age")) if data.get("age") else None
        record.gender = data.get("gender")
        record.country_region = data.get("country_region")
        record.year = int(data.get("year")) if data.get("year") else None
        record.genetic_risk = float(data.get("genetic_risk")) if data.get("genetic_risk") else None
        record.air_pollution = float(data.get("air_pollution")) if data.get("air_pollution") else None
        record.alcohol_use = float(data.get("alcohol_use")) if data.get("alcohol_use") else None
        record.smoking = float(data.get("smoking")) if data.get("smoking") else None
        record.obesity_level = float(data.get("obesity_level")) if data.get("obesity_level") else None
        record.cancer_type = data.get("cancer_type")
        record.cancer_stage = data.get("cancer_stage")
        record.treatment_cost_usd = float(data.get("treatment_cost_usd")) if data.get("treatment_cost_usd") else None
        record.survival_years = float(data.get("survival_years")) if data.get("survival_years") else None
        record.target_severity_score = float(data.get("target_severity_score")) if data.get("target_severity_score") else None
        db_session.commit()
        return jsonify({"mensaje": "Registro de cáncer actualizado correctamente"})
    except Exception as e:
        db_session.rollback()
        logger.error(f"Error updating cancer record: {str(e)}")
        return jsonify({"error": str(e)}), 400

# API Routes for Dashboard Charts
@app.route('/api/cancer_by_type', methods=['GET'])
@login_required
def cancer_by_type():
    try:
        records = db_session.query(
            Cancer.cancer_type,
            func.count().label('total')
        ).group_by(Cancer.cancer_type).order_by(Cancer.cancer_type).all()
        data = [{"cancer_type": r.cancer_type or "N/A", "total": r.total} for r in records]
        if not data:
            logger.warning("No cancer type data found")
            return jsonify([])
        return jsonify(data)
    except Exception as e:
        logger.error(f"Error retrieving cancer by type: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/cancer_by_region', methods=['GET'])
@login_required
def cancer_by_region():
    try:
        records = db_session.query(
            Cancer.country_region,
            func.count().label('total')
        ).group_by(Cancer.country_region).order_by(Cancer.country_region).all()
        data = [{"country_region": r.country_region or "N/A", "total": r.total} for r in records]
        return jsonify(data)
    except Exception as e:
        logger.error(f"Error retrieving cancer by region: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/cancer_metrics', methods=['GET'])
@login_required
def cancer_metrics():
    try:
        total_records = db_session.query(Cancer).count()
        avg_treatment_cost = db_session.query(func.avg(Cancer.treatment_cost_usd)).scalar() or 0.0
        avg_survival_years = db_session.query(func.avg(Cancer.survival_years)).scalar() or 0.0
        most_common_cancer = db_session.query(
            Cancer.cancer_type,
            func.count().label('total')
        ).group_by(Cancer.cancer_type).order_by(func.count().desc()).first()
        
        return jsonify({
            "total_records": total_records,
            "avg_treatment_cost": float(avg_treatment_cost),
            "avg_survival_years": float(avg_survival_years),
            "most_common_cancer": most_common_cancer.cancer_type if most_common_cancer else "N/A",
            "most_common_cancer_count": most_common_cancer.total if most_common_cancer else 0
        })
    except Exception as e:
        logger.error(f"Error retrieving cancer metrics: {str(e)}")
        return jsonify({"error": str(e)}), 500

##app.run(debug=True)
    port = int(os.environ.get("PORT", 5000))  # Render asigna el puerto dinámicamente
    app.run(host='0.0.0.0', port=port)

    