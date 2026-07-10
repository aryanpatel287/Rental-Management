import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useEntityDefinition } from '../hooks/useEntityDefinition.js';
import { useCrud } from '../hooks/useCrud.js';
import AutoTable from '../components/AutoTable.jsx';
import { useAuth } from '../../auth/hooks/useAuth.js';
import '../styles/crud.scss';

/**
 * Page displaying the data grid/table list view of any dynamic entity.
 */
const CrudListPage = () => {
  const { entity: entitySlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    currentDefinition,
    loading: defLoading,
    error: defError,
    fetchDefinition,
  } = useEntityDefinition();

  const {
    records,
    loading: recordsLoading,
    error: recordsError,
    pagination,
    fetchRecords,
    deleteRecord,
  } = useCrud();

  useEffect(() => {
    if (entitySlug) {
      fetchDefinition(entitySlug);
    }
  }, [entitySlug, fetchDefinition]);

  useEffect(() => {
    if (currentDefinition) {
      fetchRecords(currentDefinition.slug, { page: 1, limit: 10 });
    }
  }, [currentDefinition, fetchRecords]);

  const handlePageChange = (newPage) => {
    if (currentDefinition) {
      fetchRecords(currentDefinition.slug, { page: newPage, limit: pagination.limit });
    }
  };

  const handleSearch = (term) => {
    if (currentDefinition) {
      // Pass filters matching name if name field exists, or build general query
      const nameField = currentDefinition.fields.find(
        (f) => f.columnName === 'name' || f.columnName === 'title'
      );
      const params = { page: 1, limit: pagination.limit };
      if (term && nameField) {
        params[`filters[${nameField.columnName}]`] = term;
      }
      fetchRecords(currentDefinition.slug, params);
    }
  };

  const handleEdit = (id) => {
    navigate(`/crud/${entitySlug}/${id}/edit`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to deactivate/delete this record?')) {
      const res = await deleteRecord(entitySlug, id);
      if (res.success) {
        // Refresh records list
        fetchRecords(entitySlug, { page: pagination.page, limit: pagination.limit });
      } else {
        alert(res.message || 'Failed to delete record');
      }
    }
  };

  if (defLoading) {
    return (
      <div className="crud-page-loading">
        <div className="spinner" />
        <p>Loading database schema...</p>
      </div>
    );
  }

  if (defError) {
    return (
      <div className="crud-page-error">
        <i className="ri-error-warning-line error-icon" aria-hidden="true" />
        <h2>Schema Error</h2>
        <p>{defError}</p>
        <button onClick={() => navigate('/profile')} className="button-secondary">
          Go Back
        </button>
      </div>
    );
  }

  if (!currentDefinition) {
    return (
      <div className="crud-page-error">
        <i className="ri-question-mark empty-icon" aria-hidden="true" />
        <h2>Entity Not Found</h2>
        <p>The entity definition for "{entitySlug}" does not exist in the database.</p>
        <button onClick={() => navigate('/profile')} className="button-secondary">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <main className="crud-list-page" role="main">
      {/* Header section with Editorial Display weights from DESIGN.md */}
      <header className="crud-header">
        <div className="crud-header__title-section">
          <h1 className="display-md">{currentDefinition.name}</h1>
          {currentDefinition.description && (
            <p className="body-md crud-header__description">
              {currentDefinition.description}
            </p>
          )}
        </div>
        <div className="crud-header__actions">
          <button
            onClick={() => navigate(`/crud/${entitySlug}/new`)}
            className="button-primary"
            aria-label={`Add new ${currentDefinition.name}`}
          >
            <i className="ri-add-line" aria-hidden="true" />
            <span>Add {currentDefinition.name}</span>
          </button>
        </div>
      </header>

      {/* Dynamic Data Table */}
      <section className="crud-content" aria-label={`${currentDefinition.name} Records`}>
        {recordsError && (
          <div className="crud-inline-error">
            <i className="ri-error-warning-fill" />
            <span>{recordsError}</span>
          </div>
        )}
        <AutoTable
          fields={currentDefinition.fields}
          records={records}
          pagination={pagination}
          onPageChange={handlePageChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onSearchChange={handleSearch}
          isLoading={recordsLoading}
        />
      </section>
    </main>
  );
};

export default CrudListPage;
