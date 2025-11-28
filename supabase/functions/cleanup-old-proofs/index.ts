import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call the cleanup function
    const { error: funcError } = await supabase.rpc('delete_old_task_proofs');

    if (funcError) {
      console.error('Error running cleanup:', funcError);
      return new Response(
        JSON.stringify({ error: funcError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update cleanup log
    const { error: logError } = await supabase
      .from('task_cleanup_log')
      .update({ 
        last_cleanup_at: new Date().toISOString(),
        tasks_cleaned: 0 // Will be updated in the function
      })
      .eq('id', (await supabase.from('task_cleanup_log').select('id').single()).data?.id);

    if (logError) {
      console.error('Error updating log:', logError);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Cleanup completed' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
