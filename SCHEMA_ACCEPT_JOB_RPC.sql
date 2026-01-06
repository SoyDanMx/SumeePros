-- =====================================================
-- SCHEMA: Función RPC para Aceptación Atómica de Trabajos
-- =====================================================
-- Solución innovadora para aceptación de trabajos sin fricciones
-- Usa transacciones atómicas para prevenir race conditions

-- Función RPC para aceptar trabajo de forma atómica
CREATE OR REPLACE FUNCTION accept_job_atomic(
    p_job_id UUID,
    p_professional_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_job_record RECORD;
    v_result JSONB;
    v_now TIMESTAMP WITH TIME ZONE := NOW();
    v_update_count INTEGER;
BEGIN
    -- 1. Validación: Verificar que el trabajo existe y está disponible
    SELECT 
        id,
        status,
        professional_id,
        estado,
        nombre_cliente,
        whatsapp,
        descripcion_proyecto
    INTO v_job_record
    FROM leads
    WHERE id = p_job_id
    FOR UPDATE; -- Lock the row to prevent concurrent updates

    -- Si no existe el trabajo
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', jsonb_build_object(
                'code', 'JOB_NOT_FOUND',
                'message', 'El trabajo no existe o ya fue eliminado.'
            )
        );
    END IF;

    -- 2. Validación: Verificar que el trabajo está pendiente
    IF v_job_record.status != 'pending' THEN
        -- Si ya fue aceptado por este usuario, retornar éxito
        IF v_job_record.status = 'accepted' AND v_job_record.professional_id = p_professional_id THEN
            RETURN jsonb_build_object(
                'success', true,
                'data', jsonb_build_object(
                    'id', v_job_record.id,
                    'status', 'accepted',
                    'professional_id', v_job_record.professional_id,
                    'message', 'Trabajo ya aceptado por ti.'
                ),
                'already_accepted', true
            );
        END IF;

        -- Si fue aceptado por otro usuario
        IF v_job_record.status = 'accepted' AND v_job_record.professional_id IS NOT NULL AND v_job_record.professional_id != p_professional_id THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', jsonb_build_object(
                    'code', 'JOB_ALREADY_ACCEPTED',
                    'message', 'Este trabajo ya fue aceptado por otro técnico.'
                )
            );
        END IF;

        -- Otro estado no válido
        RETURN jsonb_build_object(
            'success', false,
            'error', jsonb_build_object(
                'code', 'JOB_NOT_AVAILABLE',
                'message', 'Este trabajo no está disponible para aceptar.'
            )
        );
    END IF;

    -- 3. Validación: Verificar que professional_id es NULL (no asignado)
    IF v_job_record.professional_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', jsonb_build_object(
                'code', 'JOB_ALREADY_ASSIGNED',
                'message', 'Este trabajo ya tiene un técnico asignado.'
            )
        );
    END IF;

    -- 4. Actualización atómica con todos los campos necesarios
    UPDATE leads
    SET
        -- Campos principales
        status = 'accepted',
        professional_id = p_professional_id,
        updated_at = v_now,
        
        -- Campos legacy (si existen)
        estado = COALESCE(estado, 'Asignado'),
        profesional_asignado_id = COALESCE(profesional_asignado_id, p_professional_id),
        fecha_asignacion = COALESCE(fecha_asignacion, v_now),
        
        -- Timestamps granulares (si existen)
        accepted_at = COALESCE(accepted_at, v_now)
    WHERE id = p_job_id
        AND status = 'pending'
        AND professional_id IS NULL;

    GET DIAGNOSTICS v_update_count = ROW_COUNT;

    -- 5. Verificar que la actualización fue exitosa
    IF v_update_count = 0 THEN
        -- Race condition: otro proceso aceptó el trabajo primero
        SELECT status, professional_id
        INTO v_job_record
        FROM leads
        WHERE id = p_job_id;

        IF v_job_record.status = 'accepted' AND v_job_record.professional_id = p_professional_id THEN
            -- Fue aceptado por este usuario (race condition resuelta)
            RETURN jsonb_build_object(
                'success', true,
                'data', jsonb_build_object(
                    'id', p_job_id,
                    'status', 'accepted',
                    'professional_id', p_professional_id
                ),
                'race_condition_resolved', true
            );
        END IF;

        IF v_job_record.status = 'accepted' AND v_job_record.professional_id != p_professional_id THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', jsonb_build_object(
                    'code', 'JOB_ALREADY_ACCEPTED',
                    'message', 'Este trabajo fue aceptado por otro técnico justo ahora.'
                )
            );
        END IF;

        RETURN jsonb_build_object(
            'success', false,
            'error', jsonb_build_object(
                'code', 'UPDATE_FAILED',
                'message', 'No se pudo actualizar el trabajo. Por favor, intenta de nuevo.'
            )
        );
    END IF;

    -- 6. Obtener el trabajo actualizado
    SELECT *
    INTO v_job_record
    FROM leads
    WHERE id = p_job_id;

    -- 7. Retornar éxito con datos del trabajo
    RETURN jsonb_build_object(
        'success', true,
        'data', jsonb_build_object(
            'id', v_job_record.id,
            'status', v_job_record.status,
            'professional_id', v_job_record.professional_id,
            'updated_at', v_job_record.updated_at,
            'accepted_at', v_job_record.accepted_at,
            'client_name', v_job_record.nombre_cliente,
            'client_phone', v_job_record.whatsapp,
            'description', v_job_record.descripcion_proyecto
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        -- Manejo de errores inesperados
        RETURN jsonb_build_object(
            'success', false,
            'error', jsonb_build_object(
                'code', 'INTERNAL_ERROR',
                'message', 'Error interno al aceptar el trabajo: ' || SQLERRM
            )
        );
END;
$$;

-- Comentario de la función
COMMENT ON FUNCTION accept_job_atomic IS 'Acepta un trabajo de forma atómica, previniendo race conditions y garantizando consistencia de datos';

-- Permisos: Solo profesionales autenticados pueden ejecutar
GRANT EXECUTE ON FUNCTION accept_job_atomic TO authenticated;

-- =====================================================
-- Índices para optimizar la función
-- =====================================================

-- Índice compuesto para búsquedas rápidas de trabajos pendientes
CREATE INDEX IF NOT EXISTS idx_leads_pending_available 
ON leads(status, professional_id) 
WHERE status = 'pending' AND professional_id IS NULL;

-- Índice para búsquedas por professional_id
CREATE INDEX IF NOT EXISTS idx_leads_professional_id 
ON leads(professional_id) 
WHERE professional_id IS NOT NULL;

-- =====================================================
-- Trigger para notificaciones (opcional)
-- =====================================================

-- Función para notificar al cliente cuando se acepta un trabajo
CREATE OR REPLACE FUNCTION notify_job_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Aquí puedes agregar lógica para notificar al cliente
    -- Por ejemplo, insertar en una tabla de notificaciones
    -- o llamar a un webhook
    
    -- Ejemplo: Insertar notificación
    -- INSERT INTO notifications (user_id, type, message, data)
    -- VALUES (
    --     NEW.client_id,
    --     'job_accepted',
    --     'Un técnico ha aceptado tu trabajo',
    --     jsonb_build_object('job_id', NEW.id, 'professional_id', NEW.professional_id)
    -- );
    
    RETURN NEW;
END;
$$;

-- Trigger que se ejecuta cuando se acepta un trabajo
DROP TRIGGER IF EXISTS trigger_notify_job_accepted ON leads;
CREATE TRIGGER trigger_notify_job_accepted
AFTER UPDATE ON leads
FOR EACH ROW
WHEN (OLD.status = 'pending' AND NEW.status = 'accepted' AND NEW.professional_id IS NOT NULL)
EXECUTE FUNCTION notify_job_accepted();

