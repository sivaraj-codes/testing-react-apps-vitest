import { useEffect, useState } from "react";

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;
    setStatus("pending");
    setUser(null);
    setError(null);
    window
      .fetch(`https://api.example.com/users/${userId}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch user with id ${userId}`);
        }
        const data = await response.json();
        setUser(data);
        setStatus("resolved");
      })
      .catch((error) => {
        console.error(error);
        setError(error.message);
        setStatus("rejected");
      });
  }, [userId]);

  return (
    <div>
      {status === "pending" && <p aria-label="loading">Loading user data...</p>}

      {status === "rejected" && <div role="alert">{error}</div>}

      {status === "resolved" && user && (
        <div>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
        </div>
      )}
    </div>
  );
}

export default UserProfile;
