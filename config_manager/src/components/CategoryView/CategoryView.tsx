import { Button, Form, Modal } from "react-bootstrap";
import { Category } from "../../interfaces/category";
import { Configuration } from "../../interfaces/configuration";
import { Version } from "../../interfaces/version";
import { useState, useEffect } from "react";
import { CustomAlertModal } from "../CustomAlertModal/CustomAlertModal";
import Card from "react-bootstrap/Card";
import "./CategoryView.css";
import {
  addConfiguration,
  approveCategory,
  updateCategory,
  getCategoryConfigurations,
  getVersions,
  getConfigVersions,
  requestCategoryApproval,
} from "../../services/apiService";
import cookie from "js-cookie";
import { ConfigView } from "../ConfigView/ConfigView";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { ColumnDef } from "@tanstack/react-table";
import { capitalizeWords } from "../../utils/stringUtils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBoxArchive, faCheck, faPencil, faPenToSquare, faPlus, faUserCheck, faXmark } from "@fortawesome/free-solid-svg-icons";
import { VersionConfig } from "../../interfaces/versionConfig";
import { CategoryStatus } from "../../types/categoryStatus.enum";
import { Editor } from "@monaco-editor/react";


export const CategoryView = ({
  category,
  resetView
}: {
  category: Category;
  resetView: (id: string | null) => void;

}) => {
  const [latestVersion, setLatestVersion] = useState<Version>();
  const [categoryConfigs, setCategoryConfigs] = useState<Configuration[]>([]);
  const [categoryVersionConfigs, setCategoryVersionConfigs] = useState<Configuration[]>([]);
  const [previousVersions, setPreviousVersions] = useState<Version[]>([]);

  const [configID, setConfigID] = useState<null | string>(null);
  const [config, setConfig] = useState<null | Configuration>(null);

  const [configVersions, setConfigVersions] = useState<VersionConfig[]>([]);

  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertModalTitle, setAlertModalTitle] = useState("");
  const [alertModalMessage, setAlertModalMessage] = useState("");
  const [postModalAction, setPostModalAction] = useState<(() => void) | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [newDescription, setNewDescription] = useState(
    latestVersion ? latestVersion.description : ""
  );
  const [newSchema, setNewSchema] = useState<string>("{}");

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [newConfigName, setNewConfigName] = useState("");
  const [newConfigDescription, setNewConfigDescription] = useState("");
  const [newConfigProperties, setNewConfigProperties] = useState(
    JSON.stringify({}, null, 2)
  );

  const [selectedVersion, setSelectedVersion] = useState<Version | null>(
    latestVersion || null
  );
  const Ajv = require('ajv');
  const ajv = new Ajv();

  // Fetch the latest version, configurations, and previous versions based on categoryId directly from the database
  useEffect(() => {
    let categoryId: string = localStorage.getItem("selectedCategoryId") || "";
    const fetchData = async () => {
      try {
        // Fetch versions and configurations for the selected category
        const versions = await getVersions();
        const configs = await getCategoryConfigurations(categoryId);

        // Use the helper functions to find the latest version of the category
        const latest = findHighestVersion(versions, categoryId);
        setLatestVersion(latest);
        setSelectedVersion(latest);

        setCategoryConfigs(configs);
        // Get the configs of the latest version of the category
        if (configs.length !== 0) {
          const latestCategoryVersionConfigs = configs.filter((config: { categoryVersion: number; }) => config.categoryVersion === latest.versionNum);
          setCategoryVersionConfigs(latestCategoryVersionConfigs);
        }

        const prevVersions = findPreviousVersions(versions, categoryId);
        setPreviousVersions(prevVersions);

        // Set the new description from the latest version
        setNewDescription(latest.description);

        // Fetch config versions for EACH config
        const allConfigVersions: VersionConfig[] = [];

        for (const config of configs) {
          const configVersions = await getConfigVersions(
            config.configurationId
          );
          allConfigVersions.push(...configVersions);
        }

        setConfigVersions(allConfigVersions); // Store all versions of all configs
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [category]); // This effect will be triggered when category changes

  function findHighestVersion(
    versions: Version[],
    categoryId: string
  ): Version {
    let high: number = 0;
    let indx: number = 0;

    const filteredVersions = versions.filter(
      (version) => version.categoryId === categoryId
    );
    filteredVersions.forEach((e, index) => {
      if (e.versionNum > high) {
        high = e.versionNum;
        indx = index;
      }
    });

    return filteredVersions[indx];
  }

  function findPreviousVersions(
    versions: Version[],
    categoryId: string
  ): Version[] {
    let high: number = 0;
    let indx: number = 0;
    let previousVersions: Version[] = [];
    const filteredVersions = versions.filter(
      (version) => version.categoryId === categoryId
    );

    filteredVersions.forEach((e, index) => {
      if (e.versionNum > high) {
        high = e.versionNum;
        indx = index;
      }
    });

    previousVersions = filteredVersions.slice(0, indx);
    return previousVersions;
  }

  const refreshCategoryData = async () => {
    const categoryId = localStorage.getItem("selectedCategoryId") || "";
    // Fetch versions and configurations for the selected category
    const versions = await getVersions();
    const configs = await getCategoryConfigurations(categoryId);

    // Use the helper functions to find the latest version of the category
    const latest = findHighestVersion(versions, categoryId);
    setLatestVersion(latest);
    setSelectedVersion(latest);

    setCategoryConfigs(configs);
    // Get the configs of the latest version of the category
    if (configs.length !== 0) {
      const latestCategoryVersionConfigs = configs.filter((config: { categoryVersion: number; }) => config.categoryVersion === latest.versionNum);
      setCategoryVersionConfigs(latestCategoryVersionConfigs);
    }

    const prevVersions = findPreviousVersions(versions, categoryId);
    setPreviousVersions(prevVersions);

    // Set the new description from the latest version
    setNewDescription(latest.description);

    // Fetch config versions for EACH config
    const allConfigVersions: VersionConfig[] = [];

    for (const config of configs) {
      const configVersions = await getConfigVersions(
        config.configurationId
      );
      allConfigVersions.push(...configVersions);
    }

    setConfigVersions(allConfigVersions); // Store all versions of all configs
  };
  

  function findHighestConfigVersion(
    configVersions: VersionConfig[],
    configId: string
  ): VersionConfig | null {
    const filtered = configVersions.filter(
      (v) => v.configurationId === configId
    );
    let highest = filtered[0];

    filtered.forEach((v) => {
      if (v.versionNum > highest.versionNum) {
        highest = v;
      }
    });

    return highest;
  }

  const resetModalValues = () => {
    if (latestVersion) {
      setNewDescription(latestVersion.description);
    }
  };

  const resetConfigModalValues = () => {
    setNewConfigName("");
    setNewConfigDescription("");
  };


  const handleUpdateCategory = async () => {
    const jwtToken = cookie.get("accessToken") || "";
    const username = cookie.get("username") || "";
  
    if (!jwtToken) {
      setAlertModalTitle("Login Required");
      setAlertModalMessage("You are not logged in. Please log in first.");
      setShowAlertModal(true);
      return;
    }
  
    // Track whether there's any change
    const descriptionChanged = latestVersion && newDescription !== latestVersion.description;
    const schemaChanged = latestVersion && newSchema !== JSON.stringify(latestVersion.schema, null, 2);
  
    if (!descriptionChanged && !schemaChanged) {
      setAlertModalTitle("No Changes");
      setAlertModalMessage("No changes detected.");
      setShowAlertModal(true);
      return;
    }
  
    // Parse schema if it changed
    let parsedSchema = latestVersion?.schema || {};
    if (schemaChanged) {
      try {
        parsedSchema = JSON.parse(newSchema);
      } catch (err) {
        setAlertModalTitle("Invalid Schema");
        setAlertModalMessage("The schema is not a valid JSON.");
        setShowAlertModal(true);
        return;
      }
    }
  
    try {
      await updateCategory(
        category.categoryId,
        descriptionChanged ? newDescription : latestVersion?.description || "",
        latestVersion?.status || "",
        username,
        parsedSchema,
        jwtToken
      );

      setShowModal(false);
  
      setAlertModalTitle("Success");
      setAlertModalMessage("Category updated successfully!");
      setPostModalAction(() => async () => {
        await refreshCategoryData();
      });
      setShowAlertModal(true);
    } catch (error) {
      console.error("Error updating category:", error);
      setAlertModalTitle("Update Error");
      setAlertModalMessage("Error updating category.");
      setShowAlertModal(true);
    }
  };
  

  const updateCategoryStatus = async (status: string) => {
    // Get the JWT token from cookies
    const jwtToken = cookie.get("accessToken") || "";

    // Make sure the JWT token exists before trying to update the category
    if (!jwtToken) {
      setAlertModalTitle("Login Required");
      setAlertModalMessage("You are not logged in. Please log in first.");
      setShowAlertModal(true);
      return;
    }

    // If status is the same as it already was, do not update
    if (latestVersion && status === latestVersion.status) {
      setAlertModalTitle("No Action Needed");
      setAlertModalMessage("Category status is already " + status + ".");
      setShowAlertModal(true);
      return;
    }

    // Make the API call to update the category
    try {
      await updateCategory(
        category.categoryId,
        latestVersion ? latestVersion.description : "",
        status,
        cookie.get("username") || "",
        latestVersion ? latestVersion.schema : {},
        jwtToken
      );
    
      setAlertModalTitle("Success");
      setAlertModalMessage("Category status updated successfully.");
      setPostModalAction(() => async () => {
        await refreshCategoryData();
      });
      setShowAlertModal(true);
    } catch (error) {
      console.error("Error updating category status:", error);
      setAlertModalTitle("Update Error");
      setAlertModalMessage("Error updating category status.");
      setShowAlertModal(true);
    }
  };


  const createNewConfig = async () => {
    // Get the JWT token from cookies
    const jwtToken = cookie.get("accessToken") || "";
  
    // Make sure the JWT token exists before trying to update the category
    if (!jwtToken) {
      setAlertModalTitle("Login Required");
      setAlertModalMessage("You are not logged in. Please log in first.");
      setShowAlertModal(true);      
      return;
    }

    // Check if the new config name and description are provided
    if (!newConfigName || !newConfigDescription) {
      setAlertModalTitle("Missing Information");
      setAlertModalMessage("Please fill out all fields.");
      setShowAlertModal(true);
      return;
    }
  
    let newFields;
    try {
      // Parse the new config properties as JSON
      newFields = JSON.parse(newConfigProperties);
    } catch (err) {
      setAlertModalTitle("Invalid JSON");
      setAlertModalMessage("The Properties JSON you entered is not valid. Please try again.");
      setShowAlertModal(true);
      return;
    }
  
    // Perform AJV validation
    const validationResult = validateAgainstCategorySchema(newConfigProperties);
    if (!validationResult) {
      // If validation failed, show an error message and stop the save process
      return;
    }
  
    // If currently selected category is not Approved, do not create a new config
    if (selectedVersion && selectedVersion.status !== CategoryStatus.Approved) {
      setAlertModalTitle("Invalid Action");
      setAlertModalMessage("Cannot create a new configuration for this category. Category must be approved first.");
      setShowAlertModal(true);
      return;
    }
  
    // Make the API call to create the new configuration
    try {
      await addConfiguration({
        categoryId: category.categoryId,
        categoryVersion: selectedVersion ? selectedVersion.versionNum : 0,
        name: newConfigName,
        createdBy: cookie.get("username") || "",
        status: CategoryStatus.InEditing,
        description: newConfigDescription,
        fields: newFields,
      });
    
      setAlertModalTitle("Success");
      setAlertModalMessage("Configuration created successfully!");
      setPostModalAction(() => async () => {
        await refreshCategoryData();
      });
      setShowAlertModal(true);
      setShowConfigModal(false);
      resetConfigModalValues();
    } catch (error) {
      console.error("Error creating configuration:", error);
      setAlertModalTitle("Error");
      setAlertModalMessage("Error creating configuration: " + newConfigName + " " + category.categoryId);
      setShowAlertModal(true);
    }
  };
  
  const validateAgainstCategorySchema = (jsonCode: string) => {
    if (!latestVersion) {
      setAlertModalTitle("Validation Error");
      setAlertModalMessage("No version data available.");
      setShowAlertModal(true);
      return false; // Return false to stop execution if latestVersion is undefined
    }
  
    try {
      let parsedSchema;
      if (typeof latestVersion.schema === "string") {
        parsedSchema = JSON.parse(latestVersion.schema); // Only parse if it's a string
      } else {
        parsedSchema = latestVersion.schema; // If it's already an object, use it directly
      }
  
      const parsedJSON = JSON.parse(jsonCode);
  
      const validate = ajv.compile(parsedSchema);
      if (validate(parsedJSON)) {
        return true; // Return true to indicate validation success
      } else {
        if (validate.errors && Array.isArray(validate.errors)) {
          console.error("Invalid!", validate.errors);
          setAlertModalTitle("Validation Error");
          setAlertModalMessage("Invalid JSON: " + validate.errors.map((e: { message: any; }) => e.message).join(", "));
          setShowAlertModal(true);
        } else {
          setAlertModalTitle("Validation Error");
          setAlertModalMessage("Unknown validation error occurred.");
          setShowAlertModal(true);
        }
        return false; // Return false to indicate validation failure
      }
    } catch (error) {
      console.error("Error during schema validation", error);
      setAlertModalTitle("Validation Error");
      setAlertModalMessage("Schema or JSON parsing error.");
      setShowAlertModal(true);
      return false; // Return false if there is an error during validation
    }
  };

  interface SchemaProperty {
    type: "string" | "number" | "object" | "array" | "boolean"; // Add more types as needed
  } 

  useEffect(() => {
    // Check if latestVersion?.schema is already an object
    if (latestVersion?.schema) {
      const parsedSchema = typeof latestVersion.schema === 'string' 
        ? JSON.parse(latestVersion.schema) // If it's a string, parse it
        : latestVersion.schema; // Otherwise, use it directly
  
      if (parsedSchema.properties) {
        const defaultValues: Record<string, any> = {};
  
        // Iterate over the properties and create an object with empty values
        for (const [key, value] of Object.entries(parsedSchema.properties)) {
          // Type assertion: We know that value is a SchemaProperty, so we can cast it
          const property = value as SchemaProperty;
  
          if (property.type === "string") {
            defaultValues[key] = ""; // Empty string for string types
          } else if (property.type === "number") {
            defaultValues[key] = 0; // Default to 0 for numbers
          } else if (property.type === "boolean") {
            defaultValues[key] = false; // Default to false for boolean types
          } else {
            defaultValues[key] = null; // Default for any other types
          }
        }
  
        // Set the default JSON string in the editor
        setNewConfigProperties(JSON.stringify(defaultValues, null, 2));
      } else {
        console.error("Schema does not contain 'properties'.");
      }
    } else {
      // console.error("Schema is unavailable or invalid.");
    }
  }, [latestVersion]);
  
  
  const requestCategoryApprovalButton = async () => {
    try {
      await requestCategoryApproval(
        category.categoryId,
        cookie.get("accessToken") || ""
      );
      setAlertModalTitle("Success");
      setAlertModalMessage("Approval request sent.");
      setPostModalAction(() => async () => {
        await refreshCategoryData();
      });
      setShowAlertModal(true);
    } catch (error) {
      setAlertModalTitle("Request Failed");
      setAlertModalMessage("Error requesting category approval.");
      setShowAlertModal(true);      
      console.error("Error requesting category approval:", error);
    }
  };

  const approveCategoryButton = async () => {
    if (latestVersion && latestVersion.status === CategoryStatus.Approved) {
      setAlertModalTitle("No Action Needed");
      setAlertModalMessage("Category is already approved.");
      setShowAlertModal(true);
      return;
    }

    try {
      await approveCategory(
        category.categoryId,
        latestVersion ? latestVersion.description : "",
        CategoryStatus.Approved,
        cookie.get("username") || "",
        cookie.get("accessToken") || ""
      );
      // Refresh the page
      setAlertModalTitle("Success");
      setAlertModalMessage("Category approved successfully!");
      setPostModalAction(() => async () => {
        await refreshCategoryData();
      });
      setShowAlertModal(true);
    } catch (error) {
      setAlertModalTitle("Approval Failed");
      setAlertModalMessage("Error approving category.");
      setShowAlertModal(true);
      console.error("Error approving category:", error);
    }
  };

  useEffect(() => {
    const fetchConfigurations = async () => {
      try {
        const configurations = await getCategoryConfigurations(
          category.categoryId
        );
        setCategoryConfigs(configurations);
      } catch (error) {
        console.error("Error fetching configurations:", error);
      }
    };

    if (category) {
      fetchConfigurations();
    }
  }, [category]);

  const handleVersionClick = (version: Version) => {
    setSelectedVersion(version);
    if (categoryConfigs) {
    const selectedCategoryVersionConfigs = categoryConfigs.filter(
      (config) => config.categoryVersion === version.versionNum
    );
    setCategoryVersionConfigs(selectedCategoryVersionConfigs);}
  };


  interface ConfigsTableProps {
    data: Configuration[];
    columns: ColumnDef<Configuration>[];
  }

  const columns: ColumnDef<Configuration>[] = [
    {
      id: "checkbox-col",
      header: "   ",
      cell: ({ row }) => (
        <input
          type="checkbox"
          name="rowSelect"
          value={row.id}
          onChange={() => handleCheckboxChange(row.id)}
          checked={selectedRows.has(row.id)} // Ensure checkbox reflects the selection state
        />
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span
          onClick={() => {
            setConfig(row.original);
            setConfigID(row.original.configurationId);
          }}
          style={{
            cursor: "pointer",
            textDecoration: "underline",
            color: "#28536b",
          }}
        >
          {capitalizeWords(row.original.name)}
        </span>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: (info) => {
        const config: Configuration = info.row.original;
        const latestConfigVersion = findHighestConfigVersion(
          configVersions,
          config.configurationId
        );
        return latestConfigVersion?.description || "";
      },
    },
    {
      accessorKey: "version-status",
      header: "Version (Status)",
      cell: (info) => {
        const config: Configuration = info.row.original;
    
        // Get all versions for this config
        const versions = configVersions
          .filter(v => v.configurationId === config.configurationId)
          .sort((a, b) => b.versionNum - a.versionNum);
        
        if (versions.length === 0) return "";
    
        const latest = versions[0];
        const secondLatest = versions[1];
    
        if (latest?.status === CategoryStatus.Approved || latest?.status === CategoryStatus.Retired || !secondLatest) {
          return `${latest.versionNum}.0 (${latest.status})`;
        } else {
          // Show latest 2 versions if the latest is not approved
          return `${secondLatest.versionNum}.0 (${secondLatest.status}), ${latest.versionNum}.0 (${latest.status})`;
        }
      }
    }
  ];

  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const handleCheckboxChange = (rowId: string) => {
    setSelectedRows((prevSelectedRows) => {
      const newSelectedRows = new Set(prevSelectedRows);
      if (newSelectedRows.has(rowId)) {
        newSelectedRows.delete(rowId); // Deselect if already selected
      } else {
        newSelectedRows.add(rowId); // Select if not already selected
      }
      return newSelectedRows;
    });
  };

  const handleOpenEditModal = () => {
    setShowModal(true);
    setNewDescription(selectedVersion?.description || "");
    setNewSchema(
      typeof selectedVersion?.schema === "string"
        ? selectedVersion.schema
        : JSON.stringify(selectedVersion?.schema ?? {}, null, 2)
    );
  };
  
  
  // Configs table
  function ConfigsTable({ data, columns }: ConfigsTableProps) {
    const table = useReactTable({
      data,
      columns,
      getCoreRowModel: getCoreRowModel(),
    });

    const hasData = table.getRowModel().rows.length > 0;

    return (
      <div>
        <table>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="row-separator">
                {headerGroup.headers.map((header) => (
                  <th colSpan={header.colSpan} key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {hasData ? (
              table.getRowModel().rows.map((row) => {
                const isSelected = selectedRows.has(row.id);
                return (
                  <tr
                    key={row.id}
                    className={`row-separator ${isSelected ? "selected-row" : ""}`}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const isNameColumn = cell.column.id === "name";
                      const cellClass = isNameColumn ? "name-cell" : "";
                      return (
                        <td key={cell.id} className={cellClass}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: "center", padding: "1rem", fontSize: "18px", color: "#777", fontWeight: "400" }}>
                  No configurations available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  if (!configID) {
    return (
      <div className="categoryView" style={{ marginTop: "105px" }}>
        <Card className="full-screen-card">
          <Card.Header
            style={{ fontSize: "41px", fontWeight: "450", padding: "5px .8em" }}
          >
            <span style={{ fontWeight: "300" }}>Category: </span>{capitalizeWords(category.name)}
            <Button className="exit-button" onClick={() => resetView(null)}>
              Exit
            </Button>
          </Card.Header>
          <Card.Body style={{ padding: "25px 1.5em 15px 1.5em" }}>
            <div className="versions" style={{ marginBottom: "20px" }}>
              {previousVersions.map((version) => (
                <div
                  key={version.versionId}
                  className={
                    selectedVersion?.versionId === version.versionId
                      ? "selected-version"
                      : ""
                  }
                  onClick={() => handleVersionClick(version)}
                >
                  {version.versionNum}.0
                  {version.status !== CategoryStatus.Retired && ` (${version.status})`}
                </div>
              ))}
              <div
                className={
                  selectedVersion?.versionId === latestVersion?.versionId
                    ? "selected-version"
                    : ""
                }
                onClick={() => handleVersionClick(latestVersion!)}
              >
                {latestVersion?.versionNum}.0 ({latestVersion?.status})
              </div>
            </div>

            {selectedVersion &&
              selectedVersion.versionId !== latestVersion?.versionId &&
              selectedVersion.status === CategoryStatus.Retired && (
                <div style={{ color: "gray", marginTop: "20px", marginBottom: "15px", fontSize: "16px"}}>
                  <strong>
                    <i>THIS IS A DEPRECATED VERSION</i>
                  </strong>
                </div>
            )} 

            {selectedVersion?.status !== CategoryStatus.Retired && (
              <div style={{ display: "flex", gap: "12px" }}>
                {selectedVersion?.status === CategoryStatus.InEditing && (
                  <Button
                    variant="dark"
                    onClick={handleOpenEditModal}
                    style={{ marginTop: "5px" }}
                  >
                    <FontAwesomeIcon icon={faPencil} />&nbsp; Edit Category
                  </Button>
                )}

                {selectedVersion?.status === CategoryStatus.PendingApproval && cookie.get("userRole") !== "ROLE_ADMIN" && (
                  <Button
                    variant="dark"
                    onClick={() => {
                      setNewDescription(latestVersion?.description ?? "");
                      setNewSchema(
                        typeof latestVersion?.schema === "string"
                          ? latestVersion.schema
                          : JSON.stringify(latestVersion?.schema ?? {}, null, 2)
                      );
                      setShowModal(true);
                    }}
                    style={{ marginTop: "5px" }}
                  >
                    <FontAwesomeIcon icon={faPencil} />&nbsp; Back to Editing
                  </Button>
                )}

                {selectedVersion?.status === CategoryStatus.Approved && (
                  <Button
                    variant="dark"
                    onClick={() => {
                      setNewSchema(selectedVersion?.schema
                        ? (typeof selectedVersion.schema === "string"
                            ? selectedVersion.schema
                            : JSON.stringify(selectedVersion.schema, null, 2))
                        : "{}");
                      setShowModal(true);
                    }}
                    style={{ marginTop: "5px" }}
                  >
                    <FontAwesomeIcon icon={faPenToSquare} />&nbsp; Edit to Create New Version
                  </Button>
                )}

                {cookie.get("userRole") === "ROLE_ADMIN" &&
                  selectedVersion?.status === CategoryStatus.PendingApproval && (
                    <>
                      <Button
                        variant="success"
                        onClick={() => approveCategoryButton()}
                        style={{ marginTop: "5px", width: "109px" }}
                      >
                        <FontAwesomeIcon icon={faCheck} />&nbsp; Approve
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => updateCategoryStatus(CategoryStatus.InEditing)}
                        style={{ marginTop: "5px", width: "109px" }}
                      >
                        <FontAwesomeIcon icon={faXmark} />&nbsp; Reject
                      </Button>
                    </>
                )}
                {selectedVersion?.status === CategoryStatus.InEditing && (
                  <Button
                    variant="success"
                    onClick={() => requestCategoryApprovalButton()}
                    style={{ marginTop: "5px" }}
                  >
                    <FontAwesomeIcon icon={faUserCheck} />&nbsp; Request Approval
                  </Button>
                )}

                {cookie.get("userRole") === "ROLE_ADMIN" &&
                  selectedVersion?.status !== CategoryStatus.Retired && (
                    <Button
                      onClick={() => {
                        updateCategoryStatus(CategoryStatus.Retired);
                      }}
                      style={{ marginTop: "5px", backgroundColor: "#818691", width: "109px" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#717782")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#818691")}
                    >
                      <FontAwesomeIcon icon={faBoxArchive} />&nbsp; Retire
                    </Button>
                )}

                {selectedVersion?.status === CategoryStatus.Approved && (
                  <Button
                    variant="dark"
                    onClick={() => setShowConfigModal(true)}
                    style={{ marginTop: "5px", backgroundColor: "#28536b" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#386985")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#28536b")}
                  >
                    <FontAwesomeIcon icon={faPlus} /> Add Configuration
                  </Button>
                )}
              </div>
            )}

            <Card.Text style={{ fontSize: "16px", marginTop: "20px" }}>
              <span>
                <strong>Description: </strong>
              </span>
              {selectedVersion ? (
                <>{selectedVersion.description}</>
              ) : (
                "No description available"
              )}

              <div className="config-description" style={{ marginBottom: "-6px", marginLeft: "-15px" }}><span><strong>Schema: </strong></span></div>
              <div className="schema-border">
                <div style={{ width: "200%", marginLeft: "-9px", marginRight: "-9px" }}>
                  <Editor
                    key={selectedVersion?.versionId} // Forces re-render on version change
                    className="read-only-schema"
                    height="240px"
                    width="100%"
                    defaultLanguage="json"
                    value={
                      selectedVersion?.schema
                        ? (typeof selectedVersion.schema === "string"
                            ? selectedVersion.schema
                            : JSON.stringify(selectedVersion.schema, null, 2))
                        : "{}"
                    }
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      lineNumbersMinChars: 3
                    }}
                  />
                </div>
              </div>
            </Card.Text>
          </Card.Body>
          <div style={{ margin: "20px 40px 10px 40px", fontWeight: "450", fontSize: "1.1em" }}>Configurations</div>
          <div className="table-wrapper">
            <ConfigsTable data={categoryVersionConfigs} columns={columns}></ConfigsTable>
          </div>
          <br></br>
          <br></br>
        </Card>

        {/* Pop-Up Modal for Updating a Category */}
        <Modal
          show={showModal}
          onHide={() => {
            setShowModal(false);
            resetModalValues();
          }}
          style={{ marginTop: "80px" }}
          size="lg"
        >
          <Modal.Header closeButton style={{ padding: "16px 2.4em" }}>
            <Modal.Title>Edit Category</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form style={{ padding: "0 1.5em" }}>
              <Form.Group controlId="formDescription">
                <Form.Label><strong>Description</strong></Form.Label>
                <Form.Control
                  as="textarea"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                />
              </Form.Group>
              <div style={{ height: "15px" }}></div>
              <Form.Group controlId="formSchema">
                <Form.Label><strong>Schema</strong></Form.Label>
                <div style={{ width: "calc(100% + 9px)", marginLeft: "-9px" }}>
                  <Editor
                    className="schema-input"
                    height="240px"
                    width="100%"
                    defaultLanguage="json"
                    value={newSchema}
                    onChange={(value) => setNewSchema(value ?? "{}")}
                    options={{
                      minimap: { enabled: false },
                      lineNumbersMinChars: 3
                    }}
                  />
                </div>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleUpdateCategory} style={{ backgroundColor: "#28536b", marginRight: "1.7em" }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#366480")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#28536b")}>
              Save
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Pop-Up Modal for Creating a Config */}
        <Modal
          show={showConfigModal}
          onHide={() => {
            setShowConfigModal(false);
            resetConfigModalValues();
          }}
          style={{ marginTop: "40px" }}
          size="lg"
        >
          <Modal.Header closeButton style={{ padding: "16px 2.4em" }}>
            <Modal.Title>Create Configuration</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form style={{ padding: "0 1.5em" }}>
              <Form.Group controlId="formName">
                <Form.Label style={{ fontWeight: "bold" }}>Name</Form.Label>
                <Form.Control
                  as="textarea"
                  value={newConfigName}
                  onChange={(e) => setNewConfigName(e.target.value)}
                  rows={1}
                />
              </Form.Group>
              <div style={{ height: "15px" }}></div>
              <Form.Group controlId="formDescription">
                <Form.Label style={{ fontWeight: "bold" }}>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  value={newConfigDescription}
                  onChange={(e) => setNewConfigDescription(e.target.value)}
                  rows={3}
                />
              </Form.Group>
              <div style={{ height: "15px" }}></div>
              <Form.Group>
                <Form.Label style={{ fontWeight: "bold"}}>Properties</Form.Label>
                <div className="config-page-details" style={{ marginTop: "-12px", marginLeft: "-21px", width: "calc(100% + 30px)" }}>
                  <Editor
                    className="schema-input"
                    height="240px"
                    width="100%"
                    defaultLanguage="json"
                    value={newConfigProperties}
                    onChange={(value) => setNewConfigProperties(value ?? "{}")}
                    options={{
                      minimap: { enabled: false },
                      lineNumbersMinChars: 3
                    }}
                  />
                  </div>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={createNewConfig} style={{ marginRight: "1.7em", backgroundColor: "#28536b" }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#366480")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#28536b")}>
              Save
            </Button>
          </Modal.Footer>
        </Modal>
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
    );
  } else {
    return (
      <ConfigView
        category={category}
        config={config}
        latestVersion={latestVersion as Version}
        latestConfigs={categoryConfigs}
        previousVersions={previousVersions}
        resetView={setConfigID}
      />
    );
  }
};
