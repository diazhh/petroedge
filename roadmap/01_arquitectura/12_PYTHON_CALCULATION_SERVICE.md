# PYTHON CALCULATION SERVICE - Cálculos Complejos y Machine Learning

## 📋 Resumen Ejecutivo

Servicio Python dedicado para cálculos petroleros complejos, simulaciones de yacimientos y Machine Learning. Diseñado para escalar horizontalmente y manejar operaciones CPU-intensive que el Node.js Worker no puede procesar eficientemente.

---

## 🎯 Objetivos

1. **Cálculos Petroleros**: IPR, VLP, MSE, VFP, Nodal Analysis, Decline Curves, Material Balance
2. **Machine Learning**: Predicción, detección de anomalías, optimización
3. **Simulaciones**: Yacimientos, flujo multifásico, optimización de producción
4. **Escalabilidad**: Horizontal con Kubernetes, autoscaling basado en carga
5. **Baja Latencia**: gRPC para cálculos síncronos (<100ms)
6. **Alto Throughput**: Kafka para batch processing (5-20K cálculos/s)

---

## 🏗️ Arquitectura del Servicio

```
┌─────────────────────────────────────────────────────────────────────┐
│              PYTHON CALCULATION SERVICE                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                    API LAYER                                │    │
│  ├────────────────────────────────────────────────────────────┤    │
│  │  • FastAPI (REST API - HTTP/2)                             │    │
│  │  • gRPC Server (low-latency sync calls)                    │    │
│  │  • Health checks, metrics, OpenAPI docs                    │    │
│  └────────────────────────────────────────────────────────────┘    │
│                              ↓                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                 CALCULATION ENGINE                          │    │
│  ├────────────────────────────────────────────────────────────┤    │
│  │  Petroleum Module:                                          │    │
│  │  • IPR Calculator (Vogel, Fetkovich, Darcy)                │    │
│  │  • VLP Calculator (Beggs&Brill, Hagedorn&Brown)            │    │
│  │  • Nodal Analysis Engine                                   │    │
│  │  • Decline Curve Analysis (Arps, Hyperbolic)               │    │
│  │  • Material Balance Calculator                             │    │
│  │  • PVT Correlations (Standing, Glaso, etc.)                │    │
│  │                                                             │    │
│  │  ML Module:                                                 │    │
│  │  • Production Forecasting (LSTM, Prophet, XGBoost)         │    │
│  │  • Anomaly Detection (Isolation Forest, Autoencoders)      │    │
│  │  • Event Classification (Random Forest, SVM)               │    │
│  │  • Parameter Optimization (Bayesian Opt, PSO)              │    │
│  │                                                             │    │
│  │  Simulation Module:                                         │    │
│  │  • Reservoir Simulation (Black Oil, Compositional)         │    │
│  │  • Multiphase Flow Simulation                              │    │
│  │  • Well Performance Simulation                             │    │
│  └────────────────────────────────────────────────────────────┘    │
│                              ↓                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                  MESSAGING LAYER                            │    │
│  ├────────────────────────────────────────────────────────────┤    │
│  │  • aiokafka Consumer (calculation.request)                 │    │
│  │  • aiokafka Producer (calculation.result)                  │    │
│  │  • Dead Letter Queue (calculation.error)                   │    │
│  │  • Batch processing with asyncio                           │    │
│  └────────────────────────────────────────────────────────────┘    │
│                              ↓                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                   TASK QUEUE                                │    │
│  ├────────────────────────────────────────────────────────────┤    │
│  │  • Celery Workers (long-running tasks)                     │    │
│  │  • ML Training Pipeline                                    │    │
│  │  • Batch Simulations                                       │    │
│  │  • Report Generation                                       │    │
│  └────────────────────────────────────────────────────────────┘    │
│                              ↓                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                   STORAGE LAYER                             │    │
│  ├────────────────────────────────────────────────────────────┤    │
│  │  • Redis (model cache, results cache)                      │    │
│  │  • MLflow (model registry, experiment tracking)            │    │
│  │  • PostgreSQL (calculation history, metadata)              │    │
│  │  • S3/MinIO (large datasets, trained models)               │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Stack Tecnológico Completo

### Core Framework
```python
{
  "runtime": "Python 3.11+",
  "package_manager": "Poetry 1.7+ / pip-tools",
  "api_framework": "FastAPI 0.109+",
  "grpc": "grpcio 1.60+, grpcio-tools 1.60+",
  "async": "asyncio, uvloop 0.19+",
  "server": "uvicorn 0.27+ (ASGI server)"
}
```

### Messaging & Tasks
```python
{
  "kafka": "aiokafka 0.10+",
  "task_queue": "Celery 5.3+",
  "broker": "Redis 5.0+ (Celery broker)",
  "result_backend": "Redis 5.0+"
}
```

### Numerical Computing
```python
{
  "arrays": "NumPy 1.26+",
  "scientific": "SciPy 1.12+",
  "dataframes": "Pandas 2.2+",
  "optimization": "scipy.optimize, GEKKO 1.0+",
  "symbolic": "SymPy 1.12+ (optional)",
  "units": "pint 0.23+ (unit conversions)"
}
```

### Machine Learning
```python
{
  "classical_ml": "scikit-learn 1.4+",
  "deep_learning": "TensorFlow 2.15+ / PyTorch 2.2+",
  "forecasting": "Prophet 1.1+, statsmodels 0.14+",
  "gradient_boosting": "XGBoost 2.0+, LightGBM 4.3+",
  "hyperparameter_tuning": "Optuna 3.5+",
  "model_registry": "MLflow 2.10+",
  "feature_engineering": "feature-engine 1.6+"
}
```

### Petroleum Engineering
```python
{
  "pvt": "Custom library (Standing, Glaso, Vazquez-Beggs correlations)",
  "reservoir": "Custom library (material balance, decline curves)",
  "production": "Custom library (IPR, VLP, nodal analysis)",
  "drilling": "Custom library (MSE, T&D, hydraulics)",
  "multiphase_flow": "Custom library (Beggs&Brill, Hagedorn&Brown)",
  "well_testing": "Custom library (pressure transient analysis)"
}
```

### Data Validation & Serialization
```python
{
  "validation": "Pydantic 2.6+",
  "serialization": "msgpack 1.0+, orjson 3.9+",
  "protobuf": "protobuf 4.25+"
}
```

### Caching & Storage
```python
{
  "redis": "redis-py 5.0+",
  "postgres": "asyncpg 0.29+ (async PostgreSQL)",
  "s3": "boto3 1.34+ (AWS S3) / minio 7.2+ (MinIO)"
}
```

### Logging & Monitoring
```python
{
  "logging": "structlog 24.1+",
  "metrics": "prometheus-client 0.20+",
  "tracing": "opentelemetry-api 1.22+ (optional)",
  "profiling": "py-spy 0.3+ (production profiling)"
}
```

### Testing
```python
{
  "framework": "pytest 8.0+",
  "async": "pytest-asyncio 0.23+",
  "coverage": "pytest-cov 4.1+",
  "mocking": "pytest-mock 3.12+",
  "benchmarking": "pytest-benchmark 4.0+"
}
```

---

## 📁 Estructura del Proyecto

```
src/calculation-service/
├── pyproject.toml                    # Poetry dependencies
├── Dockerfile                        # Multi-stage build
├── docker-compose.yml                # Local development
├── .env.example
├── README.md
│
├── app/
│   ├── __init__.py
│   ├── main.py                       # FastAPI app entry point
│   ├── grpc_server.py                # gRPC server entry point
│   ├── config.py                     # Configuration (Pydantic Settings)
│   │
│   ├── api/                          # REST API endpoints
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── petroleum.py          # /api/v1/petroleum/*
│   │   │   ├── ml.py                 # /api/v1/ml/*
│   │   │   ├── simulation.py         # /api/v1/simulation/*
│   │   │   └── health.py             # /api/v1/health
│   │   └── dependencies.py           # FastAPI dependencies
│   │
│   ├── grpc/                         # gRPC services
│   │   ├── __init__.py
│   │   ├── protos/
│   │   │   ├── calculation.proto
│   │   │   ├── ml.proto
│   │   │   └── simulation.proto
│   │   ├── generated/                # Generated protobuf code
│   │   └── services/
│   │       ├── calculation_service.py
│   │       ├── ml_service.py
│   │       └── simulation_service.py
│   │
│   ├── kafka/                        # Kafka consumers/producers
│   │   ├── __init__.py
│   │   ├── consumer.py               # Main consumer
│   │   ├── producer.py               # Results producer
│   │   └── handlers/
│   │       ├── petroleum_handler.py
│   │       ├── ml_handler.py
│   │       └── simulation_handler.py
│   │
│   ├── celery_app/                   # Celery tasks
│   │   ├── __init__.py
│   │   ├── celery.py                 # Celery app config
│   │   └── tasks/
│   │       ├── ml_training.py
│   │       ├── batch_simulation.py
│   │       └── report_generation.py
│   │
│   ├── petroleum/                    # Petroleum engineering calculations
│   │   ├── __init__.py
│   │   ├── ipr/
│   │   │   ├── __init__.py
│   │   │   ├── vogel.py
│   │   │   ├── fetkovich.py
│   │   │   └── darcy.py
│   │   ├── vlp/
│   │   │   ├── __init__.py
│   │   │   ├── beggs_brill.py
│   │   │   ├── hagedorn_brown.py
│   │   │   └── duns_ros.py
│   │   ├── nodal/
│   │   │   ├── __init__.py
│   │   │   └── analysis.py
│   │   ├── decline/
│   │   │   ├── __init__.py
│   │   │   ├── arps.py
│   │   │   └── hyperbolic.py
│   │   ├── pvt/
│   │   │   ├── __init__.py
│   │   │   ├── standing.py
│   │   │   ├── glaso.py
│   │   │   └── vazquez_beggs.py
│   │   └── material_balance/
│   │       ├── __init__.py
│   │       └── calculator.py
│   │
│   ├── ml/                           # Machine Learning models
│   │   ├── __init__.py
│   │   ├── forecasting/
│   │   │   ├── __init__.py
│   │   │   ├── lstm_model.py
│   │   │   ├── prophet_model.py
│   │   │   └── xgboost_model.py
│   │   ├── anomaly/
│   │   │   ├── __init__.py
│   │   │   ├── isolation_forest.py
│   │   │   └── autoencoder.py
│   │   ├── classification/
│   │   │   ├── __init__.py
│   │   │   └── event_classifier.py
│   │   ├── optimization/
│   │   │   ├── __init__.py
│   │   │   └── bayesian_optimizer.py
│   │   └── registry/
│   │       ├── __init__.py
│   │       └── mlflow_client.py
│   │
│   ├── simulation/                   # Reservoir & well simulations
│   │   ├── __init__.py
│   │   ├── reservoir/
│   │   │   ├── __init__.py
│   │   │   ├── black_oil.py
│   │   │   └── compositional.py
│   │   └── well/
│   │       ├── __init__.py
│   │       └── performance.py
│   │
│   ├── cache/                        # Caching layer
│   │   ├── __init__.py
│   │   ├── redis_client.py
│   │   └── decorators.py             # @cache decorator
│   │
│   ├── models/                       # Pydantic models
│   │   ├── __init__.py
│   │   ├── petroleum.py
│   │   ├── ml.py
│   │   └── simulation.py
│   │
│   ├── schemas/                      # Request/Response schemas
│   │   ├── __init__.py
│   │   ├── petroleum.py
│   │   ├── ml.py
│   │   └── simulation.py
│   │
│   └── utils/                        # Utilities
│       ├── __init__.py
│       ├── logger.py
│       ├── metrics.py
│       └── validators.py
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── unit/
│   │   ├── test_petroleum.py
│   │   ├── test_ml.py
│   │   └── test_simulation.py
│   ├── integration/
│   │   ├── test_api.py
│   │   ├── test_grpc.py
│   │   └── test_kafka.py
│   └── benchmarks/
│       └── test_performance.py
│
├── scripts/
│   ├── generate_protos.sh            # Generate gRPC code
│   ├── train_models.py               # Train ML models
│   └── migrate_data.py
│
└── k8s/                              # Kubernetes manifests
    ├── deployment.yaml
    ├── service.yaml
    ├── hpa.yaml                      # Horizontal Pod Autoscaler
    └── configmap.yaml
```

---

## 🔌 APIs y Endpoints

### REST API (FastAPI)

#### Petroleum Calculations
```python
POST /api/v1/petroleum/ipr/calculate
POST /api/v1/petroleum/vlp/calculate
POST /api/v1/petroleum/nodal/analyze
POST /api/v1/petroleum/decline/forecast
POST /api/v1/petroleum/material-balance/calculate
POST /api/v1/petroleum/pvt/properties
```

#### Machine Learning
```python
POST /api/v1/ml/forecast/production
POST /api/v1/ml/anomaly/detect
POST /api/v1/ml/classify/event
POST /api/v1/ml/optimize/parameters
GET  /api/v1/ml/models                # List available models
POST /api/v1/ml/models/train          # Trigger training (async)
```

#### Simulation
```python
POST /api/v1/simulation/reservoir/run
POST /api/v1/simulation/well/performance
GET  /api/v1/simulation/jobs/{job_id}  # Check simulation status
```

#### Health & Metrics
```python
GET /api/v1/health
GET /api/v1/metrics                    # Prometheus metrics
GET /api/v1/docs                       # OpenAPI/Swagger docs
```

### gRPC Services

```protobuf
service CalculationService {
  rpc CalculateIPR(IPRRequest) returns (IPRResponse);
  rpc CalculateVLP(VLPRequest) returns (VLPResponse);
  rpc CalculateNodalAnalysis(NodalRequest) returns (NodalResponse);
  rpc ForecastProduction(ForecastRequest) returns (ForecastResponse);
  rpc DetectAnomaly(AnomalyRequest) returns (AnomalyResponse);
}
```

---

## 📊 Kafka Integration

### Input Topics (Consumed)
```yaml
calculation.request:
  format: JSON/Protobuf
  schema:
    type: string  # "ipr", "vlp", "nodal", "ml_forecast", etc.
    well_id: string
    parameters: object
    priority: string  # "high", "normal", "low"
    
ml.training.request:
  format: JSON
  schema:
    model_type: string
    dataset_id: string
    hyperparameters: object
    
optimization.request:
  format: JSON
  schema:
    optimization_type: string
    constraints: object
    objective: string
```

### Output Topics (Produced)
```yaml
calculation.result:
  format: JSON/Protobuf
  schema:
    request_id: string
    type: string
    result: object
    execution_time_ms: number
    status: string  # "success", "error"
    
calculation.error:
  format: JSON
  schema:
    request_id: string
    error_type: string
    error_message: string
    stack_trace: string
    retry_count: number
    
ml.model.updated:
  format: JSON
  schema:
    model_id: string
    model_type: string
    version: string
    metrics: object
    mlflow_run_id: string
```

---

## 🚀 Fases de Implementación

### Fase 1: Fundamentos (2 semanas)

**Semana 1: Setup del Proyecto**
- [ ] Crear estructura del proyecto con Poetry
- [ ] Configurar FastAPI con uvicorn
- [ ] Configurar gRPC server
- [ ] Setup de logging (structlog)
- [ ] Setup de metrics (Prometheus)
- [ ] Dockerfile multi-stage
- [ ] docker-compose para desarrollo local
- [ ] CI/CD pipeline básico

**Semana 2: Kafka Integration**
- [ ] Implementar aiokafka consumer
- [ ] Implementar aiokafka producer
- [ ] Message routing por tipo
- [ ] Dead Letter Queue
- [ ] Retry policies
- [ ] Tests de integración

### Fase 2: Cálculos Petroleros (4 semanas)

**Semana 3-4: IPR & VLP**
- [ ] Implementar IPR Vogel
- [ ] Implementar IPR Fetkovich
- [ ] Implementar IPR Darcy
- [ ] Implementar VLP Beggs & Brill
- [ ] Implementar VLP Hagedorn & Brown
- [ ] Tests unitarios con casos conocidos
- [ ] Benchmarking de performance

**Semana 5-6: Nodal Analysis & Decline Curves**
- [ ] Implementar Nodal Analysis engine
- [ ] Implementar Decline Curve Analysis (Arps)
- [ ] Implementar Material Balance
- [ ] Implementar PVT correlations
- [ ] Integration tests
- [ ] API documentation

### Fase 3: Machine Learning (6 semanas)

**Semana 7-8: ML Infrastructure**
- [ ] Setup MLflow server
- [ ] Implementar model registry client
- [ ] Implementar feature engineering pipeline
- [ ] Setup Celery para training tasks
- [ ] Implementar model versioning
- [ ] Implementar A/B testing framework

**Semana 9-10: Forecasting Models**
- [ ] Implementar LSTM para producción
- [ ] Implementar Prophet para forecasting
- [ ] Implementar XGBoost para producción
- [ ] Hyperparameter tuning con Optuna
- [ ] Model evaluation metrics
- [ ] Training pipeline automation

**Semana 11-12: Anomaly Detection & Optimization**
- [ ] Implementar Isolation Forest
- [ ] Implementar Autoencoder para anomalías
- [ ] Implementar Bayesian Optimization
- [ ] Implementar event classification
- [ ] Real-time inference optimization
- [ ] Model monitoring dashboard

### Fase 4: Simulaciones (4 semanas)

**Semana 13-14: Reservoir Simulation**
- [ ] Implementar Black Oil simulator
- [ ] Implementar Material Balance simulator
- [ ] Grid generation utilities
- [ ] Visualization helpers
- [ ] Performance optimization

**Semana 15-16: Well Performance**
- [ ] Implementar well performance simulator
- [ ] Multiphase flow simulation
- [ ] Integration con IPR/VLP
- [ ] Batch simulation support
- [ ] Results visualization

### Fase 5: Optimización y Producción (2 semanas)

**Semana 17: Performance Tuning**
- [ ] Profiling con py-spy
- [ ] Optimización de cálculos críticos
- [ ] Caching strategies
- [ ] Connection pooling
- [ ] Load testing (Locust)

**Semana 18: Deployment**
- [ ] Kubernetes manifests
- [ ] Horizontal Pod Autoscaler
- [ ] Monitoring dashboards (Grafana)
- [ ] Alerting rules (Prometheus)
- [ ] Documentation completa
- [ ] Runbooks de operación

---

## 📈 Métricas y Monitoreo

### Prometheus Metrics
```python
# Cálculos
calculation_requests_total{type, status}
calculation_duration_seconds{type, percentile}
calculation_errors_total{type, error_type}

# ML
ml_inference_duration_seconds{model_type, percentile}
ml_model_accuracy{model_id, version}
ml_training_duration_seconds{model_type}

# Kafka
kafka_messages_consumed_total{topic}
kafka_messages_produced_total{topic}
kafka_consumer_lag{topic, partition}

# System
python_gc_collections_total{generation}
python_memory_bytes{type}
process_cpu_seconds_total
```

### Health Checks
```python
GET /api/v1/health
{
  "status": "healthy",
  "version": "1.0.0",
  "checks": {
    "kafka": "healthy",
    "redis": "healthy",
    "postgres": "healthy",
    "mlflow": "healthy"
  },
  "uptime_seconds": 3600,
  "calculations_processed": 150000
}
```

---

## 🔒 Seguridad

- API Key authentication para REST API
- mTLS para gRPC
- Kafka SASL/SSL
- Redis AUTH
- Rate limiting (por tenant)
- Input validation con Pydantic
- SQL injection prevention (asyncpg)
- Secrets management (Kubernetes Secrets / Vault)

---

## 📚 Dependencias Externas

```toml
[tool.poetry.dependencies]
python = "^3.11"
fastapi = "^0.109.0"
uvicorn = {extras = ["standard"], version = "^0.27.0"}
grpcio = "^1.60.0"
grpcio-tools = "^1.60.0"
aiokafka = "^0.10.0"
celery = {extras = ["redis"], version = "^5.3.0"}
redis = "^5.0.0"
asyncpg = "^0.29.0"
numpy = "^1.26.0"
scipy = "^1.12.0"
pandas = "^2.2.0"
scikit-learn = "^1.4.0"
tensorflow = "^2.15.0"  # or pytorch = "^2.2.0"
prophet = "^1.1.0"
xgboost = "^2.0.0"
mlflow = "^2.10.0"
optuna = "^3.5.0"
pydantic = "^2.6.0"
pydantic-settings = "^2.1.0"
structlog = "^24.1.0"
prometheus-client = "^0.20.0"
pint = "^0.23.0"
orjson = "^3.9.0"
msgpack = "^1.0.0"

[tool.poetry.group.dev.dependencies]
pytest = "^8.0.0"
pytest-asyncio = "^0.23.0"
pytest-cov = "^4.1.0"
pytest-mock = "^3.12.0"
pytest-benchmark = "^4.0.0"
black = "^24.1.0"
ruff = "^0.2.0"
mypy = "^1.8.0"
```

---

## 🎓 Referencias

### Petroleum Engineering
- Vogel, J.V. (1968). "Inflow Performance Relationships for Solution-Gas Drive Wells"
- Beggs, H.D. & Brill, J.P. (1973). "A Study of Two-Phase Flow in Inclined Pipes"
- Fetkovich, M.J. (1980). "Decline Curve Analysis Using Type Curves"
- Standing, M.B. (1947). "A Pressure-Volume-Temperature Correlation for Mixtures of California Oils and Gases"

### Machine Learning
- Hochreiter & Schmidhuber (1997). "Long Short-Term Memory"
- Taylor & Letham (2018). "Forecasting at Scale" (Prophet)
- Liu et al. (2008). "Isolation Forest"

### Optimization
- Mockus (1974). "On Bayesian Methods for Seeking the Extremum"
- Kennedy & Eberhart (1995). "Particle Swarm Optimization"

---

**Última actualización**: 2026-01-10  
**Versión**: 1.0  
**Estado**: Diseño Completo - Listo para Implementación
