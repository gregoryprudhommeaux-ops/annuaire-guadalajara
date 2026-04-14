import { useParams } from "react-router-dom";

export function RequestDetailPage() {
  const { id } = useParams();

  return (
    <main>
      <h1>Détail de la demande</h1>
      <p>ID : {id}</p>
    </main>
  );
}

