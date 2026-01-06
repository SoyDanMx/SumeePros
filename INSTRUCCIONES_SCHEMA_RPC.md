# 📋 Instrucciones: Instalación del Schema RPC para Aceptación de Trabajos

## 🎯 Objetivo

Instalar la función RPC `accept_job_atomic` en Supabase para habilitar la aceptación atómica de trabajos sin fricciones.

---

## 📝 Pasos de Instalación

### **1. Acceder a Supabase SQL Editor**

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **SQL Editor** en el menú lateral
3. Haz clic en **New Query**

### **2. Ejecutar el Schema**

1. Abre el archivo `SCHEMA_ACCEPT_JOB_RPC.sql` en tu editor
2. Copia todo el contenido del archivo
3. Pega el contenido en el SQL Editor de Supabase
4. Haz clic en **Run** (o presiona `Cmd/Ctrl + Enter`)

### **3. Verificar Instalación**

Ejecuta esta query para verificar que la función fue creada:

```sql
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'accept_job_atomic';
```

**Resultado esperado:**
```
routine_name        | routine_type | data_type
--------------------+--------------+-----------
accept_job_atomic   | FUNCTION     | jsonb
```

### **4. Verificar Permisos**

Ejecuta esta query para verificar los permisos:

```sql
SELECT 
    grantee,
    privilege_type
FROM information_schema.role_routine_grants
WHERE routine_schema = 'public'
AND routine_name = 'accept_job_atomic';
```

**Resultado esperado:**
```
grantee      | privilege_type
-------------+----------------
authenticated| EXECUTE
```

### **5. Verificar Índices**

Ejecuta esta query para verificar los índices:

```sql
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'leads'
AND indexname IN (
    'idx_leads_pending_available',
    'idx_leads_professional_id'
);
```

**Resultado esperado:**
```
indexname                    | indexdef
-----------------------------+----------------------------------------
idx_leads_pending_available  | CREATE INDEX ... WHERE status = 'pending' ...
idx_leads_professional_id    | CREATE INDEX ... WHERE professional_id IS NOT NULL
```

---

## ✅ Verificación Funcional

### **Test 1: Función Existe y Funciona**

```sql
-- Intentar aceptar un trabajo de prueba (debe fallar si no existe)
SELECT accept_job_atomic(
    '00000000-0000-0000-0000-000000000000'::UUID,
    '00000000-0000-0000-0000-000000000000'::UUID
);
```

**Resultado esperado:**
```json
{
    "success": false,
    "error": {
        "code": "JOB_NOT_FOUND",
        "message": "El trabajo no existe o ya fue eliminado."
    }
}
```

### **Test 2: Validar Estructura de Retorno**

La función debe retornar un JSONB con esta estructura:

```json
{
    "success": true | false,
    "data": { ... } | null,
    "error": { "code": "...", "message": "..." } | null,
    "already_accepted": true | false | null,
    "race_condition_resolved": true | false | null
}
```

---

## 🔧 Troubleshooting

### **Error: "function does not exist"**

**Causa:** La función no fue creada correctamente.

**Solución:**
1. Verifica que ejecutaste todo el contenido del archivo SQL
2. Revisa los logs de error en Supabase
3. Asegúrate de que no hay errores de sintaxis

### **Error: "permission denied"**

**Causa:** Los permisos no fueron otorgados correctamente.

**Solución:**
```sql
-- Otorgar permisos manualmente
GRANT EXECUTE ON FUNCTION accept_job_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION accept_job_atomic TO anon; -- Si es necesario
```

### **Error: "relation does not exist"**

**Causa:** La tabla `leads` no existe o tiene otro nombre.

**Solución:**
1. Verifica el nombre de la tabla en tu base de datos
2. Actualiza el schema para usar el nombre correcto
3. O renombra la tabla a `leads`

### **Índices no creados**

**Causa:** Los índices pueden fallar si ya existen o hay conflictos.

**Solución:**
```sql
-- Eliminar índices existentes y recrearlos
DROP INDEX IF EXISTS idx_leads_pending_available;
DROP INDEX IF EXISTS idx_leads_professional_id;

-- Luego ejecutar la sección de índices del schema nuevamente
```

---

## 📊 Monitoreo Post-Instalación

### **1. Verificar Uso de la Función**

```sql
-- Ver logs de ejecución (si tienes logging habilitado)
SELECT * FROM pg_stat_user_functions
WHERE funcname = 'accept_job_atomic';
```

### **2. Monitorear Performance**

```sql
-- Ver estadísticas de la función
SELECT 
    schemaname,
    funcname,
    calls,
    total_time,
    mean_time
FROM pg_stat_user_functions
WHERE funcname = 'accept_job_atomic';
```

### **3. Verificar Locks**

```sql
-- Ver si hay locks en la tabla leads
SELECT 
    locktype,
    relation::regclass,
    mode,
    granted
FROM pg_locks
WHERE relation = 'leads'::regclass;
```

---

## 🚀 Próximos Pasos

Una vez instalado el schema:

1. ✅ **Probar aceptación** de un trabajo desde la app
2. ✅ **Verificar logs** en la consola del navegador
3. ✅ **Monitorear performance** en Supabase Dashboard
4. ✅ **Recopilar feedback** de usuarios

---

## 📝 Notas Importantes

- ⚠️ **Backup:** Siempre haz backup de tu base de datos antes de ejecutar schemas
- ⚠️ **Testing:** Prueba primero en un ambiente de desarrollo
- ⚠️ **Rollback:** Guarda el schema anterior por si necesitas revertir
- ✅ **Seguridad:** La función usa `SECURITY DEFINER` para garantizar permisos correctos

---

*Instrucciones de Instalación del Schema RPC* 📋

