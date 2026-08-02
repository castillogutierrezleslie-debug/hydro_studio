-- Hidrocampo -- esquema de base de datos para MySQL (Hostinger u otro hosting)
-- ------------------------------------------------------------------------
-- En Hostinger normalmente la base de datos y el usuario ya se crean
-- desde el panel (hPanel > Bases de datos), no con este CREATE DATABASE.
-- Si tu panel ya te dio un nombre de base de datos, usa ese y solo
-- ejecuta las sentencias CREATE TABLE de aqui para abajo dentro de ella
-- (phpMyAdmin, que Hostinger incluye, es la forma mas facil de correrlas).

CREATE DATABASE IF NOT EXISTS hidrocampo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hidrocampo;

CREATE TABLE Usuarios (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Email VARCHAR(200) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Pozos (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    LocalId BIGINT NULL,
    Codigo VARCHAR(100) NOT NULL,
    Proyecto VARCHAR(200) NULL,
    Fecha DATETIME NULL,
    Lat DOUBLE NULL,
    Lon DOUBLE NULL,
    Alt DOUBLE NULL,
    GpsPrecision DOUBLE NULL,
    Profundidad DOUBLE NULL,
    Diametro DOUBLE NULL,
    NivelEstatico DOUBLE NULL,
    NivelDinamico DOUBLE NULL,
    CaudalBombeo DOUBLE NULL,
    CapacidadEspecifica DOUBLE NULL,
    Uso VARCHAR(50) NULL,
    Litologia MEDIUMTEXT NULL,
    Obs MEDIUMTEXT NULL,
    CreatedByEmail VARCHAR(200) NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Manantiales (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    LocalId BIGINT NULL,
    Codigo VARCHAR(100) NOT NULL,
    Proyecto VARCHAR(200) NULL,
    Fecha DATETIME NULL,
    Lat DOUBLE NULL,
    Lon DOUBLE NULL,
    Alt DOUBLE NULL,
    GpsPrecision DOUBLE NULL,
    Caudal DOUBLE NULL,
    Temp DOUBLE NULL,
    Metodo VARCHAR(50) NULL,
    TipoAflor VARCHAR(50) NULL,
    Vegetacion VARCHAR(200) NULL,
    Obs MEDIUMTEXT NULL,
    CreatedByEmail VARCHAR(200) NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE CalidadAgua (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    LocalId BIGINT NULL,
    Codigo VARCHAR(100) NOT NULL,
    Proyecto VARCHAR(200) NULL,
    Fecha DATETIME NULL,
    Lat DOUBLE NULL,
    Lon DOUBLE NULL,
    Alt DOUBLE NULL,
    GpsPrecision DOUBLE NULL,
    PH DOUBLE NULL,
    CE DOUBLE NULL,
    Temp DOUBLE NULL,
    OD DOUBLE NULL,
    STD DOUBLE NULL,
    Turbidez DOUBLE NULL,
    Ca DOUBLE NULL,
    Mg DOUBLE NULL,
    Na DOUBLE NULL,
    K DOUBLE NULL,
    Hco3 DOUBLE NULL,
    Cl DOUBLE NULL,
    So4 DOUBLE NULL,
    Obs MEDIUMTEXT NULL,
    CreatedByEmail VARCHAR(200) NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE PuntosGeologicos (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    LocalId BIGINT NULL,
    Codigo VARCHAR(100) NOT NULL,
    Proyecto VARCHAR(200) NULL,
    Fecha DATETIME NULL,
    Lat DOUBLE NULL,
    Lon DOUBLE NULL,
    Alt DOUBLE NULL,
    GpsPrecision DOUBLE NULL,
    Formacion VARCHAR(200) NULL,
    Litologia MEDIUMTEXT NULL,
    Rumbo VARCHAR(50) NULL,
    Buzamiento VARCHAR(50) NULL,
    Estructuras MEDIUMTEXT NULL,
    Obs MEDIUMTEXT NULL,
    CreatedByEmail VARCHAR(200) NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Notas:
-- 1. "Precision" es palabra reservada en MySQL, por eso la columna se
--    llama GpsPrecision (en SQL Server se llamaba solo "Precision").
-- 2. CreatedAt usa la hora del propio servidor MySQL (no UTC explicito);
--    si el hosting y tus usuarios estan en zonas horarias muy distintas,
--    esto se puede afinar mas adelante.
