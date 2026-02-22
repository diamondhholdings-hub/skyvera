/**
 * Salesforce REST API client using jsforce
 * Connects via OAuth2 username-password flow or environment variables
 */
import jsforce from 'jsforce'
import type Connection from 'jsforce/lib/connection'

export interface SalesforceConfig {
  instanceUrl: string
  accessToken?: string
  username?: string
  password?: string
  securityToken?: string
  clientId?: string
  clientSecret?: string
}

function getConfig(): SalesforceConfig {
  return {
    instanceUrl: process.env.SALESFORCE_INSTANCE_URL || '',
    username: process.env.SALESFORCE_USERNAME,
    password: process.env.SALESFORCE_PASSWORD,
    securityToken: process.env.SALESFORCE_SECURITY_TOKEN || '',
    clientId: process.env.SALESFORCE_CLIENT_ID,
    clientSecret: process.env.SALESFORCE_CLIENT_SECRET,
  }
}

let _conn: Connection | null = null

export async function getSalesforceConnection(): Promise<Connection> {
  if (_conn) return _conn

  const config = getConfig()

  if (!config.instanceUrl || !config.username || !config.password) {
    throw new Error(
      'Salesforce credentials not configured. Set SALESFORCE_INSTANCE_URL, SALESFORCE_USERNAME, SALESFORCE_PASSWORD in environment.'
    )
  }

  const conn = new jsforce.Connection({
    loginUrl: config.instanceUrl,
  })

  await conn.login(
    config.username,
    `${config.password}${config.securityToken || ''}`
  )

  _conn = conn
  return conn
}

export function resetConnection() {
  _conn = null
}
