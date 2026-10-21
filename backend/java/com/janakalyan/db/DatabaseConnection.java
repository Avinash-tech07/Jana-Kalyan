package com.janakalyan.db;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/**
 * Central place to open a JDBC connection to the Jana Kalyan MySQL database
 * (see backend/sql/schema.sql). Update the constants below to match your
 * environment, or better, load them from environment variables.
 *
 * Requires the MySQL Connector/J driver on the classpath:
 *   https://dev.mysql.com/downloads/connector/j/
 */
public final class DatabaseConnection {

    private static final String URL = System.getenv().getOrDefault(
        "JK_DB_URL", "jdbc:mysql://localhost:3306/jana_kalyan?useSSL=false&serverTimezone=UTC");
    private static final String USER = System.getenv().getOrDefault("JK_DB_USER", "root");
    private static final String PASSWORD = System.getenv().getOrDefault("JK_DB_PASSWORD", "");

    private DatabaseConnection() {
        // utility class — no instances
    }

    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(URL, USER, PASSWORD);
    }
}
