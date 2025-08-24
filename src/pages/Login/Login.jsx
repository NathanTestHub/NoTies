import React from 'react' 
import './Login.css'
import assets from '../../assets/assets'

const Login = () => {
  return (
    <div className= 'login'>
      <img src={assets.logo_big} alt="NoTies Logo" className="logo" />
      <form className="login-form"> 
        <h2 className="sign-up-header">Sign Up</h2>
        <input type="text" placeholder="Username" className="input-field" required/>
        <input type="email" placeholder="Email" className="input-field" required/>
        <input type="password" placeholder="Password" className="input-field" required/>
        <button type="submit" className="login-button">Sign Up</button>
        <div className="login-term">
          <input type="checkbox" className="checkbox" />
          <p>By signing up, you agree to our Terms & Conditions</p>
        </div>
        <div className="login-forgot">
          <p className="login-toggle">Already have an account? <a href="/login">Log In</a>  </p> 
        </div>
      </form>
    </div>
  )
}

export default Login