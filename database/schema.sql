CREATE DATABASE user;

USE user;

CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  username VARCHAR(100),
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255)
);
