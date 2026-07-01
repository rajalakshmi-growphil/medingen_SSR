import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./filter.css";
import { FiChevronDown, FiChevronUp, FiSearch, FiCheck } from "react-icons/fi";
import { searchSalt } from "../../api/Api";

// Removed static category data to ensure the filter always dynamic from API
const categoryData = [];

export { categoryData };

export const CategoryPageFilter = ({
  onSelectCategory,
  onSelectGroup,
  onFilterChange, // New prop to notify parent of filter updates
  hideSubcategories = false,
  hideHeader = false,
  dynamicData = null,
  loading = false,
  initialFilters = {} // Accept initial filters from parent
}) => {
  const location = useLocation();
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeMobileTab, setActiveMobileTab] = useState("Sub-Category");
  const [mobileSaltSearch, setMobileSaltSearch] = useState(initialFilters.saltComposition || "");
  const isMobileView = typeof window !== "undefined" ? window.innerWidth <= 1024 : false;

  // New states for advanced filters
  const [filters, setFilters] = useState({
    subCategories: initialFilters.subCategories || [],
    dosageForm: initialFilters.dosageForm || [],
    saltComposition: initialFilters.saltComposition || "",
  });

  const [saltSuggestions, setSaltSuggestions] = useState([]);
  const [showSaltSuggestions, setShowSaltSuggestions] = useState(false);
  const [sectionsExpanded, setSectionsExpanded] = useState({
    categories: true,
    subCategories: true,
    dosageForm: true,
    saltComposition: true
  });

  const displayData = (dynamicData && dynamicData.length > 0 ? dynamicData : categoryData) || [];

  const nameToSlug = (name) =>
    name ? name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-") : "";

  // 1. Initial State Sync
  useEffect(() => {
    if (displayData.length > 0) {
      if (initialFilters.mainCategory) {
        // Find matching group based on slug
        const matched = displayData.find(g => nameToSlug(g.title) === initialFilters.mainCategory);
        if (matched) {
          setExpandedGroup(matched.title);
          setSelectedItem(matched.title);
          return;
        }
      }

      // Default to first if nothing matched yet
      if (!expandedGroup) {
        setExpandedGroup(displayData[0].title);
      }
    }
  }, [displayData, initialFilters.mainCategory]);

  // 2. Query Params Sync (Legacy)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
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
  }, [location.search, displayData]);

  // 3. Filter Change Notify
  useEffect(() => {
    if (onFilterChange) {
      if (
        JSON.stringify(filters.subCategories) !== JSON.stringify(initialFilters.subCategories) ||
        JSON.stringify(filters.dosageForm) !== JSON.stringify(initialFilters.dosageForm) ||
        filters.saltComposition !== initialFilters.saltComposition
      ) {
        onFilterChange(filters);
      }
    }
  }, [filters]);

  const toggleGroup = (group) => {
    const newGroup = expandedGroup === group ? null : group;
    setExpandedGroup(newGroup);

    // Notify parent of the selection to update URL/state
    if (onSelectCategory && newGroup) {
      onSelectCategory(newGroup);
    }

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

  const toggleSection = (section) => {
    setSectionsExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCheckboxChange = (section, value) => {
    setFilters(prev => {
      const current = prev[section];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [section]: updated };
    });
  };

  const handleSaltSearch = async (term) => {
    setFilters(prev => ({ ...prev, saltComposition: term }));
    setMobileSaltSearch(term); // Sync mobile search text
    if (term.length >= 2) {
      try {
        const results = await searchSalt(term);
        // results is an array of objects like { salt_id, composition }
        const compositions = results?.map(r => r.composition).filter(Boolean) || [];
        setSaltSuggestions([...new Set(compositions)]);
        setShowSaltSuggestions(true);
      } catch (err) {
        console.error("Salt search error:", err);
      }
    } else {
      setSaltSuggestions([]);
      setShowSaltSuggestions(false);
    }
  };

  const selectSalt = (salt) => {
    if (filters.saltComposition === salt) {
      // Toggle off if already selected
      setFilters(prev => ({ ...prev, saltComposition: "" }));
      setMobileSaltSearch("");
    } else {
      setFilters(prev => ({ ...prev, saltComposition: salt }));
      setMobileSaltSearch(salt); // Sync mobile search text on selection
      setShowSaltSuggestions(false);
    }
  };

  // Get active items for the selected category
  const activeGroup = displayData.find(g => g.title === expandedGroup);
  const subCategoryOptions = activeGroup?.items || [];
  const dosageOptions = initialFilters.dosageOptions || ["Tablets", "Capsules", "Syrup", "Injection", "Ointment"];

  if (isMobileView && hideHeader) {
    const tabs = ["Sub-Category", "Form", "Salt"];
    const getTabCount = (tab) => {
      switch (tab) {
        case "Sub-Category":
          return filters.subCategories.length;
        case "Form":
          return filters.dosageForm.length;
        case "Salt":
          return filters.saltComposition ? 1 : 0;
        default:
          return 0;
      }
    };

    const renderOptions = () => {
      switch (activeMobileTab) {
        case "Sub-Category":
          return subCategoryOptions.length > 0 ? (
            subCategoryOptions.map(option => (
              <div
                key={option}
                className={`filter-radio-item ${filters.subCategories.includes(option) ? 'selected' : ''}`}
                onClick={() => handleCheckboxChange('subCategories', typeof option === 'object' ? option.name : option)}
              >
                <span className="filter-radio-label">{typeof option === 'object' ? option.name : option}</span>
                <div className="radio-circle">
                  <FiCheck className="radio-check" />
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: '#999', padding: '20px', textAlign: 'center' }}>Select a category first</div>
          );
        case "Form":
          return dosageOptions.map(option => (
            <div
              key={option}
              className={`filter-radio-item ${filters.dosageForm.includes(option) ? 'selected' : ''}`}
              onClick={() => handleCheckboxChange('dosageForm', option)}
            >
              <span className="filter-radio-label">{option}</span>
              <div className="radio-circle">
                <FiCheck className="radio-check" />
              </div>
            </div>
          ));
        case "Salt":
          return (
            <>
              <div className="mobile-salt-search-box">
                <FiSearch />
                <input
                  type="text"
                  placeholder="Search salt..."
                  value={mobileSaltSearch}
                  onChange={(e) => {
                    setMobileSaltSearch(e.target.value);
                    handleSaltSearch(e.target.value);
                  }}
                />
              </div>
              {filters.saltComposition && !saltSuggestions.includes(filters.saltComposition) && (
                <div
                  className="filter-radio-item selected"
                  onClick={() => selectSalt(filters.saltComposition)}
                >
                  <span className="filter-radio-label">{filters.saltComposition}</span>
                  <div className="radio-circle">
                    <FiCheck className="radio-check" />
                  </div>
                </div>
              )}
              {saltSuggestions.length > 0 ? (
                saltSuggestions.map((salt, idx) => (
                  <div
                    key={idx}
                    className={`filter-radio-item ${filters.saltComposition === salt ? 'selected' : ''}`}
                    onClick={() => selectSalt(salt)}
                  >
                    <span className="filter-radio-label">{salt}</span>
                    <div className="radio-circle">
                      <FiCheck className="radio-check" />
                    </div>
                  </div>
                ))
              ) : (
                !filters.saltComposition && (
                  <div style={{ color: '#999', padding: '20px', textAlign: 'center' }}>
                    {mobileSaltSearch.length < 2 ? "Type at least 2 characters to search" : "No results found"}
                  </div>
                )
              )}
            </>
          );
        default:
          return null;
      }
    };

    return (
      <div className="filter-container">
        <div className="filter-content">
          <div className="filter-tabs-sidebar">
            {tabs.map(tab => (
              <button
                key={tab}
                className={`filter-tab-btn ${activeMobileTab === tab ? 'active' : ''}`}
                onClick={() => setActiveMobileTab(tab)}
              >
                {tab}
                {getTabCount(tab) > 0 && (
                  <span className="filter-tab-count">{getTabCount(tab)}</span>
                )}
              </button>
            ))}
          </div>
          <div className="filter-options-pane">
            {renderOptions()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="filter-container">
      {!hideHeader && (
        <div className="filter-header-top">
          <span className="filter-title">Filters</span>
          <span
            className="filter-clear"
            onClick={() => {
              setSelectedItem(null);
              setFilters({
                subCategories: [],
                dosageForm: [],
                saltComposition: ""
              });
              setMobileSaltSearch("");
              if (onSelectCategory) onSelectCategory(null);
            }}
          >
            Clear
          </span>
        </div>
      )}

      <div className="filter-content">
        {/* Categories Section */}
        <div className="filter-section">
          <div className="filter-section-header" onClick={() => toggleSection('categories')}>
            <span className="filter-section-title">CATEGORIES</span>
            {sectionsExpanded.categories ? <FiChevronUp /> : <FiChevronDown />}
          </div>
          {sectionsExpanded.categories && (
            <div className="filter-section-body">
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="skeleton-category-item"></div>
                ))
              ) : (
                displayData.map((group, groupIndex) => (
                  <div key={groupIndex} className="group-item">
                    <div
                      className={`main-category-header ${expandedGroup === group.title ? "active" : ""}`}
                      onClick={() => toggleGroup(group.title)}
                    >
                      <div className="main-category-content">
                        <span>{group.title}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Sub-Categories Section */}
        <div className="filter-section">
          <div className="filter-section-header" onClick={() => toggleSection('subCategories')}>
            <div className="filter-section-title-wrapper">
              <span className="filter-section-title">SUB-CATEGORIES</span>
              {filters.subCategories.length > 0 && (
                <span className="filter-section-count">{filters.subCategories.length}</span>
              )}
            </div>
            {sectionsExpanded.subCategories ? <FiChevronUp /> : <FiChevronDown />}
          </div>
          {sectionsExpanded.subCategories && (
            <div className="filter-section-body">
              {subCategoryOptions.length > 0 ? (
                subCategoryOptions.map(option => {
                  const name = typeof option === 'object' ? option.name : option;
                  return (
                    <label key={name} className="filter-checkbox-item">
                      <input
                        type="checkbox"
                        checked={filters.subCategories.some(s => s.toLowerCase() === name.toLowerCase())}
                        onChange={() => handleCheckboxChange('subCategories', name)}
                      />
                      <span className="checkbox-custom"></span>
                      <span className="checkbox-label">{name}</span>
                    </label>
                  );
                })
              ) : (
                <div style={{ fontSize: '12px', color: '#999', padding: '10px 0' }}>Select a category to see sub-categories</div>
              )}
            </div>
          )}
        </div>

        {/* Dosage Form Section */}
        <div className="filter-section">
          <div className="filter-section-header" onClick={() => toggleSection('dosageForm')}>
            <div className="filter-section-title-wrapper">
              <span className="filter-section-title">DOSAGE FORM</span>
              {filters.dosageForm.length > 0 && (
                <span className="filter-section-count">{filters.dosageForm.length}</span>
              )}
            </div>
            {sectionsExpanded.dosageForm ? <FiChevronUp /> : <FiChevronDown />}
          </div>
          {sectionsExpanded.dosageForm && (
            <div className="filter-section-body">
              {dosageOptions.map(option => (
                <label key={option} className="filter-checkbox-item">
                  <input
                    type="checkbox"
                    checked={filters.dosageForm.some(s => s.toLowerCase() === option.toLowerCase())}
                    onChange={() => handleCheckboxChange('dosageForm', option)}
                  />
                  <span className="checkbox-custom"></span>
                  <span className="checkbox-label">{option}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Salt Composition Section */}
        <div className="filter-section">
          <div className="filter-section-header" onClick={() => toggleSection('saltComposition')}>
            <div className="filter-section-title-wrapper">
              <span className="filter-section-title">SALT COMPOSITION</span>
              {filters.saltComposition && (
                <span className="filter-section-count">1</span>
              )}
            </div>
            {sectionsExpanded.saltComposition ? <FiChevronUp /> : <FiChevronDown />}
          </div>
          {sectionsExpanded.saltComposition && (
            <div className="filter-section-body salt-search-container">
              <div className="salt-search-input-wrapper">
                <FiSearch className="salt-search-icon" />
                <input
                  type="text"
                  placeholder="Search salt..."
                  value={filters.saltComposition}
                  onChange={(e) => handleSaltSearch(e.target.value)}
                  onFocus={() => filters.saltComposition.length >= 2 && setShowSaltSuggestions(true)}
                  className="salt-search-input"
                />
              </div>
              {showSaltSuggestions && saltSuggestions.length > 0 && (
                <div className="salt-suggestions">
                  {saltSuggestions.map((salt, idx) => (
                    <div
                      key={idx}
                      className="salt-suggestion-item"
                      onClick={() => selectSalt(salt)}
                    >
                      {salt}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
