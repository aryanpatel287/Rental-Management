import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Condensed data table widget displaying a mini feed of recent database items.
 */
const TableWidget = ({ config }) => {
  const { title, entity: entitySlug, limit = 5 } = config.settings;
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [definition, setDefinition] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch entity definition to know column metadata
        const defRes = await axios.get(`${API_BASE_URL}/api/crud/definitions/${entitySlug}`, {
          withCredentials: true,
        });

        if (defRes.data?.success) {
          setDefinition(defRes.data.data.entity);
        }

        // 2. Fetch recent records list
        const recRes = await axios.get(`${API_BASE_URL}/api/crud/${entitySlug}`, {
          params: { limit },
          withCredentials: true,
        });

        if (recRes.data?.success) {
          setRecords(recRes.data.data.records || []);
        }
      } catch (err) {
        console.error(`Error loading table widget data for "${entitySlug}":`, err);
      } finally {
        setLoading(false);
      }
    };

    if (entitySlug) {
      fetchData();
    }
  }, [entitySlug, limit]);

  const handleRowClick = (id) => {
    navigate(`/crud/${entitySlug}/${id}/edit`);
  };

  const getPrimaryValue = (record) => {
    // Return name or title, or fallback to first key
    const primaryKey = ['name', 'title', 'label'].find(k => record[k] !== undefined);
    return primaryKey ? record[primaryKey] : record.id;
  };

  const getSecondaryValue = (record, fields) => {
    // Return price, email, or category status
    const secField = fields.find(f => f.columnName !== 'id' && f.columnName !== 'name' && f.columnName !== 'title');
    if (!secField) return '';
    const val = record[secField.columnName];
    if (val === undefined || val === null) return '';
    return secField.fieldType === 'number' ? `$${Number(val).toLocaleString()}` : String(val);
  };

  if (loading) {
    return (
      <div className="table-widget table-widget--loading">
        <div className="table-widget__spinner" />
        <p className="caption">Loading latest {entitySlug}...</p>
      </div>
    );
  }

  const columns = definition ? definition.fields.filter(f => !f.uiConfig || f.uiConfig.showInList !== false).slice(0, 3) : [];

  return (
    <div className="table-widget">
      <header className="table-widget__header">
        <h3 className="table-widget__title">{title || `Recent ${entitySlug}`}</h3>
        <button
          onClick={() => navigate(`/crud/${entitySlug}`)}
          className="table-widget__view-all"
        >
          View All <i className="ri-arrow-right-s-line" />
        </button>
      </header>

      <div className="table-widget__body">
        {records.length === 0 ? (
          <div className="table-widget__empty">
            <i className="ri-inbox-2-line" />
            <p className="caption">No records found</p>
          </div>
        ) : (
          <ul className="table-widget__list">
            {records.map((rec) => (
              <li
                key={rec.id}
                onClick={() => handleRowClick(rec.id)}
                className="table-widget__item"
              >
                <div className="table-widget__item-details">
                  <span className="table-widget__item-primary">
                    {getPrimaryValue(rec)}
                  </span>
                  {columns.length > 0 && (
                    <span className="table-widget__item-secondary">
                      {getSecondaryValue(rec, columns)}
                    </span>
                  )}
                </div>
                <i className="ri-arrow-right-line table-widget__arrow" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TableWidget;
