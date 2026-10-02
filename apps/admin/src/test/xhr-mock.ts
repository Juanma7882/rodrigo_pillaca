import { vi } from 'vitest';

/** Respuesta simulada de una subida (una por solicitud, en orden). */
export type XhrScript = {
  status?: number;
  body?: unknown;
  networkError?: boolean;
  /** Si es true, la respuesta queda pendiente hasta llamar a `release()`. */
  hold?: boolean;
};

export type XhrRequest = { url: string; headers: Record<string, string>; body: FormData };

/** Reemplaza XMLHttpRequest por uno falso que responde con los guiones dados. */
export function mockXhr(scripts: XhrScript[] = []) {
  const requests: XhrRequest[] = [];
  const held: Array<() => void> = [];

  class FakeXhr {
    status = 0;
    responseText = '';
    upload = { onprogress: null as ((e: ProgressEvent) => void) | null };
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    ontimeout: (() => void) | null = null;
    private url = '';
    private headers: Record<string, string> = {};
    open(_method: string, url: string) {
      this.url = url;
    }
    setRequestHeader(name: string, value: string) {
      this.headers[name] = value;
    }
    send(body: FormData) {
      requests.push({ url: this.url, headers: this.headers, body });
      const script = scripts.shift();
      if (!script) throw new Error(`Sin respuesta simulada para la subida ${requests.length}`);
      const respond = () => {
        if (script.networkError) return this.onerror?.();
        const progress = (loaded: number) =>
          this.upload.onprogress?.({ lengthComputable: true, loaded, total: 100 } as ProgressEvent);
        progress(50);
        progress(100);
        this.status = script.status ?? 201;
        this.responseText = JSON.stringify(script.body ?? null);
        this.onload?.();
      };
      if (script.hold) held.push(respond);
      else queueMicrotask(respond);
    }
  }

  vi.stubGlobal('XMLHttpRequest', FakeXhr);
  return {
    requests,
    scripts,
    /** Libera las respuestas retenidas con `hold`. */
    release: () => held.splice(0).forEach((respond) => respond()),
  };
}
