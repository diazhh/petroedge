# 🎨 Estándares de Frontend - SCADA+ERP

## Visión General

Este documento define los estándares de diseño y arquitectura para el frontend del sistema SCADA+ERP, basado en las mejores prácticas del proyecto ERP existente.

---

## 📋 Principios de Diseño

### 1. Interfaces vs Modales
- ❌ **NO usar modales** para crear, editar o ver detalles
- ✅ **Usar páginas/interfaces dedicadas** para cada acción
- ✅ Después de crear/editar → redirigir al detalle del registro
- ✅ Los formularios son páginas completas, no diálogos

### 2. Estructura de Páginas por Módulo
Cada módulo debe tener:
```
/modules/{modulo}/
├── {Modulo}List.tsx      # Lista de registros (tabla/cards)
├── {Modulo}Detail.tsx    # Vista detallada con tabs
├── {Modulo}Form.tsx      # Formulario de creación/edición
├── {Modulo}Dashboard.tsx # Dashboard del módulo (opcional)
└── index.ts              # Exportaciones
```

### 3. Patrón de Navegación
```
Lista → Click en fila → Detalle (con tabs)
                      ↓
            Botón Editar → Formulario → Guardar → Detalle
                      ↓
            Botón Crear (en lista) → Formulario → Guardar → Detalle
```

### 4. Páginas de Lista
- Mostrar tabla paginada con datos esenciales
- NO mostrar botones de editar/borrar en cada fila
- Click en cualquier parte de la fila → navega al detalle
- Botón "Nuevo" en la cabecera
- Filtros y búsqueda
- KPI cards en la parte superior (opcional)

### 5. Páginas de Detalle
- Header con título y acciones (Editar, Eliminar)
- Tabs para organizar información relacionada
- Información principal en el primer tab
- Datos relacionados en otros tabs
- Acciones sensibles (eliminar) requieren confirmación

### 6. Páginas de Formulario
- Formulario de página completa
- Validación con Zod + React Hook Form
- Mensajes de error claros por campo
- Botones: Cancelar (vuelve atrás), Guardar
- Después de guardar → notificación + redirect a detalle

---

## 🔐 Sistema de Permisos

### Formato de Permisos
```
{modulo}:{accion}[:{campo}]

Ejemplos:
- wells:read           # Leer pozos
- wells:create         # Crear pozos
- wells:update         # Actualizar pozos
- wells:delete         # Eliminar pozos
- wells:read:payroll   # Leer info de nómina de pozos
- wells:*              # Todas las acciones en pozos
- *:*                  # Super admin
```

### Hooks de Permisos
```typescript
// Verificar un permiso
const canRead = usePermission('wells:read');

// Verificar múltiples permisos (cualquiera)
const canEdit = useAnyPermission(['wells:update', 'wells:*']);

// Verificar todos los permisos
const canManage = useAllPermissions(['wells:create', 'wells:update', 'wells:delete']);

// Es super admin
const isSuperAdmin = useIsSuperAdmin();
```

### Componentes de Permisos
```tsx
// Mostrar solo si tiene permiso
<PermissionGate permission="wells:create">
  <Button>Crear Pozo</Button>
</PermissionGate>

// Mostrar solo si tiene al menos uno
<PermissionGate permissions={['wells:update', 'wells:delete']} requireAll={false}>
  <ActionButtons />
</PermissionGate>

// Mostrar solo si tiene todos
<PermissionGate permissions={['admin:*']} requireAll>
  <AdminPanel />
</PermissionGate>

// Shorthand para botones de acción
<CanDo permission="wells:delete">
  <Button color="error">Eliminar</Button>
</CanDo>
```

### Estructura de Permisos por Módulo
```typescript
const MODULE_PERMISSIONS = {
  wells: {
    read: 'wells:read',
    create: 'wells:create',
    update: 'wells:update',
    delete: 'wells:delete',
  },
  wellTests: {
    read: 'well-tests:read',
    create: 'well-tests:create',
    update: 'well-tests:update',
    delete: 'well-tests:delete',
    calculate: 'well-tests:calculate',
  },
  // ...
};
```

---

## 🌐 Sistema de Traducciones

### Estructura por Módulo
```
/src/i18n/
├── index.ts                 # Configuración de i18next
├── locales/
│   ├── es/
│   │   ├── common.json      # Textos comunes
│   │   ├── wells.json       # Módulo pozos
│   │   ├── well-tests.json  # Módulo well testing
│   │   ├── drilling.json    # Módulo drilling
│   │   └── ...
│   ├── en/
│   │   └── ...
│   └── pt/
│       └── ...
```

### Uso en Componentes
```tsx
import { useTranslation } from 'react-i18next';

function WellsList() {
  const { t } = useTranslation('wells'); // Namespace del módulo
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <Button>{t('actions.create')}</Button>
    </div>
  );
}
```

### Estructura de Archivo de Traducción
```json
{
  "title": "Pozos",
  "subtitle": "Gestión de pozos petroleros",
  "fields": {
    "name": "Nombre",
    "status": "Estado",
    "type": "Tipo"
  },
  "actions": {
    "create": "Crear Pozo",
    "edit": "Editar",
    "delete": "Eliminar",
    "view": "Ver Detalle"
  },
  "messages": {
    "createSuccess": "Pozo creado exitosamente",
    "updateSuccess": "Pozo actualizado exitosamente",
    "deleteSuccess": "Pozo eliminado exitosamente",
    "deleteConfirm": "¿Está seguro de eliminar este pozo?"
  },
  "status": {
    "active": "Activo",
    "inactive": "Inactivo",
    "maintenance": "En Mantenimiento"
  }
}
```

---

## 🍞 Breadcrumbs (Migas de Pan)

### Componente Breadcrumb
```tsx
<Breadcrumbs items={[
  { label: t('common.home'), href: '/dashboard' },
  { label: t('wells.title'), href: '/wells' },
  { label: well.name }, // Sin href = página actual
]} />
```

### Integración Automática
Cada página de detalle y formulario debe incluir breadcrumbs:
```tsx
// En WellDetail.tsx
<Breadcrumbs items={[
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Pozos', href: '/wells' },
  { label: well?.name || 'Cargando...' },
]} />

// En WellForm.tsx (crear)
<Breadcrumbs items={[
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Pozos', href: '/wells' },
  { label: 'Nuevo Pozo' },
]} />

// En WellForm.tsx (editar)
<Breadcrumbs items={[
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Pozos', href: '/wells' },
  { label: well?.name, href: `/wells/${id}` },
  { label: 'Editar' },
]} />
```

---

## 🔔 Sistema de Notificaciones

### Toast Notifications
```tsx
import { toast } from 'sonner'; // o react-toastify

// Éxito
toast.success(t('messages.createSuccess'));

// Error
toast.error(t('messages.createError'));

// Warning
toast.warning(t('messages.warning'));

// Info
toast.info(t('messages.info'));

// Con acción
toast.success(t('messages.createSuccess'), {
  action: {
    label: 'Ver',
    onClick: () => navigate(`/wells/${id}`),
  },
});
```

### Cuándo Mostrar Notificaciones
- ✅ Después de crear un registro
- ✅ Después de actualizar un registro
- ✅ Después de eliminar un registro
- ✅ En errores de API
- ✅ En errores de validación del servidor
- ❌ NO en errores de validación de formulario (mostrar inline)

---

## 📝 Validación de Formularios

### Stack de Validación
- **Zod**: Definición de schemas
- **React Hook Form**: Gestión de formularios
- **@hookform/resolvers**: Integración Zod + RHF

### Estructura de Schema
```typescript
// wells.schema.ts
import { z } from 'zod';

export const wellSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  status: z.enum(['active', 'inactive', 'maintenance']),
  reservoirId: z.string().uuid('Seleccione un yacimiento válido'),
  depth: z.number().positive('La profundidad debe ser positiva').optional(),
  coordinates: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }).optional(),
});

export type WellFormData = z.infer<typeof wellSchema>;
```

### Uso en Formularios
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { wellSchema, WellFormData } from './wells.schema';

function WellForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WellFormData>({
    resolver: zodResolver(wellSchema),
  });

  const onSubmit = async (data: WellFormData) => {
    try {
      await createWell(data);
      toast.success('Pozo creado exitosamente');
      navigate(`/wells/${newId}`);
    } catch (error) {
      toast.error('Error al crear el pozo');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input
        {...register('name')}
        error={!!errors.name}
        helperText={errors.name?.message}
      />
      {/* ... */}
    </form>
  );
}
```

---

## 📁 Estructura de Archivos por Módulo

```
/src/features/{modulo}/
├── api/
│   └── {modulo}.api.ts       # React Query hooks
├── components/
│   ├── {Modulo}Table.tsx     # Tabla de datos
│   ├── {Modulo}Filters.tsx   # Filtros
│   ├── {Modulo}Stats.tsx     # KPI cards
│   └── {Modulo}Tabs.tsx      # Tabs del detalle
├── hooks/
│   └── use{Modulo}.ts        # Custom hooks
├── i18n/
│   ├── es.json               # Traducciones ES
│   ├── en.json               # Traducciones EN
│   └── index.ts              # Loader
├── pages/
│   ├── {Modulo}List.tsx      # Página de lista
│   ├── {Modulo}Detail.tsx    # Página de detalle
│   └── {Modulo}Form.tsx      # Página de formulario
├── schemas/
│   └── {modulo}.schema.ts    # Zod schemas
├── types/
│   └── {modulo}.types.ts     # TypeScript types
├── constants/
│   └── {modulo}.constants.ts # Constantes y enums
└── index.ts                  # Barrel exports
```

---

## 🎯 Checklist de Implementación por Módulo

### Lista (List Page)
- [ ] Breadcrumbs
- [ ] Título y subtítulo traducidos
- [ ] Botón "Crear" con PermissionGate
- [ ] Filtros y búsqueda
- [ ] Tabla paginada
- [ ] Click en fila → navega al detalle
- [ ] KPI cards (opcional)
- [ ] Loading state
- [ ] Empty state

### Detalle (Detail Page)
- [ ] Breadcrumbs
- [ ] Header con título y acciones
- [ ] Botón Editar con PermissionGate
- [ ] Botón Eliminar con PermissionGate y confirmación
- [ ] Tabs para información relacionada
- [ ] Loading state
- [ ] 404 state

### Formulario (Form Page)
- [ ] Breadcrumbs
- [ ] Título (Crear/Editar)
- [ ] Formulario con React Hook Form
- [ ] Validación con Zod
- [ ] Mensajes de error inline
- [ ] Botón Cancelar → vuelve atrás
- [ ] Botón Guardar → crea/actualiza y redirige
- [ ] Toast de éxito/error
- [ ] Loading state en botón

---

## 🚀 Roadmap de Implementación

### Fase 1: Infraestructura Base (Prioridad Alta)
1. [ ] Implementar sistema de permisos (hooks + componentes)
2. [ ] Implementar sistema de traducciones por módulo
3. [ ] Implementar componente Breadcrumbs
4. [ ] Configurar sistema de notificaciones (sonner/react-toastify)
5. [ ] Crear componentes base reutilizables

### Fase 2: Refactorizar Módulo Piloto (Yacimientos)
1. [ ] Refactorizar BasinsList → BasinsListPage (sin modales)
2. [ ] Crear BasinsDetailPage con tabs
3. [ ] Crear BasinsFormPage con validación
4. [ ] Implementar breadcrumbs en todas las páginas
5. [ ] Agregar traducciones para el módulo
6. [ ] Implementar permisos en acciones

### Fase 3: Aplicar a Otros Módulos
1. [ ] Wells (Pozos)
2. [ ] Well Testing
3. [ ] Edge Gateway
4. [ ] Drilling
5. [ ] Digital Twins

### Fase 4: Mejoras de UX
1. [ ] Loading skeletons
2. [ ] Confirmación de navegación con cambios sin guardar
3. [ ] Atajos de teclado
4. [ ] Accesibilidad (a11y)

---

## 📚 Referencias

- Proyecto ERP de referencia: `/home/diazhh/dev/erp/frontend`
- Documentación React Hook Form: https://react-hook-form.com
- Documentación Zod: https://zod.dev
- Documentación i18next: https://react.i18next.com
- Documentación Sonner: https://sonner.emilkowal.ski

---

**Última actualización**: 2026-01-09  
**Responsable**: Sistema
