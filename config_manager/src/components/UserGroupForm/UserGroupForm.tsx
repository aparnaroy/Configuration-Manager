import { useState } from "react";
import { Button, Form, FormGroup } from "react-bootstrap";
import "./UserGroupForm.css";
import { addUserGroup } from "../../services/apiService";
import { User } from "../../interfaces/User";
import Select from "react-select";
import { Category } from "../../interfaces/category";
import cookie from "js-cookie";
import { CustomAlertModal } from "../CustomAlertModal/CustomAlertModal";

interface UserGroupFormProps {
  users: User[];
  categoryList: Category[];
  onSubmit: (success: boolean, errorMessage?: string) => void;
}

export const UserGroupForm = ({
  users,
  categoryList,
  onSubmit,
}: UserGroupFormProps) => {
  const [newName, setName] = useState<string>("");
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertModalTitle, setAlertModalTitle] = useState("");
  const [alertModalMessage, setAlertModalMessage] = useState("");
  const [postModalAction, setPostModalAction] = useState<(() => void) | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<
    { value: string; label: string }[]
  >([]);
  const [selectedCategories, setSelectedCategories] = useState<
    { value: string; label: string }[]
  >([]);

  // Creates a new User Group
  // Sends user group back to list
  const saveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    const inputName = newName.trim();
    if (inputName === "") {
      setAlertModalTitle("Missing Information");
      setAlertModalMessage("Please fill out all fields before creating a new user group.");
      setShowAlertModal(true);
      return;
    }

    const usernames = selectedUsers.map((user) => user.value);
    const categoryIds = selectedCategories.map((category) => category.value);

    const newUserGroup = {
      user_group_name: inputName,
      user_list: usernames,
      category_access: categoryIds,
    };

    try {
      const jwtToken = cookie.get("accessToken") || "";

      if (!jwtToken) {
        alert("You are not logged in. Please log in first.");
        return;
      }

      await addUserGroup(newUserGroup, jwtToken);
      setAlertModalTitle("Success");
      setAlertModalMessage("User group added successfully!");
      setPostModalAction(() => () => onSubmit(true));
      setShowAlertModal(true);
    } catch (err: any) {
      const errorMessage = err.response?.data || "Error adding user group.";
      setAlertModalTitle("Error");
      setAlertModalMessage(errorMessage + " User group names must be unique and category access is mandatory.");
      setPostModalAction(() => () => onSubmit(false, errorMessage));
      setShowAlertModal(true);

    }
  };

  // Cancels user creation of a User group by submitting void/null
  const handleCancel = () => {
    onSubmit(false);
  };

  const userOptions = users.map((user) => ({
    value: user.username,
    label: user.username,
  }));

  const categoryOptions = categoryList.map((category) => ({
    value: category.categoryId,
    label: category.name,
  }));

  // Handles category selection
  const handleCategoryChange = async (selected: any) => {
    setSelectedCategories(selected ?? []);
  };

  return (
    <>
    <div className="form-page">
      <div className="form-container" style={{ marginTop: "-70px" }}>
        <h1 style={{ fontWeight: "bold" }}>Create New User Group</h1>
        <Form onSubmit={saveChanges} className="form">
          <Form.Group className="form-entry">
            <Form.Label className="form-labels">Group Name:</Form.Label>
            <Form.Control
              className="text-input"
              type="text"
              name="name"
              value={newName}
              onChange={(e) => setName(e.target.value)}
            />
          </Form.Group>
          <FormGroup className="form-entry">
            <Form.Label className="form-labels">Users:</Form.Label>
            <Select
              isMulti
              options={userOptions}
              value={selectedUsers}
              onChange={(selected) =>
                setSelectedUsers(
                  (selected ?? []) as { value: string; label: string }[]
                )
              }
              className="basic-multi-select"
              classNamePrefix="select"
              menuPosition="fixed" // stays in viewport
              styles={{
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              }}
              menuPortalTarget={document.body}
            />
          </FormGroup>
          <FormGroup className="form-entry">
            <Form.Label className="form-labels">Category Access:</Form.Label>
            <Select
              isMulti
              options={categoryOptions}
              value={selectedCategories}
              onChange={handleCategoryChange}
              className="basic-multi-select"
              classNamePrefix="select"
              menuPosition="fixed" // stays in viewport
              styles={{
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              }}
              menuPortalTarget={document.body}
            />
          </FormGroup>
          <div className="form-entry-cancel">
            <Button
              className="custom-form-button cancel-button"
              onClick={handleCancel}
              type="button"
            >
              Cancel
            </Button>
            <Button className="custom-form-button" type="submit">
              Save
            </Button>
          </div>
        </Form>
      </div>
    </div>
    <CustomAlertModal
      show={showAlertModal}
      title={alertModalTitle}
      message={alertModalMessage}
      onClose={() => {
        setShowAlertModal(false);
        if (postModalAction) {
          postModalAction();
          setPostModalAction(null);
        }
      }}
    />
  </>
  );
};
