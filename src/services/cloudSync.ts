import { AppState } from './storage';

export interface SyncPayload {
  state: AppState;
  savedBy: string;
  savedAt: string;
  lastUpdated?: string;
  version?: number;
}

type UpdateCallback = (data: AppState, savedBy: string, savedAt: string) => void;

class CloudSyncService {
  private listeners: Set<UpdateCallback> = new Set();
  private eventSource: EventSource | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private isConnecting = false;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private lastVersion = 0;

  constructor() {
    this.initBroadcastChannel();
    this.initEventSource();
    this.initPollingFallback();
  }

  private initBroadcastChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('heckler_family_realtime_sync');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.type === 'DATA_UPDATED' && event.data.state) {
            this.notifyListeners(event.data.state, event.data.savedBy || 'Outro Titular', event.data.savedAt || new Date().toLocaleTimeString('pt-BR'));
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel não suportado neste navegador:', err);
      }
    }
  }

  private initEventSource() {
    if (typeof window === 'undefined' || !('EventSource' in window)) return;
    if (this.isConnecting || this.eventSource) return;

    this.isConnecting = true;

    try {
      this.eventSource = new EventSource('/api/finance-sync');

      this.eventSource.addEventListener('DATA_UPDATED', (event: MessageEvent) => {
        try {
          const payload: SyncPayload = JSON.parse(event.data);
          if (payload?.state) {
            if (payload.version) {
              this.lastVersion = payload.version;
            }
            this.notifyListeners(payload.state, payload.savedBy || 'Outro Titular', payload.savedAt || new Date().toLocaleTimeString('pt-BR'));
          }
        } catch (err) {
          console.error('Erro ao interpretar evento SSE DATA_UPDATED:', err);
        }
      });

      this.eventSource.onopen = () => {
        this.isConnecting = false;
      };

      this.eventSource.onerror = () => {
        this.isConnecting = false;
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }
        // Tentativa de reconexão automática
        if (!this.reconnectTimeout) {
          this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            this.initEventSource();
          }, 3000);
        }
      };
    } catch (err) {
      this.isConnecting = false;
      console.warn('Falha ao inicializar EventSource:', err);
    }
  }

  private initPollingFallback() {
    if (typeof window === 'undefined') return;

    // Polling regular a cada 8 segundos para garantir sincronia mesmo com redes móveis oscilantes
    this.pollingInterval = setInterval(() => {
      this.checkServerUpdates();
    }, 8000);

    // Quando o usuário volta à aba do navegador
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkServerUpdates();
      }
    });

    window.addEventListener('focus', () => {
      this.checkServerUpdates();
    });
  }

  private async checkServerUpdates() {
    try {
      const res = await fetch('/api/finance-data', { cache: 'no-store' });
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && json.data) {
        if (json.version && json.version > this.lastVersion) {
          this.lastVersion = json.version;
          this.notifyListeners(json.data, json.savedBy || 'Servidor', json.savedAt || new Date().toLocaleTimeString('pt-BR'));
        }
      }
    } catch {
      // Falha silenciosa de polling
    }
  }

  private notifyListeners(state: AppState, savedBy: string, savedAt: string) {
    for (const listener of this.listeners) {
      try {
        listener(state, savedBy, savedAt);
      } catch (err) {
        console.error('Erro no listener de sincronização:', err);
      }
    }
  }

  /**
   * Assina notificações de atualização de dados em tempo real
   */
  public subscribe(callback: UpdateCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Busca os dados canônicos compartilhados do servidor
   */
  public async fetchCanonicalData(): Promise<{ success: boolean; data?: AppState; savedBy?: string; savedAt?: string }> {
    try {
      const res = await fetch('/api/finance-data', { cache: 'no-store' });
      if (!res.ok) return { success: false };
      const json = await res.json();
      if (json.success && json.data) {
        if (json.version) this.lastVersion = json.version;
        return {
          success: true,
          data: json.data,
          savedBy: json.savedBy,
          savedAt: json.savedAt,
        };
      }
      return { success: false };
    } catch (err) {
      console.warn('Erro ao buscar dados canônicos do servidor:', err);
      return { success: false };
    }
  }

  /**
   * Salva os dados canônicos no servidor e transmite para todos os outros usuários conectados
   */
  public async saveCanonicalData(state: AppState, savedBy: string, savedAt: string): Promise<boolean> {
    // 1. Notifica imediatamente abas locais no mesmo navegador
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'DATA_UPDATED',
          state,
          savedBy,
          savedAt,
        });
      } catch (err) {
        console.warn('Erro no broadcast local:', err);
      }
    }

    // 2. Salva no servidor para persistir no disco e transmitir via SSE para qualquer outro dispositivo
    try {
      const res = await fetch('/api/finance-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          state,
          savedBy,
          savedAt,
        }),
      });

      if (!res.ok) {
        console.error('Falha HTTP ao salvar no servidor:', res.statusText);
        return false;
      }

      const json = await res.json();
      if (json.version) {
        this.lastVersion = json.version;
      }
      return Boolean(json.success);
    } catch (err) {
      console.error('Erro na requisição de salvamento no servidor:', err);
      return false;
    }
  }

  /**
   * Reseta os dados canônicos no servidor para a demonstração padrão
   */
  public async resetCanonicalData(defaultState: AppState, resetBy: string): Promise<boolean> {
    try {
      const res = await fetch('/api/finance-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultState, resetBy }),
      });
      return res.ok;
    } catch (err) {
      console.error('Erro ao resetar dados no servidor:', err);
      return false;
    }
  }
}

export const cloudSync = new CloudSyncService();
