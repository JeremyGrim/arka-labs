-- 070_catalog_schema.sql — schémas catalog/routing et tables principales
CREATE SCHEMA IF NOT EXISTS catalog;
CREATE SCHEMA IF NOT EXISTS routing;

CREATE TABLE IF NOT EXISTS catalog.domains (
  domain TEXT PRIMARY KEY,
  tags   TEXT[]
);

CREATE TABLE IF NOT EXISTS catalog.flows (
  flow_ref   TEXT PRIMARY KEY,
  brick      TEXT NOT NULL,
  export     TEXT NOT NULL,
  intent     TEXT NULL,
  name       TEXT NULL,
  tags       TEXT[],
  family     TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS catalog.capabilities (
  capability TEXT PRIMARY KEY,
  agents     TEXT[],
  domain     TEXT NULL REFERENCES catalog.domains(domain) ON UPDATE CASCADE ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
