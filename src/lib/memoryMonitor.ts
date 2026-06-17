/**
 * Memory Monitoring Utility
 * 
 * Monitors blob URL usage and browser memory pressure to prevent
 * memory exhaustion and provide early warnings.
 */

// Memory pressure thresholds (in bytes)
const MEMORY_THRESHOLDS = {
  WARNING: 100 * 1024 * 1024, // 100 MB
  CRITICAL: 200 * 1024 * 1024, // 200 MB
  DANGER: 500 * 1024 * 1024, // 500 MB
};

// Blob URL limits
const BLOB_URL_LIMITS = {
  WARNING: 10, // 10 active blob URLs
  CRITICAL: 20, // 20 active blob URLs
  DANGER: 50, // 50 active blob URLs
};

type MemoryPressure = "low" | "warning" | "critical" | "danger";

interface MemoryStats {
  activeBlobUrls: number;
  estimatedMemoryUsage: number;
  pressure: MemoryPressure;
  timestamp: number;
}

class MemoryMonitor {
  private blobUrlCount = 0;
  private listeners: Set<(stats: MemoryStats) => void> = new Set();
  private checkInterval: NodeJS.Timeout | null = null;
  private lastStats: MemoryStats | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.startMonitoring();
    }
  }

  /**
   * Register a blob URL creation
   */
  registerBlobUrl(): void {
    this.blobUrlCount++;
    this.checkMemoryPressure();
  }

  /**
   * Register a blob URL revocation
   */
  revokeBlobUrl(): void {
    this.blobUrlCount = Math.max(0, this.blobUrlCount - 1);
    this.checkMemoryPressure();
  }

  /**
   * Get current memory statistics
   */
  getStats(): MemoryStats {
    const estimatedMemoryUsage = this.estimateMemoryUsage();
    const pressure = this.calculatePressure(estimatedMemoryUsage, this.blobUrlCount);

    const stats: MemoryStats = {
      activeBlobUrls: this.blobUrlCount,
      estimatedMemoryUsage,
      pressure,
      timestamp: Date.now(),
    };

    this.lastStats = stats;
    return stats;
  }

  /**
   * Subscribe to memory pressure changes
   */
  subscribe(listener: (stats: MemoryStats) => void): () => void {
    this.listeners.add(listener);
    
    // Immediately send current stats
    if (this.lastStats) {
      listener(this.lastStats);
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Start periodic memory monitoring
   */
  private startMonitoring(): void {
    // Check every 5 seconds
    this.checkInterval = setInterval(() => {
      this.checkMemoryPressure();
    }, 5000);
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Check memory pressure and notify listeners
   */
  private checkMemoryPressure(): void {
    const stats = this.getStats();
    
    // Only notify if pressure changed
    if (this.lastStats?.pressure !== stats.pressure) {
      this.listeners.forEach(listener => listener(stats));
    }
  }

  /**
   * Estimate memory usage based on blob URL count
   * This is a rough estimate - actual usage depends on file sizes
   */
  private estimateMemoryUsage(): number {
    // Assume average video file size of 50MB per blob URL
    const averageSize = 50 * 1024 * 1024;
    return this.blobUrlCount * averageSize;
  }

  /**
   * Calculate memory pressure based on usage and blob URL count
   */
  private calculatePressure(memoryUsage: number, blobCount: number): MemoryPressure {
    // Check blob URL count first (more accurate indicator)
    if (blobCount >= BLOB_URL_LIMITS.DANGER) {
      return "danger";
    }
    if (blobCount >= BLOB_URL_LIMITS.CRITICAL) {
      return "critical";
    }
    if (blobCount >= BLOB_URL_LIMITS.WARNING) {
      return "warning";
    }

    // Fall back to memory usage estimate
    if (memoryUsage >= MEMORY_THRESHOLDS.DANGER) {
      return "danger";
    }
    if (memoryUsage >= MEMORY_THRESHOLDS.CRITICAL) {
      return "critical";
    }
    if (memoryUsage >= MEMORY_THRESHOLDS.WARNING) {
      return "warning";
    }

    return "low";
  }

  /**
   * Get human-readable memory size
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  }

  /**
   * Get memory pressure description
   */
  static getPressureDescription(pressure: MemoryPressure): string {
    switch (pressure) {
      case "low":
        return "Memory usage is normal";
      case "warning":
        return "Memory usage is elevated - consider closing unused tabs";
      case "critical":
        return "Memory usage is high - close unused tabs or restart browser";
      case "danger":
        return "Memory usage is critical - restart browser immediately";
    }
  }
}

// Singleton instance
let memoryMonitorInstance: MemoryMonitor | null = null;

export function getMemoryMonitor(): MemoryMonitor {
  if (!memoryMonitorInstance) {
    memoryMonitorInstance = new MemoryMonitor();
  }
  return memoryMonitorInstance;
}

export { MemoryMonitor };
export type { MemoryStats, MemoryPressure };
