"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import "./filter.css";
import { FiChevronDown } from "react-icons/fi";

const categoryData = [];

export { categoryData };

export const CategoryFilter = ({
  onSelectCategory,
  onSelectGroup,
  hideSubcategories = false,
  hideHeader = false,
  dynamicData = null,
  loading = false, 
}) => {
  const searchParams = useSearchParams();
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const displayData = (dynamicData && dynamicData.length > 0 ? dynamicData : categoryData) || [];

  useEffect(() => {
    if (!expandedGroup && displayData.length > 0) {
      setExpandedGroup(displayData[0].title);
    }
  }, [displayData]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    const categoryFromUrl = params.get("name");

    if (categoryFromUrl && displayData.length > 0) {
      const normalizedUrlCategory = categoryFromUrl.trim().toLowerCase();

      for (const group of displayData) {
        if (group.title && group.title.toLowerCase() === normalizedUrlCategory) {
          setExpandedGroup(group.title);
          setSelectedItem(group.title);
          if (onSelectCategory) onSelectCategory(group.title);
          break;
        }

        // Match Sub Category within group
        if (group.items) {
          const matchedItem = group.items.find(
            (item) => (typeof item === 'object' ? item.name : item).toLowerCase() === normalizedUrlCategory
          );
          if (matchedItem) {
            const name = typeof matchedItem === 'object' ? matchedItem.name : matchedItem;
            setExpandedGroup(group.title);
            setSelectedItem(name);
            if (onSelectCategory) onSelectCategory(name);
            break;
          }
        }
      }
    }
  }, [searchParams, displayData]);

  const toggleGroup = (group) => {
    const newGroup = expandedGroup === group ? null : group;
    setExpandedGroup(newGroup);
    if (onSelectGroup && newGroup) {
      onSelectGroup(newGroup);
    }
  };

  const handleItemClick = (item) => {
    setSelectedItem(item);
    if (onSelectCategory) {
      onSelectCategory(item);
    }
  };

  return (
    <div className="filter-container">
      {!hideHeader && (
        <div className="filter-header-top">
          <span className="filter-title">Filters</span>
          <span
            className="filter-clear"
            onClick={() => {
              setSelectedItem(null);
              onSelectCategory(null);
            }}
          >
            Clear
          </span>
        </div>
      )}

      <div className="filter-content">
        {!hideHeader && <div className="filter-section-title">Category</div>}

        {loading ? (
          // Skeleton Loader
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="skeleton-category-item"></div>
          ))
        ) : (
          displayData.map((group, groupIndex) => (
            <div key={groupIndex} className="group-item">
              <div
                className={`main-category-header ${expandedGroup === group.title ? "active" : ""
                  }`}
                onClick={() => toggleGroup(group.title)}
              >
                <div className="main-category-content">
                  <div className="category-initial-badge">
                    {group.title ? group.title.charAt(0).toUpperCase() : ""}
                  </div>
                  <span>{group.title}</span>
                </div>
                {!hideSubcategories && (
                  <FiChevronDown
                    className={`chevron ${expandedGroup === group.title ? "rotated" : ""
                      }`}
                  />
                )}
              </div>

              {!hideSubcategories && expandedGroup === group.title && (
                <div className="items-list">
                  {group.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className={`filter-item ${selectedItem === item ? "selected" : ""
                        }`}
                      onClick={() => handleItemClick(item)}
                    >
                      <div className="filter-item-content">
                        <div
                          className={`selection-indicator ${selectedItem === item ? "active" : ""
                            }`}
                        ></div>
                        <span>{typeof item === 'object' ? item.name : item}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
