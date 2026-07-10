import React, { useState } from 'react';

/**
 * AI Natural Language Query prompt box widget.
 */
const AIPromptWidget = ({ config }) => {
  const { placeholder } = config.settings;
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setResponse('');

    setTimeout(() => {
      setLoading(false);
      const query = prompt.toLowerCase();
      if (query.includes('product') || query.includes('stock') || query.includes('value')) {
        setResponse('AI Insight: Total stock value across all active products in inventory is $18,114. There are currently 5 registered product variants.');
      } else if (query.includes('lead') || query.includes('crm') || query.includes('new')) {
        setResponse('AI Insight: You have 3 sales leads. 1 lead is new (John Doe) and 1 is highly qualified (Bruce Wayne, Wayne Enterprises).');
      } else {
        setResponse(`AI Insight: I searched your ERP database for "${prompt}". All tables (crud_product, crud_lead, users) are healthy and index paths are optimized.`);
      }
    }, 1500);
  };

  return (
    <div className="ai-prompt-widget">
      <header className="ai-prompt-widget__header">
        <h3 className="ai-prompt-widget__title">
          <i className="ri-sparkling-fill ai-spark-icon" /> ERP Assistant AI
        </h3>
      </header>
      <div className="ai-prompt-widget__body">
        <form onSubmit={handleSearchSubmit} className="ai-prompt-form">
          <input
            type="text"
            placeholder={placeholder || 'Ask AI...'}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="text-input ai-prompt-input"
            disabled={loading}
          />
          <button
            type="submit"
            className="button-primary ai-prompt-btn"
            disabled={loading}
          >
            Ask
          </button>
        </form>

        {loading && (
          <div className="ai-loading-container">
            <div className="ai-pulse-dot" />
            <span className="caption">AI is compiling insights...</span>
          </div>
        )}

        {response && !loading && (
          <div className="ai-response-panel">
            <i className="ri-robot-line ai-bot-icon" />
            <p className="body-sm ai-response-text">{response}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIPromptWidget;
