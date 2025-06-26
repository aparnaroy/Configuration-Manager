import { useEffect, useMemo, useState } from "react";
import { Button, FormControl } from "react-bootstrap";
import "./UserGroupList.css";
import { User } from "../../interfaces/User";
import { UserGroup } from "../../interfaces/UserGroup";
import {
  getCategories,
  getUserGroups,
  addUsertoUserGroup,
  removeUserFromUserGroup,
  deleteUserGroup,
  removeCategoryFromUserGroup,
} from "../../services/apiService";
import { UserGroupForm } from "../UserGroupForm/UserGroupForm";
import Select from "react-select";
import cookie from "js-cookie";
import { CustomAlertModal } from "../CustomAlertModal/CustomAlertModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faPlus,
  faUser,
  faUserGroup,
} from "@fortawesome/free-solid-svg-icons";
import { capitalizeWords } from "../../utils/stringUtils";

interface UserGroupListProps {
  users: User[];
}

export const UserGroupList = ({ users }: UserGroupListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "groups">("users");
  const [groupList, setGroupList] = useState<UserGroup[]>([]);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [categories, setCategories] = useState<[]>([]);
  const [expandedUsername, setExpandedUsername] = useState<string | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertModalTitle, setAlertModalTitle] = useState("");
  const [alertModalMessage, setAlertModalMessage] = useState("");
  const [selectedUserGroupsByUser, setSelectedUserGroupsByUser] = useState<{
    [username: string]: string[];
  }>({});
  const [selectedCategoriesToRemove, setSelectedCategoriesToRemove] = useState<{
    [groupId: string]: string[];
  }>({});
  const [groupsToRemoveByUser, setGroupsToRemoveByUser] = useState<{
    [username: string]: string[];
  }>({});
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  const USERS_PER_PAGE = 6;
  const GROUPS_PER_PAGE = 6;
  const [currentUserPage, setCurrentUserPage] = useState(1);
  const [currentGroupPage, setCurrentGroupPage] = useState(1);

  useEffect(() => {
    refreshUserGroups();
    refreshCategories();
  }, []);

  // Filter users based on search query
  const filteredUsers = users.filter(
    (user) => user.username.toLowerCase().includes(searchQuery.toLowerCase()) // Assuming user has a 'name' field
  );

  const refreshUserGroups = async () => {
    try {
      const fetchedUserGroups: UserGroup[] = await getUserGroups(); // Call endpoint to get all categories
      setGroupList(fetchedUserGroups);
    } catch (error) {
      console.error("Error fetching user groups:", error);
    }
  };

  const addNewUserGroup = (success: boolean, errorMessage?: string) => {
    if (success) {
      refreshUserGroups(); // Refresh user groups list
    } else if (errorMessage) {
      console.error("Failed to add group:", errorMessage);
    }
    setShowGroupForm(false);
  };

  const refreshCategories = async () => {
    try {
      const fetchedCategories: [] = await getCategories(
        cookie.get("accessToken")
      ); // Call endpoint to get all categories
      setCategories(fetchedCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const getUserGroupMembership = (username: string) => {
    return groupList.filter((group: any) =>
      group.user_list?.some(
        (user: any) =>
          (typeof user === "string" && user === username) ||
          user?.username === username
      )
    );
  };

  const getCategoriesById = useMemo(() => {
    const categoryMap: { [key: string]: string } = {};
    categories.forEach((category: any) => {
      categoryMap[category.categoryId] = category.name;
    });
    return categoryMap;
  }, [categories]);

  const userTotalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const userStartIndex = (currentUserPage - 1) * USERS_PER_PAGE;
  const currentUsers = filteredUsers.slice(
    userStartIndex,
    userStartIndex + USERS_PER_PAGE
  );

  const groupTotalPages = Math.ceil(groupList.length / GROUPS_PER_PAGE);
  const groupStartIndex = (currentGroupPage - 1) * GROUPS_PER_PAGE;
  const currentGroups = groupList.slice(
    groupStartIndex,
    groupStartIndex + GROUPS_PER_PAGE
  );

  return (
    <>
      <div
        className={`userGroupPage ${showGroupForm ? "no-navbar-padding" : ""}`}
      >
        {" "}
        {!showGroupForm ? (
          <>
            <h2
              style={{
                fontSize: "40px",
                fontWeight: "450",
                marginTop: "45px",
                marginBottom: "15px",
              }}
            >
              Manage Users & User Groups
            </h2>

            <div className="tab-header">
              <button
                className={`tab-button ${
                  activeTab === "users" ? "active" : ""
                }`}
                onClick={() => {
                  setActiveTab("users");
                  setSearchQuery("");
                }}
              >
                <FontAwesomeIcon icon={faUser} />
                &nbsp; Users
              </button>
              <button
                className={`tab-button ${
                  activeTab === "groups" ? "active" : ""
                }`}
                onClick={() => {
                  setActiveTab("groups");
                  refreshCategories();
                }}
              >
                <FontAwesomeIcon icon={faUserGroup} />
                &nbsp; User Groups
              </button>
            </div>

            {/* All code for Users tab */}
            {activeTab === "users" && (
              <>
                <div className="button-search-container">
                  <div className="search-wrapper">
                    <FontAwesomeIcon
                      icon={faMagnifyingGlass}
                      className="search-icon"
                    />
                    <FormControl
                      type="text"
                      placeholder="Search users..."
                      className="search-bar"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentUserPage(1);
                      }}
                    />
                  </div>
                </div>

                <div className="white-box" style={{ marginBottom: "70px" }}>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {currentUsers.length > 0 ? (
                      currentUsers.map((user) => (
                        <li
                          key={user.username}
                          style={{
                            position: "relative",
                            padding: "12px 16px",
                            borderBottom: "1px solid #e0e0e0",
                            cursor: "pointer",
                          }}
                          onClick={() =>
                            setExpandedUsername((prev) =>
                              prev === user.username ? null : user.username
                            )
                          }
                        >
                          <div>{capitalizeWords(user.username)}</div>

                          {expandedUsername === user.username && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                marginTop: "12px",
                                borderTop: "1px solid #ddd",
                                padding: "9px 15px",
                                marginLeft: "8px",
                                backgroundColor: "#f9f9f9",
                                borderRadius: "4px",
                                display: "flex",
                                justifyContent: "space-between",
                                gap: "24px",
                              }}
                            >
                              {/* LEFT COLUMN: User Groups list */}
                              <div style={{ flex: 1 }}>
                                <p
                                  style={{
                                    fontWeight: "bold",
                                    marginBottom: "5px",
                                    marginTop: "3px"
                                  }}
                                >
                                  User Groups{" "}
                                  <span style={{ fontWeight: "normal" }}>
                                    (this user is a member of):
                                  </span>
                                </p>

                                <div style={{ marginBottom: "10px" }}>
                                  {getUserGroupMembership(user.username)
                                    .length > 0 ? (
                                    getUserGroupMembership(user.username).map(
                                      (group: any, index: number) => (
                                        <div key={index} style={{ marginBottom: "3px" }}>
                                          <label>
                                            <input
                                              type="checkbox"
                                              style={{ marginRight: "7px" }}
                                              checked={
                                                groupsToRemoveByUser[
                                                  user.username
                                                ]?.includes(
                                                  group.user_group_name
                                                ) || false
                                              }
                                              onChange={(e) => {
                                                const isChecked =
                                                  e.target.checked;
                                                setGroupsToRemoveByUser(
                                                  (prev) => {
                                                    const prevGroups =
                                                      prev[user.username] || [];
                                                    let updatedGroups =
                                                      isChecked
                                                        ? [
                                                            ...prevGroups,
                                                            group.user_group_name,
                                                          ]
                                                        : prevGroups.filter(
                                                            (name) =>
                                                              name !==
                                                              group.user_group_name
                                                          );

                                                    return {
                                                      ...prev,
                                                      [user.username]:
                                                        updatedGroups,
                                                    };
                                                  }
                                                );
                                              }}
                                            />{" "}
                                            {group.user_group_name}
                                          </label>
                                        </div>
                                      )
                                    )
                                  ) : (
                                    <div
                                      style={{
                                        color: "#606060",
                                        fontStyle: "italic",
                                      }}
                                    >
                                      This user is not a member of any groups
                                    </div>
                                  )}
                                  {groupsToRemoveByUser[user.username]?.length >
                                    0 && (
                                    <Button
                                      size="sm"
                                      style={{
                                        marginTop: "10px",
                                        fontSize: "15px",
                                        color: "white",
                                        border: "none",
                                        padding: "6px 12px",
                                        borderRadius: "4px",
                                        cursor: "pointer",
                                      }}
                                      onClick={async () => {
                                        const groupsToRemove =
                                          groupsToRemoveByUser[user.username];

                                        try {
                                          const jwtToken =
                                            cookie.get("accessToken") || "";

                                          if (!jwtToken) {
                                            alert(
                                              "You are not logged in. Please log in first."
                                            );
                                            return;
                                          }
                                          for (const groupName of groupsToRemove) {
                                            const group = groupList.find(
                                              (g: any) =>
                                                g.user_group_name === groupName
                                            );
                                            if (group) {
                                              await removeUserFromUserGroup(
                                                group?.user_group_id!,
                                                groupName,
                                                user.username,
                                                jwtToken
                                              );
                                            }
                                          }

                                          // Clear selection and refresh UI
                                          setGroupsToRemoveByUser((prev) => ({
                                            ...prev,
                                            [user.username]: [],
                                          }));
                                          refreshUserGroups();
                                        } catch (err) {
                                          console.error(
                                            "Error removing user from groups:",
                                            err
                                          );
                                          setAlertModalTitle("Error");
                                          setAlertModalMessage(
                                            "Cannot remove the last user from the group"
                                          );
                                          setShowAlertModal(true);
                                        }
                                      }}
                                    >
                                      Remove
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {/* RIGHT COLUMN: Add to groups */}
                              <div style={{ flex: 1 }}>
                                <Select
                                  isMulti
                                  value={(
                                    selectedUserGroupsByUser[user.username] ||
                                    []
                                  ).map((groupName) => ({
                                    value: groupName,
                                    label: groupName,
                                  }))}
                                  className="select-box"
                                  options={groupList
                                    .filter(
                                      (group: any) =>
                                        !group.user_list?.some(
                                          (username: any) =>
                                            (typeof username === "string" &&
                                              username === user.username) ||
                                            username?.username === user.username
                                        )
                                    )
                                    .map((group: any) => ({
                                      value: group.user_group_name,
                                      label: group.user_group_name,
                                    }))}
                                  placeholder="Add User to Groups..."
                                  onChange={(selectedOptions) => {
                                    const selectedGroupNames =
                                      selectedOptions.map(
                                        (opt: any) => opt.value
                                      );
                                    setSelectedUserGroupsByUser((prev) => ({
                                      ...prev,
                                      [user.username]: selectedGroupNames,
                                    }));
                                  }}
                                />
                                {selectedUserGroupsByUser[user.username]
                                  ?.length > 0 && (
                                  <Button
                                    size="sm"
                                    className="save-button"
                                    style={{
                                      marginTop: "10px",
                                      padding: "6px 12px",
                                      fontSize: "15px",
                                      boxShadow: "none",
                                      marginLeft: "0px",
                                    }}
                                    onClick={async () => {
                                      const selectedGroupNames =
                                        selectedUserGroupsByUser[user.username];

                                      try {
                                        const jwtToken =
                                          cookie.get("accessToken") || "";

                                        if (!jwtToken) {
                                          alert(
                                            "You are not logged in. Please log in first."
                                          );
                                          return;
                                        }
                                        // Go through each selected group name
                                        for (const groupName of selectedGroupNames) {
                                          const group = groupList.find(
                                            (g: any) =>
                                              g.user_group_name === groupName
                                          );

                                          await addUsertoUserGroup(
                                            group?.user_group_id!,
                                            groupName,
                                            user.username,
                                            jwtToken
                                          );
                                        }

                                        // Clear selection
                                        setSelectedUserGroupsByUser((prev) => ({
                                          ...prev,
                                          [user.username]: [],
                                        }));

                                        refreshUserGroups();
                                      } catch (err) {
                                        console.error(
                                          "Error adding user to group:",
                                          err
                                        );
                                        setAlertModalTitle("Error");
                                        setAlertModalMessage(
                                          "Something went wrong adding user to groups."
                                        );
                                        setShowAlertModal(true);
                                      }
                                    }}
                                  >
                                    Save
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </li>
                      ))
                    ) : (
                      <p
                        style={{
                          color: "#606060",
                          fontSize: "16px",
                          fontStyle: "italic",
                          margin: "15px",
                        }}
                      >
                        No users found
                      </p>
                    )}
                  </ul>
                  <div className="pagination">
                    <Button
                      size="sm"
                      className="small-button"
                      onClick={() =>
                        setCurrentUserPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentUserPage === 1}
                      style={{ padding: "5px 12px 7px 12px" }}
                    >
                      &lt;
                    </Button>

                    <span className="page-info">
                      Page {currentUserPage} of {userTotalPages}
                    </span>

                    <Button
                      className="show-users-button"
                      onClick={() =>
                        setCurrentUserPage((prev) =>
                          Math.min(prev + 1, userTotalPages)
                        )
                      }
                      disabled={currentUserPage === userTotalPages}
                      style={{ padding: "5px 12px 7px 12px" }}
                    >
                      &gt;
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* All code for User Groups tab */}
            {activeTab === "groups" && (
              <>
                <div className="add-user-group">
                  <Button
                    className="custom-buttons"
                    onClick={() => {
                      setShowGroupForm(true);
                      refreshCategories();
                    }}
                    style={{ marginBottom: "20px", boxShadow: "none" }}
                  >
                    Add New Group &nbsp;
                    <FontAwesomeIcon icon={faPlus} />
                  </Button>
                  {showGroupForm && (
                    <UserGroupForm
                      onSubmit={addNewUserGroup}
                      users={users}
                      categoryList={categories}
                    ></UserGroupForm>
                  )}
                </div>
                <div className="white-box" style={{ marginBottom: "30px" }}>
                  {currentGroups.length > 0 ? (
                    <ul style={{ listStyle: "none", padding: 0 }}>
                      {currentGroups.map((group: any) => {
                        const isSelected = selectedGroups.includes(
                          group.user_group_id
                        );

                        return (
                          <li
                            key={group.user_group_id}
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              borderBottom: "1px solid #eee",
                              paddingBottom: "10px",
                            }}
                          >
                            {/* Header row: Group name + delete button */}
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                cursor: "pointer",
                              }}
                              onClick={() =>
                                setExpandedGroup(
                                  expandedGroup === group.user_group_id
                                    ? null
                                    : group.user_group_id
                                )
                              }
                            >
                              <div>{group.user_group_name}</div>

                              {expandedGroup === group.user_group_id && (
                                <Button
                                  variant="danger"
                                  style={{
                                    padding: "5px 10px",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    fontSize: "15px",
                                    fontWeight: "bold",
                                  }}
                                  onClick={async (e) => {
                                    e.stopPropagation();

                                    try {
                                      await deleteUserGroup(
                                        group.user_group_id,
                                        group.user_group_name,
                                        cookie.get("accessToken") || ""
                                      );
                                      setAlertModalTitle("Success");
                                      setAlertModalMessage(
                                        "User group deleted successfully!"
                                      );
                                      setShowAlertModal(true);

                                      refreshUserGroups();
                                    } catch (error) {
                                      console.error(
                                        "Failed to delete group",
                                        error
                                      );
                                      setAlertModalTitle("Error");
                                      setAlertModalMessage(
                                        "Failed to delete group. Please try again."
                                      );
                                      setShowAlertModal(true);
                                    }
                                  }}
                                >
                                  Delete Group
                                </Button>
                              )}
                            </div>

                            {/* Expanded content below */}
                            {expandedGroup === group.user_group_id && (
                              <div
                                style={{
                                  marginTop: "12px",
                                  padding: "8px 15px",
                                  backgroundColor: "#f9f9f9",
                                  borderRadius: "4px",
                                }}
                              >
                                <p
                                  style={{
                                    fontWeight: "bold",
                                    marginBottom: "2px",
                                  }}
                                >
                                  Users:
                                </p>
                                <div style={{ marginLeft: "16px" }}>
                                  {group.user_list?.length > 0 ? (
                                    group.user_list.map(
                                      (user: any, index: number) => (
                                        <div key={index}>
                                          {capitalizeWords(user.username) || capitalizeWords(user)}
                                        </div>
                                      )
                                    )
                                  ) : (
                                    <li>No users in this group</li>
                                  )}
                                </div>

                                <p
                                  style={{
                                    marginTop: "10px",
                                    marginBottom: "5px",
                                    fontWeight: "bold",
                                  }}
                                >
                                  Category Access:
                                </p>
                                <div style={{ marginLeft: "16px" }}>
                                  {group.category_access.map(
                                    (categoryId: string, index: number) => (
                                      <div key={index}>
                                        <label>
                                          <input
                                            type="checkbox"
                                            style={{ marginRight: "7px" }}
                                            checked={
                                              selectedCategoriesToRemove[
                                                group.user_group_id
                                              ]?.includes(categoryId) || false
                                            }
                                            onClick={(e) => e.stopPropagation()} // Prevent click from affecting parent toggler
                                            onChange={(e) => {
                                              setSelectedCategoriesToRemove(
                                                (prev) => {
                                                  const isChecked =
                                                    e.target.checked;
                                                  const current =
                                                    prev[group.user_group_id] ||
                                                    [];
                                                  const updated = isChecked
                                                    ? [...current, categoryId] // Add if checked
                                                    : current.filter(
                                                        (id) =>
                                                          id !== categoryId
                                                      ); // Remove if unchecked

                                                  return {
                                                    ...prev,
                                                    [group.user_group_id]:
                                                      updated,
                                                  };
                                                }
                                              );
                                            }}
                                          />{" "}
                                          {capitalizeWords(getCategoriesById[categoryId]) ||
                                            categoryId}
                                        </label>
                                      </div>
                                    )
                                  )}

                                  {(
                                    selectedCategoriesToRemove[
                                      group.user_group_id
                                    ] || []
                                  ).length > 0 && (
                                    <Button
                                      style={{
                                        marginTop: "10px",
                                        fontSize: "15px",
                                        color: "white",
                                        border: "none",
                                        padding: "6px 12px",
                                        borderRadius: "4px",
                                        cursor: "pointer",
                                      }}
                                      onClick={async () => {
                                        const categoriesToRemove =
                                          selectedCategoriesToRemove[
                                            group.user_group_id
                                          ];

                                        try {
                                          const jwtToken =
                                            cookie.get("accessToken") || "";

                                          if (!jwtToken) {
                                            alert(
                                              "You are not logged in. Please log in first."
                                            );
                                            return;
                                          }
                                          for (const category_id of categoriesToRemove) {
                                            await removeCategoryFromUserGroup(
                                              group?.user_group_id!,
                                              group.user_group_name,
                                              category_id,
                                              jwtToken
                                            );
                                          }

                                          // Clear selection and refresh UI
                                          setSelectedCategoriesToRemove(
                                            (prev) => ({
                                              ...prev,
                                              [group.user_group_id]: [],
                                            })
                                          );
                                          refreshUserGroups();
                                        } catch (err) {
                                          console.error(
                                            "Error removing categories from groups:",
                                            err
                                          );
                                          setAlertModalTitle("Error");
                                          setAlertModalMessage(
                                            "Cannot remove the last category from the group"
                                          );
                                          setShowAlertModal(true);
                                        }
                                      }}
                                    >
                                      Remove
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p style={{ color: "#28536b", fontSize: "16px" }}>
                      No user groups found
                    </p>
                  )}
                  <div>
                    {selectedGroups.length > 0 && (
                      <div style={{ marginTop: "20px", textAlign: "center", fontSize: "15px" }}>
                        <Button>
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="pagination">
                    <Button
                      className="show-groups-button"
                      onClick={() =>
                        setCurrentGroupPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentGroupPage === 1}
                      style={{ padding: "5px 12px 7px 12px" }}
                    >
                      {" "}
                      &lt;
                    </Button>

                    <span className="page-info">
                      Page {currentGroupPage} of {groupTotalPages}
                    </span>

                    <Button
                      className="show-groups-button"
                      onClick={() =>
                        setCurrentGroupPage((prev) =>
                          Math.min(prev + 1, groupTotalPages)
                        )
                      }
                      disabled={currentGroupPage === groupTotalPages}
                      style={{ padding: "5px 12px 7px 12px" }}
                    >
                      &gt;
                    </Button>
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <UserGroupForm
            onSubmit={addNewUserGroup}
            users={users}
            categoryList={categories}
          />
        )}
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
