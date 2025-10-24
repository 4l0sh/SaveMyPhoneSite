import { useCallback, useState } from "react";
import "./login.css";

const Login = () => {
  const [error, setError] = useState(null);
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const username = String(formData.get("username") || "").trim();
    const password = String(formData.get("password") || "").trim();
    if (!username || !password) {
      setError("Vul zowel gebruikersnaam als wachtwoord in");
      return;
    }

    fetch("http://localhost:3000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Login failed");
        }
        return res.json();
      })
      .then((data) => {
        console.log("Login successful:", data);
        localStorage.setItem("authToken", data.token);
        window.location.href = "/admin";
      })
      .catch((err) => {
        console.error("Login error:", err);
        setError("Invalid username or password");
      });
  }, []);

  return (
    <div className="login-page">
      <div className="login-card">
        <h2 className="login-title">Inloggen</h2>
        <p className="login-subtitle">Log in om te beheren.</p>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {error && <div className="login-error">{error}</div>}
          <div className="input-group">
            <label htmlFor="username">Gebruikersnaam</label>
            <input
              type="text"
              id="username"
              name="username"
              className="login-input"
              placeholder="bijv. naam@example.com"
              autoComplete="username"
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Wachtwoord</label>
            <input
              type="password"
              id="password"
              name="password"
              className="login-input"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn btn-primary login-submit">
            Inloggen
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
