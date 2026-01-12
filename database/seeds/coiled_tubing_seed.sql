-- =====================================================
-- COILED TUBING MODULE - SEED DATA
-- =====================================================
-- Versión: 1.0
-- Fecha: 2026-01-12
-- Descripción: Datos de prueba para módulo Coiled Tubing
--
-- IMPORTANTE: Este seed asume que ya existen:
--   - Tenant ACME Petroleum
--   - Usuarios (admin, engineer, operator)
--   - Wells y Fields
-- =====================================================

-- Variables para referencias
-- Obtener tenant_id de ACME Petroleum
DO $$
DECLARE
    v_tenant_id UUID;
    v_admin_id UUID;
    v_engineer_id UUID;
    v_operator_id UUID;
    v_field_id UUID;
    v_well_1_id UUID;
    v_well_2_id UUID;
    v_well_3_id UUID;
    v_well_4_id UUID;
    
    -- CT Units
    v_unit_1_id UUID;
    v_unit_2_id UUID;
    v_unit_3_id UUID;
    
    -- CT Reels
    v_reel_1_id UUID;
    v_reel_2_id UUID;
    v_reel_3_id UUID;
    v_reel_4_id UUID;
    v_reel_5_id UUID;
    v_reel_6_id UUID;
    
    -- CT Jobs
    v_job_1_id UUID;
    v_job_2_id UUID;
    v_job_3_id UUID;
    v_job_4_id UUID;
    v_job_5_id UUID;
    v_job_6_id UUID;
    v_job_7_id UUID;
    v_job_8_id UUID;
    v_job_9_id UUID;
    v_job_10_id UUID;
    v_job_11_id UUID;
    v_job_12_id UUID;
    
    -- BHA IDs
    v_bha_1_id UUID;
    v_bha_2_id UUID;
    v_bha_3_id UUID;
    v_bha_4_id UUID;
    v_bha_5_id UUID;
    
BEGIN
    -- Obtener IDs de referencias existentes
    SELECT id INTO v_tenant_id FROM tenants WHERE name = 'ACME Petroleum' LIMIT 1;
    SELECT id INTO v_admin_id FROM users WHERE email = 'admin@acme-petroleum.com' LIMIT 1;
    SELECT id INTO v_engineer_id FROM users WHERE email = 'engineer@acme-petroleum.com' LIMIT 1;
    SELECT id INTO v_operator_id FROM users WHERE email = 'operator@acme-petroleum.com' LIMIT 1;
    
    -- Obtener field y wells (asumiendo que existen de seeds anteriores)
    SELECT id INTO v_field_id FROM fields WHERE tenant_id = v_tenant_id LIMIT 1;
    SELECT id INTO v_well_1_id FROM wells WHERE tenant_id = v_tenant_id ORDER BY created_at LIMIT 1 OFFSET 0;
    SELECT id INTO v_well_2_id FROM wells WHERE tenant_id = v_tenant_id ORDER BY created_at LIMIT 1 OFFSET 1;
    SELECT id INTO v_well_3_id FROM wells WHERE tenant_id = v_tenant_id ORDER BY created_at LIMIT 1 OFFSET 2;
    SELECT id INTO v_well_4_id FROM wells WHERE tenant_id = v_tenant_id ORDER BY created_at LIMIT 1 OFFSET 3;
    
    -- Si no existen wells, crear algunas básicas para el seed
    IF v_well_1_id IS NULL THEN
        INSERT INTO wells (id, tenant_id, well_name, well_number, field_id, status, created_by)
        VALUES 
            (gen_random_uuid(), v_tenant_id, 'PDC-15', 'PDC-015', v_field_id, 'active', v_admin_id),
            (gen_random_uuid(), v_tenant_id, 'VEN-08', 'VEN-008', v_field_id, 'active', v_admin_id),
            (gen_random_uuid(), v_tenant_id, 'PET-23', 'PET-023', v_field_id, 'active', v_admin_id),
            (gen_random_uuid(), v_tenant_id, 'MOR-042', 'MOR-042', v_field_id, 'active', v_admin_id)
        RETURNING id INTO v_well_1_id;
        
        SELECT id INTO v_well_2_id FROM wells WHERE well_number = 'VEN-008';
        SELECT id INTO v_well_3_id FROM wells WHERE well_number = 'PET-023';
        SELECT id INTO v_well_4_id FROM wells WHERE well_number = 'MOR-042';
    END IF;

    -- =====================================================
    -- 1. CT UNITS (3 unidades de diferentes capacidades)
    -- =====================================================
    
    RAISE NOTICE 'Insertando CT Units...';
    
    -- Unit 1: 60K lbs, disponible
    INSERT INTO ct_units (
        id, tenant_id, unit_number, manufacturer, model, serial_number, year_manufactured,
        injector_capacity_lbs, max_speed_ft_min, pump_hp, max_pressure_psi, max_flow_rate_bpm,
        status, location, last_inspection_date, next_inspection_date, certification_status,
        created_by, updated_by
    ) VALUES (
        gen_random_uuid(), v_tenant_id, 'CT-UNIT-01', 'NOV', 'CT-60K', 'NOV-CT-60K-2020-001', 2020,
        60000, 100, 800, 5000, 4.0,
        'AVAILABLE', 'Base Maturín', '2026-01-01', '2026-04-01', 'VALID',
        v_admin_id, v_admin_id
    ) RETURNING id INTO v_unit_1_id;
    
    -- Unit 2: 80K lbs, en servicio
    INSERT INTO ct_units (
        id, tenant_id, unit_number, manufacturer, model, serial_number, year_manufactured,
        injector_capacity_lbs, max_speed_ft_min, pump_hp, max_pressure_psi, max_flow_rate_bpm,
        status, location, last_inspection_date, next_inspection_date, certification_status,
        created_by, updated_by
    ) VALUES (
        gen_random_uuid(), v_tenant_id, 'CT-UNIT-02', 'Schlumberger', 'FlexRig-80', 'SLB-FR80-2021-042', 2021,
        80000, 120, 1000, 6000, 5.0,
        'IN_SERVICE', 'Campo Morichal', '2025-12-15', '2026-03-15', 'VALID',
        v_admin_id, v_admin_id
    ) RETURNING id INTO v_unit_2_id;
    
    -- Unit 3: 100K lbs, mantenimiento
    INSERT INTO ct_units (
        id, tenant_id, unit_number, manufacturer, model, serial_number, year_manufactured,
        injector_capacity_lbs, max_speed_ft_min, pump_hp, max_pressure_psi, max_flow_rate_bpm,
        status, location, last_inspection_date, next_inspection_date, certification_status,
        created_by, updated_by
    ) VALUES (
        gen_random_uuid(), v_tenant_id, 'CT-UNIT-03', 'Baker Hughes', 'CT-100K-Elite', 'BH-CT100-2022-018', 2022,
        100000, 150, 1200, 7500, 6.0,
        'MAINTENANCE', 'Taller Puerto La Cruz', '2025-11-20', '2026-02-20', 'VALID',
        v_admin_id, v_admin_id
    ) RETURNING id INTO v_unit_3_id;

    RAISE NOTICE 'CT Units insertadas: %, %, %', v_unit_1_id, v_unit_2_id, v_unit_3_id;

    -- =====================================================
    -- 2. CT REELS (6 carretes de diferentes especificaciones)
    -- =====================================================
    
    RAISE NOTICE 'Insertando CT Reels...';
    
    -- Reel 1: 1.5" CT80, alta fatiga (asignado a Unit 2)
    INSERT INTO ct_reels (
        id, tenant_id, ct_unit_id, reel_number, serial_number, manufacturer,
        outer_diameter_in, wall_thickness_in, inner_diameter_in, steel_grade, yield_strength_psi,
        total_length_ft, usable_length_ft, weight_per_ft_lbs,
        fatigue_percentage, total_cycles, total_pressure_cycles, last_fatigue_calculation,
        manufacture_date, first_use_date, last_cut_date, cut_history_ft,
        status, condition,
        created_by, updated_by
    ) VALUES (
        gen_random_uuid(), v_tenant_id, v_unit_2_id, 'R-2024-008', 'CT-R-2024-008-SN', 'NOV',
        1.500, 0.109, 1.282, 'CT80', 80000,
        18500, 18000, 1.89,
        87.5, 4250, 1850, NOW() - INTERVAL '2 days',
        '2024-03-15', '2024-04-01', '2025-11-10', 500,
        'IN_USE', 'CRITICAL',
        v_admin_id, v_admin_id
    ) RETURNING id INTO v_reel_1_id;
    
    -- Reel 2: 1.75" CT90, fatiga media
    INSERT INTO ct_reels (
        id, tenant_id, ct_unit_id, reel_number, serial_number, manufacturer,
        outer_diameter_in, wall_thickness_in, inner_diameter_in, steel_grade, yield_strength_psi,
        total_length_ft, usable_length_ft, weight_per_ft_lbs,
        fatigue_percentage, total_cycles, total_pressure_cycles, last_fatigue_calculation,
        manufacture_date, first_use_date, cut_history_ft,
        status, condition,
        created_by, updated_by
    ) VALUES (
        gen_random_uuid(), v_tenant_id, v_unit_1_id, 'R-2024-012', 'CT-R-2024-012-SN', 'Schlumberger',
        1.750, 0.125, 1.500, 'CT90', 90000,
        20000, 19500, 2.45,
        72.3, 3100, 1420, NOW() - INTERVAL '1 day',
        '2024-06-20', '2024-07-05', 500,
        'AVAILABLE', 'FAIR',
        v_admin_id, v_admin_id
    ) RETURNING id INTO v_reel_2_id;
    
    -- Reel 3: 2.0" CT100, baja fatiga
    INSERT INTO ct_reels (
        id, tenant_id, ct_unit_id, reel_number, serial_number, manufacturer,
        outer_diameter_in, wall_thickness_in, inner_diameter_in, steel_grade, yield_strength_psi,
        total_length_ft, usable_length_ft, weight_per_ft_lbs,
        fatigue_percentage, total_cycles, total_pressure_cycles, last_fatigue_calculation,
        manufacture_date, first_use_date,
        status, condition,
        created_by, updated_by
    ) VALUES (
        gen_random_uuid(), v_tenant_id, v_unit_3_id, 'R-2025-003', 'CT-R-2025-003-SN', 'Baker Hughes',
        2.000, 0.134, 1.732, 'CT100', 100000,
        22000, 22000, 3.22,
        28.5, 980, 450, NOW() - INTERVAL '12 hours',
        '2025-02-10', '2025-03-01',
        'MAINTENANCE', 'GOOD',
        v_admin_id, v_admin_id
    ) RETURNING id INTO v_reel_3_id;
    
    -- Reel 4: 1.5" CT80, fatiga media-alta
    INSERT INTO ct_reels (
        id, tenant_id, reel_number, serial_number, manufacturer,
        outer_diameter_in, wall_thickness_in, inner_diameter_in, steel_grade, yield_strength_psi,
        total_length_ft, usable_length_ft, weight_per_ft_lbs,
        fatigue_percentage, total_cycles, total_pressure_cycles, last_fatigue_calculation,
        manufacture_date, first_use_date, last_cut_date, cut_history_ft,
        status, condition,
        created_by, updated_by
    ) VALUES (
        gen_random_uuid(), v_tenant_id, 'R-2024-015', 'CT-R-2024-015-SN', 'NOV',
        1.500, 0.109, 1.282, 'CT80', 80000,
        19000, 18200, 1.89,
        68.2, 2850, 1320, NOW() - INTERVAL '3 days',
        '2024-05-12', '2024-06-01', '2025-10-05', 800,
        'AVAILABLE', 'FAIR',
        v_admin_id, v_admin_id
    ) RETURNING id INTO v_reel_4_id;
    
    -- Reel 5: 1.75" CT90, nueva
    INSERT INTO ct_reels (
        id, tenant_id, reel_number, serial_number, manufacturer,
        outer_diameter_in, wall_thickness_in, inner_diameter_in, steel_grade, yield_strength_psi,
        total_length_ft, usable_length_ft, weight_per_ft_lbs,
        fatigue_percentage, total_cycles, total_pressure_cycles, last_fatigue_calculation,
        manufacture_date, first_use_date,
        status, condition,
        created_by, updated_by
    ) VALUES (
        gen_random_uuid(), v_tenant_id, 'R-2025-018', 'CT-R-2025-018-SN', 'Schlumberger',
        1.750, 0.125, 1.500, 'CT90', 90000,
        20000, 20000, 2.45,
        12.0, 420, 180, NOW() - INTERVAL '6 hours',
        '2025-10-15', '2025-11-01',
        'AVAILABLE', 'GOOD',
        v_admin_id, v_admin_id
    ) RETURNING id INTO v_reel_5_id;
    
    -- Reel 6: 2.0" CT110, alta capacidad
    INSERT INTO ct_reels (
        id, tenant_id, reel_number, serial_number, manufacturer,
        outer_diameter_in, wall_thickness_in, inner_diameter_in, steel_grade, yield_strength_psi,
        total_length_ft, usable_length_ft, weight_per_ft_lbs,
        fatigue_percentage, total_cycles, total_pressure_cycles, last_fatigue_calculation,
        manufacture_date, first_use_date,
        status, condition,
        created_by, updated_by
    ) VALUES (
        gen_random_uuid(), v_tenant_id, 'R-2025-020', 'CT-R-2025-020-SN', 'Baker Hughes',
        2.000, 0.156, 1.688, 'CT110', 110000,
        21000, 21000, 3.55,
        15.8, 550, 240, NOW() - INTERVAL '18 hours',
        '2025-08-20', '2025-09-10',
        'AVAILABLE', 'GOOD',
        v_admin_id, v_admin_id
    ) RETURNING id INTO v_reel_6_id;

    RAISE NOTICE 'CT Reels insertados: 6 reels';

    -- =====================================================
    -- 3. REEL SECTIONS (Secciones de fatiga para reels críticos)
    -- =====================================================
    
    RAISE NOTICE 'Insertando secciones de fatiga...';
    
    -- Secciones para Reel 1 (alta fatiga - crítico)
    INSERT INTO ct_reel_sections (reel_id, section_number, start_depth_ft, end_depth_ft, length_ft, fatigue_percentage, bending_cycles, pressure_cycles, combined_damage, status)
    VALUES 
        (v_reel_1_id, 1, 0, 2000, 2000, 95.2, 850, 425, 0.952, 'CRITICAL'),
        (v_reel_1_id, 2, 2000, 4000, 2000, 87.5, 720, 380, 0.875, 'CRITICAL'),
        (v_reel_1_id, 3, 4000, 6000, 2000, 78.3, 640, 340, 0.783, 'WARNING'),
        (v_reel_1_id, 4, 6000, 8000, 2000, 68.5, 580, 295, 0.685, 'WARNING'),
        (v_reel_1_id, 5, 8000, 10000, 2000, 58.2, 520, 260, 0.582, 'WARNING'),
        (v_reel_1_id, 6, 10000, 12000, 2000, 48.7, 450, 220, 0.487, 'ACTIVE'),
        (v_reel_1_id, 7, 12000, 14000, 2000, 38.1, 390, 180, 0.381, 'ACTIVE'),
        (v_reel_1_id, 8, 14000, 16000, 2000, 28.5, 320, 145, 0.285, 'ACTIVE'),
        (v_reel_1_id, 9, 16000, 18000, 2000, 18.2, 250, 110, 0.182, 'ACTIVE');
    
    -- Secciones para Reel 2 (fatiga media)
    INSERT INTO ct_reel_sections (reel_id, section_number, start_depth_ft, end_depth_ft, length_ft, fatigue_percentage, bending_cycles, pressure_cycles, combined_damage, status)
    VALUES 
        (v_reel_2_id, 1, 0, 2500, 2500, 82.1, 620, 310, 0.821, 'WARNING'),
        (v_reel_2_id, 2, 2500, 5000, 2500, 72.3, 550, 275, 0.723, 'WARNING'),
        (v_reel_2_id, 3, 5000, 7500, 2500, 62.8, 480, 240, 0.628, 'WARNING'),
        (v_reel_2_id, 4, 7500, 10000, 2500, 52.5, 410, 205, 0.525, 'ACTIVE'),
        (v_reel_2_id, 5, 10000, 12500, 2500, 42.0, 340, 170, 0.420, 'ACTIVE'),
        (v_reel_2_id, 6, 12500, 15000, 2500, 32.1, 275, 135, 0.321, 'ACTIVE'),
        (v_reel_2_id, 7, 15000, 17500, 2500, 22.5, 210, 105, 0.225, 'ACTIVE'),
        (v_reel_2_id, 8, 17500, 19500, 2000, 15.2, 150, 75, 0.152, 'ACTIVE');

    RAISE NOTICE 'Secciones de fatiga insertadas';

    -- =====================================================
    -- 4. CT JOBS (12 trabajos de diferentes tipos y estados)
    -- =====================================================
    
    RAISE NOTICE 'Insertando CT Jobs...';
    
    -- Job 1: Cleanout completado
    INSERT INTO ct_jobs (
        id, tenant_id, job_number, job_type, well_id, field_id, ct_unit_id, ct_reel_id,
        client_name, client_contact,
        planned_start_date, planned_end_date, estimated_duration_hours,
        actual_start_date, actual_end_date, actual_duration_hours,
        planned_depth_ft, max_depth_reached_ft, tag_depth_ft,
        status, objectives, results, npt_hours,
        estimated_cost, actual_cost,
        created_by, updated_by, approved_by, approved_at
    ) VALUES (
        gen_random_uuid(), v_tenant_id, 'CT-2026-042', 'CLN', v_well_1_id, v_field_id, v_unit_2_id, v_reel_1_id,
        'PDVSA', 'Ing. Carlos Ramirez',
        '2026-01-08', '2026-01-08', 10.0,
        '2026-01-08 06:00:00', '2026-01-08 16:30:00', 10.5,
        10000, 10020, 8542,
        'COMPLETED', 'Limpiar arena y propante hasta profundidad objetivo',
        'Objetivo cumplido. Removidos aprox 150 bbl de sólidos. Pozo fluyendo normalmente.', 0.5,
        25000.00, 24800.00,
        v_engineer_id, v_engineer_id, v_admin_id, '2026-01-07 14:00:00'
    ) RETURNING id INTO v_job_1_id;
    
    -- Job 2: Nitrogen Lift en progreso
    INSERT INTO ct_jobs (
        id, tenant_id, job_number, job_type, well_id, field_id, ct_unit_id, ct_reel_id,
        client_name, planned_start_date, estimated_duration_hours,
        actual_start_date, planned_depth_ft,
        status, objectives, estimated_cost,
        created_by, updated_by, approved_by, approved_at
    ) VALUES (
        gen_random_uuid(), v_tenant_id, 'CT-2026-043', 'N2L', v_well_2_id, v_field_id, v_unit_2_id, v_reel_1_id,
        'PDVSA', '2026-01-12', 8.0,
        NOW() - INTERVAL '4 hours', 6500,
        'IN_PROGRESS', 'Inducir pozo con nitrógeno para kickoff', 18000.00,
        v_engineer_id, v_operator_id, v_admin_id, '2026-01-11 10:00:00'
    ) RETURNING id INTO v_job_2_id;
    
    -- Job 3: Acid Treatment completado
    INSERT INTO ct_jobs (
        id, tenant_id, job_number, job_type, well_id, field_id, ct_unit_id, ct_reel_id,
        client_name, planned_start_date, planned_end_date, estimated_duration_hours,
        actual_start_date, actual_end_date, actual_duration_hours,
        planned_depth_ft, max_depth_reached_ft,
        status, objectives, results, npt_hours, estimated_cost, actual_cost,
        created_by, updated_by, approved_by, approved_at
    ) VALUES (
        gen_random_uuid(), v_tenant_id, 'CT-2026-038', 'ACT', v_well_3_id, v_field_id, v_unit_1_id, v_reel_2_id,
        'PDVSA', '2026-01-05', '2026-01-05', 12.0,
        '2026-01-05 05:00:00', '2026-01-05 18:00:00', 13.0,
        9500, 9480,
        'COMPLETED', 'Tratamiento ácido HCl 15% para remover escala', 
        'Bombeados 180 bbl HCl 15%. Skin reducido de +8 a +2. Productividad mejorada 120%.', 1.0,
        32000.00, 33500.00,
        v_engineer_id, v_engineer_id, v_admin_id, '2026-01-04 16:00:00'
    ) RETURNING id INTO v_job_3_id;
    
    -- Job 4: Milling programado
    INSERT INTO ct_jobs (
        id, tenant_id, job_number, job_type, well_id, field_id, ct_unit_id, ct_reel_id,
        client_name, planned_start_date, estimated_duration_hours,
        planned_depth_ft, status, objectives, estimated_cost,
        created_by, updated_by, approved_by, approved_at
    ) VALUES (
        gen_random_uuid(), v_tenant_id, 'CT-2026-044', 'MIL', v_well_4_id, v_field_id, v_unit_1_id, v_reel_4_id,
        'PDVSA', '2026-01-13', 16.0,
        8200, 'APPROVED', 'Fresar tapón de cemento a 8200 ft', 42000.00,
        v_engineer_id, v_engineer_id, v_admin_id, '2026-01-11 09:00:00'
    ) RETURNING id INTO v_job_4_id;
    
    -- Job 5: Cleanout Draft
    INSERT INTO ct_jobs (
        id, tenant_id, job_number, job_type, well_id, field_id,
        client_name, planned_start_date, estimated_duration_hours,
        planned_depth_ft, status, objectives, estimated_cost,
        created_by, updated_by
    ) VALUES (
        gen_random_uuid(), v_tenant_id, 'CT-2026-045', 'CLN', v_well_1_id, v_field_id,
        'PDVSA', '2026-01-15', 9.0,
        11000, 'DRAFT', 'Limpieza post-fractura', 28000.00,
        v_engineer_id, v_engineer_id
    ) RETURNING id INTO v_job_5_id;
    
    -- Job 6: Logging completado
    INSERT INTO ct_jobs (
        id, tenant_id, job_number, job_type, well_id, field_id, ct_unit_id, ct_reel_id,
        client_name, planned_start_date, planned_end_date, estimated_duration_hours,
        actual_start_date, actual_end_date, actual_duration_hours,
        planned_depth_ft, max_depth_reached_ft,
        status, objectives, results, npt_hours, estimated_cost, actual_cost,
        created_by, updated_by
    ) VALUES (
        gen_random_uuid(), v_tenant_id, 'CT-2026-035', 'LOG', v_well_2_id, v_field_id, v_unit_1_id, v_reel_5_id,
        'Schlumberger', '2026-01-02', '2026-01-02', 6.0,
        '2026-01-02 08:00:00', '2026-01-02 14:30:00', 6.5,
        7500, 7485,
        'COMPLETED', 'Corrida de PLT (Production Logging Tool)',
        'Survey completado exitosamente. Datos adquiridos según plan.', 0.0,
        15000.00, 14500.00,
        v_engineer_id, v_engineer_id
    ) RETURNING id INTO v_job_6_id;
    
    -- Job 7: Fishing completado con NPT
    INSERT INTO ct_jobs (
        id, tenant_id, job_number, job_type, well_id, field_id, ct_unit_id, ct_reel_id,
        client_name, planned_start_date, planned_end_date, estimated_duration_hours,
        actual_start_date, actual_end_date, actual_duration_hours,
        planned_depth_ft, max_depth_reached_ft, tag_depth_ft,
        status, objectives, results, observations, npt_hours, npt_reason,
        estimated_cost, actual_cost, hse_incidents,
        created_by, updated_by
    ) VALUES (
        gen_random_uuid(), v_tenant_id, 'CT-2025-158', 'FSH', v_well_3_id, v_field_id, v_unit_2_id, v_reel_1_id,
        'PDVSA', '2025-12-20', '2025-12-20', 14.0,
        '2025-12-20 06:00:00', '2025-12-20 23:00:00', 17.0,
        5800, 5785, 5785,
        'COMPLETED', 'Recuperar herramienta caída',
        'Herramienta recuperada exitosamente después de múltiples intentos.', 
        'Se requirió cambio de BHA por desgaste de jars.', 3.0,
        'Cambio de BHA en locación',
        38000.00, 42000.00, 0,
        v_engineer_id, v_engineer_id
    ) RETURNING id INTO v_job_7_id;
    
    -- Job 8: Cement Squeeze planificado
    INSERT INTO ct_jobs (
        id, tenant_id, job_number, job_type, well_id, field_id,
        client_name, planned_start_date, estimated_duration_hours,
        planned_depth_ft, status, objectives, estimated_cost,
        created_by, updated_by
    ) VALUES (
        gen_random_uuid(), v_tenant_id, 'CT-2026-046', 'CMS', v_well_4_id, v_field_id,
        'Halliburton', '2026-01-18', 10.0,
        6200, 'PLANNED', 'Squeeze de cemento para reparar leak en casing', 35000.00,
        v_engineer_id, v_engineer_id
    ) RETURNING id INTO v_job_8_id;
    
    -- Job 9: Perforation completado
    INSERT INTO ct_jobs (
        id, tenant_id, job_number, job_type, well_id, field_id, ct_unit_id, ct_reel_id,
        client_name, planned_start_date, planned_end_date, estimated_duration_hours,
        actual_start_date, actual_end_date, actual_duration_hours,
        planned_depth_ft, max_depth_reached_ft,
        status, objectives, results, estimated_cost, actual_cost,
        created_by, updated_by
    ) VALUES (
        gen_random_uuid(), v_tenant_id, 'CT-2025-145', 'PER', v_well_1_id, v_field_id, v_unit_3_id, v_reel_3_id,
        'Baker Hughes', '2025-11-15', '2025-11-15', 8.0,
        '2025-11-15 09:00:00', '2025-11-15 17:30:00', 8.5,
        9200, 9180,
        'COMPLETED', 'Cañoneo TCP en zona nueva', 
        '24 disparos exitosos. Pozo fluyendo inmediatamente.', 45000.00, 44500.00,
        v_engineer_id, v_engineer_id
    ) RETURNING id INTO v_job_9_id;
    
    -- Job 10: Cleanout cancelado
    INSERT INTO ct_jobs (
        id, tenant_id, job_number, job_type, well_id, field_id,
        client_name, planned_start_date, estimated_duration_hours,
        planned_depth_ft, status, objectives, observations, estimated_cost,
        created_by, updated_by
    ) VALUES (
        gen_random_uuid(), v_tenant_id, 'CT-2025-162', 'CLN', v_well_2_id, v_field_id,
        'PDVSA', '2025-12-28', 10.0,
        8500, 'CANCELLED', 'Limpieza programada',
        'Cancelado por cliente - pozo llegó a fluir naturalmente', 26000.00,
        v_engineer_id, v_engineer_id
    ) RETURNING id INTO v_job_10_id;
    
    -- Job 11: N2 Lift suspendido
    INSERT INTO ct_jobs (
        id, tenant_id, job_number, job_type, well_id, field_id, ct_unit_id, ct_reel_id,
        client_name, planned_start_date, estimated_duration_hours,
        actual_start_date, planned_depth_ft,
        status, objectives, observations, npt_hours, npt_reason, estimated_cost,
        created_by, updated_by
    ) VALUES (
        gen_random_uuid(), v_tenant_id, 'CT-2025-155', 'N2L', v_well_3_id, v_field_id, v_unit_1_id, v_reel_4_id,
        'PDVSA', '2025-12-10', 9.0,
        '2025-12-10 07:00:00', 7200,
        'SUSPENDED', 'Inducir pozo con N2',
        'Suspendido por condiciones climáticas adversas. Continuará cuando mejore el clima.', 
        4.5, 'Lluvia intensa - seguridad',
        19000.00,
        v_engineer_id, v_engineer_id
    ) RETURNING id INTO v_job_11_id;
    
    -- Job 12: CT Drilling aprobado
    INSERT INTO ct_jobs (
        id, tenant_id, job_number, job_type, well_id, field_id, ct_unit_id, ct_reel_id,
        client_name, planned_start_date, planned_end_date, estimated_duration_hours,
        planned_depth_ft, status, objectives, estimated_cost,
        created_by, updated_by, approved_by, approved_at
    ) VALUES (
        gen_random_uuid(), v_tenant_id, 'CT-2026-047', 'CTD', v_well_4_id, v_field_id, v_unit_3_id, v_reel_3_id,
        'Baker Hughes', '2026-01-20', '2026-01-22', 48.0,
        10500, 'APPROVED', 'Perforación de sidetrack con CT', 125000.00,
        v_engineer_id, v_engineer_id, v_admin_id, '2026-01-10 11:00:00'
    ) RETURNING id INTO v_job_12_id;

    RAISE NOTICE 'CT Jobs insertados: 12 jobs';

    -- Actualizar current_job_id en units en servicio
    UPDATE ct_units SET current_job_id = v_job_2_id WHERE id = v_unit_2_id;

    RAISE NOTICE 'Units actualizadas con jobs actuales';
    -- =====================================================
    -- 5. BHA CONFIGURATIONS (Para jobs completados)
    -- =====================================================
    
    RAISE NOTICE 'Insertando BHA configurations...';
    
    -- BHA para Job 1 (Cleanout)
    INSERT INTO ct_job_bha (id, job_id, bha_config_name, total_length_ft, total_weight_lbs, description)
    VALUES (gen_random_uuid(), v_job_1_id, 'Cleanout Standard BHA', 42.5, 1850, 
            'CT Connector + Check Valve + Jars + Circulating Sub + Vibration Tool + Jetting Nozzle 4x12')
    RETURNING id INTO v_bha_1_id;
    
    -- BHA para Job 3 (Acid)
    INSERT INTO ct_job_bha (id, job_id, bha_config_name, total_length_ft, total_weight_lbs, description)
    VALUES (gen_random_uuid(), v_job_3_id, 'Acid Job BHA', 38.0, 1620,
            'CT Connector + Check Valve + Circulating Sub + Wash Tool + Acid Nozzle')
    RETURNING id INTO v_bha_2_id;
    
    -- BHA para Job 7 (Fishing)
    INSERT INTO ct_job_bha (id, job_id, bha_config_name, total_length_ft, total_weight_lbs, description)
    VALUES (gen_random_uuid(), v_job_7_id, 'Fishing BHA', 52.0, 2450,
            'CT Connector + Heavy Jars + Overshot + Safety Joint + Grapple')
    RETURNING id INTO v_bha_3_id;

    -- =====================================================
    -- 6. OPERACIONES Y FLUIDOS (Solo para jobs completados principales)
    -- =====================================================
    
    -- Operaciones Job 1
    INSERT INTO ct_job_operations (job_id, sequence_number, operation_type, start_time, end_time, duration_minutes,
                                     start_depth_ft, end_depth_ft, max_weight_lbs, max_pressure_psi, pump_rate_bpm,
                                     description, status)
    VALUES 
        (v_job_1_id, 1, 'RIG_UP', '2026-01-08 06:00:00', '2026-01-08 08:30:00', 150, 0, 0, 0, 0, 0, 'Rig up y pruebas BOP', 'COMPLETED'),
        (v_job_1_id, 2, 'RIH', '2026-01-08 08:30:00', '2026-01-08 10:15:00', 105, 0, 8542, 2800, 350, 0, 'Bajar hasta tag arena', 'COMPLETED'),
        (v_job_1_id, 3, 'CIRCULATE', '2026-01-08 10:30:00', '2026-01-08 14:00:00', 210, 8542, 10020, 1200, 2850, 2.5, 'Lavar y circular', 'COMPLETED'),
        (v_job_1_id, 4, 'POOH', '2026-01-08 14:00:00', '2026-01-08 16:00:00', 120, 10020, 0, 3200, 0, 0, 'Sacar tubería', 'COMPLETED'),
        (v_job_1_id, 5, 'RIG_DOWN', '2026-01-08 16:00:00', '2026-01-08 16:30:00', 30, 0, 0, 0, 0, 0, 'Rig down', 'COMPLETED');
    
    -- Fluidos Job 1
    INSERT INTO ct_job_fluids (job_id, sequence_number, fluid_type, fluid_name, density_ppg, planned_volume_bbl, actual_volume_bbl,
                                pump_rate_bpm, pump_pressure_psi, start_time, end_time)
    VALUES 
        (v_job_1_id, 1, 'BRINE', 'KCl 3%', 8.4, 150, 148, 2.5, 2850, '2026-01-08 10:30:00', '2026-01-08 14:00:00');
    
    -- =====================================================
    -- 7. ALARMAS (Ejemplos de diferentes severidades)
    -- =====================================================
    
    INSERT INTO ct_alarms (tenant_id, job_id, ct_unit_id, alarm_type, severity, message, parameter_name, parameter_value, threshold_value, status, triggered_at)
    VALUES
        (v_tenant_id, v_job_1_id, v_unit_2_id, 'OVERPULL', 'HIGH', 'Peso excede límite de pickup', 'weight_lbs', 3850, 3500, 'RESOLVED', '2026-01-08 11:25:00'),
        (v_tenant_id, v_job_1_id, v_unit_2_id, 'OVERPRESSURE', 'MEDIUM', 'Presión de bomba elevada', 'pump_pressure_psi', 3200, 3000, 'RESOLVED', '2026-01-08 12:45:00'),
        (v_tenant_id, v_job_2_id, v_unit_2_id, 'FATIGUE_WARNING', 'CRITICAL', 'Fatiga de reel alcanzó 87%', 'fatigue_percentage', 87.5, 85.0, 'ACTIVE', NOW() - INTERVAL '3 hours');

    RAISE NOTICE 'BHA, operaciones, fluidos y alarmas insertados';

END $$;

-- =====================================================
-- RESUMEN
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'SEED COILED TUBING COMPLETADO';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'CT Units: 3';
    RAISE NOTICE 'CT Reels: 6 (con secciones de fatiga)';
    RAISE NOTICE 'CT Jobs: 12 (varios estados y tipos)';
    RAISE NOTICE 'BHA Configurations: 3';
    RAISE NOTICE 'Alarmas: 3 ejemplos';
    RAISE NOTICE '==============================================';
END $$;
