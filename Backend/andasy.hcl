# andasy.hcl app configuration file generated for waste-collection-backend on Sunday, 14-Jun-26 16:15:23 SAST
#
# See https://github.com/quarksgroup/andasy-cli for information about how to use this file.

app_name = "waste-collection-backend"

app {

  env = {
    PORT           = "8000"
    NODE_ENV       = "production"
    DATABASE_SSL   = "true"
    PGSSLMODE      = "require"
    PGHOST         = "ep-silent-hat-abf3r5pc-pooler.eu-west-2.aws.neon.tech"
    PGPORT         = "5432"
    PGUSER         = "neondb_owner"
    PGDATABASE     = "neondb"
    JWT_EXPIRES_IN = "1d"
    SMTP_HOST      = "smtp.gmail.com"
    SMTP_PORT      = "587"
    SMTP_SECURE    = "false"
    SMTP_USER      = "graceniyigena34@gmail.com"
    SMTP_FROM      = "EcoTrack <graceniyigena34@gmail.com>"
    FRONTEND_URL   = "http://192.168.56.1:3000"
  }

  port = 8000

  primary_region = "kgl"

  compute {
    cpu      = 1
    memory   = 256
    cpu_kind = "shared"
  }

  process {
    name = "waste-collection-backend"
  }

}
