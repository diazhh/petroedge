# BACKEND STACK PARA ERP+SCADA PETROLERO

## Resumen Ejecutivo

Este documento analiza y recomienda el stack tecnológico de backend para el sistema ERP+SCADA petrolero. La arquitectura híbrida Edge-Cloud requiere diferentes enfoques: servicios OT de alta frecuencia/baja latencia en edge, y servicios IT/ERP transaccionales en cloud.

Se evalúan cuatro ecosistemas principales: **Node.js/NestJS** (TypeScript), **Python/FastAPI**, **Go/Gin**, y **Rust/Actix**. La recomendación final propone un enfoque políglotico: **Go para servicios OT críticos** (telemetría, protocolos industriales) y **Node.js/NestJS para servicios IT** (API REST, business logic, reporting).

**Principio arquitectónico:** Microservicios event-driven con API Gateway unificado.

---

## 1. Requerimientos del Sistema

### 1.1 Servicios OT (Operational Technology)

**Características:**
- Alta frecuencia de datos (100K+ puntos/segundo)
- Baja latencia (<10ms para alarmas)
- Comunicación con protocolos industriales (Modbus, OPC-UA, MQTT)
- Procesamiento en tiempo real
- Operación 24/7 sin interrupciones

**Requerimientos técnicos:**
- Performance extrema
- Bajo consumo de memoria (edge limitado)
- Concurrencia masiva
- Estabilidad ante cargas variables

### 1.2 Servicios IT (Information Technology)

**Características:**
- APIs REST/GraphQL para frontend
- Lógica de negocio (usuarios, permisos, reportes)
- Integraciones con sistemas externos
- Generación de reportes y exports

**Requerimientos técnicos:**
- Productividad de desarrollo
- Ecosistema maduro de librerías
- Type-safety
- Facilidad de mantenimiento

### 1.3 Servicios de Analytics

**Características:**
- Procesamiento de datos históricos
- Machine Learning
- Cálculos de ingeniería (DCA, Nodal Analysis)
- Batch processing

**Requerimientos técnicos:**
- Integración con librerías científicas
- Procesamiento paralelo
- Manejo de grandes datasets

---

## 2. Comparativa de Lenguajes/Frameworks

### 2.1 Node.js + NestJS

**Descripción:** Framework enterprise para Node.js, inspirado en Angular, con TypeScript nativo.

**Arquitectura:**
```
┌─────────────────────────────────────────────────────────────┐
│                      NestJS Application                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Controllers│  │  Services   │  │  Modules    │         │
│  │  (Routes)   │  │ (Business)  │  │ (Features)  │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                 │
│         ▼                ▼                ▼                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Dependency Injection Container              │  │
│  └──────────────────────────────────────────────────────┘  │
│         │                │                │                 │
│         ▼                ▼                ▼                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Guards    │  │ Interceptors│  │   Pipes     │         │
│  │  (Auth)     │  │ (Transform) │  │ (Validate)  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  Adapters: Express (default) | Fastify (high performance)  │
└─────────────────────────────────────────────────────────────┘
```

**Benchmarks (requests/second):**
| Configuración | Simple JSON | DB Query | Latency p99 |
|---------------|-------------|----------|-------------|
| NestJS + Express | ~15,000 | ~8,000 | ~25ms |
| NestJS + Fastify | ~35,000 | ~15,000 | ~12ms |

**Ejemplo de código:**

```typescript
// wells.controller.ts
import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { WellsService } from './wells.service';
import { CreateWellDto, WellQueryDto } from './dto';

@ApiTags('wells')
@Controller('api/v1/wells')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WellsController {
  constructor(private readonly wellsService: WellsService) {}

  @Get()
  @Roles('operator', 'engineer', 'admin')
  @ApiOperation({ summary: 'List all wells with filtering' })
  async findAll(@Query() query: WellQueryDto) {
    return this.wellsService.findAll(query);
  }

  @Get(':id')
  @Roles('operator', 'engineer', 'admin')
  @ApiOperation({ summary: 'Get well by ID' })
  async findOne(@Param('id') id: string) {
    return this.wellsService.findOne(id);
  }

  @Get(':id/production')
  @Roles('operator', 'engineer', 'admin')
  @ApiOperation({ summary: 'Get well production data' })
  async getProduction(
    @Param('id') id: string,
    @Query('start') start: Date,
    @Query('end') end: Date,
  ) {
    return this.wellsService.getProduction(id, start, end);
  }

  @Post()
  @Roles('engineer', 'admin')
  @ApiOperation({ summary: 'Create new well' })
  async create(@Body() createWellDto: CreateWellDto) {
    return this.wellsService.create(createWellDto);
  }
}

// wells.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Well } from './entities/well.entity';

@Injectable()
export class WellsService {
  constructor(
    @InjectRepository(Well)
    private wellsRepository: Repository<Well>,
  ) {}

  async findAll(query: WellQueryDto): Promise<Well[]> {
    const qb = this.wellsRepository.createQueryBuilder('well');
    
    if (query.fieldId) {
      qb.andWhere('well.field_id = :fieldId', { fieldId: query.fieldId });
    }
    
    if (query.status) {
      qb.andWhere('well.status = :status', { status: query.status });
    }
    
    if (query.wellType) {
      qb.andWhere('well.well_type = :type', { type: query.wellType });
    }
    
    return qb.getMany();
  }

  async findOne(id: string): Promise<Well> {
    const well = await this.wellsRepository.findOne({ where: { id } });
    if (!well) {
      throw new NotFoundException(`Well ${id} not found`);
    }
    return well;
  }
}
```

**Pros:**
- ✓ TypeScript nativo - type safety, mejor tooling
- ✓ Arquitectura modular y escalable
- ✓ Decoradores para DI, validación, documentación
- ✓ OpenAPI/Swagger automático
- ✓ Gran ecosistema npm
- ✓ Fácil testing (Jest integrado)
- ✓ Soporte WebSocket nativo
- ✓ GraphQL integrado (@nestjs/graphql)

**Contras:**
- ✗ Overhead de abstracción vs Express puro
- ✗ Performance inferior a Go/Rust
- ✗ Curva de aprendizaje para devs sin Angular
- ✗ Single-threaded (event loop)

**Mejor para:** APIs REST/GraphQL, servicios IT, backends de frontend.

---

### 2.2 Python + FastAPI

**Descripción:** Framework moderno para Python con alto rendimiento, basado en type hints y Starlette/Pydantic.

**Arquitectura:**
```
┌─────────────────────────────────────────────────────────────┐
│                     FastAPI Application                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   Pydantic Models                    │    │
│  │           (Validation + Serialization)              │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  Path Operations                     │    │
│  │              (async def endpoints)                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                     Starlette                        │    │
│  │           (ASGI Framework - async/await)            │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                      Uvicorn                         │    │
│  │              (ASGI Server - uvloop)                 │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Benchmarks (requests/second):**
| Configuración | Simple JSON | DB Query | Latency p99 |
|---------------|-------------|----------|-------------|
| FastAPI + Uvicorn | ~25,000 | ~10,000 | ~15ms |
| FastAPI + Gunicorn (4 workers) | ~80,000 | ~35,000 | ~20ms |

**Ejemplo de código:**

```python
# main.py
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from uuid import UUID

app = FastAPI(
    title="SCADA API",
    description="ERP+SCADA Petrolero API",
    version="1.0.0"
)

# Pydantic models
class WellBase(BaseModel):
    well_name: str = Field(..., min_length=1, max_length=100)
    well_code: str = Field(..., min_length=1, max_length=50)
    field_id: UUID
    well_type: str = Field(..., regex="^(PROD_OIL|PROD_GAS|INJ_WATER|INJ_GAS)$")
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)

class WellCreate(WellBase):
    pass

class WellResponse(WellBase):
    id: UUID
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class ProductionData(BaseModel):
    time: datetime
    oil_rate_bopd: float
    gas_rate_mcfd: float
    water_rate_bwpd: float
    thp_psi: float
    gor_scf_bbl: float

# Dependency injection
async def get_db() -> AsyncSession:
    async with async_session() as session:
        yield session

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    # Validate JWT token
    return await validate_token(token)

# Routes
@app.get("/api/v1/wells", response_model=List[WellResponse], tags=["wells"])
async def list_wells(
    field_id: Optional[UUID] = None,
    status: Optional[str] = None,
    well_type: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List all wells with optional filtering"""
    query = select(Well).where(Well.tenant_id == current_user.tenant_id)
    
    if field_id:
        query = query.where(Well.field_id == field_id)
    if status:
        query = query.where(Well.status == status)
    if well_type:
        query = query.where(Well.well_type == well_type)
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@app.get("/api/v1/wells/{well_id}", response_model=WellResponse, tags=["wells"])
async def get_well(
    well_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get well by ID"""
    well = await db.get(Well, well_id)
    if not well or well.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Well not found")
    return well

@app.get("/api/v1/wells/{well_id}/production", 
         response_model=List[ProductionData], 
         tags=["wells"])
async def get_well_production(
    well_id: UUID,
    start: datetime,
    end: datetime,
    interval: str = Query("1h", regex="^(1m|5m|15m|1h|1d)$"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get production data for a well within time range"""
    # Query TimescaleDB with time_bucket
    query = text("""
        SELECT 
            time_bucket(:interval, time) AS time,
            AVG(oil_rate_bopd) as oil_rate_bopd,
            AVG(gas_rate_mcfd) as gas_rate_mcfd,
            AVG(water_rate_bwpd) as water_rate_bwpd,
            AVG(thp_psi) as thp_psi,
            AVG(gor_scf_bbl) as gor_scf_bbl
        FROM well_production
        WHERE well_id = :well_id
          AND time BETWEEN :start AND :end
        GROUP BY 1
        ORDER BY 1
    """)
    
    result = await db.execute(query, {
        "well_id": well_id,
        "start": start,
        "end": end,
        "interval": interval
    })
    
    return [ProductionData(**row._mapping) for row in result]
```

**Pros:**
- ✓ Sintaxis limpia y Pythonic
- ✓ Type hints + Pydantic = validación automática
- ✓ OpenAPI generado automáticamente
- ✓ Async/await nativo
- ✓ Excelente para ML/Data Science (NumPy, Pandas, scikit-learn)
- ✓ Productividad muy alta
- ✓ SQLAlchemy 2.0 async support

**Contras:**
- ✗ GIL limita concurrencia real (multiprocessing needed)
- ✗ Menor performance que Go/Rust
- ✗ Dependency management complejo (pip, poetry, conda)
- ✗ Menos tooling que TypeScript para refactoring

**Mejor para:** Servicios de analytics, ML, prototipado rápido, científicos de datos.

---

### 2.3 Go + Gin

**Descripción:** Framework web minimalista y de alto rendimiento para Go.

**Arquitectura:**
```
┌─────────────────────────────────────────────────────────────┐
│                      Gin Application                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    Router (gin.Engine)               │    │
│  │         (RadixTree - O(1) route matching)           │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    Middlewares                       │    │
│  │     (Logger, Recovery, Auth, CORS, RateLimit)       │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                     Handlers                         │    │
│  │            (func(c *gin.Context))                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    Context Pool                      │    │
│  │              (Zero allocation design)                │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Concurrency: Goroutines (lightweight threads)              │
└──────────────────────────────────────────────────────────────┘
```

**Benchmarks (requests/second):**
| Configuración | Simple JSON | DB Query | Latency p99 |
|---------------|-------------|----------|-------------|
| Gin (Go 1.22) | ~120,000 | ~50,000 | ~3ms |
| Fiber (Go 1.22) | ~150,000 | ~55,000 | ~2.5ms |

**Ejemplo de código:**

```go
// main.go
package main

import (
    "net/http"
    "time"
    
    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
    "gorm.io/gorm"
)

// Models
type Well struct {
    ID        uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
    TenantID  uuid.UUID `gorm:"type:uuid;not null" json:"-"`
    WellName  string    `gorm:"size:100;not null" json:"well_name"`
    WellCode  string    `gorm:"size:50;uniqueIndex;not null" json:"well_code"`
    FieldID   uuid.UUID `gorm:"type:uuid" json:"field_id"`
    WellType  string    `gorm:"size:20;not null" json:"well_type"`
    Status    string    `gorm:"size:20;default:DRILLING" json:"status"`
    Latitude  float64   `json:"latitude,omitempty"`
    Longitude float64   `json:"longitude,omitempty"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}

type WellProduction struct {
    Time          time.Time `json:"time"`
    WellID        uuid.UUID `json:"well_id"`
    OilRateBOPD   float64   `json:"oil_rate_bopd"`
    GasRateMCFD   float64   `json:"gas_rate_mcfd"`
    WaterRateBWPD float64   `json:"water_rate_bwpd"`
    THPPSI        float64   `json:"thp_psi"`
    GORScfBbl     float64   `json:"gor_scf_bbl"`
}

// Handlers
type WellHandler struct {
    db *gorm.DB
}

func NewWellHandler(db *gorm.DB) *WellHandler {
    return &WellHandler{db: db}
}

func (h *WellHandler) List(c *gin.Context) {
    tenantID := c.MustGet("tenant_id").(uuid.UUID)
    
    var wells []Well
    query := h.db.Where("tenant_id = ?", tenantID)
    
    // Optional filters
    if fieldID := c.Query("field_id"); fieldID != "" {
        query = query.Where("field_id = ?", fieldID)
    }
    if status := c.Query("status"); status != "" {
        query = query.Where("status = ?", status)
    }
    if wellType := c.Query("well_type"); wellType != "" {
        query = query.Where("well_type = ?", wellType)
    }
    
    if err := query.Find(&wells).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(http.StatusOK, wells)
}

func (h *WellHandler) Get(c *gin.Context) {
    tenantID := c.MustGet("tenant_id").(uuid.UUID)
    wellID := c.Param("id")
    
    var well Well
    if err := h.db.Where("id = ? AND tenant_id = ?", wellID, tenantID).First(&well).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Well not found"})
        return
    }
    
    c.JSON(http.StatusOK, well)
}

func (h *WellHandler) GetProduction(c *gin.Context) {
    wellID := c.Param("id")
    start := c.Query("start")
    end := c.Query("end")
    interval := c.DefaultQuery("interval", "1h")
    
    var production []WellProduction
    
    query := `
        SELECT 
            time_bucket($1::interval, time) AS time,
            well_id,
            AVG(oil_rate_bopd) as oil_rate_bopd,
            AVG(gas_rate_mcfd) as gas_rate_mcfd,
            AVG(water_rate_bwpd) as water_rate_bwpd,
            AVG(thp_psi) as thp_psi,
            AVG(gor_scf_bbl) as gor_scf_bbl
        FROM well_production
        WHERE well_id = $2
          AND time BETWEEN $3 AND $4
        GROUP BY 1, 2
        ORDER BY 1
    `
    
    if err := h.db.Raw(query, interval, wellID, start, end).Scan(&production).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(http.StatusOK, production)
}

// Middleware
func TenantMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        // Extract tenant from JWT claims
        tenantID, exists := c.Get("tenant_id")
        if !exists {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Tenant not found"})
            return
        }
        c.Set("tenant_id", tenantID)
        c.Next()
    }
}

// Router setup
func SetupRouter(db *gorm.DB) *gin.Engine {
    r := gin.Default()
    
    // Middleware
    r.Use(gin.Recovery())
    r.Use(CORSMiddleware())
    
    // API v1
    v1 := r.Group("/api/v1")
    v1.Use(JWTMiddleware())
    v1.Use(TenantMiddleware())
    {
        wellHandler := NewWellHandler(db)
        
        wells := v1.Group("/wells")
        {
            wells.GET("", wellHandler.List)
            wells.GET("/:id", wellHandler.Get)
            wells.GET("/:id/production", wellHandler.GetProduction)
            wells.POST("", wellHandler.Create)
            wells.PUT("/:id", wellHandler.Update)
            wells.DELETE("/:id", wellHandler.Delete)
        }
    }
    
    return r
}

func main() {
    db := setupDatabase()
    
    r := SetupRouter(db)
    r.Run(":8080")
}
```

**Pros:**
- ✓ Performance excepcional (compilado, tipado estático)
- ✓ Goroutines para concurrencia masiva (millones de conexiones)
- ✓ Bajo uso de memoria
- ✓ Binario único, deploy simple
- ✓ Excelente para microservicios
- ✓ Standard library robusta (net/http, encoding/json)
- ✓ Cross-compilation trivial

**Contras:**
- ✗ Verbose (no generics hasta Go 1.18, aún limitados)
- ✗ Error handling repetitivo (if err != nil)
- ✗ Menos librerías que Node/Python
- ✗ Curva de aprendizaje para desarrolladores web

**Mejor para:** Servicios OT, telemetría, protocol drivers, alta concurrencia.

---

### 2.4 Rust + Actix

**Descripción:** Framework web de altísimo rendimiento para Rust, basado en el actor model.

**Benchmarks (requests/second):**
| Configuración | Simple JSON | DB Query | Latency p99 |
|---------------|-------------|----------|-------------|
| Actix Web 4.x | ~200,000 | ~80,000 | ~1ms |
| Axum (Tokio) | ~180,000 | ~75,000 | ~1.2ms |

**Ejemplo de código:**

```rust
use actix_web::{web, App, HttpServer, HttpResponse, middleware};
use sqlx::PgPool;
use uuid::Uuid;
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
struct Well {
    id: Uuid,
    well_name: String,
    well_code: String,
    field_id: Option<Uuid>,
    well_type: String,
    status: String,
    latitude: Option<f64>,
    longitude: Option<f64>,
    created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
struct WellQuery {
    field_id: Option<Uuid>,
    status: Option<String>,
    well_type: Option<String>,
}

async fn list_wells(
    pool: web::Data<PgPool>,
    query: web::Query<WellQuery>,
    tenant_id: web::ReqData<Uuid>,
) -> actix_web::Result<HttpResponse> {
    let wells = sqlx::query_as::<_, Well>(
        r#"
        SELECT id, well_name, well_code, field_id, well_type, 
               status, latitude, longitude, created_at
        FROM wells
        WHERE tenant_id = $1
          AND ($2::uuid IS NULL OR field_id = $2)
          AND ($3::text IS NULL OR status = $3)
          AND ($4::text IS NULL OR well_type = $4)
        ORDER BY well_name
        "#
    )
    .bind(*tenant_id.into_inner())
    .bind(query.field_id)
    .bind(&query.status)
    .bind(&query.well_type)
    .fetch_all(pool.get_ref())
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;
    
    Ok(HttpResponse::Ok().json(wells))
}

async fn get_well(
    pool: web::Data<PgPool>,
    well_id: web::Path<Uuid>,
    tenant_id: web::ReqData<Uuid>,
) -> actix_web::Result<HttpResponse> {
    let well = sqlx::query_as::<_, Well>(
        "SELECT * FROM wells WHERE id = $1 AND tenant_id = $2"
    )
    .bind(well_id.into_inner())
    .bind(*tenant_id.into_inner())
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;
    
    match well {
        Some(w) => Ok(HttpResponse::Ok().json(w)),
        None => Ok(HttpResponse::NotFound().json(serde_json::json!({"error": "Well not found"}))),
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let pool = PgPool::connect("postgres://localhost/scada").await.unwrap();
    
    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(pool.clone()))
            .wrap(middleware::Logger::default())
            .wrap(middleware::Compress::default())
            .service(
                web::scope("/api/v1")
                    .route("/wells", web::get().to(list_wells))
                    .route("/wells/{id}", web::get().to(get_well))
            )
    })
    .bind("0.0.0.0:8080")?
    .run()
    .await
}
```

**Pros:**
- ✓ Performance máxima (C/C++ level)
- ✓ Memory safety garantizada en compile time
- ✓ Zero-cost abstractions
- ✓ Concurrencia sin data races
- ✓ Ideal para sistemas críticos

**Contras:**
- ✗ Curva de aprendizaje muy empinada (borrow checker)
- ✗ Tiempo de compilación lento
- ✗ Ecosistema web menos maduro que Node/Go
- ✗ Menos desarrolladores disponibles

**Mejor para:** Componentes críticos de ultra-alta performance, drivers de protocolo, edge embebido.

---

## 3. Comparativa Consolidada

### 3.1 Tabla de Decisión

| Criterio | NestJS | FastAPI | Go/Gin | Rust/Actix |
|----------|--------|---------|--------|------------|
| **Performance** | ★★★☆☆ | ★★★☆☆ | ★★★★★ | ★★★★★+ |
| **Productividad** | ★★★★★ | ★★★★★ | ★★★☆☆ | ★★☆☆☆ |
| **Ecosistema** | ★★★★★ | ★★★★☆ | ★★★☆☆ | ★★☆☆☆ |
| **Type Safety** | ★★★★★ | ★★★★☆ | ★★★★☆ | ★★★★★ |
| **Concurrencia** | ★★★☆☆ | ★★★☆☆ | ★★★★★ | ★★★★★ |
| **Memory Usage** | ★★☆☆☆ | ★★★☆☆ | ★★★★★ | ★★★★★ |
| **Deploy Size** | ★★☆☆☆ | ★★★☆☆ | ★★★★★ | ★★★★★ |
| **Hiring Pool** | ★★★★★ | ★★★★☆ | ★★★☆☆ | ★☆☆☆☆ |
| **ML/Analytics** | ★★☆☆☆ | ★★★★★ | ★★☆☆☆ | ★★☆☆☆ |

### 3.2 Benchmark Comparativo

```
Requests/second (JSON serialization, 10 concurrent connections):

Actix (Rust)    ████████████████████████████████████████  200,000
Gin (Go)        ████████████████████████                  120,000
FastAPI         █████████████                              65,000*
NestJS+Fastify  ███████                                    35,000
NestJS+Express  ███                                        15,000

* FastAPI con 4 workers Gunicorn
```

---

## 4. Arquitectura de Microservicios

### 4.1 Diseño Propuesto

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                     │
│        (Web App, Mobile App, Third-party Integrations)                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY                                    │
│                      (Traefik / Kong)                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  - SSL Termination     - Rate Limiting    - Request Routing    │   │
│  │  - Authentication      - Load Balancing   - API Versioning     │   │
│  │  - Metrics/Tracing     - Circuit Breaker  - Request Transform  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   IT SERVICES   │  │   OT SERVICES   │  │ ANALYTICS SVC   │
│   (NestJS)      │  │   (Go)          │  │ (FastAPI)       │
│                 │  │                 │  │                 │
│ - Wells API     │  │ - Telemetry     │  │ - DCA           │
│ - Users API     │  │ - Protocol GW   │  │ - Nodal         │
│ - Reports       │  │ - Alarms        │  │ - ML Models     │
│ - Billing       │  │ - MQTT Handler  │  │ - Forecasting   │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          MESSAGE BUS                                     │
│                      (Apache Kafka / NATS)                              │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Topics:                                                         │   │
│  │  - telemetry.{field}.{well}  - alarms.{severity}                │   │
│  │  - events.well.created       - commands.{device}                 │   │
│  │  - analytics.dca.request     - analytics.dca.result             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                      │
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │   PostgreSQL     │  │   TimescaleDB    │  │      Redis       │      │
│  │  (Relational)    │  │  (Time-Series)   │  │    (Cache)       │      │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘      │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 4.2 API Gateway: Traefik vs Kong

| Feature | Traefik | Kong |
|---------|---------|------|
| **Configuración** | Labels/Annotations | Declarative/API |
| **K8s Integration** | Nativo (Ingress) | Via Ingress Controller |
| **Service Discovery** | Automático | Requiere config |
| **Performance** | Muy alto | Alto |
| **Plugins** | Middlewares | Extenso ecosistema |
| **Dashboard** | Incluido | Kong Manager (Enterprise) |
| **Precio** | Open Source | Open Source + Enterprise |

**Recomendación:** Traefik para K3s/K8s (integración nativa), Kong si se requieren plugins avanzados.

### 4.3 Comunicación entre Servicios

| Patrón | Uso | Implementación |
|--------|-----|----------------|
| **REST** | Queries síncronas | OpenAPI + client generation |
| **gRPC** | Alta performance interno | Protobuf |
| **Events** | Asíncrono, desacoplado | Kafka/NATS |
| **WebSocket** | Real-time a frontend | Socket.IO / native WS |

---

## 5. ORMs y Database Access

### 5.1 Comparativa

| ORM | Lenguaje | Type Safety | Migrations | Performance |
|-----|----------|-------------|------------|-------------|
| **Prisma** | TypeScript | ★★★★★ | ✓ Excelente | ★★★☆☆ |
| **TypeORM** | TypeScript | ★★★★☆ | ✓ Bueno | ★★★☆☆ |
| **SQLAlchemy 2.0** | Python | ★★★★☆ | ✓ Alembic | ★★★★☆ |
| **GORM** | Go | ★★★☆☆ | ✓ Auto | ★★★★☆ |
| **SQLx** | Rust | ★★★★★ | ✓ Migrations | ★★★★★ |

### 5.2 Prisma (Recomendado para NestJS)

```typescript
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Well {
  id          String    @id @default(uuid()) @db.Uuid
  tenantId    String    @map("tenant_id") @db.Uuid
  wellName    String    @map("well_name") @db.VarChar(100)
  wellCode    String    @unique @map("well_code") @db.VarChar(50)
  fieldId     String?   @map("field_id") @db.Uuid
  wellType    String    @map("well_type") @db.VarChar(20)
  status      String    @default("DRILLING") @db.VarChar(20)
  latitude    Float?
  longitude   Float?
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  
  tenant      Tenant    @relation(fields: [tenantId], references: [id])
  field       Field?    @relation(fields: [fieldId], references: [id])
  
  @@map("wells")
  @@index([tenantId])
  @@index([fieldId])
  @@index([status])
}

// Usage in NestJS service
@Injectable()
export class WellsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, filters: WellFilters) {
    return this.prisma.well.findMany({
      where: {
        tenantId,
        ...(filters.fieldId && { fieldId: filters.fieldId }),
        ...(filters.status && { status: filters.status }),
        ...(filters.wellType && { wellType: filters.wellType }),
      },
      include: {
        field: true,
      },
      orderBy: { wellName: 'asc' },
    });
  }
}
```

---

## 6. Recomendaciones Finales

### 6.1 Stack Recomendado por Tipo de Servicio

| Tipo de Servicio | Tecnología | Justificación |
|------------------|------------|---------------|
| **IT Services (APIs)** | NestJS + Prisma | Productividad, TypeScript, ecosistema |
| **OT Services (Telemetry)** | Go + Gin | Performance, concurrencia, bajo memoria |
| **Protocol Drivers** | Go o Rust | Performance, estabilidad |
| **Analytics/ML** | FastAPI + NumPy | Librerías científicas, productividad |
| **Edge Gateway** | Go | Binario único, bajo footprint |
| **API Gateway** | Traefik | K8s nativo, configuración simple |

### 6.2 Estructura de Repositorio

```
scada-erp/
├── services/
│   ├── api-gateway/           # Traefik config
│   ├── wells-service/         # NestJS
│   ├── users-service/         # NestJS
│   ├── reports-service/       # NestJS
│   ├── telemetry-service/     # Go
│   ├── protocol-gateway/      # Go (Modbus, OPC-UA)
│   ├── mqtt-handler/          # Go
│   ├── alarm-service/         # Go
│   ├── analytics-service/     # FastAPI
│   └── ml-service/            # FastAPI
├── libs/
│   ├── common-ts/             # Shared TypeScript libs
│   ├── common-go/             # Shared Go libs
│   └── proto/                 # Protobuf definitions
├── infrastructure/
│   ├── k8s/                   # Kubernetes manifests
│   ├── terraform/             # IaC
│   └── docker/                # Dockerfiles
└── docs/
```

### 6.3 Configuración Base

```yaml
# docker-compose.yml (desarrollo)
version: '3.8'

services:
  # API Gateway
  traefik:
    image: traefik:v2.10
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
    ports:
      - "80:80"
      - "8080:8080"  # Dashboard
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock

  # IT Service (NestJS)
  wells-service:
    build: ./services/wells-service
    environment:
      DATABASE_URL: postgres://user:pass@postgres:5432/scada
      REDIS_URL: redis://redis:6379
    labels:
      - "traefik.http.routers.wells.rule=PathPrefix(`/api/v1/wells`)"
    depends_on:
      - postgres
      - redis

  # OT Service (Go)
  telemetry-service:
    build: ./services/telemetry-service
    environment:
      TIMESCALE_URL: postgres://user:pass@timescale:5432/scada
      MQTT_BROKER: mqtt://mosquitto:1883
      KAFKA_BROKERS: kafka:9092
    labels:
      - "traefik.http.routers.telemetry.rule=PathPrefix(`/api/v1/telemetry`)"
    depends_on:
      - timescale
      - mosquitto
      - kafka

  # Analytics Service (FastAPI)
  analytics-service:
    build: ./services/analytics-service
    environment:
      DATABASE_URL: postgres://user:pass@timescale:5432/scada
    labels:
      - "traefik.http.routers.analytics.rule=PathPrefix(`/api/v1/analytics`)"

  # Databases
  postgres:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

  timescale:
    image: timescale/timescaledb:latest-pg16
    environment:
      POSTGRES_PASSWORD: pass
    volumes:
      - timescale_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  mosquitto:
    image: eclipse-mosquitto:2
    volumes:
      - ./config/mosquitto:/mosquitto/config

volumes:
  postgres_data:
  timescale_data:
  redis_data:
```

---

## 7. Siguientes Pasos

1. **Configurar monorepo** con NX o Turborepo
2. **Crear template NestJS** con auth, prisma, swagger
3. **Crear template Go** para servicios OT
4. **Definir contratos API** (OpenAPI specs)
5. **Configurar CI/CD** (GitHub Actions)
6. **Implementar servicio de wells** como MVP

---

## 8. Referencias

### Documentación Oficial
- [NestJS Documentation](https://docs.nestjs.com/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Gin Web Framework](https://gin-gonic.com/docs/)
- [Actix Web](https://actix.rs/docs/)

### Benchmarks
- [TechEmpower Web Framework Benchmarks](https://www.techempower.com/benchmarks/)
- [The Benchmarks Game](https://benchmarksgame-team.pages.debian.net/benchmarksgame/)

### Arquitectura
- [Traefik Documentation](https://doc.traefik.io/traefik/)
- [Kong Gateway](https://docs.konghq.com/)
- [Microservices.io Patterns](https://microservices.io/patterns/)
