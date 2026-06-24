async function run() {
  const apiKey = 'WYpZqVEg6ra3hsvrKcqBKqOOW6ikz1aaL23wMlp7';
  const url = 'https://api.api-ninjas.com/v1/airports?country=ES&limit=50';
  
  try {
    const res = await fetch(url, { headers: { 'X-Api-Key': apiKey } });
    const data = await res.json();
    console.log("Total airports returned for ES:", data.length);
    console.log("Airports returned:", data.map(a => `${a.name} (${a.iata}/${a.icao}) - ${a.country}`));
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
