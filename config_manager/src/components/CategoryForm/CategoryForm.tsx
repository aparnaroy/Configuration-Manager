import { useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import "./CategoryForm.css";
import { addCategory } from "../../services/apiService";
import cookie from "js-cookie";
import Editor from "@monaco-editor/react";
import { CategoryStatus } from "../../types/categoryStatus.enum";
import { CustomAlertModal } from "../CustomAlertModal/CustomAlertModal";

export function CategoryForm({
  onSubmit,
}: {
  onSubmit: (success: boolean, errorMessage?: string) => void;
}) {
  // Variables used to store user input for Category name and description.
  const defaultSchema = JSON.stringify(
    {
      type: "object",
      properties: {},
      required: [],
      additionalProperties: false,
    },
    null,
    2 // Adds indentation for readability
  );

  const [newName, setName] = useState<string>("");
  const [newDescr, setDescr] = useState<string>("");
  const [jsonData, setJsonData] = useState<string>(defaultSchema);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertModalTitle, setAlertModalTitle] = useState("");
  const [alertModalMessage, setAlertModalMessage] = useState("");
  const [postModalAction, setPostModalAction] = useState<(() => void) | null>(
    null
  );

  // Creates a new Category using whatever input the user has typed into the below Forms.
  // Sends the saved new Category back out to CategoryList where it is added to the category table & list.
  const saveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    const inputName = newName.trim();
    const inputDescr = newDescr.trim();
    if (inputName === "" || inputDescr === "") {
      setAlertModalTitle("Missing Information");
      setAlertModalMessage(
        "Please fill out all fields before creating a new Category."
      );
      setShowAlertModal(true);
      return;
    }

    // Check if schema is a valid JSON
    let schema: any;
    try {
      schema = JSON.parse(jsonData); // Deserialize the input string
    } catch (error) {
      setAlertModalTitle("Invalid Input");
      setAlertModalMessage("Invalid JSON format.");
      setShowAlertModal(true);
      return;
    }

    try {
      await addCategory(
        inputName,
        inputDescr,
        CategoryStatus.InEditing,
        cookie.get("username") || "",
        cookie.get("accessToken"),
        schema
      );
      setAlertModalTitle("Success");
      setAlertModalMessage("Category added successfully!");
      setPostModalAction(() => () => onSubmit(true));
      setShowAlertModal(true);
    } catch (err: any) {
      const errorMessage = err.response?.data || "Error adding category";
      setAlertModalTitle("Add Category Failed");
      setAlertModalMessage(errorMessage + ".");
      setPostModalAction(() => () => onSubmit(false, errorMessage));
      setShowAlertModal(true);
    }
  };
  

  return (
    <>
      <div>
        <div>
          <Form onSubmit={saveChanges} style={{ padding: "0 1.5em" }}>
            <Form.Group controlId="formName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                as="textarea"
                rows={1}
                value={newName}
                onChange={(e) => setName(e.target.value)}
              />
            </Form.Group>

            <div style={{ height: "15px" }}></div>

            <Form.Group controlId="formDescription">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newDescr}
                onChange={(e) => setDescr(e.target.value)}
                style={{ resize: "none" }}
              />
            </Form.Group>

            <div style={{ height: "15px" }}></div>

            <Form.Group controlId="formSchema">
              <Form.Label>Schema</Form.Label>
              <div style={{ marginLeft: "-10px", marginRight: "0px" }}>
                <Editor
                  className="schema-input"
                  height="240px"
                  width="100%"
                  defaultLanguage="json"
                  defaultValue={jsonData}
                  onChange={(value: any) => setJsonData(value || "{}")}
                  options={{
                    minimap: { enabled: false },
                    lineNumbersMinChars: 3,
                  }}
                />
              </div>
            </Form.Group>

            <Modal.Footer style={{ paddingLeft: 0, paddingRight: 0, marginTop: "20px", marginLeft: "-47px", marginRight: "-47px" }}>
              <Button
                variant="secondary"
                type="submit"
                style={{ backgroundColor: "#28536b", marginRight: "45px", marginBottom: "-10px" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#366480")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#28536b")
                }
              >
                Save
              </Button>
            </Modal.Footer>
          </Form>

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
        </div>
      </div>
    </>
  );
}
