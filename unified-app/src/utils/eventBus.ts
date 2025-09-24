type EventHandler<T = any> = (payload: T) => void

class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map()

  on<T = any>(event: string, handler: EventHandler<T>) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler as EventHandler)
    return () => this.off(event, handler)
  }

  off<T = any>(event: string, handler: EventHandler<T>) {
    this.handlers.get(event)?.delete(handler as EventHandler)
  }

  emit<T = any>(event: string, payload: T) {
    this.handlers.get(event)?.forEach((h) => {
      try { h(payload) } catch (_) { /* noop */ }
    })
  }
}

const eventBus = new EventBus()
export default eventBus


