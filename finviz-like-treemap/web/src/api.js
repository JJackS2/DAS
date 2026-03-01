export async function fetchData(dateKey) {
  const qs = dateKey ? `?dateKey=${encodeURIComponent(dateKey)}` : "";
  const res = await fetch(`http://localhost:8787/data${qs}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return await res.json();
}
