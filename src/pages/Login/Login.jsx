import React, {useState} from 'react' 
import './Login.css'
import assets from '../../assets/assets'
import { signup } from '../../config/firebase'

const Login = () => {

  return (
    <div className= 'login'>
      <img src={assets.logo_big} alt="NoTies Logo" className="logo" />
      <form className="login-form"> 
        <h2 className="sign-up-header">{currentForm}</h2>
        {currentForm === "Sign Up"?<input type="text" placeholder="Username" className="input-field" required/>: null}
        <input type="email" placeholder="Email" className="input-field" required/>
        <input type="password" placeholder="Password" className="input-field" required/>
        <button type="submit" className="login-button">{currentForm === "Sign Up"?"Create account":"Login now"}</button>
        <div className="login-term">
          <input type="checkbox" className="checkbox" />
          <p>By signing up, you agree to our Terms & Conditions</p>
        </div>
        <div className="login-forgot">
          {
            currentForm === "Sign Up"
            ?<p className="login-toggle">Already have an account? <span onClick={()=>setCurrentForm("Login")}>Login here</span> </p> 
            :<p className="login-toggle">Create an account <span onClick={()=>setCurrentForm("Sign Up")}>Sign Up here</span> </p> 
        
          }
          </div>
        
      </form>
    </div>
  )
}

export default Login