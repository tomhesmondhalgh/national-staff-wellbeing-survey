
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../integrations/supabase/types';

/**
 * A utility wrapper to trace Supabase queries for debugging purposes
 */
export function createTracingClient(client: SupabaseClient<Database>) {
  const originalFrom = client.from.bind(client);
  
  // Create a wrapper that will log all queries and responses
  const tracedClient = {
    ...client,
    from: (table: string) => {
      const queryBuilder = originalFrom(table);
      const originalSelect = queryBuilder.select.bind(queryBuilder);
      
      // Override the select method to add tracing
      queryBuilder.select = function(...args: any[]) {
        const selectBuilder = originalSelect(...args);
        const originalThen = selectBuilder.then.bind(selectBuilder);
        
        console.log(`[QUERY TRACER] Table: ${table}, Select: ${args.join(', ') || '*'}`);
        
        // Capture the original execution chain and add logging
        selectBuilder.then = function(onfulfilled, onrejected) {
          return originalThen(
            (result) => {
              console.log(`[QUERY TRACER] Response for ${table}:`, {
                status: result.status,
                statusText: result.statusText,
                error: result.error,
                count: result.count,
                data: result.data,
              });
              return onfulfilled ? onfulfilled(result) : result;
            },
            (err) => {
              console.error(`[QUERY TRACER] Error in ${table} query:`, err);
              return onrejected ? onrejected(err) : Promise.reject(err);
            }
          );
        };
        
        return selectBuilder;
      };
      
      return queryBuilder;
    }
  };
  
  return tracedClient as SupabaseClient<Database>;
}
