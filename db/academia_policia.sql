-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1:3307
-- Tiempo de generación: 30-04-2026 a las 01:47:37
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `academia_policia`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `asignaturas`
--

CREATE TABLE `asignaturas` (
  `id_asignatura` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `asignaturas`
--

INSERT INTO `asignaturas` (`id_asignatura`, `nombre`, `descripcion`) VALUES
(1, 'Preparación Física', 'Entrenamiento para superar las pruebas físicas'),
(2, 'Psicotécnicos', 'Ejercicios de aptitud numérica, verbal y espacial'),
(3, 'Temario Policía Local', 'Legislación, tráfico y materias jurídicas'),
(4, 'Simulacros de Examen', 'Exámenes de práctica con corrección');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ayuntamientos`
--

CREATE TABLE `ayuntamientos` (
  `id_ayuntamiento` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `provincia` varchar(50) NOT NULL,
  `comunidad_autonoma` varchar(50) NOT NULL DEFAULT 'Extremadura'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `ayuntamientos`
--

INSERT INTO `ayuntamientos` (`id_ayuntamiento`, `nombre`, `provincia`, `comunidad_autonoma`) VALUES
(1, 'Cáceres', 'Cáceres', 'Extremadura'),
(2, 'Plasencia', 'Cáceres', 'Extremadura'),
(3, 'Badajoz', 'Badajoz', 'Extremadura'),
(4, 'Mérida', 'Badajoz', 'Extremadura'),
(5, 'Trujillo', 'Cáceres', 'Extremadura');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `convocatorias`
--

CREATE TABLE `convocatorias` (
  `id_convocatoria` int(11) NOT NULL,
  `fecha_examen` date DEFAULT NULL,
  `plazas_ofertadas` int(11) NOT NULL,
  `lugar_examen` varchar(100) DEFAULT NULL,
  `descripcion` text DEFAULT NULL COMMENT 'Bases, observaciones generales',
  `url_boe` varchar(500) DEFAULT NULL COMMENT 'Enlace oficial al BOE o BOPEX',
  `id_ayuntamiento` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cursos`
--

CREATE TABLE `cursos` (
  `id_curso` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `hora_inicio` time DEFAULT NULL,
  `hora_fin` time DEFAULT NULL,
  `plazas_maximas` int(11) NOT NULL,
  `precio` decimal(8,2) DEFAULT NULL,
  `id_convocatoria` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `curso_convocatoria`
--

CREATE TABLE `curso_convocatoria` (
  `id_curso` int(11) NOT NULL,
  `id_convocatoria` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `documentos`
--

CREATE TABLE `documentos` (
  `id_documento` int(11) NOT NULL,
  `id_persona` int(11) NOT NULL,
  `tipo` enum('dni','titulo_fp','certificado_medico','foto','otro') NOT NULL DEFAULT 'otro',
  `nombre_archivo` varchar(255) NOT NULL COMMENT 'Nombre original del fichero',
  `ruta_almacenamiento` varchar(500) NOT NULL COMMENT 'Ruta relativa en servidor o clave en S3',
  `mime_type` varchar(100) DEFAULT NULL,
  `tamano_bytes` int(11) DEFAULT NULL,
  `fecha_subida` timestamp NOT NULL DEFAULT current_timestamp(),
  `verificado` tinyint(1) DEFAULT 0 COMMENT '1 = revisado y validado por la academia',
  `observaciones` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `fases`
--

CREATE TABLE `fases` (
  `id_fase` int(11) NOT NULL,
  `fecha` date DEFAULT NULL,
  `lugar` varchar(100) DEFAULT NULL,
  `orden` int(11) DEFAULT NULL,
  `id_convocatoria` int(11) NOT NULL,
  `id_tipo_fase` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `logs_actividad`
--

CREATE TABLE `logs_actividad` (
  `id_log` bigint(20) NOT NULL,
  `id_persona` int(11) DEFAULT NULL COMMENT 'NULL si la acción fue del sistema',
  `accion` varchar(100) NOT NULL COMMENT 'Ej: login, crear_matricula, modificar_nota',
  `tabla_afectada` varchar(50) DEFAULT NULL,
  `id_registro_afectado` int(11) DEFAULT NULL COMMENT 'PK del registro modificado',
  `detalle` text DEFAULT NULL COMMENT 'JSON con valores anteriores/nuevos',
  `ip` varchar(45) DEFAULT NULL,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `matriculas`
--

CREATE TABLE `matriculas` (
  `id_matricula` int(11) NOT NULL,
  `id_persona` int(11) NOT NULL,
  `id_curso` int(11) NOT NULL,
  `fecha_matricula` date NOT NULL,
  `estado` enum('pendiente','activo','cancelado','completado') DEFAULT 'pendiente'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notas_curso`
--

CREATE TABLE `notas_curso` (
  `id_nota` int(11) NOT NULL,
  `id_matricula` int(11) NOT NULL,
  `id_asignatura` int(11) NOT NULL,
  `tipo` enum('examen','practica','simulacro','otro') NOT NULL DEFAULT 'examen',
  `descripcion` varchar(200) DEFAULT NULL COMMENT 'Ej: Simulacro temario bloque 2',
  `nota` decimal(5,2) DEFAULT NULL COMMENT 'Sobre 10',
  `fecha` date NOT NULL,
  `observaciones` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pagos`
--

CREATE TABLE `pagos` (
  `id_pago` int(11) NOT NULL,
  `id_matricula` int(11) NOT NULL,
  `cantidad` decimal(8,2) NOT NULL,
  `fecha_pago` date NOT NULL,
  `metodo_pago` enum('efectivo','tarjeta','transferencia') DEFAULT NULL,
  `estado` enum('pendiente','completado','fallido') DEFAULT 'pendiente',
  `concepto` varchar(200) DEFAULT NULL COMMENT 'Ej: Matrícula, Cuota mensual, Reserva de plaza',
  `num_recibo` varchar(50) DEFAULT NULL COMMENT 'Número de factura o recibo generado'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `perfil_alumno`
--

CREATE TABLE `perfil_alumno` (
  `id_persona` int(11) NOT NULL,
  `nivel_inicial` enum('basico','intermedio','avanzado') DEFAULT 'basico',
  `municipio_objetivo` varchar(100) DEFAULT NULL COMMENT 'Ayuntamiento al que aspira principalmente',
  `anios_preparacion` tinyint(3) DEFAULT 0 COMMENT 'Años que lleva preparando la oposición',
  `tiene_carnet_b` tinyint(1) DEFAULT 0,
  `tiene_fp_seguridad` tinyint(1) DEFAULT 0 COMMENT 'FP Grado Medio en Seguridad y Emergencias',
  `observaciones` text DEFAULT NULL,
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `personas`
--

CREATE TABLE `personas` (
  `id_persona` int(11) NOT NULL,
  `dni` varchar(9) NOT NULL,
  `usuario` varchar(50) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `apellido1` varchar(50) NOT NULL,
  `apellido2` varchar(50) DEFAULT NULL,
  `telefono` varchar(15) DEFAULT NULL,
  `correo` varchar(100) DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `contrasena_hash` varchar(255) NOT NULL,
  `rol` enum('alumno','profesor','admin') NOT NULL,
  `fecha_registro` date DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `profesor_asignatura`
--

CREATE TABLE `profesor_asignatura` (
  `id_persona` int(11) NOT NULL,
  `id_asignatura` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `resultados`
--

CREATE TABLE `resultados` (
  `id_resultado` int(11) NOT NULL,
  `id_persona` int(11) NOT NULL,
  `id_fase` int(11) NOT NULL,
  `nota` decimal(5,2) DEFAULT NULL,
  `apto` tinyint(1) DEFAULT NULL,
  `fecha` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipos_fase`
--

CREATE TABLE `tipos_fase` (
  `id_tipo_fase` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `descripcion` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `tipos_fase`
--

INSERT INTO `tipos_fase` (`id_tipo_fase`, `nombre`, `descripcion`) VALUES
(1, 'Prueba Física', 'Carrera, salto, abdominales y trepa de cuerda'),
(2, 'Psicotécnico', 'Test de aptitudes cognitivas y personalidad'),
(3, 'Examen Teórico', 'Test tipo turno sobre temario de Policía Local'),
(4, 'Entrevista', 'Valoración personal por tribunal');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `asignaturas`
--
ALTER TABLE `asignaturas`
  ADD PRIMARY KEY (`id_asignatura`);

--
-- Indices de la tabla `ayuntamientos`
--
ALTER TABLE `ayuntamientos`
  ADD PRIMARY KEY (`id_ayuntamiento`);

--
-- Indices de la tabla `convocatorias`
--
ALTER TABLE `convocatorias`
  ADD PRIMARY KEY (`id_convocatoria`),
  ADD KEY `fk_conv_ayuntamiento` (`id_ayuntamiento`),
  ADD KEY `idx_conv_fecha_examen` (`fecha_examen`);

--
-- Indices de la tabla `cursos`
--
ALTER TABLE `cursos`
  ADD PRIMARY KEY (`id_curso`),
  ADD KEY `fk_cursos_convocatoria` (`id_convocatoria`);

--
-- Indices de la tabla `curso_convocatoria`
--
ALTER TABLE `curso_convocatoria`
  ADD PRIMARY KEY (`id_curso`,`id_convocatoria`),
  ADD KEY `fk_cc_convocatoria` (`id_convocatoria`);

--
-- Indices de la tabla `documentos`
--
ALTER TABLE `documentos`
  ADD PRIMARY KEY (`id_documento`),
  ADD KEY `fk_documentos_persona` (`id_persona`),
  ADD KEY `idx_docs_tipo` (`tipo`),
  ADD KEY `idx_docs_verificado` (`verificado`);

--
-- Indices de la tabla `fases`
--
ALTER TABLE `fases`
  ADD PRIMARY KEY (`id_fase`),
  ADD KEY `fk_fases_convocatoria` (`id_convocatoria`),
  ADD KEY `fk_fases_tipo` (`id_tipo_fase`);

--
-- Indices de la tabla `logs_actividad`
--
ALTER TABLE `logs_actividad`
  ADD PRIMARY KEY (`id_log`),
  ADD KEY `idx_logs_persona` (`id_persona`),
  ADD KEY `idx_logs_fecha` (`fecha`);

--
-- Indices de la tabla `matriculas`
--
ALTER TABLE `matriculas`
  ADD PRIMARY KEY (`id_matricula`),
  ADD UNIQUE KEY `uq_matricula_persona_curso` (`id_persona`,`id_curso`),
  ADD KEY `fk_matriculas_curso` (`id_curso`),
  ADD KEY `idx_matriculas_estado` (`estado`);

--
-- Indices de la tabla `notas_curso`
--
ALTER TABLE `notas_curso`
  ADD PRIMARY KEY (`id_nota`),
  ADD KEY `fk_notas_matricula` (`id_matricula`),
  ADD KEY `fk_notas_asignatura` (`id_asignatura`),
  ADD KEY `idx_notas_fecha` (`fecha`);

--
-- Indices de la tabla `pagos`
--
ALTER TABLE `pagos`
  ADD PRIMARY KEY (`id_pago`),
  ADD KEY `fk_pagos_matricula` (`id_matricula`),
  ADD KEY `idx_pagos_estado` (`estado`),
  ADD KEY `idx_pagos_fecha` (`fecha_pago`);

--
-- Indices de la tabla `perfil_alumno`
--
ALTER TABLE `perfil_alumno`
  ADD PRIMARY KEY (`id_persona`);

--
-- Indices de la tabla `personas`
--
ALTER TABLE `personas`
  ADD PRIMARY KEY (`id_persona`),
  ADD UNIQUE KEY `uq_personas_dni` (`dni`),
  ADD UNIQUE KEY `uq_personas_usuario` (`usuario`),
  ADD UNIQUE KEY `uq_personas_correo` (`correo`),
  ADD KEY `idx_personas_rol` (`rol`),
  ADD KEY `idx_personas_activo` (`activo`);

--
-- Indices de la tabla `profesor_asignatura`
--
ALTER TABLE `profesor_asignatura`
  ADD PRIMARY KEY (`id_persona`,`id_asignatura`),
  ADD KEY `fk_profasig_asignatura` (`id_asignatura`);

--
-- Indices de la tabla `resultados`
--
ALTER TABLE `resultados`
  ADD PRIMARY KEY (`id_resultado`),
  ADD UNIQUE KEY `uq_resultado_persona_fase` (`id_persona`,`id_fase`),
  ADD KEY `fk_resultados_fase` (`id_fase`);

--
-- Indices de la tabla `tipos_fase`
--
ALTER TABLE `tipos_fase`
  ADD PRIMARY KEY (`id_tipo_fase`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `asignaturas`
--
ALTER TABLE `asignaturas`
  MODIFY `id_asignatura` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `ayuntamientos`
--
ALTER TABLE `ayuntamientos`
  MODIFY `id_ayuntamiento` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `convocatorias`
--
ALTER TABLE `convocatorias`
  MODIFY `id_convocatoria` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `cursos`
--
ALTER TABLE `cursos`
  MODIFY `id_curso` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `documentos`
--
ALTER TABLE `documentos`
  MODIFY `id_documento` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `fases`
--
ALTER TABLE `fases`
  MODIFY `id_fase` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `logs_actividad`
--
ALTER TABLE `logs_actividad`
  MODIFY `id_log` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `matriculas`
--
ALTER TABLE `matriculas`
  MODIFY `id_matricula` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `notas_curso`
--
ALTER TABLE `notas_curso`
  MODIFY `id_nota` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `pagos`
--
ALTER TABLE `pagos`
  MODIFY `id_pago` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `personas`
--
ALTER TABLE `personas`
  MODIFY `id_persona` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `resultados`
--
ALTER TABLE `resultados`
  MODIFY `id_resultado` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tipos_fase`
--
ALTER TABLE `tipos_fase`
  MODIFY `id_tipo_fase` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `convocatorias`
--
ALTER TABLE `convocatorias`
  ADD CONSTRAINT `fk_conv_ayuntamiento` FOREIGN KEY (`id_ayuntamiento`) REFERENCES `ayuntamientos` (`id_ayuntamiento`);

--
-- Filtros para la tabla `cursos`
--
ALTER TABLE `cursos`
  ADD CONSTRAINT `fk_cursos_convocatoria` FOREIGN KEY (`id_convocatoria`) REFERENCES `convocatorias` (`id_convocatoria`) ON DELETE SET NULL;

--
-- Filtros para la tabla `curso_convocatoria`
--
ALTER TABLE `curso_convocatoria`
  ADD CONSTRAINT `fk_cc_convocatoria` FOREIGN KEY (`id_convocatoria`) REFERENCES `convocatorias` (`id_convocatoria`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_cc_curso` FOREIGN KEY (`id_curso`) REFERENCES `cursos` (`id_curso`) ON DELETE CASCADE;

--
-- Filtros para la tabla `documentos`
--
ALTER TABLE `documentos`
  ADD CONSTRAINT `fk_documentos_persona` FOREIGN KEY (`id_persona`) REFERENCES `personas` (`id_persona`) ON DELETE CASCADE;

--
-- Filtros para la tabla `fases`
--
ALTER TABLE `fases`
  ADD CONSTRAINT `fk_fases_convocatoria` FOREIGN KEY (`id_convocatoria`) REFERENCES `convocatorias` (`id_convocatoria`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_fases_tipo` FOREIGN KEY (`id_tipo_fase`) REFERENCES `tipos_fase` (`id_tipo_fase`);

--
-- Filtros para la tabla `logs_actividad`
--
ALTER TABLE `logs_actividad`
  ADD CONSTRAINT `fk_logs_persona` FOREIGN KEY (`id_persona`) REFERENCES `personas` (`id_persona`) ON DELETE SET NULL;

--
-- Filtros para la tabla `matriculas`
--
ALTER TABLE `matriculas`
  ADD CONSTRAINT `fk_matriculas_curso` FOREIGN KEY (`id_curso`) REFERENCES `cursos` (`id_curso`),
  ADD CONSTRAINT `fk_matriculas_persona` FOREIGN KEY (`id_persona`) REFERENCES `personas` (`id_persona`);

--
-- Filtros para la tabla `notas_curso`
--
ALTER TABLE `notas_curso`
  ADD CONSTRAINT `fk_notas_asignatura` FOREIGN KEY (`id_asignatura`) REFERENCES `asignaturas` (`id_asignatura`),
  ADD CONSTRAINT `fk_notas_matricula` FOREIGN KEY (`id_matricula`) REFERENCES `matriculas` (`id_matricula`) ON DELETE CASCADE;

--
-- Filtros para la tabla `pagos`
--
ALTER TABLE `pagos`
  ADD CONSTRAINT `fk_pagos_matricula` FOREIGN KEY (`id_matricula`) REFERENCES `matriculas` (`id_matricula`);

--
-- Filtros para la tabla `perfil_alumno`
--
ALTER TABLE `perfil_alumno`
  ADD CONSTRAINT `fk_perfil_alumno_persona` FOREIGN KEY (`id_persona`) REFERENCES `personas` (`id_persona`) ON DELETE CASCADE;

--
-- Filtros para la tabla `profesor_asignatura`
--
ALTER TABLE `profesor_asignatura`
  ADD CONSTRAINT `fk_profasig_asignatura` FOREIGN KEY (`id_asignatura`) REFERENCES `asignaturas` (`id_asignatura`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_profasig_persona` FOREIGN KEY (`id_persona`) REFERENCES `personas` (`id_persona`) ON DELETE CASCADE;

--
-- Filtros para la tabla `resultados`
--
ALTER TABLE `resultados`
  ADD CONSTRAINT `fk_resultados_fase` FOREIGN KEY (`id_fase`) REFERENCES `fases` (`id_fase`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_resultados_persona` FOREIGN KEY (`id_persona`) REFERENCES `personas` (`id_persona`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
