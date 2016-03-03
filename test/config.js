// database connection info
module.exports = {
  username: "root",
  password: "",
  database: "sequelize_auditing_test",
  host: "127.0.0.1",
  dialect: "mysql",
  logging: false,
  pool: {
    "maxConnections": 5,
    "minConnections": 0,
    "maxIdleTime": 10000
  }
}