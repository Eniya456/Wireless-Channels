export type Modulation = 'BPSK' | 'QPSK';
export type Channel = 'AWGN' | 'RAYLEIGH';
export type Equalizer = 'NONE' | 'ZERO_FORCING' | 'MMSE';

export interface SimulationConfig {
  modulation: Modulation;
  channel: Channel;
  snr_db: number;
  num_bits: number;
  distance_m: number;
  reference_distance_m: number;
  path_loss_exponent: number;
  speed_mps: number;
  carrier_frequency_hz: number;
  symbol_rate_sps: number;
  equalizer: Equalizer;
  random_seed?: number;
  max_constellation_points?: number;
}

export interface SimulationMetrics {
  total_bits: number;
  bit_errors: number;
  ber: number;
  theoretical_ber: number;
  nominal_snr_db: number;
  effective_snr_db: number;
  path_loss_db: number;
  received_power_dbm: number;
  received_power_mw: number;
  doppler_shift_hz: number;
  coherence_time_s: number;
  raw_bit_rate_kbps: number;
  effective_throughput_kbps: number;
  packet_throughput_kbps: number;
  packet_success_rate: number;
  execution_time_ms: number;
}

export interface ConstellationPoint {
  tx_i: number;
  tx_q: number;
  rx_i: number;
  rx_q: number;
  faded_i: number;
  faded_q: number;
}

export interface SingleSimulationResult {
  configuration: Record<string, any>;
  metrics: SimulationMetrics;
  constellation_samples: ConstellationPoint[];
}

export interface BatchPoint {
  snr_db: number;
  effective_snr_db: number;
  ber: number;
  theoretical_ber: number;
  bit_errors: number;
  total_bits: number;
  effective_throughput_kbps: number;
  received_power_dbm: number;
}

export interface BatchSimulationResult {
  configuration: Record<string, any>;
  points: BatchPoint[];
}

export interface MLPrediction {
  predicted_channel_quality: 'Good' | 'Moderate' | 'Poor';
  confidence_scores: Record<string, number>;
  predicted_ber: number;
  quality_criteria: string;
  model_version: string;
  derived_features: {
    effective_snr_db: number;
    path_loss_db: number;
    received_power_dbm: number;
    doppler_shift_hz: number;
  };
}

export interface MLEvaluation {
  version: string;
  dataset_total_samples: number;
  train_samples: number;
  test_samples: number;
  classes: string[];
  classification: {
    model_type: string;
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    confusion_matrix: number[][];
    feature_importances: Record<string, number>;
  };
  regression: {
    model_type: string;
    mae: number;
    rmse: number;
    r2_score: number;
    feature_importances: Record<string, number>;
  };
  disclaimer: string;
}

export interface Experiment {
  id: string;
  timestamp: string;
  title: string;
  description?: string;
  configuration: Record<string, any>;
  metrics: SimulationMetrics;
  ml_prediction?: MLPrediction;
  tags?: string[];
}

export interface SystemStatus {
  status: string;
  app_name: string;
  version: string;
  environment: string;
  storage: {
    mode: string;
    is_cloud: boolean;
    connected: boolean;
    storage_target: string;
    total_experiments?: number;
    project_id?: string;
    error?: string;
    details: string;
  };
  machine_learning: {
    status: string;
    model_version: string;
    classification_accuracy?: number;
    regression_r2?: number;
  };
  supported_features: string[];
}
