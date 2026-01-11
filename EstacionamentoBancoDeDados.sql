CREATE DATABASE estacionamento;
USE estacionamento;

CREATE TABLE vagas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ocupada BOOLEAN NOT NULL
);

INSERT INTO vagas (ocupada) VALUES
(false),(false),(false),(false),(false);

CREATE TABLE veiculos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    placa VARCHAR(10) NOT NULL,
    modelo VARCHAR(50),
    vaga_id INT,
    FOREIGN KEY (vaga_id) REFERENCES vagas(id)
);
SELECT * FROM vagas;

SELECT * FROM veiculos;
