import React, { useEffect, useState } from "react";
import { NavigationBar } from "../NavigationBar/NavigationBar";
import { CategoryList } from "../CategoryList/CategoryList";
import { Category } from "../../interfaces/category";
import { Version } from "../../interfaces/version";
import { getCategories, getVersions } from "../../services/apiService";
import cookie from "js-cookie";
import "./Layout.css";

const Layout = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedCategories, fetchedVersions] = await Promise.all([
          getCategories(cookie.get("accessToken")), // API call to get categories
          getVersions(), // API call to get versions
        ]);

        setCategories(fetchedCategories);
        setVersions(fetchedVersions);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);
  return (
    <div>
      <NavigationBar
        isLoggedIn={false}
        setIsLoggedIn={() => {}}
        showLogin={() => {}}
        showRegister={() => {}}
        showCategoryList={() => {}}
        showUserGroupList={() => {}}
      />
      {/* Main Content Section */}
      <div className="mainContent">
        <CategoryList
          initialCategories={categories}
          initialVersions={versions}
          configurations={[]} // Passing an empty array or removing this prop if not needed
        />
      </div>
    </div>
  );
};

export default Layout;
