export interface UserGroup {
    user_group_id: string;
    user_group_name: string;
    user_list: string[];  // array of usernames
    category_access: string[];  // array of category names
  }