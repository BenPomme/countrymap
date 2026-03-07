export type WebToIOSBridgeMessage =
  | {
      type: 'route_changed'
      payload: {
        route: string
        query: string
        title: string
        timestamp: string
      }
    }
  | {
      type: 'session_completed'
      payload: {
        route: string
        sessionType: string
        reason: 'route_change' | 'completed' | 'unload'
        durationMs?: number
        score?: number
        timestamp: string
      }
    }
  | {
      type: 'request_rewarded_retry'
      payload: {
        route: string
        date: string
        truthleDay: number
        timestamp: string
      }
    }
  | {
      type: 'retry_status_changed'
      payload: {
        granted: boolean
        consumed: boolean
        source: 'backend' | 'local_fallback' | 'none'
        timestamp: string
      }
    }
  | {
      type: 'retry_consumed'
      payload: {
        success: boolean
        timestamp: string
      }
    }
  | {
      type: 'truthle_state'
      payload: {
        state: string
        score?: number
        truthleDay: number
        hasRetryAvailable?: boolean
        userId?: string
        timestamp: string
      }
    }

export type IOSToWebBridgeMessage =
  | {
      type: 'entitlement_state'
      payload: {
        adsDisabled: boolean
      }
    }
  | {
      type: 'rewarded_result'
      payload: {
        status: 'granted' | 'failed' | 'closed'
        reason?: string
      }
    }
  | {
      type: 'app_config'
      payload: {
        platform: 'ios'
        version: string
      }
    }
