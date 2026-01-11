import { useEffect, useState } from 'react';
import './App.css';

const API = 'http://localhost:3000';
const VALOR_POR_HORA = 10;

function App() {
  const [placa, setPlaca] = useState('');
  const [modelo, setModelo] = useState('');
  const [veiculos, setVeiculos] = useState([]);
  const [status, setStatus] = useState({ total: 0, ocupadas: 0 });
  const [agora, setAgora] = useState(new Date());

  // Controle do modal
  const [modalAberto, setModalAberto] = useState(false);
  const [resultado, setResultado] = useState({ tempo: '', valor: '' });

  // Pesquisa de veículos
  const [filtro, setFiltro] = useState('');

  /*
   * Carregar dados da API
   */
  const carregarVeiculos = () => {
    fetch(`${API}/veiculos`)
      .then(res => res.json())
      .then(setVeiculos);
  };

  const carregarStatus = () => {
    fetch(`${API}/status-vagas`)
      .then(res => res.json())
      .then(setStatus);
  };

  /*
   * Atualização automática
   * - API a cada 60s
   * - Contador visual a cada 1s
   */
  useEffect(() => {
    carregarVeiculos();
    carregarStatus();

    const intervaloApi = setInterval(() => {
      carregarVeiculos();
      carregarStatus();
    }, 60000);

    const intervaloVisual = setInterval(() => {
      setAgora(new Date());
    }, 1000);

    return () => {
      clearInterval(intervaloApi);
      clearInterval(intervaloVisual);
    };
  }, []);

  /*
   * Estacionar veículo
   */
  const estacionar = () => {
    if (placa.length < 7) {
      alert('Placa inválida');
      return;
    }

    fetch(`${API}/estacionar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ placa, modelo })
    }).then(() => {
      setPlaca('');
      setModelo('');
      carregarVeiculos();
      carregarStatus();
    });
  };

  /*
   * Remover veículo e calcular valor
   */
  const remover = (veiculo) => {
    const inicio = new Date(veiculo.entrada);
    const diffMs = agora - inicio;

    const totalMin = Math.ceil(diffMs / 60000);
    const horas = Math.floor(totalMin / 60);
    const minutos = totalMin % 60;

    const tempoFormatado =
      `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;

    const valor = ((totalMin / 60) * VALOR_POR_HORA).toFixed(2);

    fetch(`${API}/veiculos/${veiculo.id}`, { method: 'DELETE' })
      .then(() => {
        setResultado({ tempo: tempoFormatado, valor });
        setModalAberto(true);
        carregarVeiculos();
        carregarStatus();
      });
  };

  /*
   * Vagas disponíveis
   */
  const vagasDisponiveis = status.total - status.ocupadas;

  /*
   * Contador visual (HH:MM:SS)
   */
  const calcularTempo = (entrada) => {
    const inicio = new Date(entrada);
    const diffMs = agora - inicio;

    const totalSeg = Math.floor(diffMs / 1000);
    const horas = String(Math.floor(totalSeg / 3600)).padStart(2, '0');
    const minutos = String(Math.floor((totalSeg % 3600) / 60)).padStart(2, '0');
    const segundos = String(totalSeg % 60).padStart(2, '0');

    return `${horas}:${minutos}:${segundos}`;
  };

  /*
   * Filtrar veículos por placa ou modelo
   */
  const veiculosFiltrados = veiculos.filter(v =>
    v.placa.toLowerCase().includes(filtro.toLowerCase()) ||
    v.modelo.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="container">
      <h1>Sistema de Estacionamento</h1>

      <p className="vagas">
        Livres: <strong>{vagasDisponiveis}</strong> | Ocupadas:{' '}
        <strong>{status.ocupadas}</strong>
      </p>

      <div className="card">
        <h2>Cadastrar Veículo</h2>

        <input
          placeholder="Placa"
          value={placa}
          onChange={e => setPlaca(e.target.value)}
        />

        <input
          placeholder="Modelo"
          value={modelo}
          onChange={e => setModelo(e.target.value)}
        />

        <button
          onClick={estacionar}
          disabled={vagasDisponiveis === 0}
        >
          Estacionar
        </button>
      </div>

      <div className="card">
        <h2>Veículos Estacionados</h2>

        <input
          className="input-pesquisa"
          placeholder="Pesquisar veículo por placa ou modelo"
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
        />

        {veiculosFiltrados.length === 0 && (
          <p>Nenhum veículo estacionado.</p>
        )}

        <ul>
          {veiculosFiltrados.map(v => (
            <li key={v.id}>
              <span>
                <strong>{v.placa}</strong> — {v.modelo}
                <br />
                <small>⏱ {calcularTempo(v.entrada)}</small>
              </span>

              <button
                className="remove"
                onClick={() => remover(v)}
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      </div>

      {modalAberto && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Estacionamento Finalizado</h2>

            <p>
              ⏱ Tempo total:<br />
              <strong>{resultado.tempo}</strong>
            </p>

            <p>
              💰 Valor a pagar:<br />
              <strong>R$ {resultado.valor}</strong>
            </p>

            <button onClick={() => setModalAberto(false)}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
