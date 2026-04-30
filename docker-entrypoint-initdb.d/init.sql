-- Configurar contraseña para el usuario
-- Usar SCRAM para coincidir con el metodo SASL por defecto
SET password_encryption = 'scram-sha-256';
ALTER USER finansystem WITH PASSWORD 'finansystem_dev';