import { Button } from "react-bootstrap";
import { Category } from "../../interfaces/category";
import { Configuration } from "../../interfaces/configuration";
import { Version } from "../../interfaces/version";
import { useState, useEffect } from "react";
import { CustomAlertModal } from "../CustomAlertModal/CustomAlertModal";
import "./ConfigView.css";
import axios from 'axios';
import {
  updateConfiguration,
  approveConfiguration,
  getConfigVersions,
  updateConfigVersion,
} from "../../services/apiService";
import cookie from "js-cookie";
import { capitalizeWords } from "../../utils/stringUtils";
import { VersionConfig } from "../../interfaces/versionConfig";
import { CategoryStatus } from "../../types/categoryStatus.enum";
import { faCheck, faPencil, faPenToSquare, faUserCheck, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Editor } from "@monaco-editor/react";

export const ConfigView = ({
  category,
  config,
  latestVersion,
  latestConfigs,
  previousVersions,
  resetView,
}: {
  category: Category;
  config: Configuration | null;
  latestVersion: Version;
  latestConfigs: Configuration[];
  previousVersions: Version[];
  resetView: (id: string | null) => void;
}) => {
  const [configVersions, setConfigVersions] = useState<VersionConfig[]>([]);
  const [latestConfigVersion, setLatestConfigVersion] = useState<VersionConfig>();
  const [previousConfigVersions, setPreviousConfigVersions] = useState<VersionConfig[]>([]);
  const [selectedConfigVersion, setSelectedConfigVersion] = useState<VersionConfig | null>(latestConfigVersion || null);

  const [isUpdatingConfig, setIsUpdatingConfig] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertModalTitle, setAlertModalTitle] = useState("");
  const [alertModalMessage, setAlertModalMessage] = useState("");
  const [postModalAction, setPostModalAction] = useState<(() => void) | null>(null);

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState(latestConfigVersion?.description || "");

  const [jsonCode, setJsonCode] = useState(
    JSON.stringify({}, null, 2)
  );
  const [isChanged, setIsChanged] = useState(false);
  const [isValidJson, setIsValidJson] = useState(true);
  const [isEditingJson, setIsEditingJson] = useState(false);  // Add this state to control read-only mode

  const validateJson = (value: string) => {
    try {
      JSON.parse(value);
      setIsValidJson(true);
    } catch (error) {
      setIsValidJson(false);
    }
  };

  const Ajv = require('ajv');
  const ajv = new Ajv();


  const handleJsonChange = (value: string | undefined) => {
    const validValue = value || "";  // Fallback to empty string if undefined
    setJsonCode(validValue);  // Make sure it’s a string
    setIsChanged(true);
    validateJson(validValue);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all versions for this config
        if (config) {
          const configVersions = await getConfigVersions(config.configurationId);
          setConfigVersions(configVersions);
          
          const latest = findHighestConfigVersion(configVersions, config.configurationId);
          setLatestConfigVersion(latest);
          setSelectedConfigVersion(latest);

          const prevConfigVersions = findPreviousConfigVersions(configVersions, config.configurationId);
          setPreviousConfigVersions(prevConfigVersions);

          setJsonCode(JSON.stringify(latest.fields, null, 2)); // Update jsonCode when config changes
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [config]);

  const updateConfig = async () => {
    // Get the JWT token from cookies
    const jwtToken = cookie.get("accessToken") || "";

    if (!jwtToken) {
      setAlertModalTitle("Not Logged In");
      setAlertModalMessage("You are not logged in. Please log in first.");
      setShowAlertModal(true);
      return;
    }

    // If JSON is invalid or no changes were made, show an error message
    if (isChanged && !isValidJson) {
      setAlertModalTitle("Invalid Input");
      setAlertModalMessage("Invalid JSON format.");
      setShowAlertModal(true);
      return;
    }

    // Make the API call to update the configuration
    try {
      const updatedFields = JSON.parse(jsonCode);

      if (selectedConfigVersion?.status === CategoryStatus.Approved) { 
        // If the selected version is currently approved, create a new version
        await updateConfiguration(jwtToken, {
          categoryId: config!.categoryId,
          configurationId: latestConfigVersion!.configurationId,
          description: editedDescription,
          fields: updatedFields,
          createdBy: cookie.get("username")
        });

        refresh();
      } else {
        // If the selected version is not currently approved, update the selected version
        await updateConfigVersion(
          config!.configurationId,
          selectedConfigVersion!.versionNum,
          {
            description: editedDescription,
            status: selectedConfigVersion!.status,
            fields: updatedFields,
          }
        );
      }

      // Update state so that after save, you can see changes immediately without having to reload the window
      setLatestConfigVersion((prev) =>
        prev ? { ...prev, description: editedDescription, fields: updatedFields } : prev
      );
      setSelectedConfigVersion((prev) =>
        prev ? { ...prev, description: editedDescription, fields: updatedFields } : prev
      );

      setIsEditingDescription(false);
      setIsUpdatingConfig(false);
      setIsChanged(false);
      setIsEditingJson(false);
    } catch (error) {
      console.error("Error updating configuration:", error);
      setAlertModalTitle("Update Failed");
      setAlertModalMessage("Error updating configuration.");
      setShowAlertModal(true);
    }
  };

  const updateConfigStatus = async (newStatus: string) => {
    try {
      // Update configuration version to new status
      await updateConfigVersion(
          config!.configurationId,
          selectedConfigVersion!.versionNum,
          {
            description: selectedConfigVersion!.description,
            status: newStatus,
            fields: selectedConfigVersion!.fields,
          }
      );
      if (newStatus === CategoryStatus.PendingApproval) {
        setAlertModalTitle("Success");
        setAlertModalMessage("Approval request sent.");
        setPostModalAction(() => async () => {
          await refresh();
        });
        setShowAlertModal(true);
      } else {
        setAlertModalTitle("Success");
        setAlertModalMessage("Configuration status updated successfully.");
        setPostModalAction(() => async () => {
          await refresh();
        });
        setShowAlertModal(true);
      }
    } catch (error) {
      setAlertModalTitle("Update Error");
      setAlertModalMessage("Error updating configuration status.");
      setShowAlertModal(true);
      console.error("Error updating configuration status:", error);
    }
  };

  const refresh = async () => {
    // Fetch the latest configuration data without remounting the app
    if (config) {
      const configVersions = await getConfigVersions(config.configurationId);
      setConfigVersions(configVersions);
      
      const latest = findHighestConfigVersion(configVersions, config.configurationId);
      setLatestConfigVersion(latest);
      setSelectedConfigVersion(latest);

      const prevConfigVersions = findPreviousConfigVersions(configVersions, config.configurationId);
      setPreviousConfigVersions(prevConfigVersions);

      setJsonCode(JSON.stringify(latest.fields, null, 2));
    }
  };

  function findHighestConfigVersion(configVersions: VersionConfig[], configId: string): VersionConfig {
      let high: number = 0;
      let i: number = 0;
    
      const filteredVersions = configVersions.filter((v) => v.configurationId === configId);
      filteredVersions.forEach((e, index) => {
        if (e.versionNum > high) {
          high = e.versionNum;
          i = index;
        }
      });
    
      return filteredVersions[i];
  }

  function findPreviousConfigVersions(versions: VersionConfig[], configId: string): VersionConfig[] {
      let high: number = 0;
      let i: number = 0;
      let previousConfigVersions: VersionConfig[] = [];
      const filteredVersions = versions.filter((version) => version.configurationId === configId);
    
      filteredVersions.forEach((e, index) => {
        if (e.versionNum > high) {
          high = e.versionNum;
          i = index;
        }
      });
    
      previousConfigVersions = filteredVersions.slice(0, i);
      return previousConfigVersions;
  }

  const handleVersionClick = (configVersion: VersionConfig) => {
      setSelectedConfigVersion(configVersion);
      setJsonCode(JSON.stringify(configVersion.fields, null, 2));
      setIsValidJson(true);
  };  

  const validateAgainstCategorySchema = (jsonCode: string) => {
    try {
      // Check if latestVersion.schema is already an object or string
      let parsedSchema;
      if (typeof latestVersion.schema === "string") {
        parsedSchema = JSON.parse(latestVersion.schema); // Only parse if it's a string
      } else {
        parsedSchema = latestVersion.schema; // If it's already an object, use it directly
      }
      const parsedJSON = JSON.parse(jsonCode);

      const validate = ajv.compile(parsedSchema);
      if (validate(parsedJSON)) {
        updateConfig();
      } else {
        // Check if validate.errors is not null or undefined before accessing it
        if (validate.errors && Array.isArray(validate.errors)) {
          console.error("Invalid!", validate.errors);
          setAlertModalTitle("Validation Error");
          setAlertModalMessage("Invalid JSON: " + validate.errors.map((e: { message: any; }) => e.message).join(", "));
          setShowAlertModal(true);
        } else {
          // In case there are no validation errors
          setAlertModalTitle("Validation Error");
          setAlertModalMessage("Unknown validation error occurred.");
          setShowAlertModal(true);
        }
      }
    } catch (error) {
      console.error("Error during schema validation", error);
      setAlertModalTitle("Validation Error");
      setAlertModalMessage("Schema or JSON parsing error.");
      setShowAlertModal(true);
    }
  };
  
  
  const approveConfigurationButton = async () => {
    if (selectedConfigVersion?.status === CategoryStatus.Approved) {
      setAlertModalTitle("Action Not Allowed");
      setAlertModalMessage("Configuration is already approved.");
      setShowAlertModal(true);
      return;
    }
    try {
      await approveConfiguration(
        config?.configurationId || "",
        CategoryStatus.Approved,
        cookie.get("username") || ""
      );
      setAlertModalTitle("Success");
      setAlertModalMessage("Configuration approved successfully!");
      setPostModalAction(() => () => refresh());
      setShowAlertModal(true);      
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setAlertModalTitle("Approval Error");
        setAlertModalMessage(`${error.response.data}`);
        setShowAlertModal(true);
        console.error("Error approving configuration:", error.response.data);
      } else {
        setAlertModalTitle("Unknown Error");
        setAlertModalMessage("An unknown error occurred.");
        setShowAlertModal(true);
        console.error("Unknown error:", error);
      }
    }
  };

  const cancelButtonClick = () => {
    setIsChanged(false);
    setIsUpdatingConfig(false);
    setIsEditingDescription(false);
    setJsonCode(JSON.stringify(selectedConfigVersion?.fields, null, 2));
    setIsEditingJson(false);
  };

  return (
    <>
    <div className="config-view">
      <div className="full-screen-card2">
      <div className="config-card">
        <div className="card-top">
        
          <div className="title-contents">
            <div className="category-title" style={{ fontSize: "41px", fontWeight: "450", padding: "5px .8em 2px .8em" }}
            >
              <div style={{ fontSize: ".93em", fontWeight: "500" }}>{config ? capitalizeWords(config.name) : `Category: ${capitalizeWords(category.name)}`}</div>

              <Button className="config-button" onClick={() => resetView(null)} style={{ marginRight: "4px"}}>
                Back
              </Button>
            </div>

            <div className="config-title" style={{padding: "0px 2em 5px 2em", color: "#616161"}}>
              Category: {capitalizeWords(category.name)} {config ? `(v${config.categoryVersion}.0)` : ""}
            </div>
          </div>
        </div>

        <div className="card-bottom">
          <div className="config-contents">
          <div className="versions" style={{ marginTop: "10px" }}>
              {previousConfigVersions.map((configVersion) => (
                <div 
                  key={configVersion.versionNum}
                  className={selectedConfigVersion?.versionNum === configVersion.versionNum ? "selected-version" : ""}
                  onClick={() => handleVersionClick(configVersion)}
                >
                  {configVersion.versionNum}.0
                  {configVersion.status !== CategoryStatus.Retired && ` (${configVersion.status})`}
                </div>
              ))}
              <div
                className={selectedConfigVersion?.versionNum === latestConfigVersion?.versionNum ? "selected-version" : ""}
                onClick={() => handleVersionClick(latestConfigVersion!)}
              >
                {latestConfigVersion?.versionNum}.0 ({latestConfigVersion?.status})
              </div>
          </div>

          {cookie.get("accessToken") && 
          selectedConfigVersion?.status !== CategoryStatus.Retired && 
          !isUpdatingConfig && (
            <div className="buttons" style={{ justifyContent: "left", gap: "2px" }}>
              {!isUpdatingConfig && selectedConfigVersion?.versionNum === latestConfigVersion?.versionNum && selectedConfigVersion?.status === CategoryStatus.InEditing && (
                <Button
                  variant="dark"
                  className="cardButtons"
                  onClick={() => {
                    setIsUpdatingConfig(true);
                    setEditedDescription(selectedConfigVersion?.description || "");
                    setIsEditingDescription(true);
                    setIsEditingJson(true);  // Enable editing of JSON when editing configuration
                  }}
                >
                  <FontAwesomeIcon icon={faPencil} />&nbsp; Edit Configuration
                </Button>
              )}

              {!isUpdatingConfig && selectedConfigVersion?.versionNum === latestConfigVersion?.versionNum && selectedConfigVersion?.status === CategoryStatus.PendingApproval && cookie.get("userRole") !== "ROLE_ADMIN" && (
                <Button
                  variant="dark"
                  className="cardButtons"
                  onClick={() => updateConfigStatus(CategoryStatus.InEditing)}
                >
                  <FontAwesomeIcon icon={faPencil} />&nbsp; Back to Editing
                </Button>
              )}

              {!isUpdatingConfig && selectedConfigVersion?.versionNum === latestConfigVersion?.versionNum && selectedConfigVersion?.status === CategoryStatus.Approved && (
                <Button
                  variant="dark"
                  className="cardButtons"
                  onClick={() => {
                    setIsUpdatingConfig(true);
                    setEditedDescription(selectedConfigVersion?.description || "");
                    setIsEditingDescription(true);
                    setIsEditingJson(true);  // Enable editing of JSON when editing configuration
                  }}
                >
                  <FontAwesomeIcon icon={faPenToSquare} />&nbsp; Edit to Create New Version
                </Button>
              )}

              {selectedConfigVersion?.status === CategoryStatus.InEditing && (
                <Button
                  variant="success"
                  onClick={() => updateConfigStatus(CategoryStatus.PendingApproval)}
                  className="cardButtons"
                >
                  <FontAwesomeIcon icon={faUserCheck} />&nbsp; Request Approval
                </Button>
              )}
              
              {cookie.get("userRole") === "ROLE_ADMIN" &&
              selectedConfigVersion?.status !== CategoryStatus.Approved && 
              selectedConfigVersion?.status === CategoryStatus.PendingApproval && (
                <Button
                  variant="success"
                  className="cardButtons"
                  onClick={() => approveConfigurationButton()}
                  style={{ width: "109px" }}
                >
                  <FontAwesomeIcon icon={faCheck} />&nbsp; Approve
                </Button>
              )}

              {cookie.get("userRole") === "ROLE_ADMIN" &&
              selectedConfigVersion?.status !== CategoryStatus.Approved && 
              selectedConfigVersion?.status === CategoryStatus.PendingApproval && (
                <Button
                  variant="danger"
                  className="cardButtons"
                  onClick={() => updateConfigStatus(CategoryStatus.InEditing)}
                  style={{ width: "109px" }}
                >
                  <FontAwesomeIcon icon={faXmark} />&nbsp; Reject
                </Button>
              )} 
            </div>
          )}
          </div>

          {selectedConfigVersion && selectedConfigVersion.status === CategoryStatus.Retired && (
            <div style={{ color: "gray", marginTop: "20px", marginBottom: "7px", marginLeft: "14px", fontSize: "16px" }}><strong><i>THIS IS A DEPRECATED VERSION</i></strong></div>
          )}

          {/* <div className="config-description" style={{ marginBottom: "-9px" }}><span><strong>ID: </strong>{selectedConfigVersion?.configurationId}</span></div> */}

          <div className="config-description" style={{ display: "flex", alignItems: "center" }}>
            <span><strong>Description: </strong></span>

            {isEditingDescription && isUpdatingConfig ? (
                <>
                <input
                  type="text"
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  style={{ marginLeft: "10px", marginRight: "-15px", flex: 1, border: "1px solid rgb(179, 179, 179)", borderRadius: "4px", padding: "5px 10px" }}
                  onFocus={(e) => e.target.style.outline = ".5px solid #28536b"}
                  onBlur={(e) => e.target.style.outline = "none"}
                />
                </>
            ) : (
              <>
                <span style={{ marginLeft: "10px" }}>{selectedConfigVersion?.description}</span>
              </>
            )}
          </div>

          <div className="config-description" style={{ marginTop: "-8px", marginBottom: "-5px" }}><span><strong>Properties: </strong></span></div>

          <div className={isEditingJson ? "config-border" : "schema-border"} style={{ marginLeft: "15px", marginBottom: "20px" }}>
            <Editor
              className={isEditingJson ? "edit-config" : "read-only-config"}
              height="240px"
              width="100%"
              defaultLanguage="json"
              value={jsonCode}
              options={{
                readOnly: !isEditingJson,  // Make the editor editable if isEditingJson is true
                minimap: { enabled: false },
                lineNumbersMinChars: 3
              }}
              onChange={(value) => handleJsonChange(value)} 
            />
          </div>
          {!isValidJson && (
            <div className="error-message">Invalid JSON format</div>
          )}

          {selectedConfigVersion?.versionNum === latestConfigVersion?.versionNum && isUpdatingConfig && (
            <>
              <Button
                className="save-button config-buttons"
                onClick={() => {
                  cancelButtonClick();
                }}
                style={{ justifyContent: "left", marginBottom: "15px" }}
                >
                Cancel
              </Button>

              <Button
                className="save-button config-buttons"
                onClick={() => {
                  validateAgainstCategorySchema(jsonCode);
                }}
                disabled={(!isChanged && editedDescription === selectedConfigVersion?.description) || !isValidJson}
                style={{ justifyContent: "left", marginLeft: "10px", marginBottom: "15px" }}
              >
                Save
              </Button>
            </>
          )}
        </div>
      </div>
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
