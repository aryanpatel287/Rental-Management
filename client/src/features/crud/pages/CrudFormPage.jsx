import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useEntityDefinition } from '../hooks/useEntityDefinition.js';
import { useCrud } from '../hooks/useCrud.js';
import AutoForm from '../components/AutoForm.jsx';
import { useAuth } from '../../auth/hooks/useAuth.js';
import '../styles/crud.scss';

/**
 * Page displaying the auto-generated create/edit form screen.
 */
const CrudFormPage = () => {
  const { entity: entitySlug, id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const { showToast } = useAuth();

  const [formValidationErrors, setFormValidationErrors] = useState([]);

  const {
    currentDefinition,
    loading: defLoading,
    error: defError,
    fetchDefinition,
  } = useEntityDefinition();

  const {
    currentRecord,
    loading: recordLoading,
    actionLoading,
    fetchRecord,
    createRecord,
    updateRecord,
  } = useCrud();

  useEffect(() => {
    if (entitySlug) {
      fetchDefinition(entitySlug);
    }
  }, [entitySlug, fetchDefinition]);

  useEffect(() => {
    if (entitySlug && isEditMode) {
      fetchRecord(entitySlug, id);
    }
  }, [entitySlug, isEditMode, id, fetchRecord]);

  const handleSubmit = async (values) => {
    setFormValidationErrors([]);
    let res;
    if (isEditMode) {
      res = await updateRecord(entitySlug, id, values);
    } else {
      res = await createRecord(entitySlug, values);
    }

    if (res.success) {
      showToast(
        isEditMode
          ? 'Record updated successfully'
          : 'Record created successfully',
        'success'
      );
      navigate(`/crud/${entitySlug}`);
    } else {
      showToast(res.message || 'Action failed', 'error');
      if (res.errors) {
        setFormValidationErrors(res.errors);
      }
    }
  };

  const handleCancel = () => {
    navigate(`/crud/${entitySlug}`);
  };

  const isLoading = defLoading || (isEditMode && recordLoading);

  if (isLoading) {
    return (
      <div className="crud-page-loading">
        <div className="spinner" />
        <p>Loading form...</p>
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
    <main className="crud-form-page" role="main">
      <header className="crud-header">
        <div className="crud-header__title-section">
          <h1 className="display-sm">
            {isEditMode
              ? `Edit ${currentDefinition.name}`
              : `Create New ${currentDefinition.name}`}
          </h1>
          <p className="body-sm">
            Fill in the details below to save this {currentDefinition.name.toLowerCase()} record.
          </p>
        </div>
      </header>

      <section className="crud-form-card" aria-label={`${currentDefinition.name} Form`}>
        <AutoForm
          fields={currentDefinition.fields}
          initialValues={isEditMode ? currentRecord || {} : {}}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={actionLoading}
          validationErrors={formValidationErrors}
        />
      </section>
    </main>
  );
};

export default CrudFormPage;
