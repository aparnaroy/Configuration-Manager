import axios from "axios";
import { LoginRequest } from "../interfaces/loginRequest";
import { RegisterRequest } from "../interfaces/registerRequest";
import { Version } from "../interfaces/version";

// This file connects the frontend to the backend (like a middleman).
// Calling these functions makes the API calls in the backend (to CRUD items in the database).

// Backend API base URL
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8080/api";

// *********************** Categories API Calls ***********************

// Get all categories
export const getCategories = async (jwtToken: string | undefined) => {
  const response = await axios.get(`${API_BASE_URL}/categories`, {
    headers: { Authorization: `Bearer ${jwtToken}` },
  });
  return response.data;
};

// Add a new category
// Add a new category
export const addCategory = async (
  name: string,
  description: string,
  status: string,
  createdBy: string,
  jwtToken: string | undefined,
  schema: any
) => {
  const requestBody = {
    name,
    description,
    status,
    createdBy,
    schema,
  };

  const response = await axios.post(`${API_BASE_URL}/categories`, requestBody, {
    headers: { Authorization: `Bearer ${jwtToken}` },
  });

  return response.data;
};

// Get a category by ID
export const getCategoryById = async (categoryId: string) => {
  const response = await axios.get(`${API_BASE_URL}/categories/${categoryId}`);
  return response.data;
};

// Approve a category
export const approveCategory = async (
  categoryId: string,
  description: string,
  status: string,
  approvedBy: string,
  jwtToken: string
) => {
  const response = await axios.post(`${API_BASE_URL}/approveCategory`, null, {
    params: { categoryId, description, status, approvedBy },
    headers: { Authorization: `Bearer ${jwtToken}` },
  });
  return response.data;
};

// Update a category
export const updateCategory = async (
  categoryId: string,
  description: string,
  status: string,
  createdBy: string,
  schema: any,
  jwtToken: string
) => {
  const requestBody = {
    categoryId,
    description,
    status,
    createdBy,
    schema,
  };

  const response = await axios.put(
    `${API_BASE_URL}/categories/${categoryId}`,
    requestBody,
    {
      headers: { Authorization: `Bearer ${jwtToken}` },
    }
  );
  return response.data;
};


// Request approval for a category
export const requestCategoryApproval = async (
  categoryId: string,
  jwtToken: string
) => {
  const response = await axios.post(
    `${API_BASE_URL}/categories/requestApproval`,
    null,
    {
      params: { categoryId },
      headers: { Authorization: `Bearer ${jwtToken}` },
    }
  );
  return response.data;
};

// *********************** (Category) Versions API Calls ***********************

// Get all category versions
export const getVersions = async (): Promise<Version[]> => {
  const response = await axios.get(`${API_BASE_URL}/allversions`);
  const rawVersions = response.data;

  const cleanedVersions: Version[] = rawVersions.map((item: any) => ({
    versionId: item.version_id,
    categoryId: item.category_id,
    versionNum: item.version_num,
    description: item.description,
    status: item.status,
    createdDate: item.created_date,
    createdBy: item.created_by,
    approvedDate: item.approved_date,
    approvedBy: item.approved_by,
    schema: item.schema ? JSON.parse(item.schema) : undefined,
    fields: item.fields ? JSON.parse(item.fields) : undefined,
  }));

  return cleanedVersions;
};

// Get all versions of a specific category
export const getCategoryVersions = async (categoryId: string) => {
  const response = await axios.get(`${API_BASE_URL}/versions/${categoryId}`);
  return response.data;
};

// *********************** Configurations API Calls ***********************

// Get all configurations
export const getConfigurations = async () => {
  const response = await axios.get(
    `${API_BASE_URL}/configuration/getAllConfigurations`
  );
  return response.data;
};

// Get configurations by category ID
export const getCategoryConfigurations = async (category_id: string) => {
  const response = await axios.get(
    `${API_BASE_URL}/configuration/getConfigurationsByCategory`,
    { params: { category_id: category_id } }
  );
  return response.data;
};

// Add a new configuration
export const addConfiguration = async (request: {
  categoryId: string;
  categoryVersion: number;
  name: string;
  createdBy?: string;
  status?: string;
  description?: string;
  fields?: Record<string, any>;
}) => {
  const response = await axios.post(
    `${API_BASE_URL}/configuration/addConfiguration`,
    request
  );
  return response.data;
};

// Approve a configuration
export const approveConfiguration = async (
  configurationId: string,
  status: string,
  approvedBy: string
) => {
  const response = await axios.put(
    `${API_BASE_URL}/configuration/approveConfiguration`,
    null,
    {
      params: { configurationId, status, approvedBy },
    }
  );
  return response.data;
};

// Update a configuration
export const updateConfiguration = async (
  jwtToken: string,
  updateRequest: {
    categoryId?: string;
    configurationId?: string;
    description?: string;
    fields?: Record<string, any>;
    createdBy?: string;
  }
) => {
  const response = await axios.put(
    `${API_BASE_URL}/configuration/updateConfiguration`,
    updateRequest,
    {
      headers: { Authorization: `Bearer ${jwtToken}` },
    }
  );
  return response.data;
};

// *********************** Configuration Versions API Calls ***********************

// Get all versions of a specific config
export const getConfigVersions = async (configId: string) => {
  const response = await axios.get(
    `${API_BASE_URL}/configVersions/${configId}`
  );
  return response.data;
};

// Add a new config version
export const addConfigVersion = async (request: {
  configurationId: string;
  description: string;
  fields: Record<string, any>;
  status: string;
  approvedBy?: string;
  createdBy: string;
}) => {
  const response = await axios.post(`${API_BASE_URL}/configVersions`, request);
  return response.data;
};

// Update a config version (does NOT create a new version)
export const updateConfigVersion = async (
  configId: string,
  versionNum: number,
  request: {
    description: string;
    status: string;
    approvedBy?: string;
    fields: Record<string, any>;
  }
) => {
  const response = await axios.put(
    `${API_BASE_URL}/configVersions/${configId}/${versionNum}`,
    request
  );
  return response.data;
};

// *********************** User API Calls ***********************

// Login
export const login = async (loginRequest: LoginRequest) => {
  const response = await axios.post(`${API_BASE_URL}/user/login`, loginRequest);
  const loginResponse = response.data;
  return loginResponse;
};

// Register
export const register = async (registerRequest: RegisterRequest) => {
  const response = await axios.post(
    `${API_BASE_URL}/user/register`,
    registerRequest
  );
  return response.data;
};

export const getUsers = async () => {
  const response = await axios.get(`${API_BASE_URL}/user/getAllUsers`);
  return response.data;
};

export const getGroups = async () => {
  const response = await axios.get(`${API_BASE_URL}/user/getAllGroups`);
  return response.data;
};

// *********************** User Groups API Calls ***********************
export const getUserGroups = async () => {
  const response = await axios.get(`${API_BASE_URL}/usergroups`);
  return response.data;
};

export const addUserGroup = async (
  groupRequest: {
    user_group_name: string;
    user_list: string[];
    category_access: string[];
  },
  jwtToken: string
) => {
  const response = await axios.post(
    `${API_BASE_URL}/usergroups`,
    groupRequest,
    {
      headers: { Authorization: `Bearer ${jwtToken}` },
    }
  );
  return response.data;
};

export const addUsertoUserGroup = async (
  user_group_id: string,
  user_group_name: string,
  username: string,
  jwtToken: string
) => {
  const response = await axios.post(
    `${API_BASE_URL}/usergroups/${user_group_id}/${user_group_name}/users`,
    null,
    {
      params: { username },
      headers: { Authorization: `Bearer ${jwtToken}` },
    }
  );
  return response.data;
};

export const removeUserFromUserGroup = async (
  user_group_id: string,
  user_group_name: string,
  username: string,
  jwtToken: string
) => {
  const response = await axios.delete(
    `${API_BASE_URL}/usergroups/${user_group_id}/${user_group_name}/users`,
    {
      params: { username },
      headers: { Authorization: `Bearer ${jwtToken}` },
    }
  );
  return response.data;
}

export const removeCategoryFromUserGroup = async (
  user_group_id: string,
  user_group_name: string,
  category_id: string,
  jwtToken: string
) => {
  const response = await axios.delete(
    `${API_BASE_URL}/usergroups/${user_group_id}/${user_group_name}/category`,
    {
      params: { category_id },
      headers: { Authorization: `Bearer ${jwtToken}` },
    }
  );
  return response.data;
}

export const deleteUserGroup = async (
  user_group_id: string,
  user_group_name: string, 
  jwtToken: string
) => {
  const response = await axios.delete(
    `${API_BASE_URL}/usergroups/${user_group_id}/${user_group_name}`,
    {
      headers: { Authorization: `Bearer ${jwtToken}` },
    }
  );
  return response.data;
}
