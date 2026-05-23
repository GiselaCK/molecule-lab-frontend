/**
 * moleculeApi.ts
 *
 * Camada de serviço responsável por:
 *  1. Serializar a molécula do canvas em um grafo compatível com o backend / RDKit
 *  2. Enviar e receber dados da API
 *  3. Tipar os contratos de request/response
 *
 * Formato do grafo enviado ao backend:
 *
 *   POST /api/simulations
 *   {
 *     "preset": "fast",
 *     "graph": {
 *       "atoms": [ { "id": "a1", "symbol": "C", "x": 350.0, "y": 300.0 }, ... ],
 *       "bonds": [ { "from": "a1", "to": "a2", "order": 2 }, ... ]
 *     }
 *   }
 *
 * No backend (Python / RDKit), cada nó do grafo vira um atom via
 *   mol.AddAtom(Chem.Atom(symbol))
 * e cada aresta vira uma bond via
 *   mol.AddBond(idx_from, idx_to, Chem.BondType.SINGLE | .DOUBLE | .TRIPLE)
 * As coordenadas 2D são opcionalmente gravadas com
 *   AllChem.Compute2DCoords() ou com a conformação já fornecida.
 */

import { Atom } from '@/context/ExperienceContext';
import { BondWithOrder } from '@/lib/moleculeEngine';

// ---------------------------------------------------------------------------
// Tipos do grafo (request)
// ---------------------------------------------------------------------------

export interface MoleculeGraphAtom {
  /** ID único do átomo (mesmo id interno do canvas) */
  id: string;
  /** Símbolo do elemento químico, e.g. "C", "O", "N" */
  symbol: string;
  /** Coordenada X em pixels no canvas (opcional; auxilia o backend a preservar o layout 2D) */
  x: number;
  /** Coordenada Y em pixels no canvas */
  y: number;
}

export interface MoleculeGraphBond {
  /** ID do átomo de origem */
  from: string;
  /** ID do átomo de destino */
  to: string;
  /**
   * Ordem da ligação:
   *   1 = simples, 2 = dupla, 3 = tripla
   * Mapeamento para RDKit:
   *   1 → Chem.BondType.SINGLE
   *   2 → Chem.BondType.DOUBLE
   *   3 → Chem.BondType.TRIPLE
   */
  order: 1 | 2 | 3;
}

export interface MoleculeGraph {
  atoms: MoleculeGraphAtom[];
  bonds: MoleculeGraphBond[];
}

export interface AnalyzeRequest {
  graph: MoleculeGraph;
}

export type SimulationPresetName = 'fast' | 'balanced' | 'debug';

export interface SimulationCreateRequest {
  graph: MoleculeGraph;
  preset: SimulationPresetName;
  seed?: number;
}

// ---------------------------------------------------------------------------
// Tipos da resposta (response)
// ---------------------------------------------------------------------------

export interface MoleculeProperties {
  /** Número de átomos pesados (sem H implícitos) */
  num_atoms: number;
  /** Número de ligações */
  num_bonds: number;
  /** Número de anéis */
  num_rings: number;
  /** Se a molécula possui caráter aromático */
  is_aromatic: boolean;
  /** Número de doadores de H (Lipinski) */
  hbd?: number;
  /** Número de receptores de H (Lipinski) */
  hba?: number;
  /** LogP estimado (Crippen) */
  logp?: number;
}

export interface BrokenBond {
  /** Símbolo do átomo i */
  atom_i: string;
  /** Símbolo do átomo j */
  atom_j: string;
  /** Distância final da ligação em Å */
  distance: number;
  /** Distância de equilíbrio r₀ em Å */
  r0: number;
  /** Fração V/Dₑ — quão próxima da dissociação (0 a 1) */
  fraction: number;
  /** Índice do átomo i na topologia simulada, quando enviado pelo backend */
  atom_i_index?: number;
  /** Índice do átomo j na topologia simulada, quando enviado pelo backend */
  atom_j_index?: number;
}

export interface StaticMoleculeInfo {
  smiles: string;
  formula: string;
  molecular_weight: number;
  properties: MoleculeProperties;
}

export interface MoleculeAnalysis {
  /** ID da simulação criada no backend */
  simulation_id: string;
  /** Preset usado pelo backend */
  preset: SimulationPresetName;
  /** URL relativa ou absoluta do stream SSE */
  events_url: string;
  /** Notação SMILES gerada pelo RDKit */
  smiles: string;
  /** Fórmula molecular, e.g. "C6H6" */
  formula: string;
  /** Nome IUPAC ou trivial (se identificado) */
  name: string | null;
  /** Massa molecular em g/mol */
  molecular_weight: number;
  /** Molécula válida quimicamente segundo o RDKit */
  valid: boolean;
  /** Resultado da simulação de dinâmica molecular */
  result: 'stable' | 'break' | null;
  /** Passo em que a primeira ruptura persistente foi detectada */
  break_step?: number | null;
  /**
   * Temperatura alvo (K) no instante em que a primeira ligação rompeu.
   * Null quando result === 'stable'.
   */
  break_temperature: number | null;
  /** Lista das ligações que romperam persistentemente */
  broken_bonds: BrokenBond[];
  /** Propriedades calculadas pelo RDKit */
  properties: MoleculeProperties;
  /** Séries completas retornadas no evento final */
  temperatures?: number[];
  target_temperatures?: number[];
  /** Tempo de simulação reportado pelo backend */
  elapsed_seconds?: number;
  /** Indica se o resultado veio do cache em memória do backend */
  cached?: boolean;
  /** Mensagem de erro, se houver */
  error: string | null;
}

export interface SimulationCreateResponse {
  simulation_id: string;
  preset: SimulationPresetName;
  molecule: StaticMoleculeInfo;
  events_url: string;
}

export interface SimulationProgressEvent {
  step: number;
  n_steps: number;
  progress: number;
  target_temperature: number;
  current_temperature: number;
  potential_energy: number;
  kinetic_energy: number;
  candidate_broken_bonds: BrokenBond[];
}

export interface SimulationResultEvent {
  result: 'stable' | 'break';
  break_step: number | null;
  break_temperature: number | null;
  broken_bonds: BrokenBond[];
  symbols: string[];
  temperatures: number[];
  target_temperatures: number[];
  elapsed_seconds: number;
  cached: boolean;
}

export interface SimulationCacheHitEvent {
  smiles: string;
  preset: SimulationPresetName;
  seed: number;
  message: string;
}

export interface SimulationMetadataEvent {
  simulation_id: string;
  preset: SimulationPresetName;
  seed: number | null;
  molecule: StaticMoleculeInfo;
}

export interface SimulationErrorEvent {
  code: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Serialização: canvas → grafo
// ---------------------------------------------------------------------------

/**
 * Converte os átomos e ligações do canvas para o formato de grafo
 * aceito pela API / RDKit.
 *
 * Nota: `BondWithOrder.order` já é 1 | 2 | 3, então o cast é seguro.
 */
export function toMoleculeGraph(atoms: Atom[], bonds: BondWithOrder[]): MoleculeGraph {
  return {
    atoms: atoms.map((a) => ({
      id: a.id,
      symbol: a.symbol,
      x: a.x,
      y: a.y,
    })),
    bonds: bonds.map((b) => ({
      from: b.from,
      to: b.to,
      order: Math.min(Math.max(b.order, 1), 3) as 1 | 2 | 3,
    })),
  };
}

// ---------------------------------------------------------------------------
// Configuração de ambiente
// ---------------------------------------------------------------------------

/**
 * URL base da API.
 * Em desenvolvimento, use a variável de ambiente VITE_API_BASE_URL
 * (ex.: http://localhost:8000).
 * Em produção, a variável aponta para o servidor real.
 *
 * Exemplo de .env.local:
 *   VITE_API_BASE_URL=http://localhost:8000
 */
const API_BASE =
  (import.meta as Record<string, unknown> & { env: Record<string, string> }).env
    ?.VITE_API_BASE_URL ?? '';

// ---------------------------------------------------------------------------
// Chamada principal
// ---------------------------------------------------------------------------

/**
 * Cria uma simulação no backend e retorna os dados estáticos da molécula.
 *
 * Uso:
 *   const analysis = await createMoleculeSimulation(atoms, bonds, "fast");
 *
 * Em caso de erro de rede ou resposta HTTP não-ok, lança um Error
 * com mensagem descritiva.
 */
export async function createMoleculeSimulation(
  atoms: Atom[],
  bonds: BondWithOrder[],
  preset: SimulationPresetName = 'fast',
  seed?: number,
): Promise<MoleculeAnalysis> {
  const graph = toMoleculeGraph(atoms, bonds);
  const payload: SimulationCreateRequest = { graph, preset };
  if (seed !== undefined) payload.seed = seed;

  const response = await fetch(`${API_BASE}/api/simulations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Erro do servidor: ${await getErrorDetail(response)}`);
  }

  const data: SimulationCreateResponse = await response.json();
  return {
    simulation_id: data.simulation_id,
    preset: data.preset,
    events_url: data.events_url,
    smiles: data.molecule.smiles,
    formula: data.molecule.formula,
    name: null,
    molecular_weight: data.molecule.molecular_weight,
    valid: true,
    result: null,
    break_step: null,
    break_temperature: null,
    broken_bonds: [],
    properties: data.molecule.properties,
    error: null,
  };
}

export function streamSimulationEvents(
  eventsUrl: string,
  handlers: {
    onMetadata?: (event: SimulationMetadataEvent) => void;
    onProgress?: (event: SimulationProgressEvent) => void;
    onCacheHit?: (event: SimulationCacheHitEvent) => void;
    onResult?: (event: SimulationResultEvent) => void;
    onError?: (error: Error | SimulationErrorEvent) => void;
  },
): () => void {
  const source = new EventSource(resolveApiUrl(eventsUrl));

  source.addEventListener('metadata', (event) => {
    handlers.onMetadata?.(parseSseData<SimulationMetadataEvent>(event));
  });
  source.addEventListener('progress', (event) => {
    handlers.onProgress?.(parseSseData<SimulationProgressEvent>(event));
  });
  source.addEventListener('cache_hit', (event) => {
    handlers.onCacheHit?.(parseSseData<SimulationCacheHitEvent>(event));
  });
  source.addEventListener('result', (event) => {
    handlers.onResult?.(parseSseData<SimulationResultEvent>(event));
    source.close();
  });
  source.addEventListener('error', (event) => {
    if ('data' in event && typeof event.data === 'string' && event.data) {
      handlers.onError?.(parseSseData<SimulationErrorEvent>(event as MessageEvent<string>));
    } else {
      handlers.onError?.(new Error('Conexão com o stream da simulação foi interrompida.'));
    }
    source.close();
  });

  return () => source.close();
}

function resolveApiUrl(pathOrUrl: string): string {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  return `${API_BASE}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;
}

function parseSseData<T>(event: MessageEvent<string>): T {
  return JSON.parse(event.data) as T;
}

async function getErrorDetail(response: Response): Promise<string> {
  let detail = `HTTP ${response.status}`;
  try {
    const err = await response.json();
    if (typeof err?.detail === 'string') detail = err.detail;
    else if (typeof err?.detail?.message === 'string') detail = err.detail.message;
    else if (typeof err?.message === 'string') detail = err.message;
    else if (typeof err?.error === 'string') detail = err.error;
  } catch {
    // ignora falha ao parsear o corpo do erro
  }
  return detail;
}

// ---------------------------------------------------------------------------
// Helpers de apresentação
// ---------------------------------------------------------------------------

/**
 * Formata a massa molecular com 2 casas decimais + unidade.
 * Ex.: formatMW(180.156) → "180.16 g/mol"
 */
export function formatMW(mw: number): string {
  return `${mw.toFixed(2)} g/mol`;
}

/**
 * Converte a ordem numérica da ligação para texto legível.
 */
export function bondOrderLabel(order: number): string {
  return order === 1 ? 'Simples' : order === 2 ? 'Dupla' : 'Tripla';
}
