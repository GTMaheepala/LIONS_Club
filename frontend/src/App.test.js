import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

test("shows sign in gate when not authenticated", async () => {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );

  expect(await screen.findByRole("heading", { name: /sign in/i })).toBeInTheDocument();
});
