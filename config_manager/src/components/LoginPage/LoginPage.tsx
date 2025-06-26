import { useEffect, useState } from "react";
import { Form, Button } from "react-bootstrap";
import "./LoginPage.css";
import cookie from "js-cookie";
import { LoginRequest } from "../../interfaces/loginRequest";
import { CustomAlertModal } from "../CustomAlertModal/CustomAlertModal";
import {
  login,
} from "../../services/apiService";
import { LoginResponse } from "../../interfaces/loginResponse";

export const LoginPage = ({
  setIsLoggedIn,
  showLoginPage,
  showCategoryList,
  showRegister
}: {
  setIsLoggedIn: (isLogged: boolean) => void;
  showLoginPage: (show: boolean) => void;
  showCategoryList: (show: boolean) => void;
  showRegister: (show: boolean) => void;
}) => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertModalTitle, setAlertModalTitle] = useState("");
  const [alertModalMessage, setAlertModalMessage] = useState("");
  
  useEffect(() => {
    showCategoryList(false);
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = (username: string, password: string) => {
    // In the future, we will need to add a remember me checkbox to the login form. For now, we will hardcode it to false.
    const loginRequest: LoginRequest = { username: username, password: password, rememberMe: false };

    login(loginRequest).then((response) => {
        const loginResponse: LoginResponse = response;
        // setAlertModalTitle("Login Successful");
        // setAlertModalMessage("Logged in as: " + loginResponse.username);
        // setShowAlertModal(true);
        cookie.set("accessToken", loginResponse.token, { path: "/" });
        cookie.set("username", loginResponse.username, { path: "/" });
        cookie.set("userRole", loginResponse.role, { path: "/" });

        setIsLoggedIn(true);
        showLoginPage(false);
        showCategoryList(true);
    }).catch((error) => {
      console.error("Error logging in: ", error);
      setAlertModalTitle("Login Failed");
      setAlertModalMessage("Error logging in. Please check your credentials and try again.");
      setShowAlertModal(true);
    });
  }

  return (
    <>
    <div className="loginPage">
      <div className="loginContainer">
        <h1>Login</h1>
        <Form>
          <Form.Group controlId="formUsername">
            <Form.Label>Username:</Form.Label>
            <Form.Control 
              type="text" 
              placeholder="Enter a username" 
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </Form.Group>
          <Form.Group controlId="formPassword">
            <Form.Label>Password:</Form.Label>
            <Form.Control
              type={showPassword ? "text" : "password"}
              placeholder="Enter a password"
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault(); 
                  if (username.trim() !== "" && password.trim() !== "") {
                    handleLogin(username, password);
                }
              }
            }}
            />
          </Form.Group>
          <Form.Group controlId="formShowPassword" className="checkbox-container">
            <Form.Check
              type="checkbox"
              label="Show password"
              checked={showPassword}
              onChange={togglePasswordVisibility}
            />
          </Form.Group>
          <Button
            onClick={() => handleLogin(username, password)}
            disabled={username.trim() === "" || password.trim() === ""}
          >
            Login
          </Button>
        </Form>
        <Button className="register-link"
          onClick={() => {
            showRegister(true);
            showLoginPage(false);
          }}
        >
          Don't have an account? Register <span className="link-text">here</span>
        </Button>
      </div>
    </div>
    <CustomAlertModal
      show={showAlertModal}
      title={alertModalTitle}
      message={alertModalMessage}
      onClose={() => setShowAlertModal(false)}
    />
  </>
  );
};