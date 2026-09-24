const { Sequelize } = require("sequelize");

class Database {
  constructor() {
    this.sequelize = null;
  }

  _configurePgTypeParsers() {
    if (process.env.DB_DIALECT !== "postgres") return;
    const pg = require("pg");
    pg.types.setTypeParser(20, (v) => (v === null ? null : Number(v))); // parse bigint
  }

  _validateEnv() {
    if (!process.env.DATABASE_URL || !process.env.DB_DIALECT) {
      throw new Error("DATABASE_URL and DB_DIALECT must be set.");
    }
  }

  getSequelize() {
    this._validateEnv();

    if (!this.sequelize) {
      this._configurePgTypeParsers();

      this.sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: process.env.DB_DIALECT,
        logging: false,
        pool: {
          max: Number(process.env.DB_POOL_MAX || 10),
          min: Number(process.env.DB_POOL_MIN || 0),
          acquire: Number(process.env.DB_POOL_ACQUIRE_MS || 10000),
          idle: Number(process.env.DB_POOL_IDLE_MS || 10000),
          evict: Number(process.env.DB_POOL_EVICT_MS || 1000),
        },
      });
    }

    return this.sequelize;
  }

  async testConnection() {
    if (!process.env.DATABASE_URL || !process.env.DB_DIALECT) {
      console.warn(
        "Database not configured yet. Set DATABASE_URL and DB_DIALECT when you choose a database for the assignment."
      );
      return;
    }

    try {
      const connection = this.getSequelize();
      await connection.authenticate();
      console.log("Database connection established.");
    } catch (error) {
      console.error("Unable to connect to the database:", error.message);
    }
  }

  async close() {
    if (this.sequelize) {
      await this.sequelize.close();
      this.sequelize = null;
    }
  }
}

module.exports = new Database();