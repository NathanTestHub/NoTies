import React, { useState } from "react";
import "./FormCheck.css";

const FormCheck = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmitHandler = (event) => {
    event.preventDefault();
  };

  return (
    <div className="form-check">
      <form onSubmit={onSubmitHandler} className="form-check-form">
        <h2 className="form-check-header">Filter</h2>
        <input
          onChange={(e) => setUserName(e.target.value)}
          value={name}
          type="text"
          placeholder="Username"
          className="input-field"
          required
        />
        <input
          value={email}
          type="email"
          placeholder="Email"
          className="input-field"
          required
        />
        <input
          value={password}
          type="password"
          placeholder="Password"
          className="input-field"
          required
        />
        <button type="submit" className="form-check-button">
          submit
        </button>
      </form>
    </div>
  );
};

export default FormCheck;
