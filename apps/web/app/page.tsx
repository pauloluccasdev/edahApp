type HealthResponse = {
  status: string;
  service: string;
  healthCheckValue: string | null;
};

async function getApiHealth(): Promise<HealthResponse | null> {
  const baseUrl =
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:3001";

  try {
    const response = await fetch(`${baseUrl}/api/health`, {
      cache: "no-store"
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as HealthResponse;
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const health = await getApiHealth();

  return (
    <main className="page">
      <section className="card">
        <p className="eyebrow">edahApp</p>
        <h1>API health</h1>
        <div className="healthGrid">
          <div className={`statusDot ${health ? "ok" : "error"}`} />
          <div>
            <p className="label">Status</p>
            <p className="value">{health?.status ?? "error"}</p>
          </div>
          <div>
            <p className="label">Service</p>
            <p className="value">{health?.service ?? "api"}</p>
          </div>
          <div>
            <p className="label">Health check (DB)</p>
            <p className="value">{health?.healthCheckValue ?? "indisponível"}</p>
          </div>
        </div>
        <p className="hint">
          {health
            ? "Resposta carregada diretamente da API no server render."
            : "Não foi possível consultar a API agora."}
        </p>
      </section>
    </main>
  );
}
