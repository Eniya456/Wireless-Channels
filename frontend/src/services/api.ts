import {
  SimulationConfig,
  SingleSimulationResult,
  BatchSimulationResult,
  MLPrediction,
  MLEvaluation,
  Experiment,
  SystemStatus,
} from '../types';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      throw new Error(
        'Backend server is unreachable on port 8000. Please ensure the backend is running via run_backend.bat or run_app.bat.'
      );
    }
    let errorMsg = `HTTP Error ${res.status}`;
    try {
      const errorJson = await res.json();
      if (errorJson.detail) {
        errorMsg = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Wireless Simulation
  async runSingleSimulation(config: Partial<SimulationConfig>): Promise<SingleSimulationResult> {
    const res = await fetch(`${API_BASE}/simulation/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return handleResponse<SingleSimulationResult>(res);
  },

  async runBatchSimulation(params: {
    modulation: string;
    channel: string;
    snr_start: number;
    snr_end: number;
    snr_step: number;
    num_bits_per_snr: number;
    distance_m: number;
    speed_mps: number;
    path_loss_exponent: number;
    carrier_frequency_hz?: number;
    equalizer?: string;
    random_seed?: number;
  }): Promise<BatchSimulationResult> {
    const res = await fetch(`${API_BASE}/simulation/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse<BatchSimulationResult>(res);
  },

  async getConfigOptions(): Promise<{
    modulations: string[];
    channels: string[];
    equalizers: string[];
    defaults: Record<string, any>;
  }> {
    const res = await fetch(`${API_BASE}/simulation/config-options`);
    return handleResponse(res);
  },

  // Machine Learning
  async predictML(features: {
    snr_db: number;
    modulation: string;
    channel_type: string;
    distance_m: number;
    speed_mps: number;
    path_loss_exponent: number;
    carrier_frequency_hz?: number;
    reference_distance_m?: number;
    effective_snr_db?: number;
    path_loss_db?: number;
    received_power_dbm?: number;
    doppler_shift_hz?: number;
  }): Promise<MLPrediction> {
    const res = await fetch(`${API_BASE}/ml/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(features),
    });
    return handleResponse<MLPrediction>(res);
  },

  async getMLEvaluation(): Promise<MLEvaluation> {
    const res = await fetch(`${API_BASE}/ml/evaluation`);
    return handleResponse<MLEvaluation>(res);
  },

  // Experiments
  async saveExperiment(data: {
    title: string;
    description?: string;
    configuration: Record<string, any>;
    metrics: Record<string, any>;
    ml_prediction?: Record<string, any>;
    tags?: string[];
  }): Promise<Experiment> {
    const res = await fetch(`${API_BASE}/experiments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Experiment>(res);
  },

  async listExperiments(params?: {
    limit?: number;
    modulation?: string;
    channel?: string;
  }): Promise<Experiment[]> {
    const q = new URLSearchParams();
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.modulation) q.set('modulation', params.modulation);
    if (params?.channel) q.set('channel', params.channel);

    const res = await fetch(`${API_BASE}/experiments?${q.toString()}`);
    return handleResponse<Experiment[]>(res);
  },

  async getExperiment(id: string): Promise<Experiment> {
    const res = await fetch(`${API_BASE}/experiments/${id}`);
    return handleResponse<Experiment>(res);
  },

  async deleteExperiment(id: string): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE}/experiments/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  async compareExperiments(experimentIds: string[]): Promise<{
    count: number;
    experiments: any[];
  }> {
    const res = await fetch(`${API_BASE}/experiments/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ experiment_ids: experimentIds }),
    });
    return handleResponse(res);
  },

  getExportCsvUrl(): string {
    return `${API_BASE}/experiments/export/csv`;
  },

  // System Diagnostics
  async getSystemStatus(): Promise<SystemStatus> {
    const res = await fetch(`${API_BASE}/system/status`);
    return handleResponse<SystemStatus>(res);
  },
};
