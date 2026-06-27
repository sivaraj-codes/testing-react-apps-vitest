import { useState } from "react";

function Location() {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | pending | resolved | rejected

  function handleClick() {
    setStatus("pending");
    window.navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setStatus("resolved");
      },
      (err) => {
        setError(err.message);
        setStatus("rejected");
      },
    );
  }

  return (
    <div>
      <button onClick={handleClick}>Get Location</button>
      {status === "pending" && <p role="status">Loading...</p>}
      {status === "resolved" && position && (
        <div>
          <p>
            Latitude: <strong>{position.latitude}</strong>
          </p>
          <p>
            Longitude: <strong>{position.longitude}</strong>
          </p>
        </div>
      )}
      {status === "rejected" && error && <div role="alert">{error}</div>}
    </div>
  );
}

export default Location;
