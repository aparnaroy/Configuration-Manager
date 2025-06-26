import { Button } from "react-bootstrap";
import "./NavigationBar.css";
import cookie from "js-cookie";
import { CustomAlertModal } from "../CustomAlertModal/CustomAlertModal";
import { useState } from "react";
import logo from "../../images/logo.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons";

export const NavigationBar = ({
  isLoggedIn,
  setIsLoggedIn,
  showLogin,
  showRegister,
  showCategoryList,
  showUserGroupList,
}: {
  isLoggedIn: boolean;
  setIsLoggedIn: (isLogged: boolean) => void;
  showLogin: (login: boolean) => void;
  showRegister: (register: boolean) => void;
  showCategoryList: (show: boolean) => void;
  showUserGroupList: (show: boolean) => void;
}) => {
  const [showAlertModal, setShowAlertModal] = useState(false);
  const jwtToken = cookie.get("accessToken");
  const username = cookie.get("username");
  const userRole = cookie.get("userRole") || "";
  const isAdmin = userRole === "ROLE_ADMIN";

  function signOut() {
    document.cookie = `username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `userRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    setIsLoggedIn(false);
    setShowAlertModal(true);
    showLogin(true);
    showCategoryList(false);
    showRegister(false);
    showUserGroupList(false);
  }

  return (
    <div>
      <div className={`navBarContents ${isAdmin ? "navbar-admin" : ""}`}>
        <img
          src={logo}
          style={{ height: "36px" }}
          alt="Navigation Bar Logo"
          className="title"
          onClick={() => {
            if (isLoggedIn) {
              showLogin(false);
              showRegister(false);
              showCategoryList(true);
            }
          }}
        />

        <div className="navButtons">
          {jwtToken && (
            <h2 className="welcomeText">
              Welcome,{" "}
              {username
                ? username[0].toUpperCase() + username.slice(1) + "!"
                : ""}
            </h2>
          )}

          {isLoggedIn && (
            <>
              {cookie.get("userRole") === "ROLE_ADMIN" && (
                <Button
                  onClick={() => {
                    showUserGroupList(true);
                    showCategoryList(false);
                    showLogin(false);
                    showRegister(false);
                  }}
                >
                  Manage Users
                </Button>
              )}
              <Button onClick={() => signOut()}>
                Logout &nbsp;
                <FontAwesomeIcon icon={faRightFromBracket} />
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="navBarSubContents">
        <CustomAlertModal
          show={showAlertModal}
          title="Logged out"
          message="Successfully logged out"
          onClose={() => setShowAlertModal(false)}
        />
      </div>
      <div className="navBarSubContents"></div>
    </div>
  );
};
