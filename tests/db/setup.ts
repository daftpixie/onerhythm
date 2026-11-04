// Local Supabase round-trips on WSL can exceed Jest's 5s default, especially on
// the first (cold) request. Give the DB integration tests room.
jest.setTimeout(30000);
