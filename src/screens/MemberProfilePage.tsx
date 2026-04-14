import { useParams } from "react-router-dom";

export function MemberProfilePage() {
  const { slug } = useParams();

  return (
    <main>
      <h1>Profil membre</h1>
      <p>Slug : {slug}</p>
    </main>
  );
}

