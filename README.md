# PetroEdge - Industrial SCADA+ERP Platform for Oil & Gas

**PetroEdge** is a comprehensive Edge-first SCADA+ERP system designed specifically for the petroleum industry. It provides complete operational management from exploration to production, with 100% autonomous operation in remote oil fields.

## 🎯 Vision

Develop an integrated ERP+SCADA system for the petroleum industry that enables:
- **Complete well lifecycle management** (exploration → production → abandonment)
- **100% autonomous field operation** without internet dependency
- **Professional technical analysis** comparable to software like OFM, PROSPER, Petrel
- **Real-time SCADA integration** for telemetry and control

## 🏗️ Architecture

### Edge-First Design
The **Edge system is the primary product** - a complete, standalone solution that operates in oil fields without cloud dependency. The Cloud is an optional service for multi-site consolidation.

```
┌─────────────────────────────────────────────────────────┐
│                    EDGE SYSTEM (Field)                   │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │  Frontend  │  │  Backend   │  │    Edge    │        │
│  │   (React)  │  │  (Node.js) │  │  Gateway   │        │
│  └────────────┘  └────────────┘  └────────────┘        │
│         │               │               │               │
│         └───────────────┴───────────────┘               │
│                         │                                │
│              ┌──────────┴──────────┐                    │
│              │  PostgreSQL +       │                    │
│              │  TimescaleDB        │                    │
│              └─────────────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Key Features

### Technical Modules (Petroleum)
- **Reservoirs**: Geological database, PVT, Material Balance, DCA, Reserves
- **Well Testing**: IPR/VLP, Pressure Testing, Field PVT
- **Drilling**: Planning, T&D, MSE, Well Control, Real-time monitoring
- **Well Management**: ESP, Gas Lift, Rod Pump, PCP, Optimization
- **Coiled Tubing**: Fatigue tracking, Buckling analysis, Job tickets

### ERP Modules
- **Inventory**: Stock control, warehouses, petroleum materials
- **Finance**: Accounting, invoicing, cost per well
- **HR**: Personnel, payroll, shifts, certifications
- **Maintenance**: CMMS, work orders, preventive/corrective

### SCADA Infrastructure
- **Protocols**: Modbus RTU/TCP, MQTT, OPC-UA
- **Real-time data**: Telemetry, alarms, trends
- **Edge analytics**: Local processing, data quality
- **Store-and-forward**: Resilient cloud synchronization

## 🛠️ Technology Stack

### Backend
- **API Service**: Node.js 20+ with TypeScript + Fastify
- **Worker Service**: Node.js 20+ with TypeScript (Kafka consumers, Rule Engine)
- **Database**: PostgreSQL 16 + TimescaleDB
- **ORM**: Drizzle ORM
- **Validation**: Zod
- **Auth**: JWT + RBAC
- **Digital Twins**: Eclipse Ditto (Java/Scala)
- **Message Broker**: Apache Kafka + Eclipse Mosquitto

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **UI**: shadcn/ui + Radix UI
- **Styling**: TailwindCSS
- **State**: Zustand + TanStack Query
- **Charts**: Apache ECharts + Recharts
- **Maps**: Leaflet
- **Rule Editor**: React Flow

### Edge Gateway
- **Runtime**: Node.js with TypeScript
- **Protocols**: Modbus, MQTT, OPC-UA, S7, EtherNet/IP
- **Fallback**: Apache PLC4X (for exotic protocols)

### Infrastructure
- **Containerization**: Docker + K3s
- **IaC**: Terraform, Ansible
- **Monitoring**: Prometheus + Grafana
- **Cache**: Redis

## 📁 Project Structure

```
petroedge/
├── src/
│   ├── backend/          # REST APIs and business logic
│   ├── frontend/         # React web application
│   └── edge/             # SCADA gateway and protocols
├── database/             # PostgreSQL schemas and migrations
├── infrastructure/       # Docker, K8s, Terraform, Ansible
├── shared/               # Shared types and utilities
├── tools/                # CLI and development tools
├── docs/                 # Technical documentation
└── roadmap/              # Project planning and roadmaps
```

## 🚦 Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 16 with TimescaleDB
- Docker and Docker Compose
- pnpm (recommended) or npm

### Development Setup

```bash
# Clone repository
git clone https://github.com/yourusername/petroedge.git
cd petroedge

# Install dependencies
pnpm install

# Setup database
pnpm db:migrate
pnpm db:seed

# Start development servers
pnpm dev
```

### Docker Compose (Recommended for Edge)

```bash
# Start complete Edge stack
docker-compose -f infrastructure/docker/docker-compose.edge.yml up -d

# View logs
docker-compose logs -f

# Access services
# - Frontend: http://localhost
# - Backend API: http://localhost:3000
# - Grafana: http://localhost:3001
```

## 📖 Documentation

- [Architecture Overview](docs/ARQUITECTURA_EDGE_CLOUD.md)
- [Backend Stack](docs/BACKEND_STACK.md)
- [Frontend Stack](docs/FRONTEND_STACK.md)
- [Database Design](docs/BASES_DATOS_TIMESERIES.md)
- [Industrial Protocols](docs/PROTOCOLOS_INDUSTRIALES.md)
- [Master Roadmap](roadmap/00_MASTER_ROADMAP.md)

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e
```

## 🔒 Security

- JWT authentication with refresh tokens
- Role-Based Access Control (RBAC)
- SQL injection prevention via ORM
- Rate limiting on all endpoints
- TLS/SSL encryption in transit
- Database encryption at rest
- Audit logging of all actions

## 📊 Deployment

### Edge Device (Field)
```bash
# Using K3s
kubectl apply -f infrastructure/k8s/edge/

# Or using Docker Compose
docker-compose -f infrastructure/docker/docker-compose.edge.yml up -d
```

### Hardware Requirements (Edge)
- **CPU**: 4+ cores (ARM64 or x86)
- **RAM**: 8 GB minimum, 16 GB recommended
- **Storage**: 256 GB SSD minimum
- **Network**: 1 Gbps Ethernet
- **Temperature**: -20°C to 60°C (industrial)

## 🤝 Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and development process.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏢 Use Cases

- Remote oil field operations
- Multi-well production monitoring
- Real-time drilling operations
- Well testing and analysis
- Coiled tubing interventions
- Field inventory management
- Production optimization
- Reservoir management

## 🌟 Differentiators

| Aspect | Competition | PetroEdge |
|--------|-------------|-----------|
| **Deployment** | Cloud-only or heavy client | Edge-first, Cloud optional |
| **Connectivity** | Requires internet | 100% offline capable |
| **Licensing** | Per module, expensive | All-inclusive |
| **Integration** | Separate silos | Unified ERP + SCADA |
| **Customization** | Limited | Open source, configurable |

## 📞 Support

For support, please open an issue on GitHub or contact the development team.

---

**Built with ❤️ for the Oil & Gas Industry**
