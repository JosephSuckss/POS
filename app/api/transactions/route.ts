import { neon } from '@neondatabase/serverless'

const getDatabaseUrl = () => {
  const url = 
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL_UNPOOLED

  if (!url) {
    throw new Error('No database connection string found')
  }
  return url
}

const sql = neon(getDatabaseUrl())

export async function GET() {
  try {
    console.log('[v0] Fetching transactions from database...')
    
    const transactions = await sql`
      SELECT 
        id,
        user_id,
        total_amount,
        payment_method,
        timestamp,
        items_count
      FROM transactions 
      ORDER BY timestamp DESC
      LIMIT 100
    `
    
    console.log(`[v0] Successfully fetched ${transactions.length} transactions`)
    
    return Response.json(transactions)
  } catch (error) {
    console.error('[v0] Error fetching transactions:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return Response.json(
      { 
        error: 'Failed to fetch transactions',
        details: errorMessage
      }, 
      { status: 500 }
    )
  }
}
