import { API_BASE_URL } from "@/lib/api-config";
import { getAuthToken, refreshAuthToken } from "@/lib/api-request";

export interface IncomingCallPayload {
  bookingId: string;
  doctorId?: string;
  patientName: string;
  reportId?: string;
  reason?: string;
  type?: "instant" | "scheduled";
  timeoutSeconds?: number;
}

type PresenceEventHandler = (data: any) => void;

class PresenceService {
  private ws: WebSocket | null = null;
  private reconnectTimer: any = null;
  private heartbeatTimer: any = null;
  private listeners: Map<string, Set<PresenceEventHandler>> = new Map();
  private isConnecting = false;

  public getWebSocketUrl(): string {
    const activeBaseUrl = localStorage.getItem("apiBaseUrl") || API_BASE_URL;
    const protocol = activeBaseUrl.startsWith("https") ? "wss:" : "ws:";
    const host = activeBaseUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `${protocol}//${host}/ws/presence`;
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: "ping" });
      }
    }, 25000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  public connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const token = getAuthToken() || localStorage.getItem("token") || localStorage.getItem("accessToken") || localStorage.getItem("authToken");
    const userId = localStorage.getItem("userId");
    if (!token && !userId) {
      console.debug("PresenceService: No auth token or userId found, skipping connection");
      return;
    }

    try {
      this.isConnecting = true;
      const url = this.getWebSocketUrl();
      console.log(`⚡ Connecting to presence WebSocket: ${url}`);
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.isConnecting = false;
        console.log("⚡ Presence WebSocket connected");

        // Identify as patient with token authentication
        this.send({
          type: "identify",
          role: "patient",
          token: token || "",
          userId: userId || undefined,
        });

        // Start 25-second ping heartbeat
        this.startHeartbeat();

        this.emit("connected", { userId, token });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const eventType = data.type || data.event;

          if (eventType === "pong") {
            return;
          }

          if (eventType) {
            this.emit(eventType, data.payload || data);
          }
        } catch (err) {
          console.debug("Presence WS message parse error:", err);
        }
      };

      this.ws.onerror = (err) => {
        console.debug("Presence WS error:", err);
      };

      this.ws.onclose = async (event: CloseEvent) => {
        this.isConnecting = false;
        this.ws = null;
        this.stopHeartbeat();

        // 4401 Unauthorized / Token Expired handling
        if (event.code === 4401) {
          console.warn("⚠️ Presence WS closed with 4401 (Token expired/unauthorized). Attempting token refresh...");
          try {
            const newToken = await refreshAuthToken();
            if (newToken) {
              console.log("✅ Token refreshed, reconnecting to Presence WS...");
              this.connect();
              return;
            }
          } catch (refreshErr) {
            console.error("Presence WS token refresh failed:", refreshErr);
          }
        }

        // Auto-reconnect after 5 seconds if authenticated
        const hasAuth = getAuthToken() || localStorage.getItem("token") || localStorage.getItem("userId");
        if (hasAuth) {
          if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => {
            this.connect();
          }, 5000);
        }
      };
    } catch (err) {
      this.isConnecting = false;
      console.debug("Presence WS connection attempt failed:", err);
    }
  }

  public disconnect(): void {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
  }

  public send(data: any): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(typeof data === "string" ? data : JSON.stringify(data));
      return true;
    }
    console.debug("Presence WS not open, could not send:", data);
    return false;
  }

  /**
   * Notify Doctor Dashboard that a patient is calling / entering consultation
   */
  public notifyDoctorIncomingCall(payload: IncomingCallPayload): boolean {
    const userStr = localStorage.getItem("user");
    let patientName = payload.patientName;
    if (!patientName && userStr) {
      try {
        const u = JSON.parse(userStr);
        patientName = u.name || u.phone_number || "Patient";
      } catch (err) {
        console.debug("Could not parse user from localStorage:", err);
      }
    }

    const message = {
      type: "consultation:incoming",
      event: "consultation:incoming",
      payload: {
        bookingId: payload.bookingId,
        doctorId: payload.doctorId,
        patientName: patientName || "Patient in Queue",
        reportId: payload.reportId,
        reason: payload.reason || "Telehealth Video Consultation",
        type: payload.type || "instant",
        timeoutSeconds: payload.timeoutSeconds || 90,
      },
    };

    console.log("🔔 Emitting consultation:incoming to Doctor:", message);
    return this.send(message);
  }

  public on(event: string, handler: PresenceEventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    // Return unbind function
    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  private emit(event: string, data: any): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (e) {
          console.error(`Error in presence handler for ${event}:`, e);
        }
      });
    }
  }
}

export const presenceService = new PresenceService();