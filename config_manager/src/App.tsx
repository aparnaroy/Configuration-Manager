import { useEffect, useState } from "react";
import "./App.css";
import { CategoryList } from "./components/CategoryList/CategoryList";
import { Category } from "./interfaces/category";
import { NavigationBar } from "./components/NavigationBar/NavigationBar";
import { LoginPage } from "./components/LoginPage/LoginPage";
import { Version } from "./interfaces/version";
import { Configuration } from "./interfaces/configuration";
import { User } from "./interfaces/User";
import { UserGroupList } from "./components/UserGroupList/UserGroupList";
import cookie from "js-cookie";
import {
  getCategories,
  getVersions,
  getConfigurations,
  getUsers,
} from "./services/apiService";
import { RegistrationPage } from "./components/RegistrationPage/RegistrationPage";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [showCategoryList, setShowCategoryList] = useState<boolean>(true);

  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const [versionList, setVersionList] = useState<Version[]>([]);
  const [configurationList, setConfigurationList] = useState<Configuration[]>(
    []
  );
  const [userList, setUserList] = useState<User[]>([]);

  const [showLogin, setShowLogin] = useState<boolean>(true);

  // Register Variables
  const [showRegister, setShowRegister] = useState<boolean>(false);
  const [registrationData, setRegistrationData] = useState<string>("");
  const [showUserGroupList, setShowUserGroupList] = useState<boolean>(false);

  const handleRegistrationData = (username: string) => {
    setRegistrationData(username);
  };

  useEffect(() => {
    const token = cookie.get("accessToken");
    if (token) {
      setIsLoggedIn(true);
    } else {
      setShowLogin(true);
      setLoading(false); // stop spinner
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        try {
          const jwtToken = cookie.get("accessToken");
          if (!jwtToken) throw new Error("Access token is missing");
        
          const categories = await getCategories(jwtToken);
          const versions = await getVersions(); // if these need auth, pass token
          const configurations = await getConfigurations();
          const users = await getUsers();
        
          setCategoryList(categories);
          setVersionList(versions);
          setConfigurationList(configurations);
          setUserList(users);
        } catch (error: any) {
          console.error("Detailed fetch error:", error);
          setError("Failed to fetch data: " + (error?.message || error));
        }
      } finally {
        setLoading(false);
      }
    };

    if (isLoggedIn) {
      fetchData();
      setShowLogin(false); // hide login page
    }
  }, [isLoggedIn]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="App">
      <div className="navBar">
        <NavigationBar
          isLoggedIn={isLoggedIn}
          setIsLoggedIn={(val) => {
            setIsLoggedIn(val);
            if (!val) {
              setShowLogin(true);
              cookie.remove("accessToken");
            }
          }}
          showLogin={setShowLogin}
          showRegister={setShowRegister}
          showCategoryList={setShowCategoryList}
          showUserGroupList={setShowUserGroupList}
        />
      </div>

      {showLogin && (
        <div className="loginPage">
          <LoginPage
            setIsLoggedIn={setIsLoggedIn}
            showLoginPage={setShowLogin}
            showCategoryList={setShowCategoryList}
            showRegister={setShowRegister}
          />
        </div>
      )}

      {showRegister && (
        <div className="registerPage">
          <RegistrationPage
            onRegister={handleRegistrationData}
            setIsLoggedIn={setIsLoggedIn}
            showRegister={setShowRegister}
            showCategoryList={setShowCategoryList}
            showLoginPage={setShowLogin}
          />
        </div>
      )}

      {isLoggedIn && !showLogin && !showRegister && (
        <>
          {showCategoryList && (
            <div className="CategoryList">
              <CategoryList
                initialCategories={categoryList}
                initialVersions={versionList}
                configurations={configurationList}
              />
            </div>
          )}

          {showUserGroupList && !showCategoryList && (
            <div className="userGroupList">
              <UserGroupList users={userList} />
            </div>
          )}
        </>
      )}
    </div>
  );  
}

export default App;
