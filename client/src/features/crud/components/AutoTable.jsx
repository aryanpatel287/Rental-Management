import React, { useState } from 'react';

/**
 * Auto-generated Data Table component based on field definitions
 */
const AutoTable = ({
  fields = [],
  records = [],
  pagination = { page: 1, limit: 10, totalRecords: 0, totalPages: 1 },
  onPageChange,
  onEdit,
  onDelete,
  onSearchChange,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Determine columns to display (default showInList to true unless explicitly false)
  const columns = fields.filter((f) => !f.uiConfig || f.uiConfig.showInList !== false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearchChange) {
      onSearchChange(searchTerm);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    if (onSearchChange) {
      onSearchChange('');
    }
  };

  const formatCellValue = (record, field) => {
    const val = record[field.columnName];
    if (val === undefined || val === null || val === '') {
      return <span className="cell-empty">—</span>;
    }

    if (field.fieldType === 'boolean') {
      return (
        <span className={`badge-pill ${val ? 'badge-pill--success' : 'badge-pill--muted'}`}>
          {val ? 'Yes' : 'No'}
        </span>
      );
    }

    if (field.fieldType === 'date') {
      try {
        return new Date(val).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      } catch (e) {
        return val;
      }
    }

    if (field.fieldType === 'select') {
      const option = field.options?.find((opt) => opt.value === val);
      return option ? option.label : val;
    }

    if (field.fieldType === 'number') {
      return Number(val).toLocaleString();
    }

    // Default to string representation
    return String(val);
  };

  return (
    <div className="auto-table-container">
      {/* Search and Action Bar */}
      <div className="table-controls">
        <form onSubmit={handleSearchSubmit} className="table-search-form">
          <div className="search-input-wrapper">
            <i className="ri-search-line search-icon" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-input table-search-input"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="clear-search-btn"
                aria-label="Clear search"
              >
                <i className="ri-close-circle-fill" />
              </button>
            )}
          </div>
          <button type="submit" className="button-secondary table-search-btn">
            Search
          </button>
        </form>
      </div>

      {/* Responsive Table Wrapper */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.columnName} scope="col">
                  {col.name}
                </th>
              ))}
              <th scope="col" className="actions-header">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + 1} className="table-loading-cell">
                  <div className="table-spinner" />
                  <span>Loading records...</span>
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="table-empty-cell">
                  <i className="ri-inbox-2-line empty-icon" aria-hidden="true" />
                  <p>No records found</p>
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record.id} className="table-row">
                  {columns.map((col) => (
                    <td key={col.columnName}>
                      {formatCellValue(record, col)}
                    </td>
                  ))}
                  <td className="actions-cell">
                    <button
                      onClick={() => onEdit(record.id)}
                      className="table-action-btn edit-action"
                      aria-label="Edit record"
                      title="Edit"
                    >
                      <i className="ri-pencil-line" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => onDelete(record.id)}
                      className="table-action-btn delete-action"
                      aria-label="Delete record"
                      title="Delete"
                    >
                      <i className="ri-delete-bin-line" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && records.length > 0 && pagination.totalPages > 1 && (
        <div className="table-pagination">
          <span className="pagination-info">
            Showing Page <strong>{pagination.page}</strong> of{' '}
            <strong>{pagination.totalPages}</strong> (
            <strong>{pagination.totalRecords}</strong> total records)
          </span>
          <div className="pagination-buttons">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="button-secondary pagination-btn"
              aria-label="Previous page"
            >
              <i className="ri-arrow-left-s-line" aria-hidden="true" />
              <span>Previous</span>
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="button-secondary pagination-btn"
              aria-label="Next page"
            >
              <span>Next</span>
              <i className="ri-arrow-right-s-line" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoTable;
