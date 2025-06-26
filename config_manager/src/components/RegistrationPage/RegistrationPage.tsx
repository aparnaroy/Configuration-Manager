import { useEffect, useState } from "react";
import { Form, Button } from "react-bootstrap";
import "./RegistrationPage.css";
import { RegisterRequest } from "../../interfaces/registerRequest";
import { login, register } from "../../services/apiService";
import { LoginRequest } from "../../interfaces/loginRequest";
import { LoginResponse } from "../../interfaces/loginResponse";
import { CustomAlertModal } from "../CustomAlertModal/CustomAlertModal";
import cookie from "js-cookie";

export const RegistrationPage = ({
  onRegister,
  setIsLoggedIn,
  showRegister,
  showCategoryList,
  showLoginPage
}: {
  onRegister: (data: string) => void;
  setIsLoggedIn: (isLogged: boolean) => void;
  showRegister: (register: boolean) => void;
  showCategoryList: (show: boolean) => void;
  showLoginPage: (show: boolean) => void;
}) => {
  const [username, setUsername] = useState<string>("");

  const [password1, setPassword1] = useState<string>("");
  const [password2, setPassword2] = useState<string>("");

  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertModalTitle, setAlertModalTitle] = useState("");
  const [alertModalMessage, setAlertModalMessage] = useState("");

  const [isDisabled, setIsDisabled] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  useEffect(() => {
      showCategoryList(false);
    }, []);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  function checkPasswords(password_1: string, password_2: string) {
    if (password_1 === password_2) {
      setIsDisabled(false);
      return true;
    }
    setIsDisabled(true);
    return false;
  }

  function handleRegister(username: string, password1: string) {
    if (!username) {
      setAlertModalTitle("Missing Username");
      setAlertModalMessage("Username cannot be empty.");
      setShowAlertModal(true);
      return;
    }
    const inputUsername = username.trim();  
    const registerRequest: RegisterRequest = {
      username: inputUsername,
      password: password1,
      role: ["USER"],
    };

    register(registerRequest)
      .then((response) => {
        console.log(
          "Registration successful with the REGISTERRESPONSE: ",
          response
        );
        const loginRequest: LoginRequest = {
          username: inputUsername,
          password: password1,
          rememberMe: false,
        };
        showRegister(false);
        login(loginRequest)
          .then((response) => {
            const loginResponse: LoginResponse = response;
            // alert("Login successful! Logged in as: " + loginResponse.username);
            cookie.set("accessToken", loginResponse.token, { path: "/" });
            cookie.set("username", loginResponse.username, { path: "/" });
            cookie.set("userRole", loginResponse.role, { path: "/" });

            showRegister(false);
            setIsLoggedIn(true);
            showCategoryList(true);
          })
          .catch((error) => {
            console.error("Error logging in: ", error);
          });
      })
      .catch((error) => {
        alert(error.response.data);
      });
  }

  return (
    <>
    <div className="registration-page">
      <div className="formContainer" style={{ marginTop: "90px" }}>
        <h1>Register</h1>
        <Form>
          <Form.Group controlId="formUsername">
            <Form.Label>Username:</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter a username"
              value={username}
              autoComplete="username"
              onChange={(e) => {
                setUsername(e.target.value);
              }}
            />
          </Form.Group>
          <Form.Group controlId="formPassword1">
            <Form.Label>Password:</Form.Label>
            <Form.Control
              type={showPassword ? "text" : "password"}
              placeholder="Enter a password"
              value={password1}
              autoComplete="current-password"
              onChange={(e) => {
                const newPassword1 = e.target.value;
                setPassword1(newPassword1);
                checkPasswords(newPassword1, password2);
              }}
            />
          </Form.Group>
          <Form.Group controlId="formPassword2">
            <Form.Label>Confirm Password:</Form.Label>
            <Form.Control
              type={showPassword ? "text" : "password"}
              placeholder="Confirm Password"
              value={password2}
              autoComplete="current-password"
              onChange={(e) => {
                const newPassword2 = e.target.value;
                setPassword2(newPassword2);
                checkPasswords(password1, newPassword2);
              }}
            />
          </Form.Group>
          {password1 !== password2 && password2 !== "" && (
            <div className="passwordError">Passwords do not match</div>
          )}
          <Form.Group controlId="formShowPassword" className="checkbox-container">
            <Form.Check
              type="checkbox"
              label="Show password"
              checked={showPassword}
              onChange={togglePasswordVisibility}
            />
          </Form.Group>
          <Button
            onClick={(e) => handleRegister(username, password1)}
            disabled={isDisabled}
          >
            Register
          </Button>
          <Button className="register-link"
          onClick={() => {
            showRegister(false);
            showLoginPage(true);
          }}
        >
          Already have an account? Log in <span className="link-text">here</span>
        </Button>
        </Form>
      </div>
      <div></div>
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
