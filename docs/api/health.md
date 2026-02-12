# GET /api/health

System health check endpoint that verifies all critical components.

## Endpoint

```
GET /api/health
```

## Description

Returns the operational status of:
- Data adapters (Excel parser, external APIs)
- Cache manager
- Claude orchestrator
- Environment configuration
- Database connectivity

## Request

No parameters required.

## Response

### Success (200 OK)

```json
{
  "status": "ok",
  "timestamp": "2026-02-12T10:30:00.000Z",
  "adapters": {
    "excel": {
      "healthy": true,
      "status": "Excel parser operational"
    },
    "newsapi": {
      "healthy": true,
      "status": "NewsAPI connected"
    }
  },
  "cache": {
    "size": 1247,
    "hitRate": 0.68,
    "missRate": 0.32
  },
  "orchestrator": {
    "available": false,
    "message": "Orchestrator stats not yet implemented"
  },
  "environment": {
    "anthropicKeyConfigured": true,
    "newsApiKeyConfigured": true,
    "databaseUrl": "configured",
    "nodeEnv": "development"
  }
}
```

### Error (500 Internal Server Error)

```json
{
  "status": "error",
  "timestamp": "2026-02-12T10:30:00.000Z",
  "error": "Health check failed: Database connection timeout"
}
```

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Overall system status: "ok" or "error" |
| `timestamp` | string | ISO 8601 timestamp |
| `adapters` | object | Status of each data adapter |
| `adapters.[name].healthy` | boolean | Whether adapter is operational |
| `adapters.[name].status` | string | Human-readable status message |
| `cache.size` | number | Number of entries in cache |
| `cache.hitRate` | number | Cache hit rate (0-1) |
| `cache.missRate` | number | Cache miss rate (0-1) |
| `orchestrator` | object | Claude orchestrator status |
| `environment` | object | Configuration status |
| `environment.anthropicKeyConfigured` | boolean | Whether Claude API key is set |
| `environment.newsApiKeyConfigured` | boolean | Whether News API key is set |
| `environment.databaseUrl` | string | Database connection status |
| `environment.nodeEnv` | string | Current environment (development/production) |

## Usage Examples

### cURL

```bash
curl http://localhost:3000/api/health
```

### JavaScript

```javascript
const checkHealth = async () => {
  const response = await fetch('/api/health')
  const health = await response.json()

  if (health.status === 'ok') {
    console.log('System is healthy')
    console.log('Cache hit rate:', health.cache.hitRate)
  } else {
    console.error('System error:', health.error)
  }
}
```

### Python

```python
import requests

response = requests.get('http://localhost:3000/api/health')
health = response.json()

if health['status'] == 'ok':
    print('System is healthy')
    print(f"Adapters: {len(health['adapters'])}")
else:
    print(f"System error: {health['error']}")
```

## Monitoring

Use this endpoint for:
- **Health checks**: Kubernetes/Docker liveness probes
- **Monitoring**: Datadog, New Relic, or custom monitoring
- **Debugging**: Verify API keys and adapters before troubleshooting
- **Performance**: Track cache hit rates and optimize caching strategy

## Notes

- This endpoint does not require authentication
- Response time should be < 100ms under normal conditions
- High cache miss rates (>0.5) may indicate cache TTL issues or high query variance
- Missing API keys will show as `false` in environment config but won't fail the health check
