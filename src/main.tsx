import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import { validateEnv } from './config/env';
import { store } from './store';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import Home from './pages/Home';
import Reports from './pages/Reports';
import AIRecommendation from './pages/AIRecommendation';
import About from './pages/About';

// Validate required env vars at startup (logs missing keys only in DEV; never logs sensitive values).
validateEnv();

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <Provider store={store}>
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/ai" element={<AIRecommendation />} />
                <Route path="/about" element={<About />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </Provider>
      </ErrorBoundary>
    </StrictMode>,
  );
}
