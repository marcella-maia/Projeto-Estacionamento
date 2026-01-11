const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ======================
// CONEXÃO COM O BANCO
// ======================
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'estacionamento'
});

db.connect(err => {
  if (err) {
    console.error('Erro ao conectar:', err);
    return;
  }
  console.log('Conectado ao MySQL');
});

// ======================
// ESTACIONAR VEÍCULO
// ======================
app.post('/estacionar', (req, res) => {
  const { placa, modelo } = req.body;

  if (!placa || placa.length < 7) {
    return res.status(400).json({ mensagem: 'Placa inválida' });
  }

  db.query(
    'SELECT * FROM vagas WHERE ocupada = false LIMIT 1',
    (err, vagas) => {
      if (err) return res.status(500).json(err);

      if (vagas.length === 0) {
        return res.json({ mensagem: 'Sem vagas disponíveis' });
      }

      const vaga = vagas[0];

      db.query(
        `
        INSERT INTO veiculos (placa, modelo, vaga_id, entrada)
        VALUES (?, ?, ?, NOW())
        `,
        [placa, modelo, vaga.id]
      );

      db.query(
        'UPDATE vagas SET ocupada = true WHERE id = ?',
        [vaga.id]
      );

      res.json({ mensagem: 'Veículo estacionado com sucesso' });
    }
  );
});

// ======================
// LISTAR VEÍCULOS
// ======================
app.get('/veiculos', (req, res) => {
  db.query(
    `
    SELECT 
      id,
      placa,
      modelo,
      entrada,
      TIME_FORMAT(
        SEC_TO_TIME(TIMESTAMPDIFF(SECOND, entrada, NOW())),
        '%H:%i'
      ) AS tempo_formatado
    FROM veiculos
    `,
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result);
    }
  );
});



// ======================
// REMOVER VEÍCULO
// ======================
app.delete('/veiculos/:id', (req, res) => {
  const id = req.params.id;

  db.query(
    `
    SELECT 
      vaga_id,
      TIME_FORMAT(
        SEC_TO_TIME(TIMESTAMPDIFF(SECOND, entrada, NOW())),
        '%H:%i'
      ) AS tempo_total
    FROM veiculos
    WHERE id = ?
    `,
    [id],
    (err, result) => {
      if (err) return res.status(500).json(err);

      if (result.length === 0) {
        return res.json({ mensagem: 'Veículo não encontrado' });
      }

      const { vaga_id, tempo_total } = result[0];

      db.query('DELETE FROM veiculos WHERE id = ?', [id]);
      db.query('UPDATE vagas SET ocupada = false WHERE id = ?', [vaga_id]);

      res.json({
        mensagem: `Veículo removido. Tempo total estacionado: ${tempo_total}`
      });
    }
  );
});


// ======================
// STATUS DAS VAGAS
// ======================
app.get('/status-vagas', (req, res) => {
  db.query(
    `
    SELECT 
      COUNT(*) AS total,
      SUM(CASE WHEN ocupada = true THEN 1 ELSE 0 END) AS ocupadas
    FROM vagas
    `,
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result[0]);
    }
  );
});

// ======================
app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
