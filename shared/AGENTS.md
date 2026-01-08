# SHARED - SCADA+ERP Petroleum Platform

Este componente contiene código compartido entre Backend, Frontend y Edge Gateway.

## Contenido

### Types (`types/`)
Tipos TypeScript compartidos entre todos los componentes:
- `wells.types.ts` - Tipos para pozos
- `well-testing.types.ts` - Tipos para pruebas de pozo
- `drilling.types.ts` - Tipos para perforación
- `production.types.ts` - Tipos para producción
- `scada.types.ts` - Tipos para tags SCADA
- `common.types.ts` - Tipos comunes

### Constants (`constants/`)
Constantes compartidas:
- `units.ts` - Unidades de medida y conversiones
- `status-codes.ts` - Códigos de estado
- `error-codes.ts` - Códigos de error
- `quality-codes.ts` - Códigos de calidad de datos

### Utils (`utils/`)
Utilidades compartidas:
- `unit-conversion.ts` - Conversión de unidades
- `date-utils.ts` - Utilidades de fechas
- `validation.ts` - Validaciones comunes
- `calculations.ts` - Cálculos de ingeniería

## Uso

### En Backend
```typescript
import { Well, WellStatus } from '@scadaerp/shared/types';
import { convertUnit } from '@scadaerp/shared/utils';

const oilRateBopd = convertUnit(1000, 'bopd', 'm3d');
```

### En Frontend
```typescript
import { WellTest } from '@scadaerp/shared/types';
import { formatDate } from '@scadaerp/shared/utils';

const formattedDate = formatDate(test.date, 'YYYY-MM-DD');
```

### En Edge
```typescript
import { TagConfig, QualityCode } from '@scadaerp/shared/types';
import { validateRange } from '@scadaerp/shared/utils';

const isValid = validateRange(value, tag.min, tag.max);
```

## Convenciones

- Todos los tipos deben estar documentados con JSDoc
- Funciones puras sin side effects
- Tests unitarios para todas las utilidades
- Versionado semántico
