import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nvrtalchlqnwvfgjicjm.supabase.co'
const supabaseKey = 'sb_publishable_R2zlVN78-8WhAu337wV00w_IC6K22UD'

export const supabase = createClient(supabaseUrl, supabaseKey)