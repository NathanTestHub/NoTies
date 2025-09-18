import React, { useState } from "react";
import "./Login.css";
import assets from "../../assets/assets";
import { signup, login, resetPass } from "../../config/firebase";

const Login = () => {
  const [currentForm, setCurrentForm] = useState("Sign Up");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmitHandler = (event) => {
    event.preventDefault();
    if (currentForm === "Sign Up") {
      signup(userName, email, password);
    } else {
      login(email, password);
    }
  };

  return (
    <div className="login">
      <img src={assets.logo_big} alt="NoTies Logo" className="logo" />
      <form onSubmit={onSubmitHandler} className="login-form">
        <h2 className="sign-up-header">{currentForm}</h2>
        {currentForm === "Sign Up" ? (
          <input
            onChange={(e) => setUserName(e.target.value)}
            value={userName}
            type="text"
            placeholder="Username"
            className="input-field"
            required
          />
        ) : null}
        <input
          onChange={(e) => setEmail(e.target.value)}
          value={email}
          type="email"
          placeholder="Email"
          className="input-field"
          required
        />
        <input
          onChange={(e) => setPassword(e.target.value)}
          value={password}
          type="password"
          placeholder="Password"
          className="input-field"
          required
        />
        <button type="submit" className="login-button">
          {currentForm === "Sign Up" ? "Create account" : "Login now"}
        </button>
        <div className="login-term">
          <input type="checkbox" className="checkbox" />
          <p>By signing up, you agree to our Terms & Conditions</p>
        </div>
        <div className="login-forgot">
          {currentForm === "Sign Up" ? (
            <p className="login-toggle">
              Already have an account?{" "}
              <span onClick={() => setCurrentForm("Login")}>Login here</span>{" "}
            </p>
          ) : (
            <p className="login-toggle">
              Create an account{" "}
              <span onClick={() => setCurrentForm("Sign Up")}>
                Sign Up here
              </span>{" "}
            </p>
          )}
          {currentForm === "Login" ? (
            <p className="login-toggle">
              Forgot Password ?{" "}
              <span onClick={() => resetPass(email)}>Click here</span>
            </p>
          ) : null}
        </div>
      </form>
    </div>
  );
};

export default Login;
