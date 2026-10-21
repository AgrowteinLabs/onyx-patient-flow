import { API_BASE_URL } from "@/lib/api-config";

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
  private listeners: Map<string, Set<PresenceEventHandler>> = new Map();
  private isConnecting = false;

  public getWebSocketUrl(): string {
    const activeBaseUrl = localStorage.getItem("apiBaseUrl") || API_BASE_URL;
    const protocol = activeBaseUrl.startsWith("https") ? "wss:" : "ws:";
    const host = activeBaseUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `${protocol}//${host}/ws/presence`;
  }

  public connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.debug("PresenceService: No userId found, skipping connection");
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

        // Identify as patient upon connection
        this.send({
          type: "identify",
          role: "patient",
          userId,
        });

        this.emit("connected", { userId });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const eventType = data.type || data.event;

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

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.ws = null;
        // Auto-reconnect after 5 seconds if logged in
        if (localStorage.getItem("userId")) {
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
