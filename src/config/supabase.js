require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Faltan las credenciales de Supabase en el archivo .env");
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;