import { Routes, Route, Link } from "react-router-dom";
import Counter from "./components/counter.jsx";
import EasyButton from "./components/easy-button.jsx";
import Login from "./components/login.jsx";
import LoginSubmission from "./components/login-submission.jsx";
import Spinner from "./components/spinner.jsx";
import { ThemeProvider } from "./components/theme.jsx";
import "../src/App.css";

const pages = [
  { path: "/counter", label: "Counter" },
  { path: "/login", label: "Login" },
  { path: "/login-submission", label: "Login Submission" },
  { path: "/spinner", label: "Spinner" },
  { path: "/easy-button", label: "Easy Button" },
];

function Home() {
  return (
    <div>
      <h1>Testing React Apps — Component Index</h1>
      <ul>
        {pages.map((p) => (
          <li key={p.path}>
            <Link to={p.path}>{p.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function App() {
  return (
    <div style={{ padding: "1rem" }}>
      <nav>
        <Link to="/">Home</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/counter" element={<Counter />} />
        <Route
          path="/login"
          element={<Login onSubmit={(data) => console.log(data)} />}
        />
        <Route path="/login-submission" element={<LoginSubmission />} />
        <Route path="/spinner" element={<Spinner />} />
        <Route
          path="/easy-button"
          element={
            <ThemeProvider>
              <EasyButton>Click me</EasyButton>
            </ThemeProvider>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
