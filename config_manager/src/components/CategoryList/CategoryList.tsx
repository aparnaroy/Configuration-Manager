import { useState } from "react";
import { Category } from "../../interfaces/category";
import { Button, Card, Modal } from "react-bootstrap";
import "config_manager/src/components/CategoryView/CategoryView.css";
import { CategoryForm } from "../CategoryForm/CategoryForm";
import { Version } from "../../interfaces/version";
import { CategoryView } from "../CategoryView/CategoryView";
import { Configuration } from "../../interfaces/configuration";
import {
  getCategories,
  getCategoryById,
  getVersions,
} from "../../services/apiService";
import { ColumnDef, flexRender, getCoreRowModel } from "@tanstack/react-table";
import { useReactTable } from "@tanstack/react-table";
import { capitalizeWords } from "../../utils/stringUtils";
import cookie from "js-cookie";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";


export const CategoryList = ({
  initialCategories,
  initialVersions,
  configurations,
}: {
  initialCategories: Category[];
  initialVersions: Version[];
  configurations: Configuration[];
}) => {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [versions, setVersions] = useState<Version[]>(initialVersions);
  const [categoryID, setCategoryID] = useState<null | string>(null);
  const [showModal, setShowModal] = useState(false);
  const [currIndex, setIndex] = useState<number>(0);
  const [viewCategory, setViewCategory] = useState<Category>(categories[0]);
  const MAX_NUM_DISPLAY = 8;

  const refreshCategories = async () => {
    try {
      const [fetchedCategories, fetchedVersions] = await Promise.all([
        getCategories(cookie.get("accessToken")), // Call endpoint to get all categories
        getVersions(), // Call API endpoint to get all versions
      ]);

      setCategories(fetchedCategories);
      setVersions(fetchedVersions);
    } catch (error) {
      console.error("Error fetching categories or versions:", error);
    }
  };

  const handleClick = async (id: string) => {
    setCategoryID(id);
    localStorage.setItem("selectedCategoryId", id);
    try {
      const fetchedCategory = await getCategoryById(id);
      setViewCategory(fetchedCategory);
    } catch (error) {
      console.error("Error fetching category by ID:", error);
    }
  };

  function updateIndex(indx: number): void {
    setIndex(indx);
  }

  function findHighestVersion(
    versions: Version[],
    categoryId: string
  ): Version {
    let high: number = 0;
    let indx: number = 0;

    if (versions.length <= 0) {
      throw new Error("Version array is empty");
    }

    const filteredVersions = versions.filter(
      (version: Version) => version.categoryId === categoryId
    );

    filteredVersions.forEach((e, index) => {
      if (e.versionNum > high) {
        high = e.versionNum;
        indx = index;
      }
    });
    return filteredVersions[indx];
  }

  interface CategoriesTableProps {
    data: Category[];
    columns: ColumnDef<Category>[];
  }

  const addNewCategory = (success: boolean, errorMessage?: string) => {
    if (success) {
      refreshCategories(); // Refresh categories list
    } else if (errorMessage) {
      console.error("Failed to add category:", errorMessage);
    }
    setShowModal(false);
  };

  interface CategoriesTableProps {
    data: Category[];
    columns: ColumnDef<Category>[];
  }

  const displayedCategories = categories.slice(
    currIndex,
    currIndex + MAX_NUM_DISPLAY
  );

  const columns: ColumnDef<Category>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span
          onClick={() => {
            setCategoryID(row.original.categoryId);
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
      cell: ({ row }) => {
        const latestVersion = findHighestVersion(
          versions,
          row.original.categoryId
        );
        return latestVersion
          ? latestVersion.description
          : "No description available";
      },
    },
  ];

  // Categories table
  function CategoriesTable({ data, columns }: CategoriesTableProps) {
    const table = useReactTable({
      data,
      columns,
      getCoreRowModel: getCoreRowModel(),
    });

    return (
      <div className="categoryView">
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
            {table.getRowModel().rows.map((row) => {
              return (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => {
                    const isNameColumn = cell.column.id === "name";
                    const cellClass = isNameColumn ? "name-cell" : "";
                    return (
                      <td
                        key={cell.id}
                        className={cellClass}
                        onClick={() => handleClick(row.original.categoryId)}
                        style={{ padding: "10px" }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // Regular display of categories.
  // Max display is 5 categories per "page"
  // User clicks next/back to cycle through list of categories (limited to 5 per page)
  // Displays ONLY when the user has NOT clicked on "Create Category"
    if (!categoryID) {
      return (
        <div className="categoryPage">
          <Card className="full-screen-card">
            <Card.Header
              style={{
                fontSize: "46px",
                fontWeight: "normal",
                padding: "2px 1em",
              }}
            >
              All Categories
              {cookie.get("userRole") === "ROLE_ADMIN" && (
                <Button
                  className="custom-buttons"
                  onClick={() => setShowModal(true)}
                  style={{  float: "right", marginTop: "20px", height: "40px" }}
                >
                  <strong><FontAwesomeIcon icon={faPlus} />&nbsp; Create Category</strong>
                </Button>
              )}
            </Card.Header>
            <Card.Body style={{ padding: "1px 1.5em 15px 1.5em" }}>
              <CategoriesTable
                data={displayedCategories}
                columns={columns}
              ></CategoriesTable>
            </Card.Body>
            <div className="buttons">
              <Button
                className="custom-buttons"
                style={{ padding: "5px 12px 7px 12px" }}
                onClick={() =>
                  currIndex > 0
                    ? updateIndex(currIndex - MAX_NUM_DISPLAY)
                    : updateIndex(currIndex)
                }
                disabled={currIndex === 0}
              >
                <strong>&lt;</strong>
              </Button>
              <span className="page-info" style={{ marginTop: "5px" }}>
                    Page {Math.floor(currIndex / MAX_NUM_DISPLAY) + 1} of {Math.max(1, Math.ceil(categories.length / MAX_NUM_DISPLAY))}
              </span>
              <Button
                className="custom-buttons"
                style={{ padding: "5px 12px 7px 12px" }}
                onClick={() =>
                  currIndex < categories.length - MAX_NUM_DISPLAY
                    ? updateIndex(currIndex + MAX_NUM_DISPLAY)
                    : updateIndex(currIndex)
                }
                disabled={currIndex >= categories.length - MAX_NUM_DISPLAY}
              >
                <strong>&gt;</strong>
              </Button>
            </div>
          </Card>

          <Modal
          show={showModal}
          onHide={() => {
            setShowModal(false);
            setCategoryID(null); // Reset category ID when modal is closed
            setViewCategory(categories[0]); // Reset view category to the first one in the list
          }}
          size="lg"
          centered
        >
          <Modal.Header closeButton  style={{ paddingLeft: "45px", paddingRight: "45px" }}>
            <Modal.Title>Create Category</Modal.Title>
          </Modal.Header>
          <Modal.Body
            className="px-4 py-3"
          >
            <CategoryForm onSubmit={addNewCategory} />
          </Modal.Body>
        </Modal>
        </div>
      );
    } else {
      return <CategoryView category={viewCategory} resetView={setCategoryID} />;
    }
}
// The user has clicked on "Create Category".
// Displays the category creation page.
